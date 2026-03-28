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
  "voice": "eleven_meditation_voice",
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
  "audioUrl": "https://cdn.rituales.app/audio/ritual_123.mp3",
  "status": "ready",
  "provider": "elevenlabs",
  "voice": "eleven_meditation_voice",
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

## Notes

- The frontend is already prepared to fall back to local mocks when `VITE_RITUALES_API_BASE_URL` is missing.
- The recommended production flow is:
  1. Create ritual
  2. Persist ritual and session plan
  3. Render audio only on demand
  4. Save the rendered audio URL
- The intro, ambient layer, and closing can be reused server-side to reduce TTS cost.
