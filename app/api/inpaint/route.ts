import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fal } from '@fal-ai/client'
import { genai } from '@/lib/gemini'
import sharp from 'sharp'

export const maxDuration = 120

fal.config({ credentials: process.env.FAL_KEY! })

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
    const { imageUrl, prompt } = body as {
      imageUrl?: string
      prompt?: string
    }

    if (!imageUrl || !prompt?.trim()) {
      return NextResponse.json(
        { error: 'imageUrl and prompt are required' },
        { status: 400 }
      )
    }

    // Deduct 1 precision credit
    const admin = createAdminClient()
    userId = user.id

    const { data: creditUsed, error: creditError } = await admin.rpc(
      'use_precision_credit',
      { uid: user.id }
    )

    if (creditError || !creditUsed) {
      return NextResponse.json(
        { error: 'Insufficient precision credits' },
        { status: 402 }
      )
    }

    creditDeducted = true

    // Insert thumbnail record (linked as inpaint result)
    const { data: thumbnail, error: insertError } = await supabase
      .from('thumbnails')
      .insert({
        user_id: user.id,
        prompt: prompt.trim(),
        status: 'generating',
      })
      .select()
      .single()

    if (insertError || !thumbnail) {
      console.error('Insert error:', insertError)
      await admin.rpc('increment_precision_credits', { uid: user.id, amount: 1 })
      return NextResponse.json(
        { error: 'Failed to create thumbnail record' },
        { status: 500 }
      )
    }

    // Resolve image to buffer + data URI for fal.ai (client may send data URI or public URL)
    let origImageBuffer: Buffer
    if (imageUrl.startsWith('data:')) {
      const base64Data = imageUrl.split(',')[1]
      origImageBuffer = Buffer.from(base64Data, 'base64')
    } else {
      const origResponse = await fetch(imageUrl)
      if (!origResponse.ok) {
        await supabase.from('thumbnails').update({ status: 'failed' }).eq('id', thumbnail.id)
        await admin.rpc('increment_precision_credits', { uid: user.id, amount: 1 })
        creditDeducted = false
        return NextResponse.json({ error: 'Failed to fetch original image' }, { status: 500 })
      }
      origImageBuffer = Buffer.from(await origResponse.arrayBuffer())
    }

    // Extract original dimensions to restore after Kontext edit
    const origMeta = await sharp(origImageBuffer).metadata()
    const origWidth = origMeta.width!
    const origHeight = origMeta.height!
    console.log(`[Inpaint] Original dimensions: ${origWidth}x${origHeight}`)

    const imageDataUri = `data:image/png;base64,${origImageBuffer.toString('base64')}`

    // Translate non-English prompts to English editing instruction
    let editPrompt = prompt.trim()
    const hasNonLatin = /[^\u0000-\u007F]/.test(editPrompt)
    if (hasNonLatin) {
      try {
        const result = await genai.models.generateContent({
          model: 'gemini-2.5-flash',
          config: { thinkingConfig: { thinkingBudget: 0 } },
          contents: `Translate the following image editing instruction to English. Output ONLY the translated text, nothing else.\n\nInput: ${editPrompt}`,
        })
        const translated = result.text?.trim()
        if (translated) editPrompt = translated
      } catch (e) {
        console.warn('Prompt translation failed, using original:', e)
      }
    }
    console.log(`[Inpaint] Prompt: "${editPrompt}"`)

    // Call fal.ai FLUX Kontext Pro — text-instruction-based image editing
    const result = await fal.subscribe('fal-ai/flux-pro/kontext', {
      input: {
        image_url: imageDataUri,
        prompt: editPrompt,
        output_format: 'png',
      },
    })

    const editedUrl = result.data?.images?.[0]?.url
    if (!editedUrl) {
      await supabase
        .from('thumbnails')
        .update({ status: 'failed' })
        .eq('id', thumbnail.id)
      await admin.rpc('increment_precision_credits', { uid: user.id, amount: 1 })
      return NextResponse.json(
        { error: 'Inpainting failed — no image returned' },
        { status: 502 }
      )
    }

    // Upscale via Recraft Crisp — pass Kontext output URL directly (no data URI)
    const upscaleResult = await fal.subscribe('fal-ai/recraft/upscale/crisp', {
      input: {
        image_url: editedUrl,
      },
    })

    const outputUrl = (upscaleResult.data as any)?.image?.url
    if (!outputUrl) {
      console.warn('[Inpaint] Upscale failed, falling back to edited image')
    }

    // Download result and resize to original dimensions (prevent aspect ratio drift)
    const finalResponse = await fetch(outputUrl || editedUrl)
    const imageBuffer = await sharp(Buffer.from(await finalResponse.arrayBuffer()))
      .resize(origWidth, origHeight, { fit: 'fill' })
      .png()
      .toBuffer()
    console.log(`[Inpaint] Final resized to original: ${origWidth}x${origHeight}`)

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
      await admin.rpc('increment_precision_credits', { uid: user.id, amount: 1 })
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to save inpainted image' },
        { status: 500 }
      )
    }

    const { data: publicUrlData } = supabase.storage
      .from('thumbnails')
      .getPublicUrl(storagePath)

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
      await admin.rpc('increment_precision_credits', { uid: user.id, amount: 1 })
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
      await admin.rpc('increment_precision_credits', { uid: userId, amount: 1 })
    }
    console.error('Inpaint error:', error)
    if (error && typeof error === 'object' && 'body' in error) {
      console.error('Inpaint error body:', JSON.stringify((error as any).body, null, 2))
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
