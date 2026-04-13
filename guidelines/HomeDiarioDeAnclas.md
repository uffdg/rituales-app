# Home · Diario de Anclas

Estado actual de la Home mobile en la branch `recurrencia`.

## Objetivo

La Home funciona como:

- hero editorial de contexto diario
- entrada al hábito con `Diario de Anclas`
- continuidad hacia crear, explorar, calendario y recomendados

## Flujo actual

El recorrido diario tiene 3 pasos:

1. `Inicio`
2. `Momento`
3. `Cierre`

Persistencia actual:

- local: `src/app/lib/daily-anchor.ts`
- remoto opcional: `src/app/lib/anchor-service.ts`

El contenido guardado por paso es:

- `Inicio`: intención + sentimiento
- `Momento`: alineación + sentimiento
- `Cierre`: reflexión + sentimiento

## Reglas de disponibilidad

- `Inicio` está disponible desde las `00:00`
- `Momento` se habilita desde las `14:00` si `Inicio` ya fue completado
- `Cierre` se habilita desde las `19:00` si `Momento` ya fue completado

Estados visibles:

- se puede navegar entre tabs aunque estén incompletas
- si falta el paso anterior, se muestra un estado intermedio pidiendo completarlo
- si el paso anterior está completo pero todavía no es la hora, se muestra un estado intermedio de disponibilidad horaria

## UI actual

El bloque de `Diario de Anclas` usa el mismo lenguaje visual del flujo de creación:

- botón de voz
- estado `Escuchando...`
- bloque `Tu intención`
- CTA principal
- chips y superficies con la misma familia de grises, bordes y pesos tipográficos

## Estado final del día

Cuando el recorrido llega a `3/3`:

- aparece el cierre con animación orbital
- se muestra `Día completado`
- se renderiza un resumen real del contenido guardado para `Inicio`, `Momento` y `Cierre`

## Hero superior

La apertura de la Home:

- usa imagen aleatoria por ingreso desde `public/home`
- calcula hora local del usuario
- calcula momento del día del usuario
- intenta resolver clima vía geolocalización + Open-Meteo
- ajusta el chip de contexto según hora/clima

## QA previa

Durante iteración se usaron controles de prueba para validar umbrales horarios y reset del día.

Estado actual:

- esos controles ya no forman parte de la versión preparada para producción
- la disponibilidad vuelve a depender solo de la hora real del usuario

## Validación realizada

Se validó con:

- `npm run build`

Hoy no hay suite de tests automatizados adicional en `package.json`.

## Antes de subir

Checklist:

- confirmar visual en viewport chico
- revisar permisos de geolocalización y fallback de clima
- verificar el recorrido completo `Inicio -> Momento -> Cierre -> 3/3`
