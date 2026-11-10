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
