# Iteración agosto 2026 — Priorización del backlog de feedback

Estado: **borrador para revisión**, no ejecutado todavía.

Fuente: `guidelines/feedback-log.md` (25 insights, 3 fuentes — usuario anónimo LinkedIn,
Raúl Villoslada LinkedIn, sesión moderada think-aloud) + confirmación adicional en
`guidelines/rituales_origen.md` (entrevista Ginny, mayo 2026: "el flujo de confirmación
de cuenta no entrega código" — cuarta fuente independiente del bug de OTP).

## Objetivo

Resolver lo que bloquea la entrada y la confianza en el producto (2 bugs bloqueantes),
arreglar el corazón de la propuesta de valor cuando falla en uso real (reencuadre de
intención), y después ordenar el resto del backlog en franjas claras de trabajo
(UX/copy vs. decisiones de producto vs. a futuro) para que las próximas rondas no
salgan de la nada.

Esta ronda **no** es un rediseño. Es estabilización + un fix de producto puntual.
No se solapa con `docs/rituales-v2-plan.md` (que sigue siendo un cambio de fondo,
todavía no ejecutado, y que de hecho depende de que `reframeIntention` funcione bien
primero — v2 lo extiende a conversación, no lo reemplaza).

---

## Prioridad 0 — Bugs bloqueantes (bloquean que la gente ni siquiera entre)

### 0.1 — OTP de registro no llega (insight #15, bug logueado del usuario LinkedIn,
confirmado además en la entrevista a Ginny en `rituales_origen.md`)

**Por qué va primero:** si el código no llega, nadie llega ni al resto de los bugs.
Es la puerta de entrada. Cuatro fuentes independientes lo confirmaron.

**Causa raíz (investigada, no es un bug de código de la app):**
- `rituales-app/src/app/pages/Login.tsx` usa `supabase.auth.signInWithOtp(...)` y
  `supabase.auth.verifyOtp(...)` — la llamada al SDK está bien hecha.
- `rituales-backend` no tiene ningún código propio de envío de mail: no hay SMTP
  custom, ni hook de email, ni plantilla propia en `supabase/schema.sql` ni en
  `src/`. El mail lo envía enteramente el servicio de mail **por defecto** de
  Supabase Auth (compartido, con rate limit bajo — 2-4 mails/hora en free tier —
  y mala reputación de entrega, por eso cae en spam o no llega).
- **Conclusión: esto no se arregla con una PR de código.** Es una tarea de
  configuración en el Dashboard de Supabase: activar **Custom SMTP** (Resend,
  Postmark, SendGrid o similar) con un dominio propio verificado (SPF/DKIM/DMARC).

**Acción concreta:**
1. **Mariana / infra, fuera de `mvp-builder`:** dar de alta un proveedor de mail
   transaccional, configurar Custom SMTP en Supabase Auth → Settings → SMTP
   Settings, verificar dominio (DNS). Esto es un prerequisito, no una tarea de
   código.
2. **`mvp-builder`, mitigación de copy mientras tanto** en `Login.tsx`:
   - Agregar texto visible en el paso `"link"`/`"code"`: *"Si no lo ves en unos
     minutos, revisá spam o promociones."*
   - Agregar cooldown visible + contador en el botón "Cambiar email o reenviar"
     (hoy no hay feedback de que el reenvío se disparó ni de cuánto hay que esperar
     por el rate limit de Supabase — un reenvío inmediato puede fallar silenciosamente
     por rate limiting y el usuario no se entera).
   - Loguear (`console.error`, ya existe parcialmente) o trackear con `track()` un
     evento `otp_send_error` cuando `signInWithOtp` devuelve error, para tener
     visibilidad de cuántos intentos fallan server-side vs. cuántos son solo
     problema de entrega.

**Pregunta abierta (insight #16, no bloquea el fix de arriba):**
¿el login por OTP a email es el canal correcto para el segmento? Una usuaria dijo
explícitamente que no revisa el mail salvo para vaciarlo. Evaluar a futuro
magic link que abra directo (ya está parcialmente soportado — `Login.tsx` tiene un
paso `"link"`) o un canal alternativo (WhatsApp/SMS). No es parte de esta ronda —
requiere decisión de producto, se deja registrado para la próxima.

---

### 0.2 — El audio del ritual guiado no suena, aunque la UI dice que inició (insight #23)

**Por qué va segundo:** una vez que la gente entra, esto es lo que rompe la
experiencia central del producto (la sesión guiada con voz).

**Causa raíz real (investigada — no es lo que parecía):**
No es un bug sutil de reproducción. Es que **el flujo de audio guiado real nunca
está conectado a la UI**:

- `rituales-app/src/app/components/GuidedAudioPlayer.tsx` es un componente completo
  y correcto — maneja `src`, estado `isPlaying`, sincroniza una capa de ambiente,
  llama a `onStart` para generar audio on-demand. **Pero no se importa ni se
  renderiza en ningún lugar de la app** (confirmado por grep — cero referencias
  fuera del archivo mismo). Es código huérfano.
- `renderGuidedAudio()` en `rituales-app/src/app/lib/ritual-service.ts` (línea 373),
  que llama a `POST /rituals/:id/render-audio` en el backend (el endpoint que sí
  genera el audio con ElevenLabs, según `guidelines/BackendContract.md`), **tampoco
  se llama desde ningún componente de la UI** (confirmado por grep — cero llamadas
  fuera de su propia definición).
- Lo que el botón **"Iniciar"** hace hoy en `rituales-app/src/app/pages/RitualDetail.tsx`
  (línea ~518, `onClick={() => setShowPlayer(true)}`) es abrir una hoja inferior
  ("Elige una pista") con **4 pistas de música ambiente fijas** (Handpan, Meditación,
  etc., archivos MP3 hardcodeados en `TRACKS`, líneas 74-79) — nada relacionado con
  el guion personalizado (`personalizedScript`) ni con la narración generada por IA.
  Es decir: lo que el usuario llama "el ritual guiado" (con voz, personalizado) **no
  existe todavía en la experiencia real** — solo existe el backend que lo genera y
  un componente de UI que nunca se conectó al resto de la app.
- Esto también explica por qué Mariana ya lo tenía identificado como bug conocido:
  no es un fix de una línea, es una feature a medio cablear.

**Acción concreta para `mvp-builder`:**
1. En `RitualDetail.tsx`, al tocar **"Iniciar"**: si `displayRitual.guidedAudio`
   no tiene `audioUrl` todavía, llamar `renderGuidedAudio({ ritualId, guidedSession,
   voice, model, responseFormat })` (ya existe en `ritual-service.ts`) y mostrar el
   estado de carga que `GuidedAudioPlayer` ya soporta vía `disabled` ("Generando
   audio...").
2. Renderizar `GuidedAudioPlayer` (ya construido) en el sheet que hoy abre
   `setShowPlayer(true)`, pasándole `src={audioUrl}` una vez generado, en lugar de
   (o además de) el selector de las 4 pistas ambiente actuales — decidir si la
   música ambiente queda como opción secundaria/capa de fondo (el propio
   `GuidedAudioPlayer` ya mezcla una capa de ambiente vía `ambienceRef`) o se
   elimina del todo. **Pregunta abierta para Mariana**: ¿las 4 pistas de música
   ambiente actuales se mantienen como opción alternativa al ritual guiado con voz,
   o se descartan ahora que el guiado con voz se cablea de verdad? Sugerencia:
   mantenerlas como fallback si el usuario prefiere solo ambiente sin narración,
   pero que "Iniciar" default sea la narración guiada.
3. Guardar el `audioUrl` devuelto en el ritual persistido (ya lo hace el backend
   cacheando `audio_url` en la tabla `rituals`, según `CLAUDE.md`) para no
   regenerar audio en cada apertura.
4. No es necesario tocar el backend para este fix — `render-audio` y el
   contrato ya existen y están documentados en `BackendContract.md`.

---

## Prioridad 1 — Hallazgo crítico de producto: el reencuadre de intención no resuena (insight #17)

**Por qué es crítico y no "solo copy":** el reencuadre es, según
`guidelines/rituales_origen.md`, literalmente el corazón de la propuesta de valor
("Tomás algo que traés... y te lo devuelve visto desde otro ángulo. Eso es el
producto."). Una fuente real lo probó y no se sintió entendida — es evidencia
negativa directa sobre la hipótesis central, no un detalle de wording.

**Causa raíz — el prompt actual contradice `VOICE.md`:**

`rituales-backend/src/lib/claude.js`, función `reframeIntention` (líneas 37-51):

```js
system: `Transformás lo que dice una persona en una afirmación de manifestación...
No uses "Quiero", "Elijo" ni "Me abro a" — eso es deseo, no manifestación.
Usá lenguaje presente: "aparece", "fluye", "llega", "se abre", "se construye"...`
```

Esto choca con reglas explícitas de `guidelines/VOICE.md`:
- `VOICE.md` prohíbe expresamente `"manifestar"` como new age vacío, y el prompt
  literalmente le pide al modelo que genere "afirmaciones de manifestación".
- `VOICE.md` prefiere `intención` sobre `afirmación, decreto, mantra` — el prompt
  usa "afirmación" en su propia instrucción.
- `VOICE.md` pide tono **encarnado** (cuerpo, sentidos) y **directo** (sin rodeos);
  el resultado real que recibió la usuaria ("Energía renovada y el descanso
  profundo que necesitas fluye naturalmente hacia vos") es abstracto y genérico —
  exactamente lo que `VOICE.md` categoriza como cliché.
- El prompt tampoco refleja nada de lo que la persona dijo — va directo a una
  frase genérica de manifestación sin ecoar el input real. Esto contradice el
  propio mecanismo que el producto dice tener ("el sistema escucha... y te
  devuelve una frase que reestructura la mirada **sobre el tema que trajiste**").

**Importante — lo que NO hay que hacer:** la usuaria esperaba algo tipo "tomate un
tecito, salí afuera, respirá" (una acción concreta). Pero `rituales_origen.md` es
explícito: el reencuadre **no** debe convertirse en receta de acciones ("No te dice
cómo sentirte. No te explica qué hacer.") — ese rol ya lo cumple el anclaje
(`StepAnchor.tsx`) más adelante en el flujo. Cambiar `reframeIntention` para que dé
instrucciones de acción sería resolver el insight rompiendo la filosofía del
producto. El fix correcto es que la frase sea **concreta y personal**, no que sea
**prescriptiva**.

**Acción concreta para `mvp-builder`** (solo backend, `rituales-backend/src/lib/claude.js`,
sin cambios de frontend — `StepIntention.tsx` ya consume `reframeIntention` sin cambios
de contrato):
1. Reescribir el `system` prompt de `reframeIntention` para:
   - Eliminar el léxico de manifestación forzado (`aparece/fluye/llega/se abre`).
   - Pedir que la frase **ecoe algo concreto** de lo que la persona dijo (mismo
     patrón que `{{ECO_EMOCIONAL}}` en `guidelines/RITUAL_SCRIPTS.md` — reflejar
     antes de reencuadrar), en vez de saltar directo a una afirmación abstracta.
   - Aplicar las reglas de `VOICE.md`: frases cortas, tono encarnado, vocabulario
     de la tabla "Vocabulario preferido" (`intención`, `claridad`, `presencia`,
     `soltar`), evitar toda la lista de "Palabras prohibidas".
   - Seguir usando 2da persona (`vos`) rioplatense, sin género gramatical.
   - Mantener el límite de una sola frase corta (ya está en `max_tokens: 80`).
2. Ejemplo de dirección (no literal, para que `mvp-builder` calibre el tono, no
   copiar textual): en vez de *"Energía renovada y el descanso profundo que
   necesitas fluye naturalmente hacia vos"* para el input *"día muy agotado"*,
   algo como *"Estás agotada. Eso también es información. Hoy la prioridad es
   sostenerte, no producir más."* — concreto, encarnado, sin new age, sin
   convertirse en instrucción de acción.
3. Una vez reescrito el prompt, correr manualmente 4-5 inputs variados (incluida
   la frase real de la sesión, "día muy agotado") y comparar el output contra
   `guidelines/VOICE.md` → sección "Ejemplos de copy" antes de dar por cerrado.
4. No tocar `applyPauseMarkers` ni `generateRitualWithClaude` — fuera de alcance
   de este fix puntual.

---

## Prioridad 2 — UX/copy, ejecutable directo por `mvp-builder` (sin decisión previa de Mariana)

Agrupados por tema. Todos son cambios acotados de un componente o de copy.

### Descubribilidad de contenido valioso (patrón repetido 2 veces — insights #13, #21)
- Wiki de notas/consejos tiene baja discoverability (Raúl la encontró recién al
  final). Evaluar exponerla antes en el recorrido (desde onboarding o desde el
  resumen del ritual), no solo en el tab inferior.
- Tarjetas de "sugerencia" pasan desapercibidas en la sesión think-aloud. Revisar
  jerarquía visual (contraste, posición) de esas tarjetas.

### Confusión de navegación/iconografía (insight #7)
- El botón flotante "?" en Home lleva a registro/perfil, pero se lee como "ayuda".
  Cambiar el ícono (a uno de cuenta/perfil) o mover el destino a algo que sí sea
  ayuda/onboarding.

### Legibilidad (insight #8)
- Tipografía serif del copy demasiado light para bloques largos. Evaluar subir
  peso de fuente en los estilos de cuerpo de texto largo (no en títulos/eyebrows).

### Consistencia de comportamiento entre pantallas (insight #9)
- Tocar un tag (ej. "Agua") dentro del detalle de un ritual no filtra rituales
  sugeridos ahí, aunque en Explorar sí funciona. Igualar comportamiento: que el
  tag sea clickeable/filtrable en cualquier contexto donde aparece.

### Layout de contenido del ritual — modelo "receta" (insight #19)
- El contenido hoy se percibe fragmentado ("consejos aislados"). La usuaria
  esperaba ver pasos + materiales juntos, tipo receta de cocina. Esto es un cambio
  de layout en `RitualDetail.tsx` (ya tiene las secciones — apertura, vela, acción
  simbólica, cierre — como tarjetas separadas en scroll). Evaluar un layout que
  muestre el resumen de "qué necesitás" (vela, elemento) fijo/visible junto a los
  pasos, no como una tarjeta más en la lista.

### Navegación durante el ritual en vivo (insight #20)
- Relacionado con el punto anterior: perder el lugar haciendo scroll genera
  olvidos. No implica ir a papel — sí resolver con un índice/overview persistente
  que permita saltar entre pasos sin scroll lineal ida y vuelta. Depende del
  rediseño de layout del punto anterior — conviene resolverlos juntos.

### Longitud de contenido (insight #5)
- El contenido de los rituales se percibe demasiado largo. Cross-referencia con
  `guidelines/RITUAL_SCRIPTS.md` (arquitectura de scripts por duración, con
  límites de palabras por bloque — hoy no implementada, `generateRitualWithClaude`
  en `claude.js` ya tiene límites de palabras en el prompt: 80/80/60 — revisar si
  esos límites se están respetando en la práctica o si conviene bajarlos).

### Onboarding de features específicas (insight #18)
- El "diario de intenciones" (Diario de Anclas) no se entiende sin que alguien lo
  explique en vivo — confirmado por la propia Mariana en la sesión. Agregar
  micro-copy o un tooltip/paso de onboarding la primera vez que aparece en Home,
  explicando en una frase qué es (ver `guidelines/HomeDiarioDeAnclas.md` para el
  estado actual del flujo `Inicio → Momento → Cierre`).

### Instrumentación de completitud (insights #2, #22 — mismo patrón, 2 fuentes)
- Falta distinguir "vio el ritual" de "lo hizo de verdad", y hay confusión sobre
  cuándo termina el ritual. Encaja con el sistema de `analytics.ts` (`track()`, ya
  usado en `StepRitual.tsx` para `ritual_created`). Acción concreta: agregar
  eventos `ritual_started` (cuando se dispara el audio guiado real — ver fix de
  Prioridad 0.2) y `ritual_completed` (cuando el audio termina — el propio
  `GuidedAudioPlayer` ya tiene el handler `handleEnded`, es el lugar natural para
  disparar el evento una vez esté cableado). Esto depende del fix 0.2 — no tiene
  sentido instrumentar completitud de un flujo que hoy no existe en la UI.

---

## Prioridad 3 — Decisiones de producto que necesitan confirmación de Mariana antes de tocar código

Estos **no** van directo a `mvp-builder`. Quedan registrados, no se implementan
en esta ronda.

- **Insight #6** — la frase "No necesitás hacerlo perfecto. Necesitás hacerlo
  consciente y real." resuena fuerte y es candidata a frase ancla de `VOICE.md`.
  Pero el usuario también sugirió sacarla de un "user persona" específico y
  llevarla a "algo más horizontal" — el propio feedback-log ya lo marca como
  ambiguo. Pregunta para Mariana: ¿se refiere al tono de copy atado a un
  arquetipo, o a diseñar contenido pensando en más de un perfil de usuario?
- **Insight #10** — los rituales compartidos por otros conservan la voz de quien
  los escribió (a veces en femenino), mientras que los generados por IA para uno
  mismo salen en neutro. No es un bug. Pregunta para Mariana: ¿se mantiene como
  autenticidad comunitaria intencional, o se neutraliza también el copy
  compartido? No cambiar sin decidirlo a propósito.
- **Elección de "Iniciar" en `RitualDetail.tsx` (relacionado al fix 0.2)** — ya
  señalada arriba: ¿las 4 pistas de ambiente actuales se mantienen como opción
  paralela al ritual guiado con voz, o se retiran?
- **Canal de login (insight #16)** — ¿se evalúa magic link o un canal alternativo
  a email para el segmento que no revisa mail? Fuera de esta ronda, pero
  relevante si el fix de infra de Prioridad 0.1 no alcanza a mejorar la
  deliverability lo suficiente.

---

## Fuera de alcance de esta ronda (a futuro, explícitamente no priorizado ahora)

- **Insight #14** — interés espontáneo en un aspecto comunitario/social (inspirarse
  en rituales de otras personas). Señal de demanda a mediano plazo, no urgente.
- **Insight #24** — comparación con apps de fase lunar tipo "qué hacer / qué no
  hacer" por fase. Contexto competitivo, no un pedido de feature concreto.
- **Insight #1** — tensión "pseudociencia / frame holístico" y propuesta de
  onboarding con versión mística vs. secular del mismo contenido. Es una decisión
  de posicionamiento de fondo (ya señalada como tensión conocida en la
  investigación del TFG) — no un fix de esta ronda, requiere pensarse aparte con
  más contexto de investigación de usuario.
- **Insight #3** — cierre del ritual con captura de foto/reflexión/voicenote.
  Candidato a extensión del Diario de Anclas, pero es una feature nueva, no un
  fix — se evalúa después de que el Diario de Anclas actual esté más simplificado
  (ver "Segundo" en la lista de `rituales_origen.md` → "Lo que falta construir").
- **`docs/rituales-v2-plan.md`** completo — sigue sin ejecutarse, y esta ronda no
  lo toca. De hecho, el fix de Prioridad 1 (`reframeIntention`) es una dependencia
  sana para v2: conviene que el reencuadre 1-shot funcione bien antes de construir
  la versión conversacional encima.
- **Insights confirmatorios, sin acción** (#4, #11, #12, #25) — no requieren
  cambio, son validaciones de que algo ya funciona como está diseñado. Vale la
  pena no tocarlos "por las dudas" mientras se resuelve el resto.

---

## Orden de ejecución sugerido para `mvp-builder`

1. Prioridad 0.1 (mitigación de copy en `Login.tsx` — la config de Custom SMTP la
   hace Mariana en paralelo, fuera del alcance de este agente).
2. Prioridad 0.2 (cablear `GuidedAudioPlayer` + `renderGuidedAudio` en
   `RitualDetail.tsx`) — es la más grande de las tres, tocar después de validar
   con Mariana la pregunta abierta sobre las pistas de ambiente.
3. Prioridad 1 (`reframeIntention` en `claude.js`) — la más chica y aislada de
   las tres, se puede hacer en paralelo a 0.2 sin dependencias.
4. Prioridad 2, en el orden en que aparece arriba — son independientes entre sí,
   se pueden tomar de a una.
