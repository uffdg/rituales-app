# UX resto flujo completo septiembre 2026

Estado: borrador para revisión

## Problema y evidencia

El plan `iteracion-flujo-completo-septiembre-2026` concentra la fricción en demasiadas decisiones antes de llegar al valor. El feedback #27, #28, #29 y #32 pide entrada más clara, menos lectura obligatoria y reproducción/cierre con menos bifurcaciones.

## Propuesta

### Home

Referencia: `Home.tsx`, `TodayContextCard`, `editorial-page-sheet`.

- Mantener el hero cósmico como contexto, pero agregar en la primera hoja blanca un bloque principal de entrada antes del Diario.
- Copy permanente: `Contame qué te pasa y armamos un ritual concreto para este momento.`
- CTA primario: `Crear desde lo que me pasa`.
- CTA secundario: `Explorar rituales`.
- Usar `editorial-card-elevated`, `editorial-title-section`, `editorial-body-muted`, `editorial-action-button-primary`.

### Diario como carta

Referencia: `PopularCarousel` para `motion` + escala suave.

- El paso Inicio se muestra como carta boca abajo hasta que la persona toca `Revelar carta`.
- El reverso usa fondo `var(--ink-strong)`, eyebrow `Carta de hoy`, y la intención generada.
- Si todavía no hay intención, la carta muestra micrófono/texto de entrada debajo, no encima.
- Estados: bloqueado futuro, pasado sin datos, cargando intención, carta revelada, día completo.

### Cierre del ritual

Referencia: hoja de audio de `RitualDetail.tsx`.

- Al terminar audio, la hoja no se queda en play: pasa a una pantalla de cierre.
- Mostrar `Ritual completado`, el anclaje real siempre visible, un checkbox/toggle `Confirmé mi anclaje`, y textarea opcional `¿Qué te dejó este ritual?`.
- CTA: `Guardar cierre`.
- Si no hay ritual persistido, guardar estado local y trackear igual.

### Perfil v1

Referencia: `Account.tsx`.

- No agregar onboarding largo todavía. En esta ronda, usar Cuenta como primer perfil editable.
- Agregar un bloque `Cómo querés que te acompañe la app` con 3 chips persistidos en localStorage: tono, momento del día, foco actual.
- Mantenerlo debajo del nombre para no bloquear el uso.

## Microcopy

- Home: `Contame qué te pasa y armamos un ritual concreto para este momento.`
- Carta: `Elegí revelar la intención de hoy.`
- Cierre: `Que no quede solo en la escucha. Llevá una acción pequeña a la vida real.`
- Perfil: `Esto ayuda a ordenar futuras recomendaciones. Podés cambiarlo cuando quieras.`
