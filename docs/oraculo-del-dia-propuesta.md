# Oráculo del día — rediseño completo del Diario de intenciones

Estado: aprobada e implementada (19 oct 2026). Las decisiones abiertas se cerraron al final del documento.

Reemplaza el flujo completo del Diario de Anclas (`Inicio` / `Momento` /
`Cierre`) en `Home.tsx`. No extiende `docs/ux-carta-del-dia-diario-intenciones.md`:
lo sustituye.

## Por qué

- El flujo actual pide demasiado: dictar por voz, guardar, volver a las 14 h a
  calificar alineación, volver a las 19 h a escribir un aprendizaje, más un
  selector de sentimiento en cada paso. Tres tareas por día para obtener una
  frase.
- Nadie lo entiende sin explicación en vivo (feedback #18, #26), y el texto
  generado sale genérico (#17).
- Mezcla dos sistemas de guardado (`daily_intention_cards` por backend y
  `daily_anchor_entries` directo a Supabase). El error "Todavía no pudimos
  actualizar tus guardados" sale del segundo.

## La idea en una frase

Cada día sacás **una carta** de un mazo. La carta es tu intención del día y te
acompaña en la app hasta la noche. Una sola interacción, nada que completar.

## Flujo

### 1. Primera vez en el día: contar y sacar la carta

- En Home, en el lugar del diario actual: "¿Qué deseás hoy?" con un campo de
  texto y un botón para dictar por voz (si el navegador lo soporta).
- "Elegir mi carta" abre el mazo en abanico con 3 cartas → elegís una → gira y
  se revela. Mientras gira, el backend arma la intención con lo que contaste.
  Con `prefers-reduced-motion`, fundido simple.
- Debajo de la carta: "Llevate esta intención durante el resto del día.
  Pensala y releela."
- La carta queda fija para el día (si recargás, ves la misma carta ya
  revelada). Si algo falla, volvés al campo con tu texto intacto.

### 2. La carta

Cada carta tiene cuatro partes, en este orden de lectura:

| Parte | Ejemplo | Para qué |
|---|---|---|
| Nombre / arquetipo | **La Pausa** | Lo que se recuerda; le da carácter de oráculo |
| Intención (1ª persona) | "Hoy me doy permiso para ir más lento." | La intención en sí |
| Gesto concreto | "Antes de cada reunión, tres respiraciones." | Responde a #17: algo que se puede hacer |
| Símbolo + fase lunar | ícono + "Luna creciente" | Conecta con el contexto que ya muestra Home |

Acción secundaria debajo: **"Hacer un ritual con esta intención"** → abre el
flujo de creación con la intención precargada. Así la carta alimenta el núcleo
de la app (rituales + audio guiado) en vez de ser una isla.

### 3. Durante el día: la carta vive en Home

- Revelada, la carta queda arriba de Home hasta el día siguiente, sin pedir
  nada: ni horarios, ni bloqueos, ni progreso 0/3, ni preguntas.
- Al volver a abrir la app ese día, se ve la misma carta ya revelada.

## Qué se elimina

- Pasos `Inicio` / `Momento` / `Cierre`, tabs y barra de progreso.
- Selector de horario (● 9h 14h 19h) y bloqueos por hora.
- Dictado por voz y `reframeIntention` en este flujo.
- `MoodPicker` (7 sentimientos) y selector de alineación (5 niveles).
- Escritura de "¿Qué aprendiste hoy?".
- Uso de `daily_anchor_entries` / `anchor-service.ts` / `daily-anchor.ts` en Home.

## De dónde sale el contenido de la carta

- **Intención:** de lo que contó la persona, con el prompt existente de
  `reframeIntention` (sin cambios).
- **Nombre y símbolo:** del mazo curado de 32 cartas
  (`rituales-backend/src/lib/oracle-deck.js`). La fase lunar triplica el peso
  de las cartas afines y se evitan las de los últimos 7 días.
- **Gesto:** Claude Haiku lo escribe a partir de lo que contó la persona, leído
  a través del sentido de la carta. Corre en paralelo con la intención; si
  falla o tarda más de 6 s, sale el gesto curado de la carta.

## Cambios técnicos

**Backend (`rituales-backend`)**
- Mazo en `src/lib/oracle-deck.js` (32 cartas; la fase lunar triplica el peso
  de las cartas afines y se evitan las de los últimos 7 días).
- `generateOracleGesture` en `src/lib/claude.js` para el gesto personalizado.
- `daily_intention_cards`: columnas nuevas `card_id`, `gesture` e `input_text`.
  `intention_text` guarda la intención de la carta; `feeling` queda en desuso.
- `POST /api/me/daily-card` saca la carta (recibe `dateKey`, `inputText` y
  `moonPhase`); guarda también `input_text`.
  Idempotente: si ya hay una ese día, la devuelve.
- `GET /api/me/daily-card` devuelve la carta completa (nombre, símbolo,
  intención, gesto). Se elimina `PATCH`.

**Frontend (`rituales-app`)**
- Componente `OracleCard` (mazo, abanico, revelado, carta abierta) en lugar del
  bloque `#daily-anchor` de `Home.tsx` (de ~1.850 a ~560 líneas).
- Se eliminan `daily-anchor.ts`, `anchor-service.ts` y el borrador local de
  `daily-card-service.ts`.
- Analytics: `oracle_deck_opened`, `oracle_card_revealed`,
  `oracle_card_reopened`, `oracle_ritual_started`, `oracle_draw_error`,
  `oracle_login_prompted`.

## Decisiones tomadas

1. Contenido: **la persona cuenta cómo llega antes de recibir la intención**,
   y la intención se arma con el prompt de `reframeIntention`. Del mazo curado
   salen el nombre y el símbolo; el gesto lo escribe la IA (ver arriba).
2. **Requiere login.** Sin sesión, el mazo se ve pero tocarlo lleva a `/login`.
3. **La carta no pide nada nunca.** Se elimina la pregunta de la noche
   ("¿Viviste tu carta hoy?") y la columna `lived`.
4. **Solo en Home.** No hay mini-carta en `Layout`. También se quitó la
   sección "Intención de hoy" de `Account.tsx`, que mostraba el recorrido
   Inicio/Momento/Cierre.

Ajustes respecto de la propuesta: no hay `PATCH /api/me/daily-card`, y el
mazo evita repetir las cartas de los últimos 7 días.
