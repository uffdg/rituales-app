import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      // The React and Tailwind plugins are both required for Make, even if
      // Tailwind is not being actively used – do not remove them
      react(),
      tailwindcss(),
      {
        name: 'elevenlabs-speech-proxy',
        configureServer(server) {
          // POST /api/audio/speech  { voice_id, text, model_id?, voice_settings? }
          server.middlewares.use('/api/audio/speech', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }

            const apiKey = env.ELEVENLABS_API_KEY;
            if (!apiKey) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing ELEVENLABS_API_KEY in .env.local' }));
              return;
            }

            try {
              const chunks: Uint8Array[] = [];
              for await (const chunk of req) {
                chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
              }
              const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));

              const voiceId: string = body.voice_id || 'El3gkPAhMU9R5biL3rtU';
              const { voice_id: _vid, ...elevenBody } = body;

              const upstream = await fetch(
                `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
                {
                  method: 'POST',
                  headers: {
                    'xi-api-key': apiKey,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    model_id: 'eleven_multilingual_v2',
                    language_code: 'es',
                    voice_settings: {
                      stability: 0.55,
                      similarity_boost: 0.75,
                      speed: 0.76,
                      style: 0.45,
                    },
                    ...elevenBody,
                  }),
                },
              );

              res.statusCode = upstream.status;
              res.setHeader(
                'Content-Type',
                upstream.headers.get('content-type') || 'audio/mpeg',
              );

              if (!upstream.ok) {
                const errorText = await upstream.text();
                res.end(errorText);
                return;
              }

              res.end(Buffer.from(await upstream.arrayBuffer()));
            } catch (error) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  error: error instanceof Error ? error.message : 'Error calling ElevenLabs.',
                }),
              );
            }
          });
        },
      },
    ],
    resolve: {
      alias: {
        // Alias @ to the src directory
        '@': path.resolve(__dirname, './src'),
      },
    },

    // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
    assetsInclude: ['**/*.svg', '**/*.csv'],
  };
})
