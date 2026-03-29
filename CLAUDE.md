# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Dev server (Vite, hot reload)
npm run build    # Production build → dist/
```

No lint or test commands configured.

## Architecture

React 18 SPA, deployed at `/rituales/` (base path set in `vite.config.ts` and `basename` in `src/app/routes.ts`).

### State & Data Flow

All ritual creation state lives in `RitualContext` (`src/app/context/RitualContext.tsx`), persisted to localStorage under `rituales_current`. The context tracks the full lifecycle: user inputs (intention, energy, element, anchor) → AI-generated ritual text → guided session plan → audio state.

The multi-step wizard is `/crear/1` through `/crear/5`. Each step reads/writes to the context via `useRitual()`.

### Backend Integration

`src/app/lib/ritual-service.ts` is the single point of contact with the backend:
- `generateRitual()` → `POST /rituals/create` — generates ritual text via Claude Haiku + builds guided session plan
- `renderGuidedAudio()` → `POST /rituals/:id/render-audio` — generates TTS via ElevenLabs, caches in Supabase Storage
- `getRitualById()` → `GET /rituals/:id`

Backend URL is set via `VITE_RITUALES_API_BASE_URL` in `.env.local`. If unset, `generateRitual()` returns mock data and `renderGuidedAudio()` falls back to the Vite dev proxy (`/api/audio/speech` → ElevenLabs directly).

### Dev Proxy (ElevenLabs)

`vite.config.ts` includes a custom Vite middleware that proxies `POST /api/audio/speech` to ElevenLabs, injecting the `ELEVENLABS_API_KEY` from `.env.local`. This is dev-only — in production, audio goes through the backend.

### Audio Player

`GuidedAudioPlayer` (`src/app/components/GuidedAudioPlayer.tsx`) handles two states:
- No `src` + `onStart` prop → clicking play triggers audio generation (calls `onStart`)
- Has `src` → standard play/pause/seek controls

### Analytics

`src/app/lib/analytics.ts` tracks events to localStorage (max 200) and fire-and-forgets to `POST /api/events` if backend URL is set.

## Environment Variables

`.env.local` (frontend):
```
ELEVENLABS_API_KEY=...          # Used by Vite dev proxy only
VITE_RITUALES_API_BASE_URL=...  # Backend URL, e.g. http://localhost:5001/api
```

Backend repo is at `../super-funicular` (Express + Supabase + ElevenLabs + Anthropic).
