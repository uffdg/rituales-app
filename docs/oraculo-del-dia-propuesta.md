# Intención del día + Oráculo del día

Estado: implementado en la branch `intencion-y-oraculo` (ambos repos), 19 oct 2026.

Reemplaza el Diario de Anclas (`Inicio` / `Momento` / `Cierre`) de Home con
dos features independientes, una debajo de la otra.

## Por qué

- El diario pedía demasiado: dictar, guardar, volver a las 14 h a calificar
  alineación, volver a las 19 h a escribir un aprendizaje, y un selector de
  sentimiento en cada paso. Tres tareas por día para obtener una frase.
- Nadie lo entendía sin explicación en vivo (feedback #18, #26).
- La tabla que usaba nunca se había creado en producción, así que además
  estaba roto.
- Una primera versión juntaba la intención y la carta en un solo flujo. Se
  separaron porque son dos cosas distintas: una intención clara a partir de
  lo que la persona desea, y una carta de oráculo que no pide nada.

## 1. Intención del día

**Para qué:** la persona dice qué desea hoy y recibe una intención clara para
llevar durante el día.

- "¿Qué deseás hoy?" con un campo de texto y un botón "Hablar" para dictar
  (si el navegador lo soporta).
- "Recibir mi intención" → el backend la escribe con el prompt existente de
  `reframeIntention` (sin cambios).
- Resultado: la intención, lo que la persona deseaba, y debajo
  "Llevate esta intención durante el resto del día. Pensala y releela."
- "Hacer un ritual con esta intención" abre la creación de ritual con la
  intención precargada.
- Una por día. Al volver a abrir la app ese día se ve la misma. Si algo
  falla, se vuelve al campo con el texto intacto.
- Sin sesión: se ve la pregunta y el botón lleva a `/login`.

## 2. Oráculo del día

**Para qué:** la persona saca una carta y recibe un mensaje de oráculo, sin
escribir nada.

- Mazo boca abajo → "Sacar una carta" → abanico de 3 → elige una → gira y se
  revela. Con `prefers-reduced-motion`, fundido simple.
- La carta trae: nombre (p. ej. **La Pausa**), una ilustración lineal animada
  de su símbolo, el mensaje, un "Gesto de hoy" concreto y la fase lunar.
- Todo el texto es del **mazo curado** de 32 cartas
  (`rituales-backend/src/lib/oracle-deck.js`), escrito por el equipo. No
  usa IA. La fase lunar triplica el peso de las cartas afines y se evitan las
  de los últimos 7 días.
- Una por día; al volver se ve la misma ya revelada.
- Sin sesión: el mazo se ve y tocarlo lleva a `/login`.

## Ilustraciones

Líneas finas animadas, en el mismo lenguaje que las elipses de
"Día completado":

- Intención: un cuenco abierto con una estrella que flota; se acelera
  mientras se dicta o se escribe la intención.
- Dorso de las cartas: órbitas que giran en sentidos opuestos y un punto que
  respira.
- Frente de la carta: el símbolo de la carta se dibuja en grande, con una
  luna que flota y el horizonte. Usa el ícono lineal de cada símbolo; se
  pueden reemplazar por ilustraciones a medida de a una.
- Con `prefers-reduced-motion` todo queda quieto.

## Qué se elimina

- Pasos `Inicio` / `Momento` / `Cierre`, tabs, barra de progreso, selector de
  horario (9h 14h 19h) y navegación por fechas.
- `MoodPicker`, selector de alineación y "¿Qué aprendiste hoy?".
- `daily-anchor.ts`, `anchor-service.ts` y el borrador local anónimo.
- La sección "Intención de hoy" de `Account.tsx`.

## Cambios técnicos

**Backend (`rituales-backend`)**
- Tablas `daily_intentions` (`input_text`, `intention_text`) y
  `daily_oracle_cards` (`card_id`), una fila por persona por día cada una,
  con RLS. Reemplazan a `daily_intention_cards`, que nunca llegó a crearse.
- `GET/POST /api/me/daily-intention`: el `POST` recibe `dateKey` e
  `inputText` y escribe la intención con `reframeIntention`.
- `GET/POST /api/me/daily-oracle`: el `POST` recibe `dateKey` y `moonPhase`
  y saca una carta.
- Los dos `POST` son idempotentes: si ya hay fila ese día, la devuelven con
  `created: false`.

**Frontend (`rituales-app`)**
- Componentes `DailyIntention` y `OracleCard`, servicio `daily-service.ts`,
  estilos de animación en `src/styles/oracle.css`.
- Analytics: `intention_voice_used`, `intention_written`, `intention_error`,
  `intention_reopened`, `intention_ritual_started`,
  `intention_login_prompted`; `oracle_deck_opened`, `oracle_card_revealed`,
  `oracle_card_reopened`, `oracle_draw_error`, `oracle_login_prompted`.

## Pendiente

- `reframeIntention` tiene un límite de 80 tokens de salida y con deseos a
  veces escribe más de dos frases y se corta. No se tocó porque el prompt ya
  estaba definido; conviene revisarlo.
