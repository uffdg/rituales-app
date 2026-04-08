# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Dev server (Vite, hot reload)
npm run build    # Production build → dist/
```

No lint or test commands configured.

## Architecture

React 18 SPA deployed on Vercel at `https://rituales-app-ruby.vercel.app`. No base path — routes are at root (`/`).

### Auth

Supabase magic link auth. `UserContext` (`src/app/context/UserContext.tsx`) wraps `supabase.auth` and exposes `{ session, user, loading, signOut }`. `AuthGuard` (`src/app/components/AuthGuard.tsx`) protects routes by redirecting to `/login` when no session.

Public routes: `/`, `/explorar`, `/ritual/:id`, `/login`
Protected routes: `/onboarding`, `/crear/*`, `/compartir`

Routes are defined in `src/app/routes.tsx` (must be `.tsx`, not `.ts` — contains JSX).

### State & Data Flow

All ritual creation state lives in `RitualContext` (`src/app/context/RitualContext.tsx`), persisted to localStorage under `rituales_current`. Tracks: user inputs (intention, energy, element, anchor) → AI-generated ritual text → guided session plan → audio state.

Multi-step wizard: `/onboarding` → `/crear/1` (intention) → `/crear/2` (energy) → `/crear/3` (element) → `/crear/4` (ritual generation) → `/crear/5` (anchor). Each step reads/writes via `useRitual()`.

Voice input on `/onboarding` and `/crear/1` uses `SpeechRecognition` with `continuous: true` — mic stays on until user manually stops, then the full transcript is sent to the backend for positive reframing before being stored as the intention.

### Backend Integration

`src/app/lib/ritual-service.ts` is the single point of contact with the backend:
- `generateRitual()` → `POST /rituals/create`
- `renderGuidedAudio()` → `POST /rituals/:id/render-audio`
- `getRitualById()` → `GET /rituals/:id`
- `reframeIntention()` → `POST /rituals/reframe-intention` — transforms raw voice input into a manifestation-style affirmation

Backend URL set via `VITE_RITUALES_API_BASE_URL`. If unset, `generateRitual()` returns mock data and `renderGuidedAudio()` falls back to the Vite dev proxy (`/api/audio/speech` → ElevenLabs directly).

### Dev Proxy (ElevenLabs)

`vite.config.ts` includes a custom Vite middleware proxying `POST /api/audio/speech` to ElevenLabs, injecting `ELEVENLABS_API_KEY`. Dev-only — production audio goes through the backend.

### Audio Player

`GuidedAudioPlayer` (`src/app/components/GuidedAudioPlayer.tsx`):
- No `src` + `onStart` prop → play button triggers audio generation
- `disabled=true` → animated spinner loading state (shown while backend generates TTS)
- Has `src` → standard play/pause/seek + ambient soundscape layer (handpan at 3% volume)

### Supabase Client

`src/app/lib/supabase.ts` — initialized with `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`. Used directly by `UserContext` for auth and by `user-service.ts` for saved rituals.

## Environment Variables

`.env.local` (frontend):
```
ELEVENLABS_API_KEY=...          # Vite dev proxy only
VITE_RITUALES_API_BASE_URL=...  # e.g. http://localhost:5001/api
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Backend repo is separate (Express + Supabase + ElevenLabs + Anthropic Claude Haiku).
