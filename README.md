# Grimbang (그림방)

> **"Your Sentence, Becomes Art."** — AI-powered YouTube thumbnail generator.

Generate high-quality YouTube thumbnails with a single prompt, and refine them with natural language instructions.

한 문장의 프롬프트로 유튜브 썸네일을 생성하고, 텍스트 지시만으로 정밀 편집까지 수행하는 SaaS 서비스입니다.

## Features

- **AI Thumbnail Generation** — Generate 16:9 thumbnails in 2K resolution from a single prompt
- **Precision Edit** — Edit with natural language like "make the background darker" or "add text"
- **Preset Styles** — 10 CTR-optimized presets (viral, cinematic, webtoon, VS battle, etc.)
- **Reference Images** — Attach previous thumbnails for automatic style analysis and consistency
- **Korean Support** — Auto-translation of Korean prompts, bilingual UI (KR/EN)
- **Credit System** — 5 free credits on signup, subscription-based pricing

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, Tailwind CSS v4, TypeScript 5 |
| Backend | Next.js API Routes (Serverless) |
| Database & Auth | Supabase (Auth, PostgreSQL, Storage) |
| AI — Generation | Google Gemini 3.1 Flash |
| AI — Precision Edit | fal.ai FLUX Kontext Pro + Recraft Crisp Upscale |
| Payments | Polar |
| Deployment | Vercel |

## Architecture

```
Client (React 19)
  ├─ Generate Mode ──→ /api/generate ──→ Gemini 3.1 Flash (2K)
  │                                        └─ Fallback → Gemini 2.5 Flash
  │
  └─ Precision Mode ─→ /api/inpaint ──→ Korean→English Translation
                                          └─ FLUX Kontext Pro (Edit)
                                              └─ Recraft Crisp Upscale (2K)

  All paths: Auth → Credit Check/Deduct → AI Pipeline → Storage → DB Update
             (failure at any stage → automatic credit rollback)
```

## Getting Started

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local
# Fill in: GOOGLE_GEMINI_API_KEY, FAL_KEY, NEXT_PUBLIC_SUPABASE_URL, etc.

# Set up prompt files (system prompt & presets are excluded from repo)
cp lib/system-prompt.example.ts lib/system-prompt.ts
cp lib/presets.example.ts lib/presets.ts
# Customize with your own prompts and preset templates

# Run development server
npm run dev
```

## Project Structure

```
app/
  api/
    generate/route.ts    # Thumbnail generation pipeline
    inpaint/route.ts     # Precision edit pipeline
  dashboard/             # Main dashboard
  (main)/                # Landing page
components/
  dashboard/
    PromptArea.tsx       # Generate/Precision dual-mode UI
    Sidebar.tsx          # Real-time thumbnail history
  main/                  # Landing page components
lib/
  system-prompt.ts       # System prompt (setup required)
  presets.ts             # Preset templates (setup required)
  gemini.ts              # Gemini client
  supabase/              # Supabase client (server/client)
  i18n/                  # KR/EN localization
```

## License

All rights reserved. This code is provided for reference purposes only.
