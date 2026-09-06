# Backend Contract

## Base URL

The frontend uses `VITE_RITUALES_API_BASE_URL`.

Example:

```bash
VITE_RITUALES_API_BASE_URL=http://localhost:3000/api
```

## POST `/rituals/create`

Creates a ritual and returns the structured guided session needed by the frontend.

Request body:

```json
{
  "ritualType": "claridad",
  "simpleMode": true,
  "intention": "Quiero tener claridad para tomar una decision importante.",
  "intentionCategory": "",
  "energy": "calma",
  "duration": 20,
  "intensity": "profunda",
  "element": "agua",
  "aiRitual": {
    "title": "",
    "opening": "",
    "symbolicAction": "",
    "closing": ""
  },
  "guidedSession": null,
  "guidedAudio": {
    "status": "idle"
  },
  "anchor": ""
}
```

Response body:

```json
{
  "ritualId": "ritual_123",
  "ritual": {
    "title": "Ritual de claridad interior",
    "opening": "Texto de apertura",
    "symbolicAction": "Texto de accion simbolica",
    "closing": "Texto de cierre"
  },
  "guidedSession": {
    "targetDurationMinutes": 20,
    "soundscape": "deep-night",
    "personalizedScript": "Guion personalizado para TTS",
    "notes": "La intro y el cierre pueden ser bloques reutilizables.",
    "segments": [
      {
        "id": "intro-universal",
        "kind": "intro",
        "label": "Inicio universal",
        "durationSeconds": 55,
        "text": "Cierra los ojos...",
        "isReusable": true
      },
      {
        "id": "middle-personalized",
        "kind": "personalized",
        "label": "Centro personalizado",
        "durationSeconds": 85,
        "text": "Texto personalizado",
        "isReusable": false
      },
      {
        "id": "ambient-20",
        "kind": "ambient",
        "label": "Capa binaural",
        "durationSeconds": 1020,
        "isReusable": true
      },
      {
        "id": "closing-universal",
        "kind": "closing",
        "label": "Cierre universal",
        "durationSeconds": 40,
        "text": "Vuelve despacio...",
        "isReusable": true
      }
    ]
  },
  "guidedAudio": {
    "status": "idle"
  }
}
```

## POST `/rituals/:id/render-audio`

Renders the final guided audio for the ritual.

Request body:

```json
{
  "voice": "El3gkPAhMU9R5biL3rtU",
  "model": "eleven_multilingual_v2",
  "responseFormat": "mp3",
  "guidedSession": {
    "targetDurationMinutes": 20,
    "soundscape": "deep-night",
    "personalizedScript": "Guion personalizado para TTS",
    "notes": "La intro y el cierre pueden ser bloques reutilizables.",
    "segments": []
  }
}
```

Response body:

```json
{
  "audioUrl": "https://sztefmznsleedqythllo.supabase.co/storage/v1/object/public/audio/rituals/ritual_123/audio.mp3",
  "status": "ready",
  "provider": "elevenlabs",
  "voice": "El3gkPAhMU9R5biL3rtU",
  "model": "eleven_multilingual_v2"
}
```

## GET `/rituals/:id`

Returns a previously created ritual, including session and audio state.

Response body:

```json
{
  "ritualId": "ritual_123",
  "ritual": {
    "title": "Ritual de claridad interior",
    "opening": "Texto de apertura",
    "symbolicAction": "Texto de accion simbolica",
    "closing": "Texto de cierre"
  },
  "guidedSession": {
    "targetDurationMinutes": 20,
    "soundscape": "deep-night",
    "personalizedScript": "Guion personalizado para TTS",
    "notes": "La intro y el cierre pueden ser bloques reutilizables.",
    "segments": []
  },
  "guidedAudio": {
    "status": "ready",
    "audioUrl": "https://cdn.rituales.app/audio/ritual_123.mp3",
    "provider": "elevenlabs",
    "voice": "eleven_meditation_voice",
    "model": "eleven_multilingual_v2"
  }
}
```

## GET `/me/daily-card`

Returns the current user's daily intention card for a client-provided date.
Requires `Authorization: Bearer <supabase_jwt>`.

Query:

```text
date=2026-09-05
```

Response body when a card exists:

```json
{
  "card": {
    "dateKey": "2026-09-05",
    "intentionText": "Hoy puedo ordenar una cosa a la vez.",
    "feeling": "tranquilo",
    "createdAt": "2026-09-05T12:10:00.000Z"
  }
}
```

Response body when no card exists:

```json
{
  "card": null
}
```

## POST `/me/daily-card`

Creates the current user's daily intention card. This endpoint is get-or-create:
if a card already exists for `(user, dateKey)`, it returns the existing card and
does not overwrite `intentionText` or `feeling`.

Request body:

```json
{
  "dateKey": "2026-09-05",
  "intentionText": "Hoy puedo ordenar una cosa a la vez.",
  "feeling": null
}
```

Created response:

```json
{
  "card": {
    "dateKey": "2026-09-05",
    "intentionText": "Hoy puedo ordenar una cosa a la vez.",
    "feeling": null,
    "createdAt": "2026-09-05T12:10:00.000Z"
  },
  "created": true
}
```

Existing-card response:

```json
{
  "card": {
    "dateKey": "2026-09-05",
    "intentionText": "La intención original se mantiene.",
    "feeling": "tranquilo",
    "createdAt": "2026-09-05T12:10:00.000Z"
  },
  "created": false
}
```

## PATCH `/me/daily-card`

Updates only the `feeling` for an existing daily intention card. `intentionText`
is immutable after creation.

Request body:

```json
{
  "dateKey": "2026-09-05",
  "feeling": "tranquilo"
}
```

Response body:

```json
{
  "card": {
    "dateKey": "2026-09-05",
    "intentionText": "Hoy puedo ordenar una cosa a la vez.",
    "feeling": "tranquilo",
    "createdAt": "2026-09-05T12:10:00.000Z"
  }
}
```

## Notes

- The frontend is already prepared to fall back to local mocks when `VITE_RITUALES_API_BASE_URL` is missing.
- The recommended production flow is:
  1. Create ritual
  2. Persist ritual and session plan
  3. Render audio only on demand
  4. Save the rendered audio URL
- The intro, ambient layer, and closing can be reused server-side to reduce TTS cost.
