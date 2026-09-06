# Carta de hoy · Diario de Anclas (paso Inicio)

Estado: borrador para revisión

## Problema / evidencia

El "diario de intenciones" (paso `Inicio` del Diario de Anclas) no se entiende
sin que alguien lo explique en vivo — confirmado por **cuatro fuentes
independientes** en `guidelines/feedback-log.md`:

- #18: Mariana, moderando en vivo, tiene que aclarar "eso que no se entendía
  al principio es para generar una intención diaria... pero claramente no se
  está entendiendo".
- #26: cuarta fuente (Agustín, cofundador). Ni siquiera él entiende qué acaba
  de completar. Mariana: "no se entiende este flujo y eso ya lo sé."
- #17: el texto de reencuadre sale "genérico y no resuena" — una usuaria
  esperaba algo concreto ("tomate un tecito, salí afuera, respirá") y recibió
  una frase poética abstracta.
- #28 (transversal): demasiadas decisiones/pasos generan ansiedad — cualquier
  solución acá no puede agregar fricción nueva (modales, pasos extra) para
  "explicar" la feature.

El diagnóstico y la propuesta de fondo ya están en
`docs/iteracion-flujo-completo-septiembre-2026.md` sección 3.3 (carta tipo
oráculo/tarot en vez de formulario) — este documento cierra las dos preguntas
abiertas que esa sección dejó pendientes (14.2 y 14.3) y agrega el diseño de
la explicación en la interacción misma, que es el problema central de #18/#26
y que la sección 3.3 no resolvía todavía.

**Implementación parcial ya en `Home.tsx` (sin commitear) revisada antes de
proponer esto:** hoy hay un solo tap (`onClick={() => setIsDailyCardRevealed(true)}`,
líneas ~1160-1211) que revela todo el texto de una vez — ni mazo ni revelado
progresivo — sin ninguna línea de copy que explique qué es la "Carta de hoy"
antes de tocarla, y con el selector de sentimiento (`MoodPicker`) visible
todo el tiempo, incluso antes de revelar. No resuelve #18/#26: sigue siendo
una animación sin propósito explicado. Este spec reemplaza esa interacción,
no la extiende.

**Bugs de estado detectados al leer el código, a corregir como parte de esta
tarea (no son el foco pedido pero rompen el mismo patrón que #23/OTP — error
invisible):**

1. `handleMic` → `reframeIntention` no tiene `catch`. Si la llamada falla,
   `generatedIntention` queda `null` para siempre, sin ningún mensaje — el
   usuario dictó y no pasa nada visible. Ver estado "Reencuadre fallido" abajo.
2. `isDailyCardRevealed` es estado de React efímero, no se hidrata desde lo
   ya guardado (`dailyAnchorContent.inicio`). Si alguien ya completó `Inicio`
   hoy y vuelve a esa pestaña en la misma sesión tras un reload, o en otra
   sesión, no ve su carta — ve el mic vacío de nuevo. Esto rompe directamente
   el requisito 3.3.2 ("si vuelve a abrir la app más tarde ese mismo día...
   tiene que ver la misma carta ya revelada"). Ver estado "Carta ya revelada
   hoy" abajo.
3. `MoodPicker` de `inicio` se renderiza siempre, incluso con la carta boca
   abajo — pide una reacción a algo que la persona todavía no vio.

## Decisiones (a) — Mecánica de juego: mazo + revelado progresivo, combinados

Se cierra la pregunta abierta #2 de la sección 14: **combinar A+B**, tal como
recomendaba (sin cerrar) el plan original, con un alcance acotado a propósito
para no construir algo "excesivamente complejo" (mismo criterio que ya usaba
el documento).

**Punto de partida importante:** el contenido detrás de la carta es un único
texto (`generatedIntention`, salida de `reframeIntention`). El mazo **no
genera 3 lecturas distintas** — sería costoso (3 llamadas a IA), y además
generaría una nueva confusión: "¿por qué la carta 2 me dice algo distinto a
lo que yo conté?". Las 3 cartas del mazo son 3 posiciones con el mismo dorso;
cualquiera que se elija revela el mismo texto. Es el mismo principio que un
mazo de tarot físico tirado por una sola persona: elegís una carta de un
despliegue, no "generás" el despliegue a medida.

**Secuencia exacta:**

1. Igual que hoy: mic/texto libre → `Escuchando...` → `Construyendo tu
   intención...` (loader existente, sin cambios).
2. Cuando `generatedIntention` está listo, en vez de la carta única tocable
   de hoy, aparecen **3 cartas boca abajo en abanico** (mismo dorso que la
   carta no revelada actual: `linear-gradient(145deg, #f8f9fa, #eceeef)`,
   `border-soft`, `radius-card`). Layout: carta central un poco más grande y
   adelante (`scale(1.04)`, `z-index` mayor), las dos laterales con
   `rotate(-6deg)`/`rotate(6deg)` y `translateY(6px)`, mismo patrón de
   interpolación de `scale`/`opacity` que ya usa `PopularCarousel.tsx` — no
   hace falta drag, son estáticas, solo tap.
3. Tap en cualquiera de las 3 → esa carta hace `rotateY` de 0 a 180 con
   `perspective`/`backfaceVisibility: hidden` (`transition-spring`, ~450-550ms,
   mismo lenguaje de movimiento que ya usa `motion/react` en el resto de la
   app). Las otras dos **no se revelan**: se desvanecen (`opacity → 0`,
   `scale → 0.92`, ~250ms, con 80ms de stagger entre ellas) mientras la
   elegida gira. No hay "carta ganadora vs. perdedora" en el copy — solo se
   van, sin mensaje, como en un tarot real donde el resto del despliegue
   vuelve al mazo.
4. Apenas termina el flip, el texto **no aparece de una** — se revela en
   2-4 tramos cortos (por oración/coma, o en tercios si el texto no tiene
   puntuación intermedia), cada tramo con blur-to-clear + fade
   (`filter: blur(6px)→blur(0)`, `opacity 0→1`), ~150-200ms por tramo con un
   pequeño stagger. Duración total del revelado de texto: ~700-900ms. No es
   word-by-word (se ve gimmick y lento) — es por frase/tramo.
5. Terminado el revelado, aparece debajo (fade+slide corto) el bloque de
   reacción de sentimiento — ver decisión (b).

**Accesibilidad / `prefers-reduced-motion`:** si está activo, saltar el flip
y el revelado por tramos — mostrar directamente la carta elegida con un
cross-fade simple de ~150ms. No es opcional, es requisito de estado (ver
tabla de estados).

**Un mazo por día, no por sesión:** el mazo de 3 solo se muestra una vez por
`date_key` (el momento entre "ya until tengo `generatedIntention`" y "ya
elegí una carta"). Una vez elegida, esa elección queda fija para ese día —
no hay forma de "volver a tirar" ni de ver las otras dos cartas después,
ni ese mismo día ni en visitas futuras a esa fecha. Esto es consistente con
3.3.2 (una carta por día) y con el mismo mecanismo pedido para
`daily_intention_cards` en 3.3.3 — la elección de posición no se persiste
como dato de negocio (no importa cuál de las 3 se tocó para nada del
producto), solo su resultado: el texto ya revelado. La posición elegida sí
es útil como dato de analítica (ver sección d) aunque no tenga efecto en
el producto.

## Decisiones (b) — `inicioFeeling`: se mantiene, pero se pide después de revelar, como reacción a la carta

Se cierra la pregunta abierta #3. **No se absorbe ni se elimina** — sigue
siendo un campo real (`feeling`, ya mapea a `daily_intention_cards.feeling`
según 3.3.3, y hoy es parte de lo que exige `canCompleteSelectedStep` para
poder guardar `Inicio`). Lo que cambia es el momento y el marco:

- El `MoodPicker` de `inicio` **no se monta mientras el mazo está boca
  abajo ni durante el flip/revelado**. Aparece recién cuando el revelado de
  texto terminó — como el siguiente beat natural de la misma interacción, no
  como un formulario aparte y desconectado.
- El label deja de ser el genérico `¿Cómo te sentís?` (que sí tiene sentido
  en `Momento`/`Cierre`, donde no hay una carta a la que reaccionar) y pasa a
  `¿Cómo te deja esta carta?` — mismo componente `MoodPicker`, mismas
  `MOOD_OPTIONS`, solo cambia el prop `label` para esta instancia. Esto
  además refuerza el propósito: la persona entiende que está reaccionando a
  lo que acaba de leer, no llenando un campo suelto.
- El CTA `Guardar inicio` sigue exactamente igual (ya exige
  `generatedIntention && inicioFeeling`, no cambia la condición) — lo que
  cambia es que ahora ese requisito es visualmente obvio en el orden en que
  aparece la UI: primero revelás, después reaccionás, después guardás.

## Decisiones (c) — Cómo la interacción explica su propósito sin ayuda en vivo

Este es el problema central de #18/#26. La solución **no es un tutorial ni
un modal** — por #28, agregar una pantalla/paso extra para "explicar la
explicación" reproduciría el mismo patrón de fricción que ya está señalado
como crítico. La explicación vive en copy siempre visible, más una única
línea de refuerzo la primera vez que alguien usa la app.

**1. El copy permanente del paso `Inicio` pasa a nombrar el mecanismo
completo, no solo pedir el input:**

`STEP_COPY.inicio` hoy (`intro`/`title`/`body`) no dice para qué sirve ni qué
pasa con la intención después. Nueva versión:

- `intro` (línea chica sobre el título, `editorial-eyebrow`-like, ya existe
  el elemento): `"Así arranca tu Diario de Anclas."`
- `title` (sin cambios, ya es directo): `"Contame sobre tu día"`
- `body`: `"Con lo que digas armamos la carta de tu intención. Volvés a ella
  a la tarde en Momento y a la noche en Cierre."`

Esa última frase es la que falta hoy en todo el flujo: nombra explícitamente
que esto no termina en la carta — es el hilo que conecta los tres pasos. Es
exactamente lo que Mariana tuvo que explicar en vivo en la sesión de #18 y
lo que Agustín no entendió en #26.

**2. Copy del mazo (siempre visible, corto, no es un tutorial):**

Arriba de las 3 cartas boca abajo: `"Elegí una carta."` — corto, funciona
como instrucción de juego, no como explicación. Debajo del mazo, más chico
y en `editorial-meta`/`ink-subtle` (mismo peso que metadata secundaria en
el resto de la app): `"Revela la intención que armamos con lo que
contaste."` — aclara, sin ser intrusivo, que las 3 cartas no son 3
resultados distintos (evita la confusión de "por qué me tocó justo esta").

**3. Único micro-momento de refuerzo, solo la primera vez que alguien usa
el Diario de Anclas (no cada día):**

Cuando no hay ningún registro histórico en `rituales_daily_anchor_v1` (osea,
la persona nunca completó ni un solo paso, en ningún día — detectable en
frontend sin backend nuevo), se agrega **una línea extra**, debajo del botón
de mic, antes de la primera dictada:

`"Vas a hacer esto tres veces por día: una carta a la mañana, un chequeo a
la tarde, un cierre a la noche."`

Esta línea desaparece para siempre después de la primera vez que se completa
`Inicio` (se detecta con la misma condición de "sin historial" — no hace
falta una key nueva de `localStorage`, alcanza con que `getDailyAnchorJourney`
para cualquier fecha pasada tenga `completedCount > 0` en algún día, o que
`daily_anchor_entries`/`daily_intention_cards` remoto tenga alguna fila para
ese usuario). No es un dismiss manual, no es un modal, no bloquea nada — es
una frase que se lee o no se lee, consistente con el principio de #28 de no
agregar decisiones.

**4. La carta ya revelada, cuando se vuelve a ver (mismo día u otro), sigue
mostrando el eyebrow `Carta de hoy` siempre** — ese label evergreen (ya
existe) es en sí mismo parte de la explicación pasiva: refuerza con
repetición diaria que esto es "una carta, todos los días", el mismo
principio de reconocimiento que un horóscopo diario o Wordle, sin que haga
falta releer una explicación cada vez.

## Estados a cubrir

| Estado | Disparador | Qué se muestra |
|---|---|---|
| Vacío (sin input aún) | Carga inicial del paso `Inicio`, sin `generatedIntention` | Botón de mic/texto existente, `STEP_COPY.inicio` nuevo (ve decisión c.1). Si es la primera vez histórica del usuario (ver c.3), se agrega la línea de refuerzo. |
| Escuchando | Tap en mic | Sin cambios respecto de hoy. |
| Reencuadrando | `onend` del reconocimiento, mientras corre `reframeIntention` | Sin cambios respecto de hoy (`"Construyendo tu intención..."`). |
| **Reencuadre fallido (nuevo)** | `reframeIntention` lanza excepción | Agregar `catch`. Mostrar un bloque corto con tono directo (no técnico): `"No pudimos armar tu carta. Tu texto quedó guardado — probá de nuevo."` + botón `Reintentar` que vuelve a llamar `reframeIntention` con el mismo `transcript` (no obliga a re-dictar). No usar el fallback silencioso de mostrar el texto crudo como si fuera "la carta" en este caso — el fallback actual (`reframed \|\| transcript`) se mantiene solo para el caso de respuesta vacía/no-error, no para excepciones. |
| Mazo visible | `generatedIntention` listo, la persona todavía no eligió carta hoy | 3 cartas boca abajo en abanico (ver decisión a). Copy `"Elegí una carta."` + línea secundaria. |
| Revelando (flip + texto progresivo) | Tap en una carta del mazo | Secuencia de la decisión (a), paso 3-4. Sin interacción posible mientras corre (evitar doble tap). |
| Carta revelada + reacción pendiente | Termina el revelado de texto | Texto completo visible, `MoodPicker` con label `"¿Cómo te deja esta carta?"` aparece, CTA `Guardar inicio` (deshabilitado hasta elegir sentimiento, igual que hoy). |
| **Carta ya revelada hoy (nuevo, corrige bug #2)** | Se vuelve a entrar al paso `Inicio` el mismo día, después de haber elegido carta (mismo reload, otra sesión, u otro dispositivo una vez que exista `/me/daily-card` de 3.3.3) | La carta se muestra **directamente revelada, sin mazo, sin flip, sin revelado progresivo** — el texto completo aparece de una (con un fade simple de entrada). Se hidrata desde `dailyAnchorContent.inicio.text`/`feeling` (local hoy; desde `GET /me/daily-card` cuando exista el endpoint de 3.3.3), no desde el estado `generatedIntention` en memoria, que no sobrevive un reload. |
| Sentimiento ya elegido, revisando | Igual que el estado anterior, más `inicioFeeling` ya set | Chip correspondiente marcado como activo en el `MoodPicker`, CTA muestra el estado ya completado (o navega directo si `Momento` ya está desbloqueado). |
| `prefers-reduced-motion` | Media query activa | Se salta flip y revelado por tramos en todos los estados de arriba — cross-fade de ~150ms directo al contenido final. |
| Día completo (3/3) | `isJourneyComplete` | Sin cambios — el resumen existente ya muestra el texto de `Inicio` entre comillas (líneas 981-985 de `Home.tsx`). |
| Día pasado / futuro | `isPast`/`isFuture` | Sin cambios respecto de hoy. |

## Decisiones (d) — Instrumentación del funnel

No se definen nombres finales de evento (los define quien mantiene la
convención de `track()` en `src/app/lib/analytics.ts`) — se listan los
momentos de la UX donde hay que disparar algo y el contexto útil para cada
uno. El wrapper `track()` ya agrega automáticamente `path`, `ts`,
`session_id`/`user_id` — no hace falta repetirlos en `props`.

1. **Input capturado** (equivalente al ya existente `home_voice_anchor_used`,
   que se dispara en `recognition.onend` con transcript no vacío — se
   mantiene). Contexto útil: método (`voz` vs. si en el futuro se agrega
   entrada de texto libre), largo del transcript en palabras (no el texto
   completo, por privacidad), si es el primer input histórico del usuario
   (para poder segmentar el funnel de "primera vez" vs. "usuario habitual").
2. **Reencuadre resuelto**, con dos variantes de contexto en el mismo
   momento del código (el `try`/`catch` nuevo):
   - Éxito: duración de la llamada en ms, si `reframed` vino vacío/falsy
     (o sea si se usó el fallback del texto crudo — señal directa para el
     insight #17, útil para saber cuán seguido el reencuadre "no aporta
     nada"), largo en palabras del texto de salida.
   - Fallo: tipo/mensaje de error (sin datos sensibles), si el usuario
     después tocó "Reintentar" o abandonó (esto último se infiere por
     ausencia del siguiente evento, no hace falta loguearlo aparte).
3. **Mazo mostrado** (las 3 cartas boca abajo aparecen). Contexto: si es la
   primera vez histórica que esta persona ve el mazo (mismo criterio que
   c.3), fecha (`date_key`).
4. **Carta elegida** (tap sobre una de las 3). Contexto: posición elegida
   (1/2/3 — de izquierda a derecha; el contenido revelado es siempre el
   mismo, pero la posición es una señal de affordance/sesgo útil sin costo
   de negocio), milisegundos entre "mazo mostrado" y el tap (mide si elegir
   genera duda).
5. **Revelado de texto completado** (termina la animación por tramos, o el
   cross-fade si `prefers-reduced-motion`). Contexto: si corrió en modo
   reducido o completo (para poder comparar tiempos de funnel entre ambos
   sin sesgo).
6. **Sentimiento capturado** (tap en un chip del `MoodPicker` de `inicio`,
   post-revelado). Contexto: el `feeling` elegido (mismo dato que ya se
   persiste en `content.feeling`, no es nuevo exponerlo en analítica),
   milisegundos entre "revelado completado" y esta selección.
7. **Inicio guardado** (tap en `Guardar inicio`, ya dispara el `toast`
   existente — agregar el evento acá). Contexto: `date_key`, si hubo reintento
   de reencuadre en el camino (booleano, derivable de si se emitió el evento
   de fallo antes en la misma sesión para esta fecha).
8. **Carta ya revelada al reabrir** (estado "Carta ya revelada hoy" de la
   tabla de arriba, cuando se hidrata desde datos persistidos en vez de
   generarse en la sesión). Contexto: si es la misma sesión (reload) o una
   sesión nueva — sirve para medir cuánta gente vuelve a revisar su carta
   más tarde en el día, que es justo la señal de hábito que 3.3.2 busca
   validar.

**Abandono:** en vez de un evento explícito de "abandonó" (poco confiable —
no siempre hay un `beforeunload` limpio en mobile), calcular el funnel por
ausencia: para cada `date_key`+usuario/sesión, ver hasta qué evento de la
lista de arriba llegó y en cuál se cortó, comparando contra el total de
"mazo mostrado" ese día. Es más robusto que instrumentar cierres de pestaña.
Si más adelante hace falta una señal más fina, se puede agregar un evento
best-effort en el cambio de ruta (`useEffect` de limpieza en `Home.tsx`) con
el último milestone alcanzado como contexto — queda anotado como mejora
futura, no bloqueante para esta ronda.

## Decisiones (e) — Nota para quien ajuste el prompt de `reframeIntention` (insight #17)

No es alcance de este spec rediseñar el prompt, pero el cambio de marco (de
"frase de afirmación" a "carta de tarot/oráculo revelada con un mazo") sí
cambia cuánto puede tolerar de poesía vs. literalidad, y vale dejarlo
anotado para quien lo ajuste en `rituales-backend/src/lib/claude.js`:

- Una carta de tarot **puede** sostener un titular más evocador que una
  frase de coaching genérica — el formato de juego ya comunica "esto es
  simbólico" sin que haga falta que el texto lo compense siendo abstracto.
  Eso da margen para que el texto sea más corto y más concreto sin sentirse
  "plano", porque el ritual de revelado ya aporta la textura.
- Pero el insight #17 sigue siendo válido dentro de ese margen: la usuaria
  no pedía menos poesía porque quisiera prosa de coach — pedía algo
  **accionable y encarnado** (`tomate un tecito, salí afuera, respirá`), que
  es exactamente el rasgo "Encarnado" que ya define `VOICE.md` (habla del
  cuerpo, la respiración, los sentidos) y que el reencuadre actual no está
  cumpliendo.
- Sugerencia concreta para quien toque el prompt: dos líneas en vez de una
  — una frase breve tipo "nombre de carta" (evocadora, corta) seguida de una
  línea concreta y física de qué hacer con eso hoy. El mazo ya resuelve el
  "se siente como juego"; el prompt tiene que resolver el "se siente
  específico a lo que yo conté", que es el gap real de #17.

## Microcopy — validado contra `VOICE.md`

| Texto | Uso | Nota de tono |
|---|---|---|
| `Así arranca tu Diario de Anclas.` | `STEP_COPY.inicio.intro` | Directo, sin tecnología, nombra el mecanismo por su nombre de producto (`Diario de Anclas`, ya vocabulario existente). |
| `Con lo que digas armamos la carta de tu intención. Volvés a ella a la tarde en Momento y a la noche en Cierre.` | `STEP_COPY.inicio.body` | Rioplatense (`volvés`), sin "sistema"/"IA"/"algoritmo", nombra explícitamente el hilo Inicio→Momento→Cierre que hoy nadie entiende. |
| `Elegí una carta.` | Título sobre el mazo | Corto, comando directo — mismo "ritmo fragmentado" que pide `VOICE.md`. |
| `Revela la intención que armamos con lo que contaste.` | Subtítulo del mazo | Aclara sin ser un tutorial; evita "generamos"/"procesamos" (tecnología implícita). |
| `¿Cómo te deja esta carta?` | Label del `MoodPicker` de `inicio` | Pregunta como herramienta central (regla de `VOICE.md`), encarnada a la reacción concreta, no un formulario suelto. |
| `Vas a hacer esto tres veces por día: una carta a la mañana, un chequeo a la tarde, un cierre a la noche.` | Refuerzo solo-primera-vez | Concreto, sin new age, nombra los tres momentos con sus nombres reales de producto. |
| `No pudimos armar tu carta. Tu texto quedó guardado — probá de nuevo.` | Error de reencuadre | Directo, sin jerga técnica ("no pudimos" en vez de "error del servidor"), y transparente sobre qué se perdió (nada). |
| `Reintentar` | Botón del error | Ya es el patrón estándar de CTA de error corto usado en el resto de la app. |

Palabras evitadas explícitamente en todo lo anterior, por estar en la lista
de prohibidas/evitadas de `VOICE.md`: `manifestar`, `vibrar`, `universo`,
`sistema`, `IA`, `procesar`, `generar` (se usa "armar", ya vocabulario
preferido del documento).

## Referencia visual

No se introduce ningún componente/librería nueva. Reusa:

- `motion/react` (`motion`, `AnimatePresence`) — ya en uso en todo `Home.tsx`.
- Patrón de interpolación de `scale`/`opacity`/`filter: blur()` ya existente
  en `PopularCarousel.tsx` como base del abanico de 3 cartas (adaptado a
  estático + tap, no drag).
- Tokens existentes: `--ink-strong`, `--surface-muted`, `--border-soft`,
  `--radius-card`, `.editorial-eyebrow`, `.editorial-meta`, `.editorial-action-button`.
- El dorso de carta ya definido en la implementación parcial actual
  (`linear-gradient(145deg, #f8f9fa 0%, #eceeef 100%)` + `border-soft`) se
  reusa igual para las 3 cartas del mazo — no hace falta un dorso nuevo.

## Criterio de aceptación

- El paso `Inicio` nunca revela contenido con un solo tap sin mazo — siempre
  pasa por elegir una de 3 cartas boca abajo antes del flip.
- El texto revelado aparece en tramos (no todo de una), salvo con
  `prefers-reduced-motion` activo, donde aparece con cross-fade simple.
- El `MoodPicker` de `inicio` no es visible mientras la carta está boca
  abajo o revelándose — aparece recién con el texto ya completo.
- Volver a entrar al paso `Inicio` el mismo día, después de haber elegido
  carta, muestra esa carta ya revelada de inmediato (sin mazo, sin
  animación de flip) — no puede volver a mostrarse boca abajo ni permitir
  elegir otra carta ese día.
- `STEP_COPY.inicio` (intro/title/body) nombra explícitamente que la carta
  se retoma en `Momento` y `Cierre` — ningún copy nuevo introduce
  `sistema`, `IA`, `algoritmo`, `manifestar`, `vibrar` o `universo`.
- Un fallo real de `reframeIntention` (excepción) muestra el estado de error
  con `Reintentar` y conserva el transcript dictado — nunca deja
  `generatedIntention` en `null` sin ningún mensaje visible.
- La línea de refuerzo de primera vez (c.3) solo aparece para usuarios sin
  ningún historial de Diario de Anclas y no vuelve a aparecer después de la
  primera vez que completan `Inicio`.
- Cada uno de los 8 momentos listados en la sección de instrumentación
  dispara un evento con el contexto descripto (nombres finales a definir
  aparte).
