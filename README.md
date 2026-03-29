
# MVP Prototipo App Rituales

Frontend de la experiencia de rituales guiados.

## Correr en local

1. Instalá dependencias con `npm i`
2. Levantá el proyecto con `npm run dev`

## Audio con ElevenLabs

Para probar la narración del ritual en local, creá un `.env.local` con:

```bash
ELEVENLABS_API_KEY=your_elevenlabs_api_key
VITE_ELEVENLABS_VOICE_ID=El3gkPAhMU9R5biL3rtU
VITE_RITUALES_API_BASE_URL=http://localhost:3000/api
VITE_AUTH_REDIRECT_URL=http://127.0.0.1:5173
```

La voz por default del proyecto es `El3gkPAhMU9R5biL3rtU`. Si no definís `VITE_ELEVENLABS_VOICE_ID`, el frontend y el proxy local van a usar esa misma voice id.

Si `VITE_RITUALES_API_BASE_URL` está presente, el frontend queda listo para hablar con un backend real para crear rituales y renderizar audio final. Si no está presente, la app sigue usando mocks locales para generar rituales y el proxy `/api/audio/speech` solo para previews de audio durante desarrollo.

Para que el magic link vuelva a tu entorno local, agregá también `http://127.0.0.1:5173` dentro de los Redirect URLs permitidos en Supabase Auth.
  
