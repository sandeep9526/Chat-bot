# Zeva Platform: Deployment, DevOps & Production Scaling Audit

This document catalogs critical infrastructure, DevOps, containerization, database pooling, and cloud hosting issues discovered during a rigorous technical audit of the **Zeva Chatbot Platform** (`zeva-backend` & `fortend`).

---

## 1. [CRITICAL] Ephemeral Cloud File & Embeddings Wipeout (Stateful Disk Reliance)
**Location**: `zeva-backend/ingest.py` -> `DOCS_ROOT` & `DB_DIR` ([L25-L26](file:///Users/sandeepsharma/Manisha-Folder/chat-bot-zeva-project%202/zeva-backend/ingest.py#L25-L26))  
**Vulnerability Type**: Data Loss on Container Redeploys & Multi-Instance Desync

### Description & Impact
Uploaded customer documents are saved directly to a local file system directory (`documents/<bot_id>/*.txt`), and vector embeddings are stored inside a local SQLite-backed ChromaDB directory (`chroma_db/`).
* **Cloud Hosting Incompatibility**: When deployed to serverless or ephemeral container runtime providers (Render web services without persistent volumes, Vercel Serverless Functions, AWS Fargate, Google Cloud Run, Heroku), local storage is transient. Every automated container redeployment, background scale-to-zero restart, or platform upgrade **permanently deletes all uploaded customer documents and ChromaDB embeddings**.
* **Horizontal Scaling Failure**: When scaling Uvicorn horizontally across multiple server instances (or behind a load balancer), Worker A handles a document upload and builds a local disk vector index. When an incoming chat visitor hits Worker B, Worker B lacks access to Worker A's disk, causing RAG retrieval to fail with "document context not found" fallbacks.

### Action Item Checklist
- [ ] **Cloud Object Storage Integration**: Store uploaded client raw files in an object storage bucket (Cloudflare R2, AWS S3, or Vercel Blob) rather than relying on local filesystem IO.
- [ ] **Decenteralize Vector Database**: Migrate vector embeddings away from local embedded ChromaDB to a cloud vector engine (Neon Postgres native `pgvector` extension, Pinecone, or standalone hosted ChromaDB Server) so all horizontal API instances share unified embedding state.
- [ ] **Persistent Volume Mount Alternative**: If hosting on Railway or Render web servers without architectural migration, enforce mounting a dedicated persistent Block Storage Volume to `/data`, setting `ZEVA_DOCS_DIR=/data/docs` and `CHROMA_DB_DIR=/data/chroma`.

---

## 2. [HIGH] Missing FastAPI Lifespan Hooks & Postgres Connection Pool Exhaustion
**Location**: `zeva-backend/db.py` -> `_get_pool()` ([L42](file:///Users/sandeepsharma/Manisha-Folder/chat-bot-zeva-project%202/zeva-backend/db.py#L42))  
**Vulnerability Type**: TCP Connection Exhaustion & Orphaned Pool Handles

### Description & Impact
The database layer establishes an asynchronous-compatible connection pool via `psycopg_pool.ConnectionPool(min_size=1, max_size=5)`. However, `main.py` does not incorporate FastAPI application lifecycle event handlers (`@asynccontextmanager` / `app = FastAPI(lifespan=...)`) to systematically open and close the TCP connection pool during server startup and shutdown.
* **Exploit/Operational Outcome**: During Uvicorn scale-down procedures, zero-downtime rolling redeploys, or worker restarts, open TCP sessions connected to Neon Postgres are abandoned rather than cleanly terminated. This exhausts Neon's maximum concurrent connection cap and throws noisy Python threading exceptions upon worker exit (`Exception ignored... PythonFinalizationError: cannot join thread at interpreter shutdown`).

### Action Item Checklist
- [ ] **Implement FastAPI Lifespan Context Manager**: Modify `main.py` to utilize standard async lifecycle binding:
  ```python
  from contextlib import asynccontextmanager

  @asynccontextmanager
  async def lifespan(app: FastAPI):
      db.init_db()  # Open connection pool cleanly at startup
      yield
      db.close_pool()  # Explicitly terminate pool sessions at shutdown
  
  app = FastAPI(lifespan=lifespan)
  ```
- [ ] **PgBouncer / Neon Serverless Pooling**: Ensure production database environment strings (`APP_DATABASE_URL`) point explicitly to Neon's Transaction-pooled connection endpoints (PgBouncer enabled on port 6543) to prevent worker connection proliferation.

---

## 3. [MEDIUM] Unconfigured Static CDN Hosting for `widget.js`
**Location**: `fortend/src/lib/embed.ts` -> `buildEmbedRows` ([L55](file:///Users/sandeepsharma/Manisha-Folder/chat-bot-zeva-project%202/fortend/src/lib/embed.ts#L55)) & `INTEGRATIONS.md`  
**Vulnerability Type**: Broken Onboarding Script Link & Unbound Asset Delivery

### Description & Impact
Across the client onboarding wizards, marketing landing pages, and interactive Studio preview tools, the embed generator outputs a static script tag targeting an unprovisioned domain:
```html
<script src="https://cdn.zeva.app/widget.js" data-bot-id="..." data-api-url="..."></script>
```
* **Operational Outcome**: As noted in `INTEGRATIONS.md`, a real global content delivery network at `cdn.zeva.app` has not been provisioned or hooked into automated deployment pipelines. Customers who copy and paste this suggested 1-line script onto live production websites will experience blocked scripts, DNS host failures, or HTTP 404 errors.

### Action Item Checklist
- [ ] **Dynamic Domain Fallback Mapper**: Update `embed.ts` to construct script origins dynamically based on active deployment domains:
  ```typescript
  const SCRIPT_HOST = process.env.NEXT_PUBLIC_CDN_URL || process.env.NEXT_PUBLIC_APP_URL || "https://cdn.zeva.app";
  // Emits: src="${SCRIPT_HOST}/widget.js"
  ```
- [ ] **CDN Deployment Pipeline**: Configure a GitHub Actions CI workflow or Cloudflare Wrangler build step to deploy `fortend/public/widget.js` directly to a high-availability Cloudflare Worker / R2 Edge Bucket whenever updates merge to main.

---

## 4. [MEDIUM] Absence of Docker Containerization Manifests
**Location**: Workspace Root (`zeva-backend` & `fortend`)  
**Vulnerability Type**: DevOps Deployment Impediment & Local Developer Environment Drift

### Description & Impact
The codebase lacks Docker containerization artifacts (such as standard multi-stage `Dockerfile`, `.dockerignore`, and orchestrated `docker-compose.yml` configuration files).
* **Operational Outcome**: Deployments to modern cloud microservices platforms (AWS ECS, Kubernetes, Fly.io, DigitalOcean App Platform) require hand-crafted build scripts or reliance on legacy Procfile architectures. Furthermore, developer onboarding requires running persistent shell tabs with manual Uvicorn and Next dev loops without database container isolation.

### Action Item Checklist
- [ ] **Backend Multi-Stage Dockerfile**: Create an optimized Python 3.12 slim Dockerfile for `zeva-backend` invoking enterprise multi-worker Uvicorn (`uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4`).
- [ ] **Frontend Production Standalone Dockerfile**: Configure Next.js output to `standalone` in `next.config.js` and build a lightweight Node/Alpine container image.
- [ ] **Unified Docker-Compose Orchestration**: Author an end-to-end `docker-compose.yml` network topology that simultaneously boots Next.js, FastAPI, local Redis (for distributed rate limiting), and PostgreSQL for local environment reproducibility.

---

## 5. [MEDIUM] Build-Time Baked Environment Variables (`NEXT_PUBLIC_*`)
**Location**: `fortend/.env.example` -> `NEXT_PUBLIC_API_URL` & `NEXT_PUBLIC_APP_URL`  
**Vulnerability Type**: Environment Misdirection During Immutable Container Promotions

### Description & Impact
Next.js statically processes and compiles all `NEXT_PUBLIC_*` variables directly into immutable client-side JavaScript bundle files at build time (`npm run build`).
* **Operational Outcome**: If an automated CI/CD pipeline compiles a Docker container image against staging environment variables (`NEXT_PUBLIC_API_URL=https://staging-api.zeva.app`) and promotes that exact container artifact to production without performing a full Next.js rebuild, interactive customer chat widgets and admin dashboards will silently execute requests against staging infrastructure.

### Action Item Checklist
- [ ] **Runtime Backend Config Interception**: For environment-neutral standalone container deployments, expose an internal frontend endpoint (`/api/env-config`) that returns production runtime environment variables to client modules upon app hydration.
- [ ] **CI/CD Promotion Playbook**: Clearly document immutable build pipeline requirements ensuring Vercel / Render builds triggers independent compilations for staging and production release channels.
