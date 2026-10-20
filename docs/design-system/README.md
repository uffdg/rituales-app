# docs/design-system

Specs del design system de Rituales: el diagnóstico, la propuesta de fundamentos y componentes, las decisiones y el plan de implementación. Es la referencia para estandarizar la interfaz.

## Cómo abrirlos

Abrí `index.html` con doble clic y navegá con el menú lateral (en el celular, con el botón "Menú"). No hace falta servidor. La única dependencia externa es Google Fonts (Cormorant Garamond + Inter); sin conexión se ven con la tipografía de sistema.

## Archivos

- `index.html`: inicio, estado de cada spec y cómo validar.
- `01-diagnostico.html`: relevamiento de la app sin tocar código.
- `02-fundamentos.html`: color, tipografía, espaciado, radios, sombras, movimiento, íconos, accesibilidad.
- `03-componentes.html`: botones, campos, chips, cards, rótulos, feedback, navegación, oráculo.
- `04-validacion.html`: decisiones a cerrar, plan por fases y criterios de verificación.
- `05-ilustraciones-e-imagenes.html`: familias de ilustración, fotografía, texto sobre foto, peso y formato, accesibilidad, archivos sin uso.
- `galeria.html`: galería de todos los assets (ilustraciones exportadas y miniaturas de las fotos) con ruta, medidas, peso y dónde se usan. **Se genera**: no la edites a mano.
- `assets/nav.js` y `assets/nav.css`: la navegación (menú lateral agrupado en Sistema, Recursos y Proceso; botón "Menú" en pantallas chicas; anterior/siguiente). Única lista de páginas: `PAGES` en `nav.js`.
- `assets/ds.css`: estilos compartidos. La sección **1. SISTEMA** son los tokens y componentes tal como van a `src/styles/theme.css`; la sección **2. DOCS** es solo el armazón de estas páginas.

## Convenciones

- `NN-tema.html`: número correlativo de dos dígitos + tema en kebab-case.
- Cada spec declara arriba su fecha y su estado: `Hecho` / `Para validar` → `Aprobado` (o `Descartado`). El estado se repite en el menú lateral (`.tag`) y en la tabla de `index.html`.
- Al sumar una página: agregala en `PAGES` dentro de `assets/nav.js` (grupo, título y estado) y en la tabla de `index.html`. El menú, las secciones de la página, la barra del celular y los links de anterior/siguiente se arman solos. Cada página solo necesita el esqueleto `<div class="docs">` con `<nav class="docs-nav" id="docs-nav">` vacío, `assets/nav.css` y `<script src="assets/nav.js">`; las secciones salen de sus `<h2 id>`.
- Si una spec reemplaza a otra, no se borra la vieja: se marca `Reemplazada por NN`.
- `01-diagnostico.html` conserva su estilo propio (es un relevamiento); las demás usan `assets/ds.css`.

## Galería de assets

`galeria.html` y `assets/galeria/` los genera `tools/build-galeria.py` (macOS, usa `sips`). Desde la raíz de `rituales-app`:

```bash
python3 docs/design-system/tools/build-galeria.py
```

Exporta a SVG las ilustraciones que son componentes React (`tools/render-illustrations.tsx`), crea miniaturas de 480 px de todas las imágenes de `public/` y busca en `src/` dónde se usa cada archivo. Volvé a correrlo cuando se agreguen, cambien o borren assets. Para ver los arcanos animados, con la app corriendo: `http://localhost:5173/dev/arcanos`.
