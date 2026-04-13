import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

const DEFAULT_ELEVENLABS_VOICE_ID = 'El3gkPAhMU9R5biL3rtU';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      // The React and Tailwind plugins are both required for Make, even if
      // Tailwind is not being actively used – do not remove them
      react(),
      tailwindcss(),
      {
        name: 'claude-proxy',
        configureServer(server) {
          const REFRAME_SYSTEM = `Transformás lo que dice una persona en una afirmación de manifestación, en español rioplatense.
La afirmación describe el deseo como algo que ya está en movimiento, que fluye naturalmente, que llega en el momento justo.
No uses "Quiero", "Elijo" ni "Me abro a" — eso es deseo, no manifestación.
Usá lenguaje presente: "aparece", "fluye", "llega", "se abre", "se construye", "encuentra su lugar".
Ejemplo: "quiero conseguir trabajo" → "El espacio para desarrollar mis habilidades y lograr mis objetivos aparece cuando menos lo espero y fluye naturalmente."
UNA SOLA frase. Sin comillas. Sin explicaciones.`;

          const GENERATE_SYSTEM = `Sos una guía espiritual que crea rituales personalizados en español rioplatense.
Dado el contexto del usuario, generá un ritual con tono suave, íntimo y meditativo.
Respondé SOLO con JSON válido, sin texto extra, con esta estructura exacta:
{
  "title": "Nombre del ritual (máx 8 palabras)",
  "opening": "Apertura: cómo prepararse y entrar en presencia (máx 80 palabras)",
  "symbolicAction": "Acción simbólica concreta con un elemento natural (máx 80 palabras)",
  "closing": "Cierre e intención para llevar (máx 60 palabras)"
}`;

          async function readBody(req: any): Promise<any> {
            const chunks: Uint8Array[] = [];
            for await (const chunk of req) {
              chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
            }
            return JSON.parse(Buffer.concat(chunks).toString('utf8'));
          }

          async function callClaude(apiKey: string, system: string, userMessage: string, maxTokens: number) {
            const upstream = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
              },
              body: JSON.stringify({
                model: 'claude-haiku-4-5',
                max_tokens: maxTokens,
                system,
                messages: [{ role: 'user', content: userMessage }],
              }),
            });
            if (!upstream.ok) {
              const text = await upstream.text();
              throw new Error(`Claude API error ${upstream.status}: ${text}`);
            }
            const data = await upstream.json() as any;
            return data.content?.[0]?.text ?? '';
          }

          // POST /api/claude/reframe-intention  { text }  → { reframed }
          server.middlewares.use('/api/claude/reframe-intention', async (req: any, res: any) => {
            if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
            const apiKey = env.ANTHROPIC_API_KEY;
            if (!apiKey) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing ANTHROPIC_API_KEY in .env.local' }));
              return;
            }
            try {
              const body = await readBody(req);
              const text = await callClaude(apiKey, REFRAME_SYSTEM, body.text, 80);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ reframed: text.trim() }));
            } catch (error) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Claude error' }));
            }
          });

          // POST /api/claude/create  { ritualType, intention, energy, element, duration, intensity }
          server.middlewares.use('/api/claude/create', async (req: any, res: any) => {
            if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
            const apiKey = env.ANTHROPIC_API_KEY;
            if (!apiKey) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing ANTHROPIC_API_KEY in .env.local' }));
              return;
            }
            try {
              const input = await readBody(req);
              const userMessage = `Tipo de ritual: ${input.ritualType}
Intención: ${input.intention}
Energía deseada: ${input.energy}
Elemento: ${input.element}
Duración: ${input.duration} minutos
Intensidad: ${input.intensity || 'suave'}`;

              const text = await callClaude(apiKey, GENERATE_SYSTEM, userMessage, 500);
              const ritual = JSON.parse(text.trim());

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ritualId: `dev-${Date.now()}`, ritual }));
            } catch (error) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Claude error' }));
            }
          });
        },
      },
      {
        name: 'elevenlabs-speech-proxy',
        configureServer(server) {
          // POST /api/audio/speech  { voice_id, text, model_id?, voice_settings?, dialect_hint? }
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

              const voiceId: string = body.voice_id || DEFAULT_ELEVENLABS_VOICE_ID;
              const { voice_id: _vid, dialect_hint: _dialectHint, ...elevenBody } = body;

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
                      stability: 0.6,
                      similarity_boost: 0.75,
                      speed: 0.96,
                      style: 0,
                      use_speaker_boost: false,
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
