# RitualDetail · Anclaje real siempre visible

Estado: borrador para revisión

## Problema / evidencia

En `RitualDetail`, el bloque negro `TU ANCLAJE REAL` puede mostrar el fallback genérico:

> Elegí una acción concreta y pequeña para llevar este ritual a tu vida real.

Mariana reporta que ese texto aparece en lugar del anclaje real del ritual: "el anclaje real debería mostrarse siempre y no este dialogo".

Esto contradice un principio de producto ya validado: el anclaje real es el diferencial más fuerte de Rituales y tiene que quedar último, visible y concreto. Está respaldado por `guidelines/feedback-log.md` insight #4, insight #11, y `guidelines/rituales_origen.md`: el anclaje concreto al final "estaba escondido" y debe ser más visible.

## Propuesta UX/UI

El bloque `TU ANCLAJE REAL` debe seguir siendo el cierre visual del ritual: fondo `var(--ink-strong)`, texto blanco, después de las secciones del ritual y antes de metadata/acciones secundarias. No bajarlo de jerarquía ni moverlo arriba del cuerpo del ritual: su fuerza está en funcionar como último paso accionable.

Comportamiento esperado:

1. Si el ritual tiene `anchor` real no vacío, mostrar siempre ese texto.
2. El fallback no debe reemplazar silenciosamente un anclaje que debería existir.
3. Para rituales propios o guardados generados por el usuario, la ausencia de `anchor` debe tratarse como dato incompleto, no como copy normal.
4. Para rituales públicos/curados, no publicar ni mostrar cards que lleguen a `RitualDetail` sin anclaje real. Si por error falta, mostrar estado de dato incompleto.

## Fallback

Usar fallback solo cuando el dato falta de verdad después de normalizarlo (`null`, `undefined`, string vacío o solo espacios).

Copy propuesto para el fallback visible:

**Eyebrow:** `ANCLAJE PENDIENTE`

**Texto:** `Este ritual todavía no tiene un anclaje real. Volvé a editarlo para cerrar la práctica con una acción concreta.`

Notas de tono:

- Directo, rioplatense y accionable.
- No usar "diálogo", "IA", "sistema" ni explicaciones técnicas.
- No usar el fallback actual porque suena como instrucción genérica de creación y puede confundirse con el contenido final del ritual.

## Estados

Estado feliz:

- El bloque mantiene el eyebrow `TU ANCLAJE REAL`.
- El texto mostrado es el `anchor` real del ritual.
- El bloque es el último contenido fuerte de la pantalla.

Dato incompleto:

- El bloque mantiene el mismo peso visual oscuro para no esconder el problema.
- Cambia el eyebrow a `ANCLAJE PENDIENTE`.
- Muestra el fallback propuesto.
- Si el ritual es propio/editable, la acción primaria disponible debe permitir volver a editar el ritual.

Carga:

- No mostrar fallback mientras el ritual está cargando.
- Mantener el estado de carga general de `RitualDetail`.

Error:

- Si falla la carga del ritual, usar el error general existente de `RitualDetail`.
- No mostrar el bloque de anclaje sin datos del ritual.

## Referencia visual

Reusar el patrón actual del bloque de anclaje en `RitualDetail`: `border border-[var(--ink-strong)] bg-[var(--ink-strong)]`, texto con `var(--font-sans-ui)`, eyebrow uppercase de 10px con tracking editorial.

No introducir un componente visual nuevo. El cambio es de comportamiento, jerarquía de estado y copy.

## Criterio de aceptación

- En un ritual con `anchor` guardado, `TU ANCLAJE REAL` muestra exactamente ese anclaje y nunca el texto genérico actual.
- El texto `Elegí una acción concreta y pequeña para llevar este ritual a tu vida real.` ya no aparece en `RitualDetail`.
- Un `anchor` vacío, `null`, `undefined` o compuesto solo por espacios activa `ANCLAJE PENDIENTE`.
- El fallback solo aparece para datos incompletos; no se usa como contenido normal del ritual.
- El bloque de anclaje sigue siendo el último bloque visual fuerte del ritual y queda visible antes de la barra inferior de acciones.
- No hay cambios de estilo fuera del bloque de anclaje.
