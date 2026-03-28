
  # MVP Prototipo App Rituales

  This is a code bundle for MVP Prototipo App Rituales. The original project is available at https://www.figma.com/design/qQj0jAJS6UwCVp6dxfv2ys/MVP-Prototipo-App-Rituales.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Groq speech test

  To test ritual narration with `https://api.groq.com/openai/v1/audio/speech`, create a `.env.local` file:

  ```bash
  GROQ_API_KEY=your_groq_api_key
  VITE_GROQ_SPEECH_MODEL=playai-tts
  VITE_GROQ_SPEECH_VOICE=Fritz-PlayAI
  VITE_GROQ_SPEECH_FORMAT=mp3
  VITE_RITUALES_API_BASE_URL=http://localhost:3000/api
  ```

  If `VITE_RITUALES_API_BASE_URL` is present, the frontend is ready to call a real backend for ritual generation and guided-audio rendering. Without it, the app falls back to local mocks for ritual generation and uses the local `/api/audio/speech` proxy only for audio previews during development.
  
