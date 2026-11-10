# Work_RAG-WebUI

Dana / Work Credit RAG frontend fork of [Open WebUI](https://github.com/open-webui/open-webui).

- Upstream pin: `v0.13.3`
- Parent path: `components/webui`
- Runtime: build this tree into Docker; compose points `webui` at this Dockerfile
- Product RAG stays in orchestrator `:8100` — this repo owns UI/UX only

Remotes:

- `origin` → `AliNikkhah2001/Work_RAG-WebUI`
- `upstream` → `open-webui/open-webui`

## Local Mac image build

Docker Desktop (~8Gi) OOMs on the in-container Vite build. Use the host frontend build path:

```bash
bash components/webui/scripts/dana-local-image.sh
# or npm ci && npm run build, then compose build webui (Dockerfile.local)
```

`Dockerfile` remains the full upstream multi-stage build for CI/machines with enough RAM.
