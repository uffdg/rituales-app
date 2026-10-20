#!/usr/bin/env python3
"""Genera docs/design-system/galeria.html: la galería de assets de Rituales.

Qué hace:
  1. Exporta a SVG las ilustraciones que son componentes React (arcanos,
     dorso, íconos de fase lunar) con tools/render-illustrations.tsx.
  2. Crea miniaturas livianas (480 px, JPEG) de todas las imágenes de public/,
     porque los originales pesan hasta 6 MB.
  3. Busca en src/ dónde se usa cada asset y marca los que no se usan.
  4. Escribe galeria.html con todo eso.

Uso (desde la raíz de rituales-app, en macOS por `sips`):
    python3 docs/design-system/tools/build-galeria.py

Volvé a correrlo cada vez que se agreguen, cambien o borren assets.
"""

import html
import json
import os
import re
import shutil
import subprocess
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
DOCS = ROOT / "docs" / "design-system"
OUT = DOCS / "assets" / "galeria"
SRC = ROOT / "src"
PUBLIC = ROOT / "public"

GROUPS = [
    ("fondos-home", "Fondos de Home", PUBLIC / "home",
     "Fondo a pantalla completa del hero de Home. Se elige uno al azar en cada visita."),
    ("rituales", "Rituales e historias", PUBLIC / "images",
     "Portadas de los rituales curados, de la grilla y de Stories."),
    ("wiki", "Wiki", PUBLIC / "wiki",
     "Imágenes de las notas de la Wiki (Unsplash; el autor está en el nombre del archivo)."),
    ("lunas-png", "Lunas en PNG", PUBLIC,
     "Renders de la luna que usa el calendario cósmico."),
]

# Assets que se referencian armando el nombre en el código, no literal.
DYNAMIC_USES = {
    "home": "Home.tsx (al azar: bg-${n}.jpg)",
}


def human(n):
    return f"{n / 1024 / 1024:.1f} MB" if n >= 1024 * 1024 else f"{round(n / 1024)} KB"


def dims(path):
    out = subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", str(path)],
                         capture_output=True, text=True).stdout
    w = re.search(r"pixelWidth: (\d+)", out)
    h = re.search(r"pixelHeight: (\d+)", out)
    return (int(w.group(1)), int(h.group(1))) if w and h else (0, 0)


def source_files():
    files = []
    for path in SRC.rglob("*"):
        if path.suffix in {".ts", ".tsx", ".css"}:
            files.append((path, path.read_text(encoding="utf-8", errors="ignore")))
    index = ROOT / "index.html"
    files.append((index, index.read_text(encoding="utf-8")))
    return files


def uses_of(name, folder, files):
    found = sorted({p.name for p, text in files if name in text})
    if not found and folder in DYNAMIC_USES:
        found = [DYNAMIC_USES[folder]]
    return found


def thumbnail(src, dest):
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_mtime >= src.stat().st_mtime:
        return
    subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "70", "-Z", "480",
                    str(src), "--out", str(dest)], capture_output=True, check=True)


def export_illustrations():
    ill = OUT / "ilustraciones"
    if ill.exists():
        shutil.rmtree(ill)
    bundle = OUT / ".render.mjs"
    env = {**os.environ, "NODE_PATH": str(ROOT / "node_modules")}
    subprocess.run(["npx", "esbuild", str(DOCS / "tools" / "render-illustrations.tsx"), "--bundle",
                    "--platform=node", "--format=esm", "--jsx=automatic", "--log-level=error",
                    "--banner:js=import{createRequire}from'module';const require=createRequire(import.meta.url);",
                    f"--outfile={bundle}"], cwd=ROOT, env=env, check=True)
    result = subprocess.run(["node", str(bundle), str(ill)], cwd=ROOT, env=env,
                            capture_output=True, text=True, check=True)
    bundle.unlink()
    return json.loads(result.stdout.strip().splitlines()[-1])


def collect_photos(files):
    groups = []
    for key, title, folder, note in GROUPS:
        if key == "lunas-png":
            paths = sorted(folder.glob("*.png"))
        else:
            paths = sorted(p for p in folder.iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"})
        items = []
        for path in paths:
            rel = path.relative_to(PUBLIC)
            thumb = OUT / "fotos" / key / (path.stem + ".jpg")
            thumbnail(path, thumb)
            w, h = dims(path)
            search = f"/{rel}" if key == "lunas-png" else path.name
            items.append({
                "name": path.name,
                "public": f"/{rel}",
                "original": os.path.relpath(path, DOCS),
                "thumb": os.path.relpath(thumb, DOCS),
                "size": path.stat().st_size,
                "w": w, "h": h,
                "uses": uses_of(search, folder.name, files),
            })
        groups.append({"key": key, "title": title, "note": note, "items": items})
    return groups


NAV = """  <nav class="docs-nav" id="docs-nav" aria-label="Design system"><noscript><a href="index.html">Inicio</a></noscript></nav>"""

# Copia estática de la ilustración del cuenco (WishIllustration en
# src/app/components/DailyIntention.tsx), que no se exporta como componente.
WISH_SVG = """<svg width="104" height="80" viewBox="0 0 104 80" fill="none" stroke="#0a0a0a" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 58 H96" stroke="rgba(10,10,10,0.25)"/><path d="M18 58 Q52 84 86 58"/><path d="M52 62 C46 50 58 42 52 32"/><path d="M52 8 L54.5 17.5 L64 20 L54.5 22.5 L52 32 L49.5 22.5 L40 20 L49.5 17.5 Z"/><ellipse cx="52" cy="20" rx="20" ry="7" stroke="rgba(10,10,10,0.35)" stroke-width="0.8"/><path d="M30 10 v4 M28 12 h4"/><path d="M78 30 v4 M76 32 h4"/></svg>"""


def card(item, dark=False):
    used = item["uses"]
    status = (f'<span class="pass">En uso</span> <span class="muted">{html.escape(", ".join(used))}</span>'
              if used else '<span class="fail">Sin uso</span>')
    ratio = f"{item['w']}×{item['h']}" if item["w"] else "—"
    heavy = ' <span class="warn">pesada</span>' if item["size"] > 1024 * 1024 else ""
    return f"""<figure class="asset">
  <a href="{html.escape(item['original'])}" class="asset-thumb{' asset-thumb--dark' if dark else ''}" title="Abrir original">
    <img src="{html.escape(item['thumb'])}" alt="" loading="lazy" decoding="async">
  </a>
  <figcaption>
    <b>{html.escape(item['name'])}</b>
    <span class="mono">{html.escape(item['public'])}</span>
    <span>{ratio} · {human(item['size'])}{heavy}</span>
    <span>{status}</span>
  </figcaption>
</figure>"""


def svg_card(path_rel, title, sub, dark=False):
    return f"""<figure class="asset">
  <a href="{html.escape(path_rel)}" class="asset-thumb asset-thumb--svg{' asset-thumb--dark' if dark else ''}" title="Abrir SVG">
    <img src="{html.escape(path_rel)}" alt="" loading="lazy">
  </a>
  <figcaption><b>{html.escape(title)}</b><span class="mono">{html.escape(sub)}</span></figcaption>
</figure>"""


def build(meta, groups):
    all_items = [i for g in groups for i in g["items"]]
    total = sum(i["size"] for i in all_items)
    unused = [i for i in all_items if not i["uses"]]
    heavy = [i for i in all_items if i["size"] > 1024 * 1024]


    arcana_cards = [svg_card("assets/galeria/ilustraciones/arcano-dorso.svg", "Dorso", "ArcanaBack", dark=True)]
    arcana_cards += [svg_card(f"assets/galeria/ilustraciones/arcano-{a}.svg", a, "ArcanaArt", dark=True)
                     for a in meta["arcana"]]
    phase_cards = []
    for phase in meta["phases"]:
        slug = phase.lower().replace(" ", "-")
        phase_cards.append(svg_card(f"assets/galeria/ilustraciones/luna-{slug}.svg", phase, "MoonPhaseIcon"))
        phase_cards.append(svg_card(f"assets/galeria/ilustraciones/luna-{slug}-oscuro.svg", phase, "darkTheme", dark=True))

    sections = []
    for g in groups:
        g_total = sum(i["size"] for i in g["items"])
        g_unused = sum(1 for i in g["items"] if not i["uses"])
        dark = g["key"] == "lunas-png"
        sections.append(f"""
      <h2 id="{g['key']}">{html.escape(g['title'])}</h2>
      <p class="muted">{html.escape(g['note'])} {len(g['items'])} archivos · {human(g_total)}{f' · {g_unused} sin uso' if g_unused else ''}.</p>
      <div class="asset-grid">
{''.join(card(i, dark) for i in g['items'])}
      </div>""")

    return f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Galería de assets — Design System Rituales</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,300;1,400&family=Inter:wght@300;400;500&display=swap">
<link rel="stylesheet" href="assets/ds.css">
<link rel="stylesheet" href="assets/nav.css">
</head>
<body>
<div class="docs">
{NAV}

  <main class="docs-main">
    <div class="docs-content">
      <p class="docs-eyebrow">Recursos · generada el {date.today().strftime('%d/%m/%Y')}</p>
      <h1>Galería de assets</h1>
      <p class="docs-lede">Todas las ilustraciones e imágenes de la app en un solo lugar, con su ruta, sus medidas, su peso y dónde se usan. Tocá una miniatura para abrir el archivo original. Las reglas de uso están en <a href="05-ilustraciones-e-imagenes.html">05 Ilustraciones e imágenes</a>.</p>

      <div class="grid-3">
        <div class="panel" style="margin:0"><p class="type-display" style="margin:0;color:var(--ink-strong)">{len(all_items) + len(meta['arcana']) + 1 + len(meta['phases']) * 2 + 1}</p><p class="type-body muted" style="margin:4px 0 0">assets en total</p></div>
        <div class="panel" style="margin:0"><p class="type-display" style="margin:0;color:var(--ink-strong)">{total / 1024 / 1024:.0f} MB</p><p class="type-body muted" style="margin:4px 0 0">de imágenes en <code>public/</code> · {len(heavy)} de más de 1 MB</p></div>
        <div class="panel" style="margin:0"><p class="type-display" style="margin:0;color:var(--danger)">{len(unused)}</p><p class="type-body muted" style="margin:4px 0 0">imágenes sin uso</p></div>
      </div>

      <div class="callout callout--rule"><strong>Cómo se actualiza</strong>Desde la raíz de <code>rituales-app</code>: <code>python3 docs/design-system/tools/build-galeria.py</code>. Exporta las ilustraciones, rehace las miniaturas y vuelve a buscar dónde se usa cada archivo. Para ver los arcanos animados, con la app corriendo: <a href="http://localhost:5173/dev/arcanos">localhost:5173/dev/arcanos</a>.</div>

      <h2 id="arcanos">Arcanos</h2>
      <p class="muted">Los 22 arcanos mayores y el dorso, exportados del componente <code>ArcanaArt</code> (<code>src/app/components/arcana/ArcanaArt.tsx</code>). En la app los trazos se dibujan al revelar y las estrellas titilan; acá se ven quietos.</p>
      <div class="asset-grid asset-grid--tall">
{''.join(arcana_cards)}
      </div>

      <h2 id="interfaz">Ilustraciones de interfaz</h2>
      <p class="muted">Ilustraciones de línea en tinta que acompañan bloques de la app.</p>
      <div class="asset-grid">
<figure class="asset"><div class="asset-thumb asset-thumb--svg">{WISH_SVG}</div><figcaption><b>Cuenco y estrella</b><span class="mono">WishIllustration · DailyIntention.tsx</span><span>Encabeza la Intención del día</span></figcaption></figure>
      </div>

      <h2 id="fases">Fases lunares</h2>
      <p class="muted">Íconos de línea del componente <code>MoonPhaseIcon</code>, en sus dos temas. Conviven con las lunas en PNG (más abajo): ver la decisión en la spec 05.</p>
      <div class="asset-grid">
{''.join(phase_cards)}
      </div>
{''.join(sections)}

    </div>
  </main>
</div>
<script src="assets/nav.js"></script>
</body>
</html>
"""


def main():
    if sys.platform != "darwin":
        sys.exit("Este script usa `sips`, que solo existe en macOS.")
    OUT.mkdir(parents=True, exist_ok=True)
    # Miniaturas desde cero: así no quedan las de archivos que ya no existen.
    shutil.rmtree(OUT / "fotos", ignore_errors=True)
    meta = export_illustrations()
    groups = collect_photos(source_files())
    (DOCS / "galeria.html").write_text(build(meta, groups), encoding="utf-8")
    count = sum(len(g["items"]) for g in groups)
    print(f"galeria.html lista: {count} imágenes, {len(meta['arcana']) + 1} arcanos, {len(meta['phases']) * 2} fases.")


if __name__ == "__main__":
    main()
