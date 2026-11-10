#!/usr/bin/env bash
# Build Open WebUI frontend on the host, then docker-build Dockerfile.local.
# Usage (from repo root or this submodule):
#   bash components/webui/scripts/dana-local-image.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f package.json ]]; then
  echo "error: run from Work_RAG-WebUI checkout" >&2
  exit 1
fi

export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=8192}"

echo "==> npm ci"
ONNXRUNTIME_NODE_INSTALL_CUDA=skip npm ci --force

echo "==> npm run build (host)"
npm run build
find build -type f -name '*.map' -delete || true

# SvelteKit nests static/static → build/static; keep login/favicon on ICS assets
echo "==> sync Dana favicons into build/static"
for f in favicon.png favicon.ico favicon.svg favicon-96x96.png logo.png apple-touch-icon.png \
  splash.png splash-dark.png web-app-manifest-192x192.png web-app-manifest-512x512.png site.webmanifest; do
  if [[ -f "static/$f" ]]; then
    cp "static/$f" "static/static/$f" 2>/dev/null || true
    cp "static/$f" "build/static/$f" 2>/dev/null || true
    cp "static/$f" "build/$f" 2>/dev/null || true
  fi
done


IMAGE_TAG="${IMAGE_TAG:-rag-webui:local}"
echo "==> docker build -f Dockerfile.local -t ${IMAGE_TAG}"
docker build \
  -f Dockerfile.local \
  --build-arg USE_SLIM=true \
  --build-arg USE_CUDA=false \
  --build-arg USE_OLLAMA=false \
  -t "${IMAGE_TAG}" \
  .

echo "==> done: ${IMAGE_TAG}"
