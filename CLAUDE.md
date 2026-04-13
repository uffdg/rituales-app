# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Dev server (Vite, hot reload)
npm run build    # Production build → dist/
```

No lint or test commands configured.

## Architecture

React 18 SPA deployed on Vercel at `https://rituales-app-ruby.vercel.app`. No base path — routes are at root (`/`). Styled as a **mobile-first app** constrained to `max-width: 390px`, centered on desktop with a drop shadow.

### UI Stack

Tailwind v4 (uses `@theme inline` and `@custom-variant` syntax — not v3). shadcn/ui components live in `src/app/components/ui/`. Custom design tokens defined in `src/styles/theme.css`. App background is `#EEEAE6` with white content panel.

### Auth

Supabase OTP (6-digit code) auth. `UserContext` (`src/app/context/UserContext.tsx`) wraps `supabase.auth` and exposes `{ session, user, loading, signOut }`. `AuthGuard` (`src/app/components/AuthGuard.tsx`) protects routes by redirecting to `/login` when no session.

Public routes: `/`, `/stories`, `/calendario-cosmico`, `/wiki`, `/wiki/:id`, `/explorar`, `/ritual/:id`, `/login`
Protected routes: `/onboarding`, `/crear/*`, `/compartir`, `/cuenta`

Routes are defined in `src/app/routes.tsx` (must be `.tsx`, not `.ts` — contains JSX).

### State & Data Flow

All ritual creation state lives in `RitualContext` (`src/app/context/RitualContext.tsx`), persisted to localStorage under `rituales_current`. Tracks: user inputs (intention, energy, element, anchor) → AI-generated ritual text → guided session plan → audio state.

Multi-step wizard: `/onboarding` → `/crear/1` (intention) → `/crear/2` (energy) → `/crear/3` (element) → `/crear/4` (ritual generation) → `/crear/5` (anchor). Each step reads/writes via `useRitual()`.

**Reset behavior**: `Onboarding` calls `resetRitual()` on mount — entering the creation flow always starts clean. IDs with `mock-` or `dev-` prefix are treated as local-only and stripped from localStorage on load.

Voice input on `/onboarding` and `/crear/1` uses `SpeechRecognition` with `continuous: true` — mic stays on until user manually stops, then the full transcript is sent to the backend for positive reframing before being stored as the intention. On `/onboarding`, after reframe the card appears with "Continuar" enabled (no separate "Comenzar ritual" button).

### Backend Integration

`src/app/lib/ritual-service.ts` is the single point of contact with the backend:
- `generateRitual()` → `POST /rituals/create`
- `renderGuidedAudio()` → `POST /rituals/:id/render-audio`
- `getRitualById()` → `GET /rituals/:id`
- `reframeIntention()` → `POST /rituals/reframe-intention`

All these functions have **graceful fallbacks** when the backend is unreachable:
- `generateRitual()` → falls back to Vite Claude proxy → falls back to static mock
- `reframeIntention()` → falls back to Vite Claude proxy → returns null (raw transcript used)
- `getRitualById()` → falls back to direct Supabase query
- IDs prefixed `mock-` or `dev-` are skipped on fetch and treated as local-context rituals

When `generateRitualWithDevProxy` runs, it calls Claude via the Vite proxy AND saves to Supabase directly (so the returned `ritualId` is a real UUID, enabling share links and profile listing).

### Dev Proxies (Vite middleware — dev only)

`vite.config.ts` has three Vite server middlewares, all dev-only:

| Endpoint | Purpose |
|---|---|
| `POST /api/audio/speech` | Proxy to ElevenLabs, injects `ELEVENLABS_API_KEY` |
| `POST /api/claude/reframe-intention` | Calls Claude Haiku with reframe system prompt, returns `{ reframed }` |
| `POST /api/claude/create` | Calls Claude Haiku with ritual generation prompt, returns `{ ritual }` |

`ANTHROPIC_API_KEY` must be in `.env.local` (server-side only, never exposed to browser). Without it, the Claude proxies return 500 and the service falls back to static mocks.

### Supabase Direct Fallback Pattern

When the Express backend is unreachable, both `user-service.ts` and `ritual-service.ts` fall back to querying Supabase directly using the frontend client. This mirrors prod behavior without running the backend locally. The mapping between Supabase snake_case columns and frontend camelCase types is handled by local `mapRitualRow()` helpers in each service file.

### Audio Player

`GuidedAudioPlayer` (`src/app/components/GuidedAudioPlayer.tsx`):
- No `src` + `onStart` prop → play button triggers audio generation
- `disabled=true` → animated spinner loading state (shown while backend generates TTS)
- Has `src` → standard play/pause/seek + ambient soundscape layer (handpan at 3% volume)

`RitualDetail` has an inline 3-track soundscape player (bottom sheet triggered by "Iniciar" button):
- Three tracks from `src/app/assets/`: handpan, dana meditation, third-eye frequency (all 432hz)
- Tracks loop, volume 70%, one active at a time, managed via `new Audio()` ref
- Note: the three MP3 files are large (~5–19MB each) and bundled as static assets — consider CDN hosting if bundle size becomes an issue

### Layout & Navigation

`Layout` (`src/app/components/Layout.tsx`) wraps all non-login routes and renders a fixed bottom nav with 5 tabs: Hoy (`/stories`), Inicio (`/`), Explorar (`/explorar`), Crear (`/onboarding`), Wiki (`/wiki`). All pages must add `pb-16` or equivalent to avoid content being hidden behind the nav.

### User Service

`src/app/lib/user-service.ts` handles all authenticated user operations against the backend:
- `getUserDashboard()` → `GET /me/dashboard` — falls back to direct Supabase query when backend is down
- `updateProfile()` → `PATCH /me/profile`
- `favoriteRitual()` / `unfavoriteRitual()` → `POST/DELETE /rituals/:id/favorite`
- `likeRitual()` / `unlikeRitual()` → `POST/DELETE /rituals/:id/like`
- `deleteOwnRitual()` → `DELETE /rituals/:id`

All these pass a Supabase JWT via `Authorization: Bearer` header.

### Analytics

`src/app/lib/analytics.ts` exports `track(event, props?)` which dual-writes: localStorage (`rituales_events`, capped at 200 entries) + Supabase `ritual_events` table (anonymous or authenticated). Also fires to `POST /events` on the backend if `VITE_RITUALES_API_BASE_URL` is set.

### Cosmic Calendar

`src/app/lib/cosmic-calendar.ts` is a pure client-side utility. Moon phases are computed algorithmically from a known new moon anchor (`2026-03-19`, Buenos Aires time). Eclipses and equinoxes are hardcoded in `KNOWN_EVENTS` / `PERFECTED_POSITIONS` — adding new events requires editing that file directly.

### Stories

`src/app/pages/Stories.tsx` is a full-screen swipeable stories feed. Cards are generated from `EDITORIAL_CARDS` (static content) combined with dynamic cards (cosmic context, mood picker). A progressive unlock system (`getDailyEditorial`) shows more cards as days pass since first visit, tracked in `rituales_stories_first_visit_v1` localStorage key.

### Static Data

`src/app/data/rituals.ts` — curated public ritual records shown on `/explorar`.
`src/app/data/wiki.ts` — wiki entries shown on `/wiki` and `/wiki/:id`.

### Supabase Client

`src/app/lib/supabase.ts` — initialized with `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`. Used directly by `UserContext` for auth, by `analytics.ts` for event tracking, and by `user-service.ts` for saved rituals.

## Environment Variables

`.env.local` (frontend):
```
ELEVENLABS_API_KEY=...          # Vite dev proxy only (not VITE_ prefixed — server-side only)
ANTHROPIC_API_KEY=...           # Vite dev proxy only (not VITE_ prefixed — server-side only)
VITE_RITUALES_API_BASE_URL=...  # e.g. http://localhost:5001/api — leave unset to use dev proxies
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_PUBLIC_APP_URL=...         # Optional — used for share links; falls back to window.location.origin
VITE_AUTH_REDIRECT_URL=...      # e.g. http://127.0.0.1:5173
```

**Local dev without backend**: set `ANTHROPIC_API_KEY` and leave `VITE_RITUALES_API_BASE_URL` unset (or set it to a non-running URL). The Vite proxies handle Claude calls and the frontend Supabase client handles persistence directly.

Backend repo is separate (Express + Supabase + ElevenLabs + Anthropic Claude Haiku), deployed on Vercel.
