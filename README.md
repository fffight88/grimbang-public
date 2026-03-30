# Grimbang (그림방)

> **"Your Sentence, Becomes Art."** — AI-powered YouTube thumbnail generator.

한 문장의 프롬프트로 유튜브 썸네일을 생성하고, 텍스트 지시만으로 정밀 편집까지 수행하는 SaaS 서비스입니다.

## Features

- **AI 썸네일 생성** — 프롬프트 한 줄로 16:9 고품질 썸네일 생성 (2K 해상도)
- **정밀 편집** — "배경을 더 어둡게", "텍스트 추가해줘" 같은 자연어 지시로 편집
- **프리셋 스타일** — 10종의 CTR 최적화 프리셋 (바이럴, 시네마틱, 웹툰, VS 배틀 등)
- **참조 이미지** — 이전 썸네일을 첨부하면 스타일을 자동 분석하여 일관성 유지
- **한글 지원** — 한국어 프롬프트 자동 번역, 한/영 UI
- **크레딧 시스템** — 가입 시 무료 5크레딧, 구독제 운영

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
    generate/route.ts    # 썸네일 생성 파이프라인
    inpaint/route.ts     # 정밀 편집 파이프라인
  dashboard/             # 메인 대시보드
  (main)/                # 랜딩페이지
components/
  dashboard/
    PromptArea.tsx       # Generate/Precision 듀얼 모드 UI
    Sidebar.tsx          # 실시간 썸네일 히스토리
  main/                  # 랜딩페이지 컴포넌트
lib/
  system-prompt.ts       # 시스템 프롬프트 (별도 설정 필요)
  presets.ts             # 프리셋 템플릿 (별도 설정 필요)
  gemini.ts              # Gemini 클라이언트
  supabase/              # Supabase 클라이언트 (server/client)
  i18n/                  # 한/영 다국어 지원
```

## License

All rights reserved. This code is provided for reference purposes only.
