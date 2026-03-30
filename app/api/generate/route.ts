import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { genai } from '@/lib/gemini'
import { THUMBNAIL_SYSTEM_PROMPT, IMAGE_ANALYSIS_PROMPT } from '@/lib/system-prompt'

export const maxDuration = 300

const GEMINI_TIMEOUT_MS = 120_000 // 120 seconds per attempt

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(message)), ms)
    ),
  ])
}

export async function POST(request: Request) {
  let creditDeducted = false
  let userId: string | undefined

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const prompt = body.prompt?.trim()
    const generationPrompt = body.generationPrompt?.trim() || prompt

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    if ((generationPrompt || prompt).length > 2000) {
      return NextResponse.json(
        { error: 'Prompt must be under 2000 characters' },
        { status: 400 }
      )
    }

    // Validate attached images (max 10, each max 5MB base64 ≈ 6.67MB encoded)
    const images: { data: string; mimeType: string }[] = body.images || []
    if (images.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 images allowed' },
        { status: 400 }
      )
    }
    for (const img of images) {
      const sizeBytes = (img.data.length * 3) / 4
      if (sizeBytes > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Each image must be under 5MB' },
          { status: 400 }
        )
      }
    }

    // Deduct 1 credit (atomic: checks >= 1 and decrements)
    const admin = createAdminClient()
    const { data: creditUsed, error: creditError } = await admin.rpc('use_credit', {
      uid: user.id,
    })

    if (creditError || !creditUsed) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 402 }
      )
    }

    creditDeducted = true
    userId = user.id

    // Insert thumbnail record
    const { data: thumbnail, error: insertError } = await supabase
      .from('thumbnails')
      .insert({
        user_id: user.id,
        prompt,
        status: 'generating',
      })
      .select()
      .single()

    if (insertError || !thumbnail) {
      console.error('Insert error:', insertError)
      await admin.rpc('increment_credits', { uid: user.id, amount: 1 })
      return NextResponse.json(
        { error: 'Failed to create thumbnail record' },
        { status: 500 }
      )
    }

    // Analyze reference images if attached (non-blocking)
    let analysisResult = ''
    if (images.length > 0) {
      try {
        const analysisResponse = await withTimeout(
          genai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
              { text: IMAGE_ANALYSIS_PROMPT },
              ...images.map((img) => ({
                inlineData: { mimeType: img.mimeType, data: img.data },
              })),
            ],
          }),
          30_000,
          'Image analysis timed out'
        )
        analysisResult =
          analysisResponse.candidates?.[0]?.content?.parts?.find((p) => p.text)
            ?.text || ''
        if (analysisResult) {
          console.log('Reference image analysis:', analysisResult.slice(0, 200))
        }
      } catch (err) {
        console.error('Image analysis failed (non-blocking):', err)
      }
    }

    // Call Gemini API: try 3.1-flash twice (with 5s gap), then fallback to 2.5-flash
    const MODELS = [
      { id: 'gemini-3.1-flash-image-preview', imageSize: '2K', delayAfter: 5000 },
      { id: 'gemini-3.1-flash-image-preview', imageSize: '2K', delayAfter: 5000 },
      { id: 'gemini-2.5-flash-image', imageSize: undefined, delayAfter: 0 },
    ] as const

    let imageBuffer: Buffer | null = null
    let lastError: unknown

    for (let i = 0; i < MODELS.length; i++) {
      const model = MODELS[i]
      try {
        console.log(`Trying ${model.id} (attempt ${i + 1}/${MODELS.length})`)
        // Build contents: text prompt + optional image parts
        const contentParts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [
          { text: `${THUMBNAIL_SYSTEM_PROMPT} ${analysisResult ? `[Reference Analysis: ${analysisResult}] ` : ''}${generationPrompt}` },
          ...images.map((img) => ({
            inlineData: { mimeType: img.mimeType, data: img.data },
          })),
        ]

        const response = await withTimeout(
          genai.models.generateContent({
            model: model.id,
            contents: contentParts,
            config: {
              responseModalities: ['TEXT', 'IMAGE'],
              imageConfig: {
                aspectRatio: '16:9',
                ...(model.imageSize && { imageSize: model.imageSize }),
              },
            },
          }),
          GEMINI_TIMEOUT_MS,
          `${model.id} timed out after ${GEMINI_TIMEOUT_MS / 1000}s`
        )

        const parts = response.candidates?.[0]?.content?.parts
        const imagePart = parts?.find(
          (part) => part.inlineData?.mimeType?.startsWith('image/')
        )

        if (!imagePart?.inlineData?.data) {
          const textPart = parts?.find((p) => p.text)
          throw new Error(
            textPart?.text
              ? `No image returned. Model said: ${textPart.text.slice(0, 200)}`
              : 'No image returned from Gemini'
          )
        }

        imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64')
        console.log(`Success with ${model.id}`)
        break
      } catch (err) {
        console.error(`${model.id} attempt ${i + 1} failed:`, err)
        lastError = err
        if (model.delayAfter > 0) {
          console.log(`Waiting ${model.delayAfter / 1000}s before next attempt...`)
          await new Promise((r) => setTimeout(r, model.delayAfter))
        }
      }
    }

    if (!imageBuffer) {
      await supabase
        .from('thumbnails')
        .update({ status: 'failed' })
        .eq('id', thumbnail.id)

      await admin.rpc('increment_credits', { uid: user.id, amount: 1 })
      console.error('All attempts failed:', lastError)
      return NextResponse.json(
        { error: 'Image generation failed. Please try again.' },
        { status: 502 }
      )
    }

    // Upload to Supabase Storage
    const storagePath = `${user.id}/${thumbnail.id}.png`

    const { error: uploadError } = await supabase.storage
      .from('thumbnails')
      .upload(storagePath, imageBuffer, {
        contentType: 'image/png',
        upsert: false,
      })

    if (uploadError) {
      await supabase
        .from('thumbnails')
        .update({ status: 'failed' })
        .eq('id', thumbnail.id)

      await admin.rpc('increment_credits', { uid: user.id, amount: 1 })
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to save generated image' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('thumbnails')
      .getPublicUrl(storagePath)

    // Update thumbnail record
    const { data: updatedThumbnail, error: updateError } = await supabase
      .from('thumbnails')
      .update({
        image_url: publicUrlData.publicUrl,
        storage_path: storagePath,
        status: 'completed',
      })
      .eq('id', thumbnail.id)
      .select()
      .single()

    if (updateError) {
      await admin.rpc('increment_credits', { uid: user.id, amount: 1 })
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update thumbnail record' },
        { status: 500 }
      )
    }

    return NextResponse.json({ thumbnail: updatedThumbnail })
  } catch (error) {
    if (creditDeducted && userId) {
      const admin = createAdminClient()
      await admin.rpc('increment_credits', { uid: userId, amount: 1 })
    }
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
