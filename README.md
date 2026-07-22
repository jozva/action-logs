# Gidy Security Console

Enterprise-grade security audit log monitoring platform.

Built as a production-style full-stack system with server-side search, filtering, sorting, pagination, and bulk ingestion of up to **10,000** records per request.

Think internal ops console — closer to Datadog / Cloudflare / AWS Console than a tutorial CRUD app.

---

## Screenshots

> Placeholders — capture after local run or deployment.

| Dashboard | Bulk Upload |
|---|---|
| ![Dashboard placeholder](docs/screenshots/dashboard.png) | ![Upload placeholder](docs/screenshots/upload.png) |

---

## Tech Stack

### Frontend
- React + Vite + TypeScript
- React Router (lazy routes)
- TanStack Query
- Axios
- React Hook Form + Zod
- Zustand
- Tailwind CSS v4
- shadcn/ui-style primitives + Lucide

### Backend
- Node.js + Express + TypeScript
- MongoDB Atlas + Mongoose
- Zod request validation
- Winston + Morgan logging
- Helmet, CORS, rate limiting, compression, HPP, mongo sanitize

### Deployment targets
- Frontend → Vercel
- Backend → Render
- Database → MongoDB Atlas

---

## Architecture

```text
Browser (React)
  └─ TanStack Query / Axios
       └─ REST /api/v1/*
            └─ Controllers
                 └─ Services
                      └─ Repositories
                           └─ MongoDB (security_logs)
```

### Why this layering

| Layer | Responsibility | Why |
|---|---|---|
| Routes | HTTP wiring + middleware | Keeps transport concerns isolated |
| Controllers | Status codes + response shaping | No DB, no business rules |
| Services | Validation orchestration + domain rules | Testable without Express |
| Repositories | Query construction + persistence | Swappable data access |
| Validators | Zod schemas at the boundary | Never trust client input |

### Frontend state split

- **Server state** → TanStack Query (`logs`, `summary`, detail)
- **URL/query UX state** → Zustand filter store (search/filters/page/sort)
- **UI chrome** → Zustand persisted preferences (sidebar)

Search / filter / sort / pagination are **never** applied in the browser against a full dataset. The client only renders the page returned by the API.

---

## Folder Structure

```text
gidy/
├── client/                 # Vite React SPA
│   ├── src/
│   │   ├── api/            # Axios client + resource APIs
│   │   ├── components/     # UI primitives + DataTable + shared
│   │   ├── features/       # Domain feature modules (logs)
│   │   ├── hooks/          # Query + debounce hooks
│   │   ├── layouts/        # App shell
│   │   ├── pages/          # Route-level screens
│   │   ├── providers/      # Query client, error boundary, toasts
│   │   ├── routes/         # Lazy route tree
│   │   ├── stores/         # Zustand stores
│   │   ├── constants/
│   │   ├── lib/
│   │   ├── types/
│   │   └── test/           # Test architecture notes
│   ├── vercel.json
│   └── .env.example
├── server/                 # Express API
│   ├── src/
│   │   ├── config/
│   │   ├── constants/
│   │   ├── controllers/
│   │   ├── database/
│   │   ├── errors/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── scripts/        # seed + sample generator
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   └── validators/
│   ├── tests/              # Test architecture notes
│   └── .env.example
├── render.yaml
└── README.md
```

---

## Domain Model

Collection: `security_logs`

Matches the assignment contract (flat document):

```json
{
  "actor": "priya.nair@company.com",
  "role": "admin",
  "action": "DELETE_USER",
  "resource": "/api/users/334",
  "resourceType": "USER",
  "ipAddress": "192.168.1.45",
  "region": "ap-south-1",
  "severity": "HIGH",
  "status": "Unresolved",
  "timestamp": "2025-06-14T08:32:11Z"
}
```

| Field | Notes |
|---|---|
| `actor` | Actor email |
| `role` | `admin \| user \| viewer \| service \| auditor` |
| `action` | SCREAMING_SNAKE action enum (`DELETE_USER`, …) |
| `resource` | Resource path/identifier |
| `resourceType` | `USER \| FILE \| API_KEY \| …` |
| `ipAddress` / `region` | Network context |
| `severity` | `CRITICAL \| HIGH \| MEDIUM \| LOW \| INFO` |
| `status` | `Unresolved \| Investigating \| Resolved \| Dismissed` |
| `timestamp` | Event time (indexed) |
| `createdAt` / `updatedAt` | Ingestion metadata |

### Indexes

- `timestamp`, `severity`, `status`, `region`, `role`, `action`, `resourceType`
- Compound: `(timestamp, severity)`, `(status, timestamp)`, `(role, timestamp)`, `(action, timestamp)`, `(resourceType, timestamp)`
- Text index across actor, action, resource, IP, region, status

Regex search is used for predictable partial matching across fields; text index remains available for ranking/evolution.

---

## API

Base path: `/api/v1`

Envelope:

```json
{
  "success": true,
  "message": "Security logs fetched",
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 25,
    "total": 1000,
    "totalPages": 40,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Liveness + DB state |
| `GET` | `/api/v1/logs` | List with search/filter/sort/pagination |
| `GET` | `/api/v1/logs/summary` | Dashboard aggregates |
| `GET` | `/api/v1/logs/:id` | Single log |
| `POST` | `/api/v1/logs/upload` | Bulk upload (`records[]`, max 10,000) |
| `POST` | `/api/v1/auth/register` | Create employee account (`user` role) |
| `POST` | `/api/v1/auth/login` | Login and receive JWT |
| `GET` | `/api/v1/auth/me` | Current authenticated user |
| `POST` | `/api/v1/auth/logout` | Logout (audited) |
| `GET/POST/PATCH/DELETE` | `/api/v1/users` | Role-gated user management |
| `GET/POST` | `/api/v1/files` | File list/upload (audited) |
| `POST` | `/api/v1/files/:id/download` | Authorize download (audited) |
| `POST` | `/api/v1/exports` | Create data export (audited) |
| `GET/PATCH` | `/api/v1/policies` | Read/update security policies (audited) |

### Demo admin

```bash
cd server && npm run seed:admin
```

Default credentials: `admin@company.com` / `Admin123!`

### List query parameters

`page`, `pageSize`, `sortBy`, `sortOrder`, `search`, `role`, `severity`, `status`, `action`, `resourceType`, `region`, `dateFrom`, `dateTo`

### Bulk upload behavior

1. Request body validated (`records` array size limits)
2. Every record validated independently with Zod
3. Valid records inserted in 1,000-document chunks (`ordered: false`)
4. Invalid records returned in a capped failure report (first 100)
5. If **all** records are invalid → `422` with detailed errors
6. Partial success → `201` with inserted counts + failure details

Example:

```bash
curl -X POST "$API/api/v1/logs/upload" \
  -H 'Content-Type: application/json' \
  -d @sample-upload-1000.json
```

---

## Security Decisions

Aligned with OWASP Top 10 practical controls:

| Threat | Control |
|---|---|
| NoSQL injection | `express-mongo-sanitize`, strict Zod schemas, no raw operator passthrough |
| XSS | React escaping + security response headers via Helmet |
| CSRF | Stateless JSON API; tighten further if cookie auth is introduced |
| Brute force / abuse | Global + upload-specific rate limits |
| Malformed JSON | Express entity parse handling → `400` |
| Large payload / upload DoS | Body size limit (`5mb`) + max 10,000 records |
| Parameter pollution | `hpp` |
| Mass assignment | `.strict()` Zod objects; only allowlisted fields persist |
| Prototype pollution | Strict parsing + sanitized keys |
| Information disclosure | Central error handler; no stack traces / Mongo internals in production |
| CORS misuse | Explicit allowlist from `CORS_ORIGIN` |

Additional hardening: compression, `trust proxy`, disabled `X-Powered-By`, request logging, operational vs non-operational error classification.

---

## Performance Decisions

- Lean queries + field projection for list/detail
- Compound indexes matching common filter/sort patterns
- Parallel `find` + `countDocuments` for list responses
- Chunked `insertMany` for bulk ingestion
- Aggregation only for dashboard summary cards
- Frontend request debouncing for search (does not move filtering client-side)
- Lazy-loaded routes + skeleton loaders for perceived performance

### Trade-offs

| Decision | Trade-off |
|---|---|
| Offset pagination (`skip/limit`) | Simple + assignment-friendly; deep pages get slower — cursor pagination is the scale upgrade |
| Regex multi-field search | Flexible partial match; heavier than pure text search at very large scale |
| Partial bulk success | Better operator UX; callers must handle mixed validity reports |
| Estimated counts for summary total | Fast on huge collections; slightly approximate vs exact count |

---

## Local Setup

### Prerequisites

- Node.js **20.19+** (repo `.nvmrc` → 22)
- MongoDB Atlas connection string (or local Mongo)

```bash
nvm use
```

### 1) Backend

```bash
cd server
cp .env.example .env
# set MONGODB_URI and CORS_ORIGIN
npm install
npm run dev
```

API defaults to `http://localhost:8080`.

Seed data:

```bash
npm run seed -- 1000
```

Generate a bulk upload file (up to 10000):

```bash
npm run generate:sample -- 10000 ./sample-upload-10000.json
```

### 2) Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

App defaults to `http://localhost:5173`.

`VITE_API_BASE_URL` can point at the Render API in deployed environments. Locally, Vite proxies `/api` and `/health` to the backend.

---

## Deployment

### MongoDB Atlas

1. Create cluster + database user
2. Allow Render egress IPs (or `0.0.0.0/0` for demo)
3. Copy SRV URI into `MONGODB_URI`

### Backend (Render)

- Root directory: `server`
- Build: `npm install && npm run build`
- Start: `npm run start`
- Health check: `/health`
- Blueprint: `render.yaml`

Required env vars:

- `MONGODB_URI`
- `CORS_ORIGIN` (your Vercel URL, comma-separated if multiple)
- `NODE_ENV=production`
- `PORT` (Render usually injects this; app reads `PORT`)

### Frontend (Vercel)

- Root directory: `client`
- Framework preset: Vite
- Build: `npm run build`
- Output: `dist`
- Env: `VITE_API_BASE_URL=https://<your-render-service>/api/v1`
- SPA fallback configured via `vercel.json`

---

## Product Features

- Dashboard summary cards
- Debounced multi-field search (server-side)
- Filters: role, severity, status, action, resource type, region, date range
- Sortable columns
- Pagination + page size controls
- Reusable DataTable (sticky header, badges, loading/empty states)
- Bulk JSON upload with validation report
- Responsive desktop / tablet / mobile shell
- Global toasts + error boundary + 404 page
- Dark-mode-ready token architecture (CSS variables)

---

## Interview Notes / Defendable Decisions

1. **Server owns query semantics** — prevents inconsistent client filtering and protects data volume.
2. **Zod at every boundary** — query, params, body, and each upload row.
3. **Repository isolation** — controllers never touch Mongoose.
4. **Operational error model** — clients get stable codes/messages; logs keep diagnostics.
5. **Chunked bulk write** — keeps memory predictable at 10k records.
6. **Feature-folder frontend** — scales to many domains without a junk drawer.
7. **shadcn-style primitives** — accessible building blocks without locking the product into a heavy component framework.

---

## Future Improvements

- Cursor-based pagination for deep scans
- AuthN/AuthZ (SSO + RBAC) and audit of dashboard users themselves
- OpenAPI/Swagger generation from Zod schemas
- Vitest unit + integration suites in CI
- Atlas Search for high-scale full-text
- Streamed uploads / signed object ingestion for >10k
- Saved views and alert rules
- Metric export (Prometheus) and structured trace IDs

---

## License

Private assignment / portfolio project — all rights reserved by the author unless otherwise stated.
