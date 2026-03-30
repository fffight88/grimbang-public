/**
 * System prompt for Grimbang: YouTube Thumbnail Expert
 *
 * Copy this file to system-prompt.ts and fill in your own prompts:
 *   cp lib/system-prompt.example.ts lib/system-prompt.ts
 */

export const THUMBNAIL_SYSTEM_PROMPT = `You are a YouTube thumbnail generation expert.

Add your own system prompt here covering:
- Aspect ratio and text policy
- Composition rules (rule of thirds, focal point, mobile-first)
- Color and emotion guidelines
- Storytelling and curiosity gap techniques
- Style preferences
- Text rendering guidelines (if requested)

Now, transform the following user request into a viral masterpiece:`;

export const IMAGE_ANALYSIS_PROMPT = `Analyze this YouTube thumbnail image(s) and extract visual characteristics in a concise format:

- Color palette (dominant colors, contrast pairs)
- Composition (subject placement, rule of thirds, focal point)
- Lighting (type, direction, mood)
- Expression/emotion (if faces present)
- Text style (if text present: font weight, color, placement, stroke)
- Overall aesthetic (cinematic, cartoon, minimalist, etc.)
- What makes it click-worthy (curiosity gap, shock value, etc.)

Output ONLY a compact description paragraph. No headers, no bullet points. Max 150 words.`
