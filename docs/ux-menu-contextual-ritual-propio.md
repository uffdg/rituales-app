# Menu contextual en cards de ritual propio

Estado: borrador para revision

## Problema / evidencia

Mariana reporto con captura que en una card de ritual aparece un boton flotante circular con icono de delete/trash sobre la imagen, visualmente desfasado.

La superficie probable es `/cuenta`, en la grilla de rituales propios: hoy la card usa `RitualGridCard` y, si `isOwn`, agrega un `Trash2` absoluto sobre la imagen. Esa accion destructiva compite con la imagen, queda fuera de la jerarquia natural de lectura y puede parecer un bug visual.

Hay evidencia previa relacionada en `guidelines/feedback-log.md` insight #43: los iconos ambiguos confunden cuando no comunican claramente su destino. Aca el problema no es solo ambiguedad: una accion destructiva esta demasiado expuesta y sin contexto.

## Propuesta

Reemplazar el icono flotante de eliminar por un menu contextual de acciones ubicado a la derecha de la card, dentro del header visual de la card.

Patron exacto:

- Mantener la imagen limpia. No debe haber ningun boton de eliminar superpuesto sobre la imagen.
- En cards de rituales propios, mostrar un trigger de menu en el extremo superior derecho de la imagen, ocupando el lugar de accion secundaria de la card.
- El trigger debe ser un boton iconografico neutral con `MoreHorizontal` de lucide, `aria-label="Mas acciones"`.
- Usar el patron existente de `DropdownMenu` de `src/app/components/ui/dropdown-menu.tsx`, no `ContextMenu`: en mobile el usuario necesita tocar un boton visible, no long-press/right-click.
- El menu abre alineado a la derecha del trigger: `align="end"`, `sideOffset=6`.
- Contenido del menu, en este orden:
  - `Compartir` con icono `Share2`.
  - Separador horizontal.
  - `Eliminar` con icono `Trash2`, en rojo/destructive.
- `Eliminar` conserva el flujo actual de confirmacion antes de borrar. El menu solo mueve el acceso a la accion; no cambia la proteccion.

## Jerarquia visual

- La card sigue teniendo como primer nivel la imagen + titulo del ritual.
- Guardar/favorito, si aplica para esa vista, no debe competir con eliminar. En cards propias, priorizar el menu como contenedor de acciones secundarias. Si se mantiene guardado/favorito en la misma card, dejarlo como accion separada solo cuando sea funcionalmente necesario y evitar dos botones flotantes juntos.
- El menu es una accion secundaria: icono chico, bajo contraste, sin texto visible en la card.
- Eliminar queda como accion destructiva dentro del menu, separada por linea para evitar taps accidentales.

Tokens / estilo:

- Trigger: reutilizar `editorial-icon-button`; tamano tactil minimo 32 x 32 px, ideal 36 x 36 px en mobile.
- Trigger sobre imagen: fondo `rgba(0,0,0,0.32)` + `backdrop-filter: blur(8px)` como el boton de guardado actual; icono blanco `rgba(255,255,255,0.9)`.
- Menu: fondo blanco, borde `var(--border-soft)`, sombra `var(--shadow-lifted)`, radio 12-14 px, padding 6 px.
- Items: `var(--font-sans-ui)`, 13 px, peso 400, altura minima 40 px, iconos 16 px.
- Separador: `var(--border-soft)`, margen vertical 4 px.
- Destructive: texto e icono `var(--destructive)`.

## Microcopy

- Trigger accesible: `Mas acciones`.
- Item 1: `Compartir`.
- Item 2: `Eliminar`.
- Confirmacion existente, si se muestra:
  - Titulo: `Eliminar ritual`
  - Cuerpo: `Esta accion no se puede deshacer.`
  - Cancelar: `Cancelar`
  - Confirmar: `Eliminar`
- Toast exito: `Ritual eliminado`
- Toast error: `No se pudo eliminar el ritual. Proba de nuevo.`

Copy validado contra `VOICE.md`: directo, rioplatense, sin tecnologia, sin new age vacio, sin genero gramatical.

## Estados

- Default: trigger visible solo en rituales propios.
- Hover/focus: fondo del trigger apenas mas opaco; foco visible con ring sutil.
- Pressed: escala leve igual al patron actual (`active:scale-90`).
- Menu abierto: trigger mantiene estado activo; el menu queda por encima de la card y no tapa el titulo si hay espacio para abrir hacia abajo.
- Compartir en curso: item puede cerrar menu y disparar el flujo nativo/actual de compartir. Si falla, mostrar toast de error.
- Eliminar: al tocar, cerrar menu y abrir confirmacion. No borrar sin confirmar.
- Eliminando: deshabilitar confirmar y mostrar estado de carga en la confirmacion si el patron actual lo permite.
- Error al eliminar: cerrar loading, mantener o volver a estado anterior, mostrar toast de error.
- Ritual no propio: no mostrar `Eliminar`; si no hay otras acciones propias, no mostrar el menu.

## Criterio de aceptacion

- En `/cuenta`, las cards de rituales propios ya no muestran un icono de trash/delete flotando suelto sobre la imagen.
- Cada card propia tiene un unico acceso contextual a la derecha con icono `MoreHorizontal`.
- Al abrir el menu se ven exactamente `Compartir`, separador, `Eliminar`.
- `Compartir` y `Eliminar` tienen iconos.
- `Eliminar` aparece en rojo y separado por una linea.
- Tocar `Eliminar` no borra inmediatamente: abre confirmacion.
- Tocar fuera o presionar Escape cierra el menu sin ejecutar accion.
- La card sigue abriendo el ritual al tocar imagen/titulo, pero tocar el menu o sus items no abre la card.
- El patron funciona en ancho mobile de 390 px sin superposiciones ni texto cortado.
- Los labels accesibles existen: trigger `Mas acciones`; item compartir y eliminar tienen nombre discernible por lector de pantalla.
