# Rituales v2 — Plan (branch experimental, paralela al flujo actual)

Estado: **borrador para revisión**, no ejecutado todavía.

## Visión

El flujo actual (`/onboarding → /crear/1-5`) pide intención, energía, elemento y arma
un ritual en 4 pasos de formulario. v2 reemplaza el **paso de intención** por una
conversación corta con la IA: el usuario habla o escribe, la IA refina y devuelve
opciones claras, y de paso vamos construyendo un perfil de la persona (creencias,
patrones emocionales, historia) que persiste en Supabase y mejora la personalización
con el tiempo.

Es **paralela/experimental**: vive en una ruta nueva (ej. `/crear-v2/1` o `/chat`),
no toca el flujo actual. Permite probarla con un subset de usuarios sin riesgo.

## Fases (faceted)

### Fase 1 — Conversación de intención (esta es la prioridad, foco UX/UI)

Reemplaza `StepIntention.tsx` por una vista tipo chat:

- **Input único** (igual que hoy: textarea + botón de dictado vía
  `SpeechRecognition continuous`), pero la interacción cambia:
  - El usuario escribe o dicta lo que le pasa.
  - La IA responde con **una pregunta de refinamiento concreta + opciones clidas**
    (chips seleccionables, no texto libre obligatorio) para acotar la intención.
  - Máximo **4 intercambios** (no es chat infinito). Si en 1-2 ya queda claro, se
    salta directo a la confirmación.
  - Usuario avanzado: puede ignorar las preguntas y tipear/dictar todo de una,
    igual que el flujo actual — el modo conversacional es progresivo, no forzado.
  - Al cerrar, se muestra el resumen ("Tu intención: ...") con CTA "Continuar",
    igual que ahora.
- **Backend**: extender `reframeIntention` (o nuevo endpoint
  `POST /rituals/refine-intention`) para que reciba el historial de la conversación
  + perfil acumulado del usuario, y devuelva `{ question?, options?, intention?, done }`.
- **Perfil persistente (Supabase, desde día 1)**:
  - Tabla nueva, ej. `user_emotional_profile`: `user_id`, `beliefs` (jsonb),
    `patterns` (jsonb), `history` (jsonb array con timestamps), `updated_at`.
  - Cada conversación de intención agrega entradas (no sobreescribe) — se va
    "conociendo" al usuario con el tiempo.
  - Requiere RLS (solo el propio usuario lee/escribe su perfil) — coordinar con
    `rituales-backend`.
  - Usuarios anónimos: la conversación funciona igual, pero sin persistencia de
    perfil (igual que hoy con `mock-`/`dev-` ids).

**Entregable de Fase 1**: nueva ruta + componente de chat + endpoint de refinamiento
+ tabla de perfil. El resto del flujo (`/crear/2-5`) se reusa sin cambios.

### Fase 2 — Ritual/meditación/acción concreta personalizados

- La generación del ritual (`generateRitual`) recibe también el perfil acumulado,
  no solo intención/energía/elemento.
- Además de "ritual" o "meditación guiada", la IA puede sugerir una **acción
  concreta** (salir a caminar, correr, escribir algo) cuando eso es lo que mejor
  encaja con la intención y el estado de la persona.
- Recomendación de fecha/horario sugerido usando `cosmic-calendar.ts` (ya existe
  la lógica de fases lunares/eventos — se reusa, no se reescribe).

### Fase 3 — Facilitación con voz (ElevenLabs, sensible a tiempos)

- Hoy el `GuidedAudioPlayer` lee texto plano vía TTS. v2 necesita que la
  narración tenga **pausas/ritmo de meditación**, no solo lectura corrida.
- Investigar qué soporta la API de ElevenLabs para pausas (`<break>`/silencios)
  vs. generar el audio en segmentos separados y armar el timing en el frontend
  (similar a `GuidedSessionPlan.segments` que ya existe en `RitualContext`).
- Esto es trabajo de **guion** (cómo se escribe el texto con marcas de pausa) +
  **ingeniería de audio** (cómo se ensamblan los segmentos).

### Fase 4 — Medición punto A → punto B (30 min)

- Check-in de estado emocional **antes** (al cerrar la conversación de intención)
  y **después** (a los 30 min de iniciado el ritual/acción).
- Mecanismo simple: slider o chips de "cómo te sentís" (reusar UI de mood chips
  de Home/Stories).
- El "después" necesita traer al usuario de vuelta — evaluar notificación local
  (con permisos) vs. simplemente mostrarlo si vuelve a abrir la app dentro de la
  ventana de 30-60 min. Sin asumir push notifications nativas (limitación PWA/iOS).

### Fase 5 — Elementos/ingredientes + agendar

- Si el ritual requiere elementos (vela, sahumerio, etc.), mostrar lista tipo
  "receta" (reusa lógica de `candle.ts` como referencia de matching).
- Permitir agendar el día/hora del ritual (recomendado por Fase 2), guardado en
  perfil o en `daily_anchor_entries`.

## Riesgos / decisiones abiertas

- **Costo**: cada conversación de refinamiento = llamadas LLM adicionales vs. el
  modelo 1-shot actual (~$0.00008/ritual). A monitorear cuando se mida uso real.
- **Datos sensibles**: el perfil acumulado (creencias, patrones emocionales) es
  dato sensible. Falta: copy claro al usuario sobre qué se guarda, opción de
  borrar su perfil, y revisar si necesita mención en política de privacidad.
- **Backend**: Fase 1 requiere un endpoint nuevo/extendido y una tabla nueva en
  Supabase — coordinar con `rituales-backend`.

## Próximo paso

Si se aprueba, Fase 1 arranca con:
1. Crear branch `rituales-v2` desde `design`.
2. Nuevo componente de chat de intención (UI primero, con mock de respuestas).
3. Endpoint de refinamiento conversacional (dev proxy en Vite primero, luego backend).
4. Tabla `user_emotional_profile` en Supabase + RLS.
