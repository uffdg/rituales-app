#!/usr/bin/env bash
# Convierte fotos a WebP con el tamaño y la calidad del design system
# (docs/design-system/05-ilustraciones-e-imagenes.html#tecnica):
# 1080 px de ancho como máximo, calidad 75, sin metadatos.
#
# Uso: scripts/optimize-images.sh foto1.jpg [foto2.jpg …]
# Deja `foto1.webp` al lado del original; el original no se borra.
# Requiere cwebp (brew install webp). Las fotos con rotación en EXIF se
# rechazan: cwebp ignora esa rotación y saldrían giradas.
set -euo pipefail

MAX_WIDTH=1080
QUALITY=75

command -v cwebp >/dev/null || { echo "Falta cwebp: brew install webp" >&2; exit 1; }

for src in "$@"; do
  orientation=$(sips -g orientation "$src" 2>/dev/null | awk '/orientation/{print $2}')
  if [[ -n "$orientation" && "$orientation" != "<nil>" && "$orientation" != "1" ]]; then
    echo "Salteada (rotación EXIF $orientation): $src" >&2
    continue
  fi

  width=$(sips -g pixelWidth "$src" | awk '/pixelWidth/{print $2}')
  resize=()
  if (( width > MAX_WIDTH )); then resize=(-resize "$MAX_WIDTH" 0); fi

  out="${src%.*}.webp"
  cwebp -quiet -q "$QUALITY" -m 6 -metadata none "${resize[@]}" "$src" -o "$out"
  printf "%-60s %6s → %6s\n" "$src" "$(du -h "$src" | cut -f1)" "$(du -h "$out" | cut -f1)"
done
