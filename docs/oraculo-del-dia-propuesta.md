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
- **Se puede volver a pedir** ("Pedir otra intención"): vuelve al campo con
  lo que había escrito, para ajustarlo o pedir otra versión. Todas quedan
  guardadas; Home muestra la última del día. Si algo falla, se vuelve al
  campo con el texto intacto.
- Sin sesión: se ve la pregunta y el botón lleva a `/login`.

## 2. Oráculo del día

**Para qué:** la persona saca una carta y recibe un arcano con una mirada
sobre el día y un consejo, sin escribir nada.

- Mazo boca abajo → "Sacar una carta" → abanico de 3 → elige una → gira y se
  revela. Con `prefers-reduced-motion`, fundido simple.
- El mazo son los **22 arcanos mayores del Rider-Waite**, al derecho
  (`rituales-backend/src/lib/oracle-deck.js`). Cada carta muestra: número
  romano, nombre, tres palabras clave, **La mirada** (lo que el arcano
  produce, una forma de ver el día) y **El consejo**. Texto escrito por el
  equipo, sin IA. Se evitan los arcanos de los últimos 7 días.
- **Una por día** (no se puede volver a sacar); al volver se ve la misma ya
  revelada.
- Sin sesión: el mazo se ve y tocarlo lleva a `/login`.

## 3. Registro diario en el perfil

- En `/cuenta`, arriba de todo: un calendario mensual. Cada día marca con un
  punto si pidió intenciones y con un rombo dorado si sacó su arcano.
- Al tocar un día se ven el arcano (dibujo, nombre, consejo) y todas las
  intenciones de ese día, con la hora y lo que deseaba.
- Desde Home, "Tu registro →" lleva directo ahí (`/cuenta#registro`).

## Ilustraciones

Línea fina dorada (#c9a66b) sobre carbón (#141312), marco en arco y motivos
celestes, siguiendo la referencia visual del equipo:

- Cada arcano tiene su dibujo con el símbolo central de la carta original (la
  balanza de La Justicia, el farol de El Ermitaño, la torre con el rayo…),
  en `src/app/components/arcana/ArcanaArt.tsx`.
- Al revelar, los trazos se dibujan solos y después las estrellas titilan.
- Dorso: arco dorado con órbitas que giran.
- Intención: un cuenco abierto con una estrella que flota; se acelera
  mientras se dicta o se escribe la intención.
- Con `prefers-reduced-motion` todo queda quieto.
- En desarrollo, `/dev/arcanos` muestra los 22 dibujos juntos.

## Qué se elimina

- Pasos `Inicio` / `Momento` / `Cierre`, tabs, barra de progreso, selector de
  horario (9h 14h 19h) y navegación por fechas.
- `MoodPicker`, selector de alineación y "¿Qué aprendiste hoy?".
- `daily-anchor.ts`, `anchor-service.ts` y el borrador local anónimo.
- La sección "Intención de hoy" de `Account.tsx`.

## Cambios técnicos

**Backend (`rituales-backend`)**
- Tablas `daily_intentions` (`input_text`, `intention_text`; varias por
  día) y `daily_oracle_cards` (`card_id`; una por día), con RLS. Reemplazan a `daily_intention_cards`, que nunca llegó a crearse.
- `GET/POST /api/me/daily-intention`: el `POST` recibe `dateKey` e
  `inputText` y escribe la intención con `reframeIntention`.
- `GET/POST /api/me/daily-oracle`: el `POST` recibe `dateKey` y `moonPhase`
  y saca una carta.
- `POST /daily-intention` guarda una intención nueva en cada pedido.
  `POST /daily-oracle` es idempotente: si ya sacó carta ese día, devuelve la
  misma con `created: false`.
- `GET /api/me/daily-records?from=&to=` devuelve los días del rango (máx. 62)
  con sus intenciones y su carta, para el calendario.
- Si la base falla al leer o guardar, la persona igual recibe su intención o
  su arcano (`persisted: false`) y el error queda en el log.

**Frontend (`rituales-app`)**
- Componentes `DailyIntention`, `OracleCard`, `DailyRecordsCalendar` y
  `arcana/ArcanaArt`, servicio
  `daily-service.ts`, estilos de animación en `src/styles/oracle.css`.
- Analytics: `intention_voice_used`, `intention_written`, `intention_error`,
  `intention_reopened`, `intention_ritual_started`,
  `intention_login_prompted`; `oracle_deck_opened`, `oracle_card_revealed`,
  `oracle_card_reopened`, `oracle_draw_error`, `oracle_login_prompted`.

## Pendiente

- `reframeIntention` cortaba frases por el límite de 80 tokens. Se subió a
  220 y, si igual se pasa, se recorta en la última frase completa. El texto
  del prompt no se tocó.
