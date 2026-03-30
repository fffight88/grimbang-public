# Grimbang (그림방) — Project Guide

## Rebranding
- Project is transitioning from "NailArt" to **Grimbang (그림방)**
- Full roadmap: `docs/Grimbang_Project_Roadmap.md` — covers model strategy, pricing, feature phases, and brand identity
- Slogan: *"Your Sentence, Becomes Art."*

## Service Overview
- AI-powered YouTube thumbnail generator
- Gemini API: `gemini-3.1-flash-image-preview` (생성+수정 단일 모델, 2K) / `gemini-2.5-flash-image` (fallback)
- 1크레딧 = 1회 API 호출 (생성 또는 수정, Gemini 3.1 Flash 2K, $0.101/회)
- fal.ai API: `fal-ai/flux-pro/kontext` — Phase 2 텍스트 지시 기반 이미지 편집 (구현 완료, DB 마이그레이션 필요)
- Imagen 4 Fast/Standard 검토 후 품질 미달로 제외 (구도 제어 약함, 이미지 입력 불가)
- Stack: Next.js 16, React 19, Tailwind v4, Supabase (Auth / DB / Storage)

## Key Files
| Path | Purpose |
|------|---------|
| `lib/system-prompt.ts` | Gemini system prompt — thumbnail generation guidelines |
| `lib/gemini.ts` | Gemini client (`GoogleGenAI`) export only |
| `app/api/generate/route.ts` | POST: auth → DB insert → Gemini (multimodal) → Storage → DB update |
| `components/dashboard/PromptArea.tsx` | Prompt UI with image attachments, existing thumbnails popover, loading/success/error states |
| `components/dashboard/InpaintingModal.tsx` | Precision Edit: Canvas 마스크 그리기 + fal.ai 인페인팅 + 결과 비교/Attach |
| `app/api/inpaint/route.ts` | POST: auth → precision credit 차감 → fal.ai FLUX Kontext → Storage → 실패 시 롤백 |
| `components/dashboard/Sidebar.tsx` | Left sidebar gallery with realtime thumbnail history |
| `components/dashboard/DashboardNavbar.tsx` | Top navbar with profile popover and mobile sidebar toggle |
| `app/dashboard/page.tsx` | Dashboard layout: sidebar + main content area |
| `lib/types.ts` | Shared TypeScript types (`Thumbnail`, etc.) |
| `lib/supabase/client.ts` | Browser-side Supabase client |
| `lib/supabase/server.ts` | Server-side Supabase client with cookie management |

## System Prompt Rules (`lib/system-prompt.ts`)
- Default: NO text in generated images
- Text allowed only when user **explicitly requests** it → render in English by default, other languages only when specified
- 16:9 aspect ratio, bold high-contrast colors (2-3 max)
- Rule of thirds composition, clear focal point readable at 168x94px
- Based on: Nano Banana prompting guide + YouTube thumbnail best practices

## Conventions
- User prompts can be in any language; system prompt is written in English
- `quantum-pulse-loade.tsx` filename has typo (missing 'r') — known, not breaking
- Use `next/image` for all images; remote patterns configured in `next.config.ts`
- Supabase browser client: always memoize with `useMemo(() => createClient(), [])`
- Popover components that live inside `backdrop-blur` containers must use `createPortal` to escape containing block
- Glassmorphism style: `bg-white/[0.03-0.06]`, `border-white/[0.06-0.1]`, `backdrop-blur-xl`
- Dashboard background: `#181818`, sidebar: `#202020`

## Inpainting Strategy (Phase 2 — 구현 완료)
- **기본 수정** (1크레딧/회): Gemini `generateContent`로 원본+프롬프트 전체 재생성
- **정밀 수정** (애드온 $4.99~9.99/월): fal.ai `fal-ai/flux-pro/kontext` — 텍스트 지시 기반 이미지 편집 ($0.04/회)
- SDK: `@fal-ai/client` (설치 완료)
- API 라우트: `/api/inpaint/route.ts` (구현 완료)
- UI: PromptArea 내 Precision 버튼 (이미지 첨부/결과 있을 때 활성화, 마스크 불필요)
- 한글 프롬프트 → Gemini 2.5 Flash로 영어 번역 후 Kontext에 전달
- DB 마이그레이션 완료: `precision_credits` 컬럼 + `use_precision_credit` / `increment_precision_credits` RPC
- 남은 작업: Polar 상품 생성

