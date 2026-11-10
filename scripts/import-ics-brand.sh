#!/usr/bin/env bash
# Import compressed ICS brand assets into static/dana/brand.
# Usage:
#   ICS_BRAND_PACK=/path/to/drive-download-... bash scripts/import-ics-brand.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PACK="${ICS_BRAND_PACK:-$HOME/Desktop/drive-download-20261110T041011Z-1-001}"
# FastAPI serves STATIC_DIR = backend/open_webui/static
OUT="$ROOT/backend/open_webui/static/dana/brand"
mkdir -p "$OUT/logo" "$OUT/keyvisual" "$OUT/motion" "$OUT/fonts"
# Keep a mirror under repo-root static/ for source visibility
MIRROR="$ROOT/static/dana/brand"
mkdir -p "$MIRROR/logo" "$MIRROR/keyvisual" "$MIRROR/motion" "$MIRROR/fonts"

command -v pdfimages >/dev/null
command -v ffmpeg >/dev/null

pdfimages -f 3 -l 3 -png "$PACK/ICS_Foundation_V01.pdf" /tmp/ics-stair
cp "$(ls -S /tmp/ics-stair*.png | head -1)" "$OUT/keyvisual/stair-hero.png"

pdfimages -f 9 -l 10 -png "$PACK/ICS_Foundation_V01.pdf" /tmp/ics-logo
cp "$(ls -S /tmp/ics-logo*.png | head -1)" "$OUT/logo/ics-logotype.png"

MOTIONS="$PACK/ICS_Touchpoint/ICS_Motions"
ffmpeg -y -i "$MOTIONS/ICS_Maroon-Logo_Hor.mp4" -an -c:v libvpx-vp9 -b:v 400k -vf scale=640:-2 \
  "$OUT/motion/ics-maroon-logo-hor.webm"
ffmpeg -y -i "$MOTIONS/ICS_Maroon-Logo_Hor.mp4" -an \
  -vf "fps=10,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" \
  "$OUT/motion/ics-maroon-logo-hor.gif"
ffmpeg -y -i "$MOTIONS/ICS_white-and-Gauge-Logo_Hor.mp4" -an -c:v libvpx-vp9 -b:v 400k -vf scale=640:-2 \
  "$OUT/motion/ics-gauge-logo-hor.webm"

cp -R "$OUT/." "$MIRROR/"
echo "Imported into $OUT (mirrored to $MIRROR)"
ls -lhR "$OUT"
