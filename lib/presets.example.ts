/**
 * Preset templates for thumbnail generation styles
 *
 * Copy this file to presets.ts and customize with your own templates:
 *   cp lib/presets.example.ts lib/presets.ts
 *
 * Each preset has:
 *   - id: unique identifier
 *   - icon: path to icon image in /public (256x256 PNG)
 *   - template: prompt template with [USER_PROMPT] placeholder
 */

export interface Preset {
  id: string
  icon: string
  template: string
}

export const PRESETS: Preset[] = [
  {
    id: 'example-cinematic',
    icon: '/example-cinematic.png',
    template:
      'Cinematic wide-angle shot of [USER_PROMPT], rule-of-thirds composition, golden hour lighting, high-contrast atmospheric haze, bold readable at 120px mobile thumbnail size.',
  },
  // Add more presets here...
]

export function applyPreset(template: string, userPrompt: string): string {
  return template.replace('[USER_PROMPT]', userPrompt)
}
