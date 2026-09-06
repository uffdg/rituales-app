# Iteración septiembre 2026 — Rediseño del flujo completo

Estado: **borrador para revisión**, ampliado en varias rondas de revisión con Mariana.

Fuente: `guidelines/feedback-log.md` completo (42 insights, 4 fuentes — usuario
anónimo LinkedIn, Raúl Villoslada, sesión moderada de fecha a confirmar, y la
sesión con Agustín Trucco del 2026-08-30, la más rica hasta ahora porque cubre
todo el recorrido de creación paso a paso) + insights #41 y #42 agregados en
pasadas posteriores del log (PDF/imprimible, y experimento de
willingness-to-pay). Cruzado con lectura directa del código de `rituales-app`
y `rituales-backend` a la fecha de este documento (2026-09-03).

## 1. Objetivo y alcance

**Esto no es la ronda de agosto.** `docs/iteracion-feedback-agosto-2026.md` fue
estabilización + un fix puntual, explícitamente "no un rediseño". Las tres
prioridades de esa ronda ya están resueltas — se verificó antes de escribir
este plan, no se asume nada:

- **Prioridad 0.2 (audio guiado conectado a la UI): hecho.** `GuidedAudioPlayer`
  se renderiza en `RitualDetail.tsx` (línea 752), `handleStartRitual` dispara
  `renderGuidedAudio` automáticamente (líneas 269-277), y `GuidedAudioPlayer.tsx`
  hace autoplay apenas llega `src` (líneas 73-82). El audio con voz personalizada
  ya es real, no huérfano.
- **Prioridad 1 (`reframeIntention` no resuena): hecho.** El prompt en
  `rituales-backend/src/lib/claude.js` (líneas 37-53) ya pide ecoar algo
  concreto de lo que trajo la persona antes de reencuadrar, ya no usa el léxico
  de "manifestación", y sigue las reglas de `VOICE.md`. Sin retestear con
  usuarios reales todavía — vale una validación puntual, pero el fix de código
  está aplicado.
- **Prioridad 0.1 (OTP): la parte de infra ya está resuelta.** Mariana
  confirmó que el Custom SMTP ya está activado — el mail deja de ser el
  problema. **Queda un ajuste de UI puntual y ya identificado**, distinto del
  problema de entrega: hoy `Login.tsx` (estado `step`) mete una pantalla
  intermedia entre "se mandó el código" y "acá lo completás" — el campo de 6
  dígitos no se muestra hasta que el usuario toca el botón "Ingresar el
  código en cambio" (línea 259-264). Se ajusta como quick win concreto —
  ver sección 13.

Con esa base resuelta, y **tras varias rondas de revisión de Mariana, el
alcance de esta ronda creció**: ya no es solo el wizard de creación
(`/onboarding → /crear/1-5`). Es el **flujo de entrada completo de la app**:
qué explica Home, cómo se arranca un ritual, cómo se consume
(leer/escuchar/imprimir), cómo cierra, cómo se prueba disposición a pagar por
la voz guiada, y cómo la app empieza a conocer a quien la usa para adaptarse
con el tiempo. El hallazgo central sigue siendo el mismo (insight #28,
transversal): **demasiadas decisiones generan la ansiedad exacta que el
producto dice que baja** — pero ahora el rediseño lo ataca en más puntos de
entrada que solo el wizard.

Esta ronda toca trabajo en **los dos repos**: `rituales-app` (todo lo de UI) y
`rituales-backend` (perfil de usuario, tracker de cumplimiento, carta de
intención diaria, y eventualmente generación de PDF si se decide hacerla
server-side — ver sección 6).

**Qué NO cambia (filosofía de fondo, no se toca):**

- El **anclaje real** (`StepAnchor.tsx`) sigue siendo el diferencial más fuerte
  del producto — confirmado por 3 fuentes independientes en el log (#4, #11,
  #28→#31). No se dosifica, no se saca, no se esconde.
- El reencuadre de intención **no se vuelve prescriptivo** — sigue reflejando
  y abriendo, no dando instrucciones de acción (eso ya lo resolvió la ronda de
  agosto y sigue siendo la línea roja de `rituales_origen.md`).
- La pantalla resumen del ritual ya armado sigue gustando (insight #31, "me
  encanta") — no se rediseña esa pantalla en sí, se acorta el camino para
  llegar a ella.
- La tecnología sigue sin nombrarse en el copy (`VOICE.md` — "Sin tecnología").
- **Simplificar el flujo de creación no puede significar perder calidad de
  personalización real del guion generado** (pedido explícito de Mariana).
  Bajar de 6 a 3-4 pantallas es sobre sacar fricción de decisión, no sobre
  generar rituales más genéricos — ver restricción explícita en sección 4.

**Qué sí cambia respecto de la primera versión de este documento:** además del
wizard de creación, la reproducción y el cierre, ahora entran en alcance: qué
explica Home, cuál es el CTA principal de Home, una redefinición del paso
"Inicio" del Diario de Anclas como una carta-juego diaria persistida en el
backend, el ritual como PDF descargable, dos lenguajes visuales distintos
para "paso en progreso" vs. "documento terminado", un audit de si las
distintas superficies de la app (galería, creados por usuarios, compartidos)
muestran los rituales con un lenguaje visual consistente entre sí, un cierre
que además captura feedback real y trackea cumplimiento (no solo que el
audio terminó), un experimento de disposición a pagar por la voz guiada, y
una fase nueva de perfil de usuario / personalización que se documenta
aparte por su tamaño (sección 11).

**No se toca en esta ronda:** `docs/rituales-v2-plan.md`. Ese plan es una rama
paralela/experimental (`/crear-v2` o `/chat`, no pisa `/crear/*`) que además
propone algo en tensión con el hallazgo central de acá: v2 fase 1 agrega hasta
4 intercambios conversacionales para refinar la intención. Si más adelante se
retoma v2, conviene releerlo a la luz del insight #28 antes de construirlo —
más intercambios de chat pueden ser el mismo problema con otra forma. Dicho
esto, la fase de perfil de usuario de la sección 11 de este documento **sí se
superpone parcialmente** con la idea de `user_emotional_profile` que v2 ya
había anticipado en su Fase 1 (tabla de perfil persistente) — se señala la
superposición ahí mismo para que no se dupliquen si más adelante se retoma v2.

---

## 2. Diagnóstico — por qué el flujo actual genera fricción

Recorrido real hoy, leído directo del código (`src/app/routes.tsx`,
`src/app/pages/Step*.tsx`, `src/app/pages/Onboarding.tsx`):

| Pantalla | Ruta | Qué pide | Decisiones activas |
|---|---|---|---|
| Onboarding | `/onboarding` | Elegir 1 de 6 tipos de ritual, o hablar/tipear libre | 1 (o 0 si usa voz) |
| Intención | `/crear/1` | Escribir o dictar la intención | 1 (texto) |
| Energía | `/crear/2` | Tipo de energía (4 opciones) + Duración (3) + Intensidad (3) | 3 |
| Elemento | `/crear/3` | 1 de 4 elementos | 1 |
| Tu ritual | `/crear/4` | Leer 3 bloques de texto + guía de vela generados por IA (editable, con botones "Regenerar" / "Hacerlo más simple" / "Dame 3 versiones") | 0-1 (pero exige lectura) |
| Anclaje | `/crear/5` | Escribir una acción real (con chips y sugerencia IA) | 1 (texto) |

Son **6 pantallas y 7-8 decisiones activas** antes de llegar a la pantalla
resumen que a la gente le gusta (insight #31). `ProgressBar` (línea 7 de
`ProgressBar.tsx`) ni siquiera cuenta Onboarding en el total (`step: 1..5`),
así que el usuario ve "1/5" sin saber que ya tomó una decisión antes de
empezar a contar.

Esto valida con evidencia de código lo que dice el insight #28
("me hiciste elegir muchas cosas, tomar decisiones, pensar... si ya vengo
medio cebado, me estreso") y la comparación con "una carta de restaurant con
10 platos" (00:22:14, sobre una de las pantallas de 4 opciones).

**El mismo patrón también aplica a Home, no solo al wizard** (esto es lo que
motiva la sección 3 nueva): leyendo `Home.tsx` y `Layout.tsx`, hoy Home es un
hero editorial (imagen + saludo contextual por hora/clima) seguido del bloque
de Diario de Anclas — pero **no hay ninguna línea de copy que explique qué se
puede hacer en el producto**, y el punto de entrada para "armar un ritual
hablando de lo que te pasa" no vive en Home: vive detrás de la pestaña
**"Crear"** de la barra inferior (`Layout.tsx`, línea 62-72), que lleva a
`/onboarding`. Es decir, hoy hacen falta un tap a otra sección de la app y
después elegir (tipear/tocar tarjeta/hablar) para llegar al mecanismo central
del producto. Esto es el mismo insight #27 ("¿qué es crear un ritual?
¿qué voy a hacer?") pero aplicado un nivel más arriba: si Home no explica ni
ofrece el mecanismo central como primera acción, la confusión empieza antes
de llegar siquiera al wizard.

Encadenado con eso:

- **Insight #29** (preferencia por escuchar, no leer): `StepRitual.tsx` (paso
  4) muestra el guion completo como texto principal — 3 bloques editables
  (`opening`, `symbolicAction`, `closing`) más la guía de vela — todos
  visibles y "para leer" antes de poder avanzar. No hay ninguna opción de
  saltar directo a escuchar en este paso; el audio recién se genera más tarde,
  en `RitualDetail.tsx`, cuando el ritual ya está completo. Es decir: **hoy se
  fuerza lectura completa en el momento exacto en que, según el propio log,
  el usuario menos quiere leer.**
- **Insight #27** (no se entiende qué es "crear un ritual"): `Onboarding.tsx`
  arranca directo con la grilla de 6 tipos y el input de voz — no hay ninguna
  frase previa que explique en concreto qué va a pasar. Esto ahora se resuelve
  con el onboarding de perfil al primer inicio de la app (sección 11), no con
  una frase estática en el wizard.
- **Insight #32** (reproducción con demasiadas opciones): aunque el audio
  guiado ya está conectado (a diferencia de cuando se logueó el insight en
  agosto), la hoja inferior de `RitualDetail.tsx` (líneas 733-748) todavía
  muestra un control segmentado **"Guiado con voz" / "Solo ambiente"** como lo
  primero que ve el usuario al tocar "Iniciar" — una decisión binaria antes de
  llegar al botón de play. Además `GuidedAudioPlayer.tsx` tiene dos
  affordances redundantes para lo mismo: un botón "Reiniciar" arriba a la
  derecha (líneas 239-246) y un link "Volver a empezar" abajo (líneas
  349-359), ambos llamando a la misma función `restart()`.

**Causa raíz transversal:** el flujo fue diseñado como un formulario de
configuración (elegir energía, elegir elemento, elegir duración, elegir
intensidad, elegir pista de audio) en vez de como una conversación con
inferencia. El propio código ya tiene precedente de "inferir en vez de
preguntar": `src/app/lib/candle.ts` (`deriveCandleGuide`) infiere el color de
vela a partir de intención/energía/tipo de ritual sin preguntarle nada al
usuario — nunca se le pide "elegí un color de vela". Ese mismo patrón no se
aplicó a energía, elemento, duración ni intensidad, que sí se piden como
elecciones activas. El rediseño de la sección 4 extiende el patrón que ya
existe en el código en vez de inventar uno nuevo.

---

## 3. Home y entrada principal

Sección nueva. Cubre los puntos 1 y 2 del pedido de Mariana: Home tiene que
explicar el producto, y su CTA principal tiene que ser construir un ritual a
partir de escuchar la necesidad — no un menú.

### 3.1 — Home tiene que explicar qué se puede hacer

Confirmado en el diagnóstico (sección 2): no hay hoy ninguna línea de copy en
`Home.tsx` que explique el producto. El hero es 100% contextual (clima, hora,
imagen) y editorial, sin una frase de propósito.

**Acción concreta:** agregar, arriba del bloque de Diario de Anclas o
integrado al hero, una línea corta tono `VOICE.md` (directo, sin new age, sin
nombrar la tecnología) que explique el mecanismo en una frase — no un texto
explicativo largo, una frase ancla, mismo criterio que ya usa el copy de
`Stories.tsx`/`VOICE.md` para micro-copy de story. Esto convive con el
onboarding de perfil de la sección 11 (que también explica el producto, la
primera vez que se abre la app) sin duplicarse: el onboarding de perfil es
una experiencia puntual de una sola vez con preguntas; esta línea en Home es
un recordatorio permanente y liviano que queda siempre visible, para quien ya
pasó por el onboarding o lo saltó.

### 3.2 — El CTA principal de Home pasa a ser "contame qué te pasa"

Hoy el mecanismo central (hablar/tipear la intención) vive detrás de la
pestaña **"Crear"** de `Layout.tsx` (barra inferior, ruta `/onboarding`) — es
una pestaña más entre cinco, con el mismo peso visual que "Explorar" o
"Wiki". Esto contradice que sea "la entrada principal del producto".

**Acción concreta:**
- Promover el mecanismo de voz/texto libre (el mismo que ya existe en
  `Onboarding.tsx` — `SpeechRecognition` + `reframeIntention` +
  `detectRitualType`) a un bloque destacado en la parte superior de `Home.tsx`,
  antes o al mismo nivel que el hero, como el CTA principal de la pantalla —
  no un botón chico entre otros.
- La pestaña "Crear" de la barra inferior se mantiene (por si alguien
  prefiere navegar directo ahí, o para volver a un ritual en construcción),
  pero deja de ser el único punto de entrada.
- Esto no es una pantalla nueva de cero: reusa exactamente el mecanismo ya
  construido en la sección 4.1 (unificación de Onboarding + Intención) — la
  diferencia es dónde vive el punto de entrada, no cómo funciona la captura
  de voz/texto. Conviene construir 4.1 y 3.2 juntos: un solo componente de
  "contame qué te pasa" que se monta tanto en Home como en el punto de
  entrada del wizard.

### 3.3 — La carta de intención diaria (rediseño del paso "Inicio" del Diario de Anclas)

Pedido agregado por Mariana en la primera revisión: presentar el paso
`Inicio` del Diario de Anclas (hoy un formulario de sentimiento + texto, ver
`HomeDiarioDeAnclas.md` y sección 8) como una **carta que se tira y se da
vuelta**, tipo oráculo/tarot, en vez de un formulario. En una revisión
posterior, Mariana agregó tres requisitos concretos que hay que cumplir, no
solo la idea general — se detallan abajo en 3.3.1-3.3.3.

**Estado real del paso `Inicio` hoy** (confirmado leyendo `Home.tsx`): ya usa
exactamente el mecanismo de voz → `reframeIntention` → `generatedIntention`
(líneas 221, 557-601), más una selección de sentimiento (`inicioFeeling`,
línea 222, contra un selector de chips). Es decir, el contenido detrás de la
carta ya existe y ya se genera igual que hoy — lo que cambia es la
**interacción de revelado**, no el generador de contenido.

**Patrones de animación ya disponibles en el repo** (se revisó antes de
proponer algo nuevo): la librería en uso es `motion/react` (`motion`, v12 —
confirmado en `CLAUDE.md` y en el código). Existe ya un patrón de
carrusel con escala + blur + drag en `PopularCarousel.tsx` (`drag="x"`,
interpolación de `scale`/`opacity`/`filter: blur()`, transiciones tipo
`spring`) — es la referencia más cercana a una mecánica de "cartas" que ya
hay en el código, aunque es un carrusel horizontal, no un flip. **No existe
hoy ningún patrón de flip/rotación 3D de carta** (`rotateY`, `perspective`,
`backfaceVisibility`) en ningún componente del repo — confirmado por grep en
todo `src/app`. Hay que construirlo de cero, pero con la misma librería que
ya se usa en todos lados (`motion/react`), no una librería nueva.

#### 3.3.1 — Tiene que sentirse como un juego, no como una animación de flip

**Requisito explícito de Mariana:** un simple `rotateY` instantáneo al tocar
no alcanza — la revelación tiene que tener suspenso/descubrimiento, como una
mecánica de juego. Esto es un criterio de diseño explícito, no un detalle de
implementación a resolver solo. Dos direcciones concretas (se pueden
combinar, no son excluyentes):

- **Opción A — selección de un mazo:** mostrar 2-3 cartas boca abajo (mismo
  dorso) en vez de una sola. El usuario elige cuál tirar — la elección en sí
  ya es la primera micro-decisión con peso lúdico (como elegir una carta de
  tarot de un despliegue), y recién ahí se dispara el flip de la carta
  elegida. Las otras cartas no elegidas simplemente no se revelan ese día.
- **Opción B — revelado progresivo del contenido:** en vez de que el texto
  completo aparezca apenas termina el `rotateY`, que se revele en etapas
  (ej. desenfocado que se aclara, o palabra por palabra con un pequeño
  stagger) — el suspenso está en cómo aparece el contenido, no en elegir
  entre varias cartas.

Combinar A+B (elegir una carta del despliegue, y que su contenido se revele
progresivamente al darse vuelta) es probablemente lo más cercano a "se siente
como un juego" sin construir nada excesivamente complejo — queda como
recomendación, no como decisión cerrada; ver pregunta abierta en sección 14.

#### 3.3.2 — Única por día, mismo espíritu que Wordle/horóscopo diario

**Requisito explícito de Mariana:** un usuario tira **una sola carta por
día**. Si vuelve a abrir la app más tarde ese mismo día (o en otro
dispositivo), tiene que ver la misma carta ya revelada — no puede tirar otra
ni regenerar el contenido. Esto es un requisito de producto de hábito diario,
no una limitación técnica incidental: es lo que le da al mecanismo su
carácter de ritual repetible (mismo principio que un horóscopo diario o un
Wordle — un evento por día, compartido en el tiempo, no un generador libre).

#### 3.3.3 — Persistencia: backend como fuente de verdad desde el día uno

**Requisito explícito de Mariana, distinto del resto de esta sección:** para
que "una carta por día" sea real entre dispositivos y sesiones, esto **no
puede ser local-first/localStorage** como sí se propone para otros bordes de
este documento (ej. el draft de perfil de 11.3, que es local-first
justamente porque ahí la persistencia real es best-effort, no una regla dura
de producto). Acá el requisito es lo opuesto: el backend tiene que ser la
fuente de verdad desde el primer momento, porque la garantía de "una por día"
solo es real si se verifica del lado del servidor.

**Se revisó si `daily_anchor_entries` (ya usado por `Momento`/`Cierre` del
Diario de Anclas, vía `anchor-service.ts`) es un lugar reusable — no lo es,
y además se encontró un problema de fondo en ese mecanismo que conviene no
heredar:**
- `anchor-service.ts` (líneas 1-24) documenta el esquema de
  `daily_anchor_entries` en un comentario, pero **esa tabla no está
  declarada en `rituales-backend/supabase/schema.sql`** — a diferencia de
  `rituals`, `ritual_favorites`, `ritual_likes` y `events`, que sí están ahí.
  Esto significa que la tabla, si existe en producción, fue creada por fuera
  del control de versiones de este repo, o puede directamente no existir.
- `saveDailyAnchorEntry` (línea 43) llama a `supabase.from(...)` **directo
  desde el frontend**, sin pasar por ningún endpoint de `rituales-backend` —
  confirmado por grep, no hay ninguna ruta relacionada con
  `daily_anchor_entries` en `rituales-backend/src/routes`. Y los errores se
  ignoran en silencio ("localStorage es la fuente de verdad del lado del
  cliente", según el propio comentario del código).
- Conclusión: el mecanismo que ya existe para `Momento`/`Cierre` es
  precisamente el patrón que este requisito pide **no** usar (best-effort,
  sin garantía server-side verificable, sin tabla versionada). Reusarlo
  heredaría el mismo problema para la carta diaria, que es justo lo que se
  quiere evitar acá.

**Acción concreta:**
1. Tabla nueva en `rituales-backend/supabase/schema.sql` (versionada, a
   diferencia de `daily_anchor_entries`): `daily_intention_cards` —
   `user_id` (FK a `auth.users`), `date_key` (texto, mismo formato que ya
   usa `daily-anchor.ts` para el resto del Diario de Anclas), `intention_text`,
   `feeling`, `created_at`, con **constraint único `(user_id, date_key)`** —
   esa restricción a nivel de base de datos es lo que hace que "una carta por
   día" sea una garantía real y no una convención de UI. RLS: cada usuario
   lee/escribe solo sus propias filas.
2. **Endpoint real en `rituales-backend`** (no acceso directo a Supabase
   desde el frontend, a diferencia del patrón de `anchor-service.ts`) — ej.
   `GET /me/daily-card?date=...` (devuelve la carta de hoy si ya existe) y
   `POST /me/daily-card` (crea la carta de hoy; falla o devuelve la
   existente si ya hay una para ese `date_key`, gracias al constraint único).
   Documentar en `guidelines/BackendContract.md`.
3. Se mantiene separada de `daily_anchor_entries` — aunque las dos son
   "parte del Diario de Anclas", tienen requisitos de confiabilidad
   distintos (esta es dura, esa es best-effort). No conviene mezclarlas
   ahora; si más adelante se aborda el rediseño de fondo de
   `Momento`/`Cierre` (sección 8, todavía pendiente de decidir), ahí sí
   conviene revisar si conviene unificar todo el Diario de Anclas sobre un
   mecanismo server-first único — fuera de esta ronda.

**Usuarios anónimos (sin login):** Home (`/`) es una ruta pública — no
requiere sesión, según `CLAUDE.md`. La carta tiene que seguir ofreciéndose
sin loguearse, consistente con el resto de Home. Pero como el requisito duro
de "una por día, verificado en servidor" **solo es aplicable con una
identidad estable**, la propuesta es:
- Sin sesión: la carta se genera y se revela igual (mismo mecanismo de voz →
  `reframeIntention`), pero queda como intento local únicamente — mismo
  patrón de `localStorage` "draft" que ya se define en 11.3 para el perfil
  (`rituales_profile_draft_v1`), acá un equivalente (`rituales_daily_card_draft_v1`).
  No hay garantía de "una por día" real todavía en este caso — es una
  limitación explícita y aceptada, no un bug.
- Al loguearse (mismo hook `SIGNED_IN` de `onAuthStateChange` que ya se
  describe en 11.3 para sincronizar el draft de perfil): si hay una carta
  local del día pendiente de sincronizar, se sube vía `POST /me/daily-card`
  y pasa a ser la carta oficial de ese día. Conviene construir el mecanismo
  de "sync de un draft local al loguearse" de forma genérica (no específico
  del perfil) para que sirva a los dos casos — ver nota agregada en 11.3.
- Esto es coherente con que, por el rediseño de la sección 11, el login ya
  no se pide al entrar a crear un ritual sino recién al final del onboarding
  de perfil (con opción de Skip) — la carta diaria sigue el mismo criterio
  de "funciona sin cuenta, se vuelve confiable y persistente con cuenta".

#### 3.3.4 — Resto del comportamiento (sin cambios respecto de la versión anterior)

- Los pasos `Momento` y `Cierre` del Diario de Anclas **no** se tocan con
  esta mecánica de carta en esta ronda — quedan con el ajuste liviano ya
  descripto en la sección 8 (gateo por hora + micro-copy explicativo), y
  siguen sobre el mecanismo local-first/`daily_anchor_entries` existente
  (con el problema de confiabilidad ya señalado en 3.3.3, que queda anotado
  pero no se resuelve en esta ronda para esos dos pasos). La carta es
  específicamente el rediseño del paso `Inicio`.
- El dato de sentimiento (`inicioFeeling`) puede seguir capturándose como un
  paso liviano después de revelar la carta (un tap sobre 3-4 chips) — mapea
  al campo `feeling` de `daily_intention_cards` (punto 1 de 3.3.3). Si se
  mantiene como paso separado o se integra a la revelación es una decisión
  de diseño fina que conviene resolver con mockup — ver pregunta abierta en
  sección 14.

---

## 4. Rediseño del flujo de creación

### 4.0 — Principio de diseño: dos lenguajes visuales distintos

Pedido nuevo de Mariana en la segunda revisión, aplica tanto a esta sección
como a la sección 6 (PDF): tiene que quedar **visualmente obvio, no solo por
copy**, cuándo el usuario está todavía completando un paso del proceso vs.
cuándo está viendo el ritual ya armado, terminado, en su formato final de
"receta".

Esto se traduce en dos lenguajes visuales explícitos, no en una sola paleta
reusada en todos lados:

- **"Construcción en progreso"** — las pantallas del wizard (4.1-4.2), donde
  todavía se están tomando decisiones. Mismo lenguaje que ya usan hoy
  `Step*.tsx`: `ProgressBar`, fondo claro con wash radial, tarjetas de opción
  con estados seleccionable/seleccionado. Este lenguaje se mantiene.
- **"Documento terminado"** — la pantalla resumen ya armada (4.3, el mismo
  contenido que hoy gusta en insight #31) y el PDF (sección 6). Acá no
  debería haber `ProgressBar`, ni "Siguiente", ni ningún indicador de que
  falta algo — tiene que sentirse como el objeto final, no como el último
  paso de una lista. `RitualDetail.tsx` hoy ya se acerca a esto (hero con
  imagen, sin barra de progreso), es la referencia correcta a extender tanto
  al resumen de 4.3 dentro del wizard como al PDF.

**Acción concreta:** cuando se construya 4.3, la pantalla de resumen del
ritual generado dentro del wizard debería tomar prestado el lenguaje visual
de `RitualDetail.tsx` (hero, tipografía, ausencia de `ProgressBar`) en vez
del lenguaje de `Step*.tsx`, aunque técnicamente todavía viva en la ruta
`/crear/4`. Es un cambio de percepción, no solo de contenido: el usuario
tiene que sentir "ya está" apenas llega ahí, no "un paso más".

### 4.1 — Dirección general

De 6 pantallas / 7-8 decisiones a 3-4 pantallas, con la mayoría de los
campos preseleccionados por inferencia (mismo patrón que `deriveCandleGuide`)
y editables con un tap si el usuario quiere ajustar, en vez de partir de
opciones en blanco.

**Restricción explícita (pedido de Mariana): simplificar no puede significar
perder calidad.** Bajar pantallas y decisiones es sobre sacar fricción de
*elección*, no sobre generar guiones más genéricos o con menos
personalización real. Concretamente:
- La inferencia de energía/elemento/intensidad (4.3) reemplaza la *pregunta*
  al usuario, no reemplaza la información que recibe `generateRitualWithClaude`
  — el backend sigue recibiendo energía/elemento/intensidad/duración con
  valores concretos (inferidos en vez de tipeados a mano), no campos vacíos
  ni genéricos.
- El modelo "escuchar primero, leer opcional" (4.4) cambia qué tan visible es
  el texto completo del guion, no lo acorta ni lo simplifica — el guion
  generado por Claude sigue teniendo el mismo nivel de detalle y
  personalización que hoy; lo que se colapsa es la UI, no el contenido.
- Si en algún punto una simplificación de UI obligara a reducir la calidad
  del prompt o de la información que recibe la IA para personalizar, eso se
  frena y se vuelve pregunta abierta para Mariana antes de implementarse —
  no es una decisión que `mvp-builder` deba tomar solo.

### 4.2 — Unificar Onboarding + Intención en un solo paso

Hoy, si el usuario habla en `/onboarding`, el propio código ya salta
`StepIntention` y va directo a `/crear/2` (`Onboarding.tsx`, `handleContinue`,
línea 72-76) — el camino de voz ya evita una pantalla redundante. El problema
es el camino manual: tocar una tarjeta de tipo en Onboarding igual lleva a
`/crear/1` a pedir la intención de nuevo por separado.

**Acción concreta:** fusionar ambas pantallas en una sola ("Contame qué te
pasa"), con:
- Input de voz como opción principal (ya existe, `SpeechRecognition
  continuous`), texto libre como alternativa.
- La grilla de 6 tipos (`RITUAL_TYPES`) queda como atajo secundario para quien
  prefiera no escribir/hablar, no como paso obligatorio previo.
- `detectRitualType` (ya existe en `Onboarding.tsx`, línea 34-42) se sigue
  usando para inferir el tipo desde el texto libre también cuando el usuario
  tipea en vez de hablar (hoy solo corre sobre el resultado de voz).
- **Este mismo componente es el que se promueve a Home en la sección 3.2** —
  construir una sola pieza reusable, no dos implementaciones paralelas del
  mismo mecanismo.

Esto baja de 2 pantallas a 1, y de hasta 2 decisiones a 0-1.

### 4.3 — Colapsar Energía + Elemento en una sola pantalla de defaults inferidos

Hoy `StepEnergy.tsx` pide 3 decisiones (energía, duración, intensidad) y
`StepElement.tsx` pide 1 (elemento) — 4 decisiones en 2 pantallas.

**Acción concreta:**
- Extender la lógica de inferencia que ya existe (`detectRitualType` +
  `deriveCandleGuide`) para sugerir automáticamente energía e intensidad a
  partir del texto de la intención y el `ritualType` detectado — mismo
  approach de keyword-matching que ya usa `candle.ts`, no un modelo nuevo.
  El elemento también puede inferirse con la misma técnica (`VOICE.md` ya
  documenta qué elemento corresponde a qué estado — tabla "Elementos y su
  cualidad").
- Reemplazar `StepEnergy.tsx` + `StepElement.tsx` por **una sola pantalla**
  que muestra energía, elemento e intensidad ya preseleccionados (con el
  criterio de arriba) y permite cambiarlos con un tap — nada bloquea el
  avance si el usuario no toca nada.
- **Duración** es la única decisión que conviene mantener explícita y
  visible (3 chips: 5/10/20 min) porque cambia el tiempo real que la persona
  va a invertir — no es inferible de forma confiable ni deseable ocultarla.

Esto baja de 2 pantallas / 4 decisiones a 1 pantalla / 1 decisión explícita
(duración) + 3 campos preseleccionados editables.

### 4.4 — "Tu ritual" (paso 4) pasa a modelo "escuchar primero, leer opcional"

Hoy `StepRitual.tsx` muestra el guion completo (3 bloques + vela) como
contenido principal a leer, con acciones de edición encima.

**Acción concreta** (conecta con insight #19/#29, "modelo receta" ya aplicado
al detalle, ahora también a la creación, y con la sección 6 de receta+PDF —
y aplica el principio visual de 4.0, "documento terminado"):
- Mostrar por default: título, un resumen de una o dos líneas, la guía de
  vela (`candleGuide`, ya existe) y un CTA principal claro ("Seguir" /
  "Confirmar ritual") — sin forzar la lectura de los 3 bloques completos.
- El guion completo (`opening` / `symbolicAction` / `closing`) pasa a un
  acordeón colapsado ("Ver el texto completo") — mismo contenido y mismas
  acciones de edición (`Regenerar`, `Hacerlo más simple`, `Dame 3 versiones`)
  que hoy, solo que ya no ocupan el primer plano.
- No se cambia el modelo de datos ni el contrato con el backend — es
  reordenamiento de UI sobre el mismo `currentRitual`/`editedTexts` que ya
  existe en `StepRitual.tsx`.

### 4.5 — Restricción técnica: el guion se congela al generar audio (insight #30)

Esto no es feedback de usuario, es una limitación de arquitectura que
Mariana señaló en vivo y que hay que respetar en el rediseño.

Leyendo el código: el audio se genera recién en `RitualDetail.tsx`
(`handleRequestGuidedAudio`, llamado por `handleStartRitual` al tocar
"Iniciar"), no durante el wizard de creación. El wizard (`/crear/1-5`)
sigue siendo 100% edición de texto sin costo de TTS — el punto de "no hay
vuelta atrás" es cuando se llama a `renderGuidedAudio()` por primera vez y
el backend cachea `audio_url` en la tabla `rituals` (según
`guidelines/BackendContract.md`).

**Con el rediseño de 4.4, esto sigue siendo válido sin cambios**: el modelo
"escuchar primero, leer opcional" no mueve el punto de congelamiento, solo
cambia qué tan visible es el texto antes de llegar ahí. Lo único que hay que
agregar (no existe hoy): si el usuario vuelve a `RitualDetail.tsx` con
"Editar" (línea 507, navega a `/crear/1`) **después** de que el audio ya se
generó una vez (`guidedAudio.status === "ready"`), y cambia el guion, hoy no
hay ningún aviso de que el audio cacheado va a quedar desactualizado o de que
va a generarse un audio nuevo con costo de TTS. Agregar un aviso simple
("Vas a cambiar el guion — esto va a generar un audio nuevo la próxima vez
que lo escuches") es un quick win chico, ver sección 13.

### 4.6 — Onboarding mínimo para quien no conoce el concepto de "ritual" (insight #27)

**Esta subsección cambia de rol respecto de la primera versión de este
documento.** Ya no hace falta una explicación estática de una frase acá: el
onboarding de perfil de la sección 11 (3 steps: género, elección simbólica,
medición de experiencia) ahora se dispara **la primera vez que se abre la
app**, no la primera vez que se entra al wizard — y ese onboarding ya cumple
la función explicativa que esta subsección proponía como piso mínimo. No
conviven los dos: la explicación de qué es la app pasa a vivir en el
onboarding de perfil de la sección 11, no en un mensaje aparte dentro de
4.2. Esta subsección queda documentada solo para dejar explícito que **se
reemplaza**, no se suma — si el onboarding de perfil de la sección 11 se
saltea (`Skip`) o todavía no se construyó, no hay ningún piso mínimo de
explicación adicional en el wizard en esta ronda; eso pasa a ser una
dependencia directa de la sección 11 en vez de algo standalone.

---

## 5. Rediseño de la pantalla de reproducción

Insight #32 sigue vigente aunque el audio ya está conectado (a diferencia de
cuando se logueó, en esa sesión el audio ni sonaba). El problema hoy no es
"el audio no existe", es "hay que decidir antes de poder soltar el celular".

**Acción concreta para `mvp-builder`, en `RitualDetail.tsx` y
`GuidedAudioPlayer.tsx`:**

1. Sacar el control segmentado "Guiado con voz" / "Solo ambiente"
   (`RitualDetail.tsx`, líneas 735-748) de primer plano. El guiado con voz
   ya es el default real (`audioTab` inicializa en `"guided"`, línea 100, y
   `handleStartRitual` ya fuerza `"guided"` en línea 271) — falta que la UI
   lo refleje: mostrar directo el `GuidedAudioPlayer` con su botón de play
   grande, y mover "Preferís solo música de fondo, sin narración?" a un link
   chico y secundario en vez de un toggle con el mismo peso visual. Esto
   responde también la pregunta abierta que había quedado de la ronda de
   agosto sobre las 4 pistas de ambiente: **se mantienen, pero como opción
   secundaria explícita, no como alternativa de igual jerarquía.**
2. En `GuidedAudioPlayer.tsx`, eliminar la redundancia entre el botón
   "Reiniciar" (líneas 239-246) y el link "Volver a empezar" (líneas
   349-359) — ambos llaman a `restart()`. Dejar uno solo.
3. No tocar el resto de los controles (scrubber, play/pause grande, skip
   ±10s) — el pedido de #32 es sobre la decisión previa a arrancar, no sobre
   los controles una vez que ya está sonando. El autoplay al recibir `src`
   (`GuidedAudioPlayer.tsx`, líneas 73-82) ya resuelve "soltar el celular"
   una vez que se togueó "Iniciar".

---

## 6. El ritual como receta — y como PDF descargable/imprimible (insight #41)

Sección nueva. Cubre el punto 3 del pedido de Mariana y el insight #41
(agregado en la segunda pasada del log): "podrías imprimirlo... sacar un
imprimible... que puedas mandar un PDF y dejás el celular" (00:20:51,
validado por Agustín: "está bueno, ahí sería como un exportar").

**Por qué encaja con lo que ya se sabe:** conecta directo con el modelo
"receta" ya validado (insight #19, y ya usado como referencia en la sección
4.4) y con el pedido repetido de soltar el celular (#28, #29, #32). Un PDF es
la versión física de la pantalla resumen que ya gusta (insight #31) — no
reemplaza esa pantalla, la extiende a un formato exportable.

### 6.1 — Contenido del PDF (formato "receta")

Mismo criterio de layout que ya se propuso para el detalle en pantalla
(sección 4.4 y el insight #19 original): pasos + lo que hace falta, visibles
juntos, no fragmentado. Y aplica directo el principio de 4.0: **el PDF tiene
que sentirse como un documento terminado, no como la captura de un paso de
formulario.** Nada de indicadores de progreso, nada de "paso X de Y", nada de
UI de wizard — mismo criterio visual que la pantalla resumen de 4.4, llevado
a un objeto exportable.

- Título del ritual.
- Intención (la frase ya reencuadrada).
- Guía de vela (`candleGuide` — color + instrucción + significado, ya
  existe en `candle.ts`, se reusa tal cual).
- Los 3 bloques del guion (`opening`, `symbolicAction`, `closing`) en
  formato de pasos numerados, no de tarjetas separadas.
- El anclaje real (`anchor`) destacado al final, mismo peso visual que tiene
  hoy en `RitualDetail.tsx` (fondo oscuro, texto blanco) — es el diferencial
  del producto, tiene que seguir siendo lo último y lo más visible.
- Explícitamente **no** va: nada de UI de la app (botones, navegación),
  nada de contenido de otros rituales ni cross-sell — es un documento
  autocontenido para llevarse, no una captura de pantalla.
- **Depende de la sección 7 (consistencia visual):** el PDF va a heredar el
  lenguaje visual que se defina para las cards/detalle de ritual — conviene
  que la consolidación de 7.3 exista antes de maquetar el PDF, para no
  construir un cuarto lenguaje visual distinto a los que ya conviven hoy.
  Por separado, un hallazgo menor de datos (sección 7.5) también puede
  afectar qué rituales son exportables de forma completa — no bloquea el
  diseño del PDF en sí, sí bloquea habilitar el botón de exportar para
  cualquier ritual sin verificar antes.

### 6.2 — Dónde se genera: frontend vs. backend

**Evaluación (sin implementar todavía, para que `mvp-builder` no tenga que
decidir esto solo a mitad de la tarea):**

- **Frontend (recomendado para v1):** generar el PDF client-side desde
  `RitualDetail.tsx` con una librería tipo `jsPDF` o `react-pdf` (ninguna de
  las dos está instalada hoy — confirmado en `package.json`, no hay ninguna
  dependencia de generación de PDF en el repo actualmente). Ventaja: no
  agrega carga a `rituales-backend`, no requiere un endpoint nuevo, y todo el
  dato ya está disponible en el cliente en el momento en que se muestra
  `RitualDetail` (no hace falta ida y vuelta al servidor). Desventaja:
  maquetar un PDF con buen diseño tipográfico desde JS en el navegador es más
  limitado que hacerlo server-side.
- **Backend (alternativa si el diseño del PDF necesita más fidelidad):**
  un endpoint nuevo en `rituales-backend` (ej. `GET /rituals/:id/pdf`) que
  arme el PDF server-side (ej. con `pdfkit` o similar) y lo devuelva o lo
  suba a Supabase Storage igual que ya se hace con el audio (`bucket audio`,
  mismo patrón que `render-audio`). Ventaja: más control de diseño,
  reusable para compartir un link directo al PDF. Desventaja: nuevo trabajo
  de infraestructura, nueva dependencia en el backend.

**Recomendación para esta ronda:** arrancar con la opción frontend (más
rápido de shippear, menor superficie de cambio) y dejar la migración a
backend como mejora futura si el resultado visual no alcanza el nivel de
`VOICE.md`/identidad de marca. Confirmar con Mariana antes de instalar una
librería nueva — ver pregunta abierta en sección 14.

### 6.3 — Punto de entrada

Agregar un botón "Descargar PDF" / "Exportar" en `RitualDetail.tsx`, junto a
los botones existentes "Iniciar" / "Compartir" en la barra inferior (o como
acción secundaria dentro de "Compartir", ya que `Share.tsx` ya es la pantalla
de exportación/distribución del ritual — puede tener más sentido vivir ahí
que como un tercer botón en la barra de `RitualDetail`). Decisión de UI menor,
`mvp-builder` puede resolverla con el criterio de no agregar una cuarta
decisión a la barra de acciones principal (conecta con el espíritu de la
sección 4/5: no multiplicar botones de igual jerarquía).

---

## 7. Estandarizar el diseño de todos los rituales ya creados — consistencia visual

Sección nueva (punto 5 del pedido de Mariana), **reencuadrada** tras
aclaración de Mariana: el pedido es sobre **estilo visual**, no sobre
completitud/calidad de los datos. La primera versión de esta sección lo
había interpretado como un audit de datos (`ai_ritual`/`anchor` faltantes) —
ese hallazgo es real y se mantiene, pero movido a 7.5 como algo aparte, no
como la respuesta al pedido. Lo que sigue es la investigación correcta: ¿los
rituales de la galería, los creados por usuarios y los compartidos/
descubiertos de otros usuarios se ven consistentes entre sí, bajo el mismo
lenguaje de diseño que este plan ya define en 4.0 (dos lenguajes visuales),
4.4 (formato receta) y 6.1 (PDF)? ¿O hay estilos/componentes viejos
conviviendo con los nuevos?

### 7.1 — `RitualDetail.tsx`: ya renderiza consistente por origen (buena noticia)

Se revisó específicamente si `RitualDetail.tsx` renderiza distinto según el
origen del ritual (galería/`isPublic`, propio/`loadedRitual`, o recién
creado en memoria vía `RitualContext`). La respuesta es que **no** — los
tres casos arman el mismo objeto `displayRitual` (con ramas para leer los
datos de la fuente correspondiente) y ese objeto alimenta un único árbol de
JSX: mismo hero, misma tipografía, mismas tarjetas de sección
(Apertura/Vela/Acción simbólica/Cierre), mismo bloque de anclaje. Las únicas
diferencias entre orígenes son funcionales, no de lenguaje visual: qué
botones aparecen en la barra inferior (`Iniciar`+`Compartir` para ritual
propio vs. `Crear el mío`+`Guardar` para uno ajeno), si aparece el botón
"Editar", y la línea "Compartido por X" solo cuando `isPublic`. Es decir: la
pantalla donde van a vivir el formato receta (4.4) y el PDF (6) **ya está
unificada** — no hay nada que arreglar ahí a nivel de estilo.

### 7.2 — Las cards de descubrimiento sí tienen el problema: tres componentes distintos, sin lenguaje compartido

El riesgo real está antes de llegar a `RitualDetail.tsx`, en cómo se
muestran los rituales para descubrirlos/elegirlos. Se relevaron todos los
componentes de card del repo:

- **`RitualGridCard.tsx`** — card compacta (aspecto cuadrado o 3:4), imagen
  con scrim y label de tipo arriba a la izquierda, título serif chico y una
  línea de metadata (`elemento · duración`). Se usa en `Explore.tsx` (grilla
  de la galería), en `Account.tsx` (grilla de "tus rituales"/favoritos), y
  reutilizada **dentro de** `PopularCarousel.tsx` para el carrusel
  "Populares ahora" de Home.
- **`RitualRecommendationCard.tsx`** — card grande (imagen 4:3), eyebrow-pill
  sobre la imagen, título serif grande, párrafo de descripción, fila de
  metadata con puntos separadores, y un footer de dos botones ("Ver ritual" +
  guardar). Se usa **solo** en `Home.tsx`, en la sección "Ritual para hoy" —
  que convive en la misma pantalla, a pocos scrolls de distancia, con el
  carrusel "Populares ahora" que usa `RitualGridCard`. Es decir: **en la
  misma pantalla de Home conviven dos lenguajes visuales distintos para el
  mismo tipo de objeto** (una card de ritual), no por venir de fuentes de
  datos distintas (los dos leen de datos curados/reales por igual) sino
  porque son dos componentes construidos por separado.
- **`RitualListCard.tsx`** — un tercer diseño de card, en formato lista
  horizontal con chips de metadata (clases CSS propias: `.ritual-list-card`,
  `.ritual-list-meta-chip`, definidas en `src/styles/theme.css` líneas
  365-385). **Confirmado por grep: no se importa ni se renderiza en ningún
  lugar de la app hoy** — ni en páginas ni en otros componentes. Es código
  (y CSS) huérfano, consistente con lo que el git log sugiere (commits tipo
  "Netflix/Spotify ritual gallery" o "redesign profile page as practice
  dashboard"): probablemente el diseño anterior de la galería/perfil, antes
  de migrar a `RitualGridCard`, que nunca se borró.

**Conclusión de 7.2:** sí, hay estilos/componentes viejos conviviendo con
los nuevos — y la inconsistencia no depende de si el ritual viene de la
galería o lo creó un usuario (los datos son intercambiables entre los tres
componentes), depende de **en qué pantalla/sección de la app** se esté
mostrando la card.

### 7.3 — ¿Está centralizado el estilo, o hay que tocar varios lugares?

Lo bueno: los **tokens de diseño** (`--ink-strong`, `--font-serif-display`,
`--font-sans-ui`, radios, sombras — definidos como variables CSS en
`src/styles/theme.css`) sí están centralizados y los tres componentes de
card los reusan correctamente. Los colores y tipografías no van a divergir
por accidente.

Lo que **no** está centralizado es la estructura/layout de las cards: cada
uno de los tres componentes arma su propio markup con estilos inline
prácticamente desde cero — no hay un componente base `RitualCard` con
variantes (`grid`, `recommendation`, etc.), cada implementación es
independiente. Esto significa que aplicar el lenguaje visual nuevo de 4.0 de
forma consistente hoy requeriría tocar cada componente por separado a mano,
con riesgo real de que se sigan desalineando con el tiempo (como ya pasó acá:
tres implementaciones distintas para el mismo tipo de contenido).

**Recomendación:** antes o junto con construir 4.4/6.1, consolidar las cards
de descubrimiento en un componente compartido (`RitualCard` con variantes,
o al menos sub-piezas comunes para imagen+badge, tipografía de título, y
botón de guardar) para que el lenguaje visual se propague desde un solo
lugar. Es trabajo de limpieza de sistema de diseño, no de rediseño de
contenido — y evita construir un cuarto estilo de card al lado de los tres
que ya existen.

### 7.4 — Acción concreta

1. Decidir el destino de `RitualListCard.tsx` y sus clases CSS asociadas
   (`.ritual-list-card`, `.ritual-list-meta-chip` en `theme.css` líneas
   365-385) — eliminarlos si son código muerto confirmado (lo son, según
   7.2), o documentar explícitamente si había un uso previsto que nunca se
   conectó. Es un cleanup de bajo riesgo.
2. Consolidar `RitualGridCard` + `RitualRecommendationCard` (y su uso dentro
   de `PopularCarousel`) en un componente compartido con variantes, para que
   Home ("Ritual para hoy" + "Populares ahora"), `Explore.tsx` y `Account.tsx`
   dejen de mostrar dos diseños distintos del mismo tipo de objeto.
3. Este trabajo no toca `RitualDetail.tsx` (ya unificado, 7.1) — es
   específicamente sobre las superficies de descubrimiento que llevan hacia
   esa pantalla.
4. Conviene resolver esto antes o junto con 4.4/6.1 (ver dependencia
   señalada en 6.1), para que el nuevo lenguaje "documento terminado" tenga
   un solo lugar de origen visual, no tres.

### 7.5 — Hallazgo aparte: completitud de datos en rituales persistidos (no es el pedido de estilo)

Esto es lo que la primera versión de esta sección proponía como respuesta
al punto 5 — se mantiene documentado porque es un hallazgo real, pero
**no responde al pedido de consistencia visual**, es un problema distinto
(de datos, no de estilo) encontrado en el camino.

- **Galería (`EXPLORE_RITUALS`, `src/app/data/rituals.ts`): sin riesgo.**
  Los 20 rituales curados tienen la forma completa que hace falta
  (`aiRitual.title/opening/symbolicAction/closing`, `intention`, `anchor`,
  etc.) — contenido estático, completo por construcción.
- **Rituales persistidos en Supabase: riesgo real, confirmado en código.**
  `rituales-backend/src/lib/rituals.js`, función `buildAiRitualFromRow`
  (líneas 1-12), tiene un fallback a columnas planas legacy
  (`row.ritual_title`, `row.ritual_opening`, `row.ritual_symbolic_action`,
  `row.ritual_closing`) para cuando `row.ai_ritual` no existe — columnas que
  **ni siquiera están declaradas en el `schema.sql` vigente**, prueba de que
  existió (o existe) una forma de datos anterior. Además, `mapRitualRow`
  (línea 40) pasa `anchor: row.anchor` sin ningún fallback — el fallback
  vive del lado del frontend (`RitualDetail.tsx`,
  `anchorText = displayRitual.anchor?.trim() || "Elegí una acción concreta..."`),
  lo que confirma que **hay rituales reales persistidos sin anclaje
  guardado**, hoy tapados en silencio con un texto genérico.
- **Por qué importa igual, aunque no sea el pedido de esta sección:** el
  anclaje es el diferencial más fuerte del producto (#4, #11, #31) — si
  faltan anclajes reales en la base, es un problema de producto silencioso,
  más allá de cualquier tema visual.
- **Acción concreta, tratada como su propia tarea (no bloquea 7.1-7.4):**
  correr una auditoría de la tabla `rituals` en producción (acceso que este
  plan no tiene desde lectura de código) para contar filas con `ai_ritual`
  o `anchor` faltantes, y decidir entre backfill puntual y/o exponer un
  flag de "no exportable" para que el botón de PDF (6.3) no se ofrezca en
  rituales incompletos. Se puede tomar como quick win/bug independiente —
  ver sección 13 — en vez de como parte de la consolidación visual de
  7.1-7.4.

---

## 8. Diario de Anclas — pasos "Momento" y "Cierre"

(El paso "Inicio" se rediseña aparte, como carta-juego diaria persistida en
el backend — ver sección 3.3. Esta sección cubre lo que queda de la
confusión reportada en #18/#26 para los otros dos pasos, que **no** cambian
de mecanismo de persistencia en esta ronda.)

**Nota de arquitectura que queda explícitamente sin resolver ahora:** a
partir de 3.3.3, el paso `Inicio` pasa a ser server-first (tabla
`daily_intention_cards`, endpoint dedicado), mientras que `Momento` y
`Cierre` siguen sobre el mecanismo local-first/best-effort de
`daily_anchor_entries` (que además, según lo encontrado en 3.3.3, tiene un
problema de confiabilidad real: tabla no versionada en `schema.sql`, sin
endpoint de backend, errores silenciosos). Esto deja una asimetría dentro
del mismo feature — los tres pasos del mismo "Diario de Anclas" no se
guardan con la misma confiabilidad. No se resuelve en esta ronda para
`Momento`/`Cierre` (ver por qué en la evaluación de abajo), pero queda
anotado como algo a resolver si más adelante se aborda el rediseño de fondo
del resto del diario.

Cuarta fuente independiente confirmando que el Diario de Anclas en general no
se entiende (#18 → #26). Agustín propuso además reemplazar todo el formulario
estructurado por un log libre de audios/notas de voz a lo largo del día.

**Estado real del feature** (`guidelines/HomeDiarioDeAnclas.md` + `Home.tsx`):
3 pasos (`Inicio`, `Momento`, `Cierre`), cada uno con inputs estructurados
(sentimiento + texto/alineación), gateados por hora fija del reloj (`Momento`
desbloquea a las 14:00, `Cierre` a las 19:00, independientemente de cuándo la
persona abrió la app o completó el paso anterior).

**Evaluación para esta ronda — no conviene rediseñar `Momento`/`Cierre` de
fondo ahora, más allá de la carta de `Inicio`:**
- La propuesta de fondo de Agustín (log libre de voz para todo el diario) es
  un cambio de modelo de datos y de UX comparable en tamaño a una fase
  completa de `rituales-v2-plan.md`, no un ajuste de flujo.
- Ya se está incorporando bastante alcance nuevo a esta ronda (Home, PDF,
  perfil, willingness-to-pay, la carta diaria). Sumar el rediseño completo
  del diario entero (y arreglar la confiabilidad de `daily_anchor_entries`)
  arriesga diluir el foco.

**Lo que sí entra en esta ronda (quick win, bajo esfuerzo):**
- Sacar o relajar el gateo por hora fija cuando el paso anterior ya está
  completo (hoy se puede completar `Inicio` a las 00:05 y quedar esperando
  hasta las 14:00 igual aunque la persona vuelva a la app a las 09:00 con
  ganas de seguir) — esto es probablemente parte de la confusión, no solo la
  falta de explicación.
- Agregar la explicación de una línea que ya estaba pendiente desde la ronda
  de agosto (Prioridad 2 de `iteracion-feedback-agosto-2026.md`, insight #18,
  nunca se hizo): un micro-copy fijo arriba del bloque de Diario de Anclas en
  `Home.tsx` explicando en una frase qué es, sin esperar a que alguien lo
  explique en vivo.
- Nota: `"¿Qué aprendiste hoy?"` (título del paso `Cierre`, confirmado en
  `Home.tsx` línea 115) **ya existe** — es importante no confundirlo con la
  pantalla de feedback post-audio nueva de la sección 9 siguiente: son dos
  momentos distintos (reflexión diaria general en Home vs. reflexión puntual
  después de escuchar un ritual específico en `RitualDetail`). No se
  fusionan ni se reemplazan entre sí — ver más detalle en sección 9.1.

El rediseño de fondo del resto del Diario de Anclas (log libre de voz, sin
gateo por hora, y resolver la asimetría de persistencia con el paso
`Inicio`) queda como pregunta abierta para Mariana — ver sección 14.

---

## 9. Cierre del ritual: feedback + tracker de cumplimiento real

Expande lo que en la primera versión de este documento era la pantalla de
cierre con racha. Ahora incluye explícitamente: capturar feedback real y
distinguir "escuchó el audio" de "completó de verdad" (incluyendo si hizo la
acción física del anclaje) — conecta con el insight #2 original del feedback
log ("saber si un usuario entró a chusmear un ritual o si lo hizo
realmente").

### 9.1 — Aclaración importante: `"¿Qué aprendiste hoy?"` ya existe, pero en otro lugar

Se verificó en código antes de asumir: el texto `"¿Qué aprendiste hoy?"`
existe hoy en `Home.tsx` (línea 115) como título del paso **`Cierre` del
Diario de Anclas** (el check-in diario en Home, ver sección 8) — no es una
pantalla que aparezca después de escuchar un ritual guiado. Es probable que
en la transcripción del 30/8 Agustín/Mariana se estén refiriendo a este
feature ya existente como referencia de qué se siente bien ("está bueno que
pregunte qué aprendí"), y no necesariamente pidiendo que sea literalmente el
mismo componente el que aparezca después del audio.

**Decisión tomada para este plan:** construir una pantalla de cierre **nueva
y separada**, específica del momento "terminé de escuchar este ritual", en
`RitualDetail.tsx` — no reutilizar el componente del Diario de Anclas tal
cual, porque vive en un flujo de datos distinto (el Diario de Anclas persiste
en `daily_anchor_entries` vía `anchor-service.ts`; esto necesita persistir
contra el ritual puntual que se acaba de escuchar). Sí se puede reusar el
mismo tono de pregunta ("¿qué te llevás de este ritual?" o similar, criterio
`VOICE.md`) como familia de copy, sin que sea el mismo componente ni la misma
tabla.

### 9.2 — Qué pasa hoy cuando termina el audio (y un bug de instrumentación encontrado)

`handleGuidedAudioEnded` en `RitualDetail.tsx` (líneas 290-295) solo dispara
`track("ritual_completed", ...)`. La hoja inferior sigue abierta, sin ningún
cambio visual — exactamente lo que describe el insight #33 ("queda ahí, no
se cierra").

**Bug de instrumentación encontrado leyendo el código, relevante para todo
este punto:** el evento `"ritual_completed"` **se dispara dos veces, con dos
significados distintos, en dos lugares distintos**:
- `StepAnchor.tsx` (línea 37) lo dispara al terminar el wizard de creación
  (`handleFinish`, "Construir ritual") — es decir, cuando el ritual **se
  armó**, antes de que nadie lo haya escuchado.
- `RitualDetail.tsx` (línea 291) lo dispara cuando el audio guiado **termina
  de sonar** — el significado real de "completó".

Hoy no hay forma confiable de distinguir en los datos de analytics cuál de
los dos pasó. Esto es exactamente el problema que describe el insight #2
("saber si lo miró o lo hizo de verdad") a nivel de instrumentación, no solo
de UI: el propio nombre del evento está pisado. **Corregirlo es un
prerequisito técnico de este punto**, no solo un nice-to-have: renombrar el
evento de `StepAnchor.tsx` a algo como `"ritual_built"` (se construyó, no se
hizo), y dejar `"ritual_completed"` exclusivamente para cuando el audio
termina de sonar de verdad.

### 9.3 — Tracker de cumplimiento real (no solo "el audio terminó")

Distinguir tres momentos, no dos:
1. **Vio el ritual** (abrió `RitualDetail`) — ya trackeable hoy vía
   `page_view` (`Layout.tsx`, `RouteTracker`).
2. **Escuchó el audio completo** — hoy trackeable vía `ritual_completed`
   (una vez corregido el bug de 9.2), pero **no persiste en ningún lado
   consultable más allá del log de eventos genérico** (`events` /
   `ritual_events`, `props` JSONB libre — no hay ninguna columna dedicada en
   `rituals` ni tabla de cumplimiento).
3. **Hizo la acción real del anclaje** — hoy **no se captura en absoluto**.
   El anclaje se define durante la creación (`StepAnchor.tsx`) pero nada en
   el código pregunta después "¿lo hiciste?".

**Acción concreta (toca `rituales-backend`):**
- Agregar columnas a `rituals` en `rituales-backend/supabase/schema.sql`
  (mismo patrón ya usado ahí — `alter table rituals add column if not
  exists ...`): `audio_completed_at timestamptz`, `anchor_confirmed_at
  timestamptz`, `reflection_text text` (para el feedback corto opcional de
  9.4). Se elige extender `rituals` directo (1 fila = 1 ritual) en vez de
  crear una tabla nueva de cumplimiento, porque hoy el modelo de datos ya es
  "un ritual persistido por sesión creada" — más simple para v1. Si más
  adelante se soporta re-escuchar/repetir el mismo ritual varias veces y hay
  que contar cada repetición por separado, ahí sí conviene una tabla de log
  aparte — no es necesario para v1.
- Nuevo endpoint en `rituales-backend` (ej. `PATCH /rituals/:id/complete`)
  que reciba `{ audioCompleted?: boolean, anchorConfirmed?: boolean,
  reflectionText?: string }` y actualice esas columnas. Documentar en
  `guidelines/BackendContract.md`.
- Desde `RitualDetail.tsx`: llamar a este endpoint (a) cuando `onEnded` del
  `GuidedAudioPlayer` dispara (`audioCompleted: true`), y (b) cuando el
  usuario confirma el anclaje en la pantalla de cierre nueva (9.4)
  (`anchorConfirmed: true` + `reflectionText` si escribió algo).
- **Esto también corrige, de paso, la imprecisión ya señalada en la primera
  versión de este documento**: la racha lunar (`getLunarStreak`,
  `practice-journal.ts`) hoy se deriva de `createdAt` de los rituales propios
  (`getJournalEntriesFromOwnRituals`), es decir, cuenta **rituales creados**,
  no completados. Con `audio_completed_at` disponible, la fuente correcta
  para la racha pasa a ser "rituales con audio completado", más fiel a lo
  que la racha debería representar. No es obligatorio migrar ya todos los
  usos existentes de la racha en esta ronda, pero sí usar la fuente correcta
  para la pantalla de cierre nueva (no la vieja).

### 9.4 — La pantalla de cierre en sí

Al disparar `onEnded` en `GuidedAudioPlayer`, reemplazar el contenido de la
hoja por una pantalla de cierre corta:

1. Una línea de cierre tono `VOICE.md` (contemplativa, directa, sin
   resignación).
2. Un dato de racha/logro concreto, ahora con la fuente de datos correcta
   (9.3), no la rota de `Account.tsx` (ver bug encontrado abajo).
3. **Feedback corto, opcional, no bloqueante:** un campo mínimo tipo "¿qué te
   llevás?" (texto corto u opción de chips rápidos, criterio `VOICE.md`,
   *no* el mismo componente del Diario de Anclas — ver 9.1) que persiste en
   `reflection_text` (9.3). Tiene que poder saltearse con un tap — no es un
   formulario obligatorio, es una invitación.
4. **Confirmación del anclaje:** un toggle o pregunta simple ("¿Hiciste tu
   anclaje?" / "Todavía no") que persiste `anchor_confirmed_at`. Esto puede
   no responderse en el momento (la acción real puede ser más tarde en el
   día) — si no se confirma ahí, no bloquea el cierre; puede ofrecerse de
   nuevo más tarde desde `RitualDetail` o el perfil, a definir.
5. Un solo botón principal ("Listo" / "Cerrar") que cierra la hoja. **Nada
   más en esta pantalla** — insight #34 sigue vigente: no agregar "seguí
   explorando" ni rituales recomendados acá. Ese contenido ya vive en otros
   lados de la app (Home, `PopularCarousel`). **Importante para la sección
   10 (willingness-to-pay):** por esta misma regla, el experimento de precio
   no se apila en esta pantalla — ver sección 10 para el punto exacto donde
   sí aparece.

**Bug real encontrado leyendo el código, relevante para el dato de racha:**
`Account.tsx` calcula "Tu práctica" (racha lunar, elemento dominante,
actividad reciente) a partir de `getJournalEntries()` (línea 71,
`practice-journal.ts`), que lee un journal local (`rituales_journal_v1`)
que **nunca se escribe** — `saveJournalEntry()` está definida pero no tiene
ningún caller en todo `src/app` (confirmado por grep). A diferencia de
`Home.tsx` (línea 277) y `CosmicCalendar.tsx` (línea 38), que sí usan
`getJournalEntriesFromOwnRituals(ownRituals)` para usuarios logueados,
`Account.tsx` no tiene ese fallback y queda siempre vacío para cualquier
usuario logueado. No es solo "datos de prueba desordenados" como se atribuyó
en vivo en la sesión (bug #4 del log) — es un bug de código verificable.
Arreglar `Account.tsx` en sí es un quick win aparte (sección 13).

---

## 10. Experimento de willingness-to-pay sobre la voz guiada (insight #42)

Sección nueva (punto 4 del pedido de Mariana). Insight #42, agregado en esta
pasada del log: a las 00:39:35 de la misma sesión del 30/8, Mariana dice
"quiero hacer un experimento de Willing to Pay"; más temprano (00:18:27-
00:19:35) ya se había hablado de un split freemium: sonido ambiente cacheado
gratis vs. moderación por voz generada como feature paga.

### 10.1 — Estado real de infraestructura de pago (verificado, no asumido)

Se buscó por `stripe`, `mercadopago`/`mercado_pago`, `billing`, `subscription`
y `payment` en los dos repos. **No hay ninguna integración de pago real en
ningún lado del código** — cero resultados relevantes en `rituales-backend`;
en `rituales-app` el único match de "subscription" es el listener de
`supabase.auth.onAuthStateChange` (`UserContext.tsx`, línea 148), que no
tiene nada que ver con cobros. Esto confirma que **esto tiene que
construirse como experimento de validación, no como paywall real** — no hay
ningún riel de cobro para conectar todavía, y no es parte de esta ronda
construirlo.

### 10.2 — Punto exacto del flujo donde aparece

**Se evaluaron dos opciones y se descarta una de ellas explícitamente:**

- **Opción descartada: dentro de la pantalla de cierre (sección 9.4).**
  Aunque es el momento narrativamente más cercano ("recién terminaste de
  escuchar la voz guiada"), apilar un prompt de precio ahí **choca
  directamente con el insight #34** ("basta de información, déjame cerrar
  tranquilo... vendeme otra cosa, ¿entendés? Última que me estoy por ir") —
  la sección 9.4 ya establece como regla no agregar nada más a esa pantalla.
  Un experimento de precio, aunque no sea "cross-sell de contenido", sigue
  siendo "una cosa más" en el momento exacto que el usuario pidió que
  quedara limpio.
- **Opción recomendada: la próxima vez que se solicita una nueva
  generación de voz guiada.** La primera vez que alguien pide audio con voz
  (`handleRequestGuidedAudio` → `renderGuidedAudio`, sección 5) es gratis y
  no se interrumpe. A partir de la **segunda vez** que un usuario dispara
  una generación nueva de voz guiada (no la reproducción de un audio ya
  cacheado — el costo real es específicamente en cada llamada nueva a
  ElevenLabs vía `render-audio`), se muestra el experimento de precio antes
  de llamar al endpoint. Esto además es más preciso que la opción
  descartada: ata el experimento al momento real donde el costo variable
  existe (una renderización nueva de TTS), en vez de a un momento narrativo
  que no necesariamente coincide con una segunda generación.

### 10.3 — Cómo se muestra (no bloqueante, medible)

- Se presenta como una tarjeta/hoja con el precio de referencia ya definido
  en `guidelines/rituales_origen.md` (mayo 2026, pivot a membresía: "~USD
  10/mes", modelo freemium con "generación de audio paga" como parte
  explícita de esa decisión) — no es un número nuevo, es el que ya está en
  la tesis de negocio.
- **No bloquea nada.** Sea cual sea la respuesta (acepta, rechaza, cierra sin
  responder), la generación de voz guiada sigue funcionando igual que hoy en
  esta ronda — no hay ningún corte de acceso real. El objetivo es medir
  intención de pago, no cobrar.
- Copy tono `VOICE.md`: directo, sin presión de venta agresiva, coherente con
  que el producto no vende con urgencia artificial.

### 10.4 — Instrumentación

Eventos nuevos en `analytics.ts` (mismo mecanismo `track(event, props)` que
ya existe, sin cambios de infraestructura):
- `pricing_experiment_shown` (con `ritualId`, número de generación de voz que
  disparó el prompt).
- `pricing_experiment_accepted` / `pricing_experiment_declined` /
  `pricing_experiment_dismissed` (cerrado sin responder).

No requiere trabajo de `rituales-backend` más allá de que estos eventos ya
caen en la tabla `events`/`ritual_events` existente — es una pieza chica y
autocontenida, se puede shippear temprano sin depender del resto del plan.

---

## 11. Onboarding de perfil y personalización — fase propia, separada del resto

**Esta sección es su propio milestone, no un ítem más de las secciones 3-10.**
Es sustancialmente más grande: roza diseño de un sistema de
recomendación/personalización con estado persistente por usuario, tracking
de eventos nuevo, y decisiones de modelo de datos en `rituales-backend`. No
es un cambio de UI.

### 11.0 — Redefinición del trigger y contenido (segunda revisión de Mariana)

Precisión importante respecto de la primera versión de este documento: el
onboarding de perfil **se dispara al abrir la app por primera vez**, no al
entrar al flujo de creación de un ritual. Contenido confirmado, 3 steps:

1. **Género.**
2. **Elección simbólica** — "para evitar ser esotérico si el usuario no lo
   es". Es, literalmente, el insight #1/#27 (tensión pseudociencia /
   accesibilidad, marco místico vs. secular) convertido en pregunta directa
   de onboarding en vez de una inferencia implícita.
3. **Medición de experiencia** — nivel de familiaridad con rituales (insight
   #27).

**Al final de los 3 steps: se ofrece loguearse por mail para guardar la
información, o "Skip" para hacerlo más tarde**, en el momento de crear un
ritual.

Estas respuestas mapean directo a los 3 campos de perfil ya diseñados en
9.3 (ahora 11.3) de la versión anterior de este documento: `gender` (nuevo,
explícito, tercer campo — no estaba en la v1 anterior), `symbolic_system`
(elección simbólica) y `familiarity_level` (medición de experiencia).

### 11.1 — Qué tan lejos está el código hoy (verificado, no asumido)

- **No existe ningún campo de perfil de usuario más allá de nombre y email.**
  `user-service.ts` (`UserProfileData`, líneas 6-11) solo tiene `id, email,
  fullName, likesReceived`. El backend (`rituales-backend/src/routes/me.js`)
  lee/escribe `full_name` directo en `user_metadata` de Supabase Auth — no
  hay ninguna tabla de perfil propia.
- **No existe ninguna tabla de perfil en el schema.** `supabase/schema.sql`
  de `rituales-backend` solo tiene `rituals`, `ritual_favorites`,
  `ritual_likes`, `events` — ningún `user_profiles` ni equivalente.
  `docs/rituales-v2-plan.md` ya había anticipado algo parecido (tabla
  `user_emotional_profile`, con `beliefs`/`patterns`/`history` en JSONB) para
  su propia Fase 1, pero nunca se construyó — **hay superposición de diseño
  entre ese plan y este pedido**, señalado en la sección 1.
- **No existe tracking más allá de `analytics.ts` / `track()`.** Es un
  sistema genérico de eventos (`event: string, props?: Record<string,
  unknown>`) que persiste en `localStorage` + tabla `events`/`ritual_events`
  (JSONB libre). No hay ningún sistema de atributos de usuario estructurados
  ni de aprendizaje/scoring sobre esos eventos.
- **La oferta de contenido hoy no es personalizada en absoluto.** `Explore.tsx`
  no tiene ningún `track()` (confirmado por grep — cero llamadas), y los
  datos que muestra vienen de `EXPLORE_RITUALS`, una lista estática en
  `src/app/data/rituals.ts`. `PopularCarousel` en Home también consume datos
  fijos/curados. Hoy no hay ninguna superficie de la app que varíe según
  comportamiento pasado del usuario.
- **No existe ningún patrón de "reclamar" datos anónimos al loguearse.**
  Se verificó específicamente para este pedido: en `rituales-backend/src/
  routes/rituals.js` (línea 61), `user_id` se fija **una sola vez**, en el
  momento de crear el ritual (`authUser?.id || input.userId || null`) — no
  hay ningún endpoint ni lógica que después vuelva a mirar rituales
  anónimos y les asigne un `user_id` si esa persona se loguea más tarde. El
  patrón más cercano que sí existe es otro: `anchor-service.ts` (local-first,
  `saveDailyAnchorEntry` intenta guardar en el backend pero ignora errores
  en silencio si no hay sesión — "localStorage es la fuente de verdad") +
  el listener `onAuthStateChange` en `UserContext.tsx` (línea 148-163, hoy
  solo trackea el evento `login`, no dispara ninguna sincronización). Ninguno
  de los dos hace exactamente lo que este pedido necesita — se toman como
  referencia de criterio (local primero, sync no bloqueante), pero el
  mecanismo específico de 11.3 (sincronizar un borrador de perfil pendiente
  al loguearse) es código nuevo, no la reutilización de un patrón ya armado.
  **Nota agregada:** este mismo mecanismo nuevo de "sync de un draft local al
  loguearse" también lo necesita la carta de intención diaria (sección
  3.3.3, para usuarios anónimos que ya jugaron localmente) — conviene
  construirlo de forma genérica (ej. un helper que reciba una key de
  localStorage y un endpoint de destino) para que sirva a los dos casos, no
  como algo hardcodeado solo para el perfil.

**Conclusión:** esto arranca de cero. No hay que migrar nada existente, pero
tampoco hay ningún atajo — todo lo de esta sección es construcción nueva.

### 11.2 — Tensión que sigue sin resolver sobre el campo de género

`VOICE.md` tiene una regla explícita y fechada: **"Sin género gramatical"**
(sección "Reglas de escritura", decisión de abril 2026) — los textos
generados no usan `ella`/`él`, todo en segunda persona o construcciones
impersonales: *"el texto funciona para cualquier persona sin esfuerzo. No es
solo inclusión — es que la segunda persona ya es el registro natural de la
app."*

Mariana confirmó en esta revisión que **el género sí se captura** como uno de
los 3 steps del onboarding — eso ya no está en duda. **Lo que sigue sin
confirmar explícitamente** es un nivel más abajo: si ese dato se usa para
generar el copy del ritual con género gramatical dirigido a la persona (lo
que chocaría con la regla vigente de `VOICE.md`), o si se usa solo para
trato/perfil de cuenta y no toca el contenido generado. No se asume ninguna
respuesta acá — queda explícito en la sección 14 como pregunta abierta,
ahora más acotada que en la versión anterior de este documento.

### 11.3 — V1 acotada (esta ronda)

Concreta y ejecutable, sin construir el "aprendizaje" todavía:

1. **Nueva tabla `user_profiles`** en `rituales-backend/supabase/schema.sql`:
   `user_id` (FK a `auth.users`, PK), `gender` (el step 1, formato a definir
   según se resuelva 11.2 — puede guardarse igual aunque todavía no se use
   para generar copy), `symbolic_system` (enum: p.ej. `mistico` / `secular`
   — step 2), `familiarity_level` (enum: `nuevo` / `con_experiencia` — step
   3), `updated_at`. Requiere RLS (cada usuario lee/escribe solo su propio
   perfil) — mismo requisito que ya había anticipado `rituales-v2-plan.md`
   para su tabla.
2. **El onboarding de 3 steps se muestra al primer inicio de la app**, no al
   entrar al wizard — nuevo flag de "primera vez" a nivel de toda la app
   (mismo patrón técnico que `rituales_stories_first_visit_v1` en
   `Stories.tsx`, pero chequeado en un punto de montaje más alto, ej.
   `App.tsx`/`Layout.tsx`, no en `Onboarding.tsx`/`StepIntention.tsx`).
3. **Persistencia mientras no hay sesión (si el usuario elige "Skip" del
   login al final de los 3 steps):**
   - Las respuestas se guardan en un nuevo key de `localStorage` (ej.
     `rituales_profile_draft_v1`), siguiendo el mismo criterio "local
     primero" que ya usa `daily-anchor.ts`/`anchor-service.ts` — no hay que
     inventar un patrón de persistencia nuevo, solo aplicar el mismo
     criterio a un dominio de datos distinto.
   - **Sync al backend:** se agrega lógica nueva (no existe hoy, ver 11.1)
     en el handler `SIGNED_IN` de `onAuthStateChange`
     (`UserContext.tsx`, línea 154) — si hay un `rituales_profile_draft_v1`
     pendiente en localStorage al detectar el login, se dispara el `PATCH`
     al endpoint de perfil (punto 5) y se limpia el draft si tuvo éxito. Si
     falla, se sigue el mismo criterio de `anchor-service.ts`: no bloquear
     al usuario, reintentar en el próximo login o desde `Account.tsx`. Este
     mismo hook, generalizado, es el que sincroniza también el draft de la
     carta diaria (`rituales_daily_card_draft_v1`, sección 3.3.3) — un solo
     mecanismo, dos consumidores.
   - Si el usuario nunca completó los 3 steps al abrir la app (los saltó
     directo), se le puede volver a ofrecer completar el perfil en el
     momento de crear un ritual (el trigger original de la v1 anterior de
     este documento) o desde `Account.tsx` — no es obligatorio en ningún
     punto, es progresivo.
4. **Estas respuestas ya se usan para adaptar contenido real en esta ronda**
   (no quedan guardadas sin uso): pasan como parámetros nuevos a
   `reframeIntention` y `generateRitualWithClaude` en
   `rituales-backend/src/lib/claude.js` (hoy ninguna de las dos funciones
   recibe nada de perfil de usuario — reciben solo texto/parámetros del
   ritual puntual). El ajuste de prompt según `symbolic_system` conecta
   directo con el insight #1 (versión más secular vs. más simbólica del
   mismo contenido) y según `familiarity_level` con el insight #27
   (explicación más o menos guiada). El uso de `gender` en el prompt queda
   supeditado a resolver la tensión de 11.2 — se guarda el dato en esta
   ronda, no necesariamente se usa para generar copy todavía.
5. **Endpoint:** extender `PATCH /me/profile` (ya existe, hoy solo actualiza
   `fullName`) o agregar uno nuevo dedicado (`PATCH /me/symbolic-profile`) —
   `mvp-builder` decide según cómo quede de prolijo, documentar en
   `guidelines/BackendContract.md` de cualquier forma.
6. **Eventos nuevos a trackear desde ya**, aunque el "aprendizaje" en sí sea
   v2/v3 — para que cuando se construya el filtro agéntico haya datos
   históricos con los que arrancar, en vez de empezar de cero en ese momento:
   - `profile_onboarding_shown_first_open` / `profile_onboarding_completed`
     (con las respuestas como `props`) / `profile_onboarding_skipped` (llegó
     al final y eligió no loguearse).
   - `profile_draft_synced_on_login` (el draft local se sincronizó
     exitosamente al loguearse — señal de cuántos "Skip" efectivamente se
     recuperan después).
   - `element_selected_override` / `energy_selected_override` /
     `intensity_selected_override`: cuando el usuario cambia un valor que
     había sido preseleccionado por inferencia (sección 4.3) — señal directa
     de qué tan bien está infiriendo el sistema, útil tanto para ajustar la
     heurística de inferencia como insumo futuro de personalización.
   - `explore_ritual_opened` / `explore_filter_used`: hoy `Explore.tsx` no
     trackea nada (confirmado, sección 11.1) — agregar estos dos eventos ya
     empieza a generar señal de qué contenido interesa, sin todavía usarla
     para nada.
   - `anchor_confirmed` (ya sale como necesidad de la sección 9.3, se reusa
     acá como señal de perfil también: quién efectivamente completa
     anclajes reales es información valiosa para personalización futura).

### 11.4 — Visión de largo plazo (dirección, explícitamente fuera de construir ahora)

El "filtro agéntico que aprende con el tiempo" — un sistema que toma los
eventos de 11.3 (y los que se sigan agregando) y ajusta de forma continua:
copy generado, qué rituales se sugieren en Home/`PopularCarousel`, qué
aparece primero en `Explore.tsx`, y potencialmente el propio
`symbolic_system`/`familiarity_level` del perfil (que hoy en v1 se
autodeclaran una vez, pero podrían ajustarse solos con el uso).

Esto es, en tamaño y naturaleza, equivalente a la tabla `user_emotional_profile`
+ perfil acumulado que ya proponía `rituales-v2-plan.md` — mismo tipo de
problema (persistencia de perfil que crece con el uso, decisiones de
privacidad sobre qué se guarda). **No se diseña en detalle en este
documento.** Cuando se aborde, conviene hacerlo como una sola iniciativa que
unifique este pedido con la Fase 1 de `rituales-v2-plan.md` en vez de
construir dos sistemas de perfil paralelos — señalado también en la sección 1.

---

## 12. Nota sobre recurrencia (insight #40)

No es un fix de UI puntual, es el motivo estratégico por el que esta ronda
importa: de 11 suscriptores orgánicos, ninguno volvió a usar la app.

Se verificó en el código: **no hay ninguna implementación de push
notifications** en `rituales-app` (sin service worker, sin `Notification`
API, sin nada — confirmado por grep en todo `src/`). Esto no es un
descuido — `docs/rituales-v2-plan.md` (Fase 4) ya lo señala explícitamente
como limitación conocida de PWA/iOS, no asumida como resuelta.

Esto significa que hoy **la única palanca de recurrencia que la app tiene es
bajar la fricción de cada apertura** — no hay ningún recordatorio externo que
traiga a alguien de vuelta. Todo lo de las secciones 3-11 (Home que explica y
ofrece el mecanismo central de entrada, menos pasos, menos decisiones, cierre
con sensación de logro real en vez de pantalla muerta, y a mediano plazo
personalización que hace que volver valga más la pena) no es "UX bonita" en
este contexto: es la palanca de negocio más directa que existe hoy para la
métrica que más le importa a Mariana de cara a la ronda pre-semilla. Vale la
pena que quede explícito así en cualquier conversación con inversores o
mentores sobre por qué esta ronda de producto es prioritaria ahora. La carta
diaria de la sección 3.3, al ser un evento único por día (3.3.2), es además
la pieza más parecida a un mecanismo de hábito recurrente que la app va a
tener sin depender de notificaciones push.

---

## 13. Quick wins — independientes del rediseño grande

Bugs puntuales de la sesión (los 4 loggeados) + insights menores (#35-#39),
agrupados aparte porque no dependen de ningún paso del rediseño de arriba y
se pueden tomar en paralelo o antes.

- **(00:03:23) Campo de OTP no evidente — ajuste específico, ya no genérico.**
  Confirmado en `Login.tsx`: después de mandar el código, `sendOtp` deja el
  `step` en `"link"` (línea 76), una pantalla intermedia ("Revisá tu email" +
  el botón "Ingresar el código en cambio", líneas 259-264) que el usuario
  tiene que tocar **antes** de que aparezcan los 6 inputs de código. La
  entrega del mail ya no es el problema (Custom SMTP activado, ver sección
  1) — el problema ahora es puramente de UI: sacar el paso intermedio, que
  `sendOtp` deje `step` directo en `"code"` en vez de `"link"`, para que el
  campo de 6 dígitos se muestre de una. El contenido del paso `"link"` (texto
  de "revisá tu email", reenviar, cambiar email) puede fusionarse dentro de
  la pantalla `"code"` (que de hecho ya tiene su propio "Reenviar código" y
  "Cambiar email", líneas 375-394) — no hace falta mantener las dos
  pantallas.
- **(00:09:56) Scroll mal posicionado entre pasos del wizard.** Cada paso
  nuevo de `/crear/*` debería montar con `window.scrollTo(0, 0)` — patrón que
  ya existe en `RitualDetail.tsx` (línea 106-108) pero no en los `Step*.tsx`.
  Aplicar el mismo `useEffect` a los pasos que sobrevivan al rediseño de la
  sección 4.
- **(00:18:27) La acción concreta elegida no se insertó bien en el guion
  final.** Bug de sustitución de variable/placeholder al ensamblar el guion
  con el anclaje — revisar dónde se arma `personalizedScript` (backend,
  `rituales-backend/src/lib/session.js` o donde se interpole el anclaje) para
  encontrar el punto de sustitución roto.
- **(00:30:39) + bug de código encontrado en sección 9.4:** el contador de
  racha en `Account.tsx` no es solo datos de prueba desordenados — es un bug
  real (`getJournalEntries()` sin fallback a `getJournalEntriesFromOwnRituals`
  para usuarios logueados). Arreglarlo alineando `Account.tsx` al mismo
  patrón que ya usan `Home.tsx` y `CosmicCalendar.tsx` — y, una vez esté
  disponible, a la fuente más precisa de la sección 9.3
  (`audio_completed_at`).
- **Insight #35 — Compartir a Instagram no funcional.** Confirmado en código:
  `Share.tsx`, `handleInstagram` (línea 50-54) solo muestra un toast
  ("En la app real, esto generaría una imagen..."). `handleWhatsApp` (línea
  44-48) también. Cablear al menos WhatsApp (más simple — compartir el link
  ya generado vía `navigator.share` o intent de WhatsApp) como primer paso;
  Instagram story requiere generar una imagen, es más trabajo.
- **Insight #36 — delay al guardar desde Explorar sin feedback.** Agregar
  estado de loading inmediato en el botón de guardar (mismo patrón que ya usa
  `RitualDetail.tsx` con `isSavingPublicRitual` / "Guardando...").
- **Insight #37 — voz artificial en el modo por voz.** Cross-referenciar con
  el trabajo de pacing ya shippeado después de esta sesión (commits recientes
  en `rituales-backend`: "Add descending cadence...", "Make guided audio
  scripts calmer and slower", "Speed up guided audio voice, shorten pauses").
  Re-testear puntualmente antes de tratarlo como pendiente — es posible que ya
  esté mitigado.
- **Insight #38 — sin preview de eventos lunares en vista semanal.** Agregar
  un badge/ícono en `CosmicCalendar.tsx` para días con eventos relevantes
  (luna llena, etc.) sin necesitar tap, en la vista semanal (default).
- **Insight #39 — Wiki de baja discoverability, tercera vez.** Ya estaba en
  Prioridad 2 de la ronda de agosto y no se hizo. Sigue pendiente, sube de
  prioridad por repetición (3 fuentes distintas: #13, #21, #39).
- **Hallazgo de datos de la sección 7.5 — anclajes/guiones faltantes en
  rituales persistidos.** Ver acción concreta detallada en 7.5: auditoría de
  `rituals` en producción + backfill o flag de "no exportable", separado de
  la consolidación visual de cards.
- **Limpieza de código muerto — `RitualListCard.tsx` + CSS asociado.** Ver
  7.2/7.4: componente y clases (`.ritual-list-card`, `.ritual-list-meta-chip`)
  sin ningún uso confirmado, candidato a eliminar o documentar.

---

## 14. Preguntas abiertas para Mariana

Decisiones de producto que este plan no puede resolver solo — no van directo
a `mvp-builder` sin su confirmación. (Se quitaron las que ya quedaron
resueltas en las rondas de revisión: el trigger del onboarding de perfil
—primer inicio de la app, no primera entrada al wizard— y los 3 campos que
captura ya están confirmados —sección 11—; las 4 pistas de ambiente ya se
resolvieron como opción secundaria —sección 5—; el estado de la
infraestructura de OTP/SMTP ya está confirmado resuelto —sección 1—; y el
pedido de la sección 7 ya quedó reencuadrado como consistencia visual, no
como audit de datos.)

1. **¿Cuántas pantallas finales para el flujo de creación?** Este plan
   propone una dirección (4.2-4.5: de 6 a 3-4 pantallas) pero el número
   exacto y qué campos quedan agrupados en la misma pantalla es una decisión
   de diseño que conviene revisar con mockups antes de que `mvp-builder`
   construya, no solo con este documento.
2. **La mecánica de "juego" de la carta diaria (3.3.1): ¿selección de un
   mazo, revelado progresivo del texto, o combinar las dos?** Este plan deja
   las dos opciones concretas sobre la mesa y recomienda combinarlas, pero
   no cierra la decisión final — conviene resolverlo con mockup/prototipo
   rápido antes de construir la animación.
3. **La carta de intención diaria: ¿reemplaza también la captura de
   `inicioFeeling`, o ese dato se sigue pidiendo aparte después de revelar la
   carta?** Afecta directamente cuánto UI hay que tirar vs. envolver.
4. **PDF (sección 6): ¿frontend o backend?** Este plan recomienda arrancar
   por frontend (más rápido, sin nueva infraestructura) pero requiere
   instalar una librería nueva (`jsPDF`/`react-pdf` o similar, ninguna está
   en el repo hoy) — confirmar antes de agregar la dependencia.
5. **Perfil de usuario — campo de género (sección 11.2): ¿afecta el copy
   generado o no?** Ya está confirmado que el dato se captura. Lo que falta
   definir es si se usa para que la IA genere el guion con género gramatical
   dirigido a la persona (lo que requeriría cambiar la regla vigente de
   `VOICE.md`, "Sin género gramatical", abril 2026 — decisión explícita, no
   un ajuste técnico silencioso) o si se guarda para otro uso (trato en UI de
   cuenta, clasificación interna) sin tocar el contenido generado.
6. **Diario de Anclas — pasos `Momento`/`Cierre`: ¿rediseño de fondo (log
   libre de voz, y resolver la asimetría de persistencia con `Inicio`) o
   solo el ajuste liviano de la sección 8?** Este plan recomienda el ajuste
   liviano ahora y tratar el rediseño de fondo como su propia iniciativa —
   confirmar si eso es aceptable dado que es la cuarta fuente que lo señala
   como confuso.
7. **Aviso de "esto regenera el audio" al editar el guion después de haberlo
   escuchado (sección 4.5).** ¿Alcanza con un aviso de copy, o conviene
   directamente bloquear la edición del guion una vez que el audio ya se
   generó, para evitar audios desactualizados sirviéndose por error?
8. **Confirmación del anclaje en el cierre (9.4): si el usuario no lo
   confirma en el momento, ¿dónde se le vuelve a ofrecer confirmarlo más
   tarde?** (¿Notificación in-app la próxima vez que abre la app, recordatorio
   en Home, o se deja como dato incompleto sin insistir?)
9. **Alcance real de la fase de perfil (sección 11) para esta ronda vs. la
   siguiente.** Este plan propone una v1 acotada (11.3) y deja el filtro
   agéntico como visión de largo plazo (11.4) explícitamente fuera de
   construir ahora — confirmar que ese corte es el que Mariana tenía en
   mente.
10. **Willingness-to-pay (sección 10): ¿"segunda generación de voz guiada" es
    el gatillo correcto, o prefiere algo más simple (ej. directamente después
    de la primera vez, aceptando la tensión con el insight #34 que este plan
    señaló como motivo para no ponerlo en el cierre)?**
11. **Consolidación de cards (sección 7.3/7.4): ¿se aborda como paso previo
    a 4.4/6.1, o se puede lanzar el formato receta/PDF primero y consolidar
    las cards de descubrimiento después?** Este plan recomienda hacerlo
    antes o junto, para no sumar un cuarto lenguaje visual a los tres que ya
    conviven — confirmar si el orden de prioridad tiene sentido dado el
    resto del roadmap.

---

## 15. Orden de ejecución sugerido para `mvp-builder`

1. **Quick wins de la sección 13** — son independientes, chicos, y varios son
   bugs reales (no solo pulido). Arrancar por acá no bloquea nada del
   rediseño y da resultados rápidos. Incluye corregir el bug de
   instrumentación de `ritual_completed` duplicado (sección 9.2), que es
   prerequisito de la sección 9, y el fix puntual de OTP (sección 13,
   primer ítem).
2. **Sección 10 (willingness-to-pay)** — chica y autocontenida (solo UI +
   eventos nuevos, sin infraestructura de pago real ni dependencias de otras
   secciones). Se puede tomar temprano en paralelo a cualquier otra cosa.
3. **Sección 5 (reproducción)** — el cambio más chico y aislado del rediseño
   grande: sacar jerarquía del toggle guiado/ambiente, sacar el control
   duplicado de reinicio. No depende de tocar el wizard.
4. **Sección 9 (feedback + tracker de cumplimiento)** — depende del fix de
   instrumentación (paso 1) y de las columnas nuevas en `rituals`
   (`rituales-backend`, sección 9.3). Es trabajo cruzado entre los dos repos:
   arrancar por el backend (migración + endpoint), después conectar el
   frontend.
5. **Sección 7.1-7.4 (consolidación visual de cards)** — arranca con decidir
   el destino de `RitualListCard.tsx` (limpieza rápida) y sigue con
   consolidar `RitualGridCard`/`RitualRecommendationCard` en un componente
   compartido. Es prerequisito recomendado de la sección 6 (PDF/receta) para
   no construir un cuarto lenguaje visual — ver pregunta 11 de la sección 14
   si se quiere invertir el orden. El hallazgo de datos de 7.5 es
   independiente y puede tomarse en paralelo como quick win (sección 13).
6. **Sección 6 (receta + PDF)** — depende de la sección 7.1-7.4 (o de
   resolver la pregunta 11 de la sección 14 si se decide invertir el orden)
   y de confirmar con Mariana la pregunta 4 de la sección 14 (frontend vs.
   backend) antes de instalar ninguna librería.
7. **Sección 3 (Home y entrada principal, incluida la carta diaria de 3.3) +
   Sección 4 (rediseño del wizard)** — se recomienda tomarlas juntas porque
   comparten el componente unificado de "contame qué te pasa" (4.2 = 3.2).
   La carta diaria (3.3) además requiere la tabla nueva
   `daily_intention_cards` y su endpoint en `rituales-backend` (3.3.3) antes
   de poder construirse de verdad — no depende del resto de la sección 3/4,
   se puede secuenciar el trabajo de backend en paralelo. Requiere confirmar
   con Mariana las preguntas 1, 2 y 3 de la sección 14 antes de arrancar la
   construcción real (mockups o al menos acuerdo de cuántas pantallas
   finales, mecánica exacta del juego, y qué pasa con `inicioFeeling`).
8. **Sección 8 (ajuste liviano de Momento/Cierre del Diario de Anclas)** —
   independiente del resto, se puede tomar en paralelo o después.
9. **Sección 11 (perfil y personalización) — su propio milestone, al final,
   no en paralelo con lo anterior.** Depende de resolver primero la pregunta
   5 de la sección 14 (tensión con `VOICE.md` sobre género) y requiere
   trabajo de `rituales-backend` (tabla nueva + RLS + endpoint) antes de que
   haya ninguna UI de onboarding de perfil que construir. Empezar por 11.3
   (v1 acotada) exclusivamente — 11.4 (filtro agéntico) no se planifica en
   detalle todavía. El mecanismo genérico de "sync de draft local al
   loguearse" que necesita esta sección conviene construirlo pensando
   también en el consumidor de la sección 3.3.3 (carta diaria anónima).
