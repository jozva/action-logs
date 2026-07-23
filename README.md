# Gidy Security Console

Full-stack security operations console for ingesting, searching, filtering, and auditing security events.

The product is built like an internal enterprise ops tool: server-owned query semantics, JWT auth with RBAC, audited employee actions, Cloudinary-backed file storage, and JSON log export.

---

## Table of contents

1. [Overview](#overview)
2. [Tech stack](#tech-stack)
3. [Architecture](#architecture)
4. [Repository structure](#repository-structure)
5. [Features](#features)
6. [Domain model](#domain-model)
7. [API reference](#api-reference)
8. [Authentication and RBAC](#authentication-and-rbac)
9. [Local setup](#local-setup)
10. [Environment variables](#environment-variables)
11. [Scripts](#scripts)
12. [Bulk upload format](#bulk-upload-format)
13. [Files and Cloudinary](#files-and-cloudinary)
14. [Exports](#exports)
15. [Security controls](#security-controls)
16. [Performance notes](#performance-notes)
17. [Deployment](#deployment)
18. [Troubleshooting](#troubleshooting)

---

## Overview

Gidy Security Console provides:

- A dashboard for security audit logs with server-side search, filters, sort, and pagination
- Bulk JSON upload (up to 10,000 records per request)
- Employee workspace for users, files, exports, and policies
- JWT authentication with role-based permissions
- Automatic region/IP detection for audit context
- Cloudinary storage for uploaded files
- One-click JSON export of audit logs

Default local URLs:

| App | URL |
|---|---|
| Frontend | `http://localhost:5173` |
| Backend | `http://localhost:8080` |
| Health | `http://localhost:8080/health` |
| API base | `http://localhost:8080/api/v1` |

---

## Tech stack

### Frontend (`client/`)

- React + Vite + TypeScript
- React Router (lazy routes)
- TanStack Query
- Axios
- React Hook Form + Zod
- Zustand
- Tailwind CSS v4
- Lucide icons + shadcn-style UI primitives

### Backend (`server/`)

- Node.js + Express 5 + TypeScript
- MongoDB Atlas + Mongoose
- Zod validation
- JWT + bcrypt
- Winston + Morgan
- Helmet, CORS, rate limiting, compression, HPP, mongo sanitize
- Cloudinary SDK for file uploads/downloads

### Deployment targets

- Frontend → Vercel
- Backend → Render (`render.yaml`)
- Database → MongoDB Atlas
- Files → Cloudinary

---

## Architecture

```text
Browser (React + TanStack Query + Axios)
  └─ REST /api/v1/*
       └─ Routes + middlewares (auth, validate, rate limit)
            └─ Controllers
                 └─ Services (domain + audit)
                      └─ Repositories / models
                           └─ MongoDB + Cloudinary
```

### Backend layering

| Layer | Responsibility |
|---|---|
| Routes | HTTP wiring, authz, validators |
| Controllers | Status codes and response shaping |
| Services | Business rules, audit events, Cloudinary/export logic |
| Repositories | Query construction and persistence |
| Validators | Zod schemas at every request boundary |

### Frontend state

| Concern | Store |
|---|---|
| Server data (logs, users, files) | TanStack Query |
| Dashboard filters / pagination | Zustand `logFiltersStore` |
| Auth session | Zustand `authStore` (persisted) |
| UI chrome (sidebar) | Zustand `uiStore` |

Search, filter, sort, and pagination are executed on the API. The browser only renders the current page.

---

## Repository structure

```text
gidy/
├── client/                     # Vite React SPA
│   ├── src/
│   │   ├── api/                # HTTP client + resource APIs
│   │   ├── components/         # UI primitives + shared components
│   │   ├── features/logs/      # Dashboard filters + table
│   │   ├── hooks/
│   │   ├── layouts/            # App shell + employee workspace
│   │   ├── pages/              # Route screens (auth, dashboard, employees)
│   │   ├── providers/
│   │   ├── routes/
│   │   ├── stores/
│   │   ├── constants/
│   │   ├── lib/
│   │   └── types/
│   ├── vercel.json
│   └── .env.example
├── server/                     # Express API
│   ├── src/
│   │   ├── config/             # env + Cloudinary
│   │   ├── constants/
│   │   ├── controllers/
│   │   ├── database/
│   │   ├── errors/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── routes/v1/
│   │   ├── scripts/            # seed, seed:admin, sample generator
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   └── validators/
│   ├── uploads/                # local fallback storage (gitignored)
│   └── .env.example
├── render.yaml
└── README.md
```

---

## Features

### Dashboard

- Summary cards (total, severity, status aggregates)
- Debounced multi-field search
- Filters: role, severity, status, action, resource type, region, date range
- Sortable columns + pagination
- Log detail route

### Bulk upload

- Drag/drop or choose `.json`
- Paste payload editor
- Sample insert + sample download
- Per-row validation report (valid / invalid / inserted)

### Auth

- Register (creates `user` role, auto region)
- Login / logout
- Session revalidation via `/auth/me`
- Password policy (length, upper, lower, number, special)

### Employee workspace

| Area | Capabilities |
|---|---|
| Users | Admin create/edit/delete with audited actions |
| Files | Real upload/download via Cloudinary |
| Exports | Download audit logs as JSON |
| Policies | Read/update security policies |

---

## Domain model

### Security logs (`security_logs`)

Flat document matching the assignment contract:

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

| Field | Allowed values / notes |
|---|---|
| `actor` | Email |
| `role` | `admin`, `user`, `viewer`, `service`, `auditor` |
| `action` | `LOGIN`, `LOGOUT`, `CREATE_USER`, `UPDATE_USER`, `DELETE_USER`, `READ_RESOURCE`, `UPDATE_RESOURCE`, `DELETE_RESOURCE`, `UPLOAD_FILE`, `DOWNLOAD_FILE`, `EXPORT_DATA`, `CONFIGURE_POLICY`, `ACCESS_DENIED` |
| `resourceType` | `USER`, `FILE`, `API_KEY`, `DATABASE`, `BUCKET`, `SERVER`, `POLICY`, `SESSION` |
| `severity` | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFO` |
| `status` | `Unresolved`, `Investigating`, `Resolved`, `Dismissed` |
| `region` | AWS-style region codes (e.g. `ap-south-1`) |

Indexes cover timestamp, severity, status, role, action, resourceType, region, plus compound and text indexes.

### Users (`users`)

- `name`, `email`, `passwordHash`, `role`, `region`, `status`, `lastLoginAt`

### Files (`file_assets`)

- Metadata in MongoDB
- Binary content in Cloudinary (`cloudinaryPublicId`, `cloudinaryUrl`)

---

## API reference

Base path: `/api/v1`

Success envelope:

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

### Core

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | No | Liveness + DB status |
| `GET` | `/api/v1/logs` | No | List logs (query filters) |
| `GET` | `/api/v1/logs/summary` | No | Dashboard aggregates |
| `GET` | `/api/v1/logs/:id` | No | Single log |
| `POST` | `/api/v1/logs/upload` | No | Bulk upload (`records[]`) |

### Auth

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Create account |
| `POST` | `/api/v1/auth/login` | Issue JWT |
| `GET` | `/api/v1/auth/me` | Current user |
| `POST` | `/api/v1/auth/logout` | Audited logout |

### Workspace (JWT + permission)

| Method | Path | Permission |
|---|---|---|
| `GET/POST/PATCH/DELETE` | `/api/v1/users` | `user:read/create/update/delete` |
| `GET/POST` | `/api/v1/files` | `file:read/upload` |
| `GET` | `/api/v1/files/:id/download` | `file:download` |
| `POST` | `/api/v1/exports` | `export:create` |
| `GET` | `/api/v1/exports/download` | `export:create` |
| `GET/PATCH` | `/api/v1/policies` | `policy:read/update` |
| `GET` | `/api/v1/geo/region` | Detected region metadata |
| `GET/POST` | `/api/v1/actions` | Employee action catalog / execute |

### List logs query params

`page`, `pageSize`, `sortBy`, `sortOrder`, `search`, `role`, `severity`, `status`, `action`, `resourceType`, `region`, `dateFrom`, `dateTo`

---

## Authentication and RBAC

### Demo admin

```bash
cd server && npm run seed:admin
```

Credentials:

- Email: `admin@company.com`
- Password: `Admin123!`

`seed:admin` creates or resets the demo admin password.

### Role permissions (summary)

| Role | Notable access |
|---|---|
| `admin` | Full permissions |
| `auditor` | Read users/files/policies, export, download |
| `user` | Read users, update self, upload/download files, export |
| `viewer` | Read-only |
| `service` | File + export automation style access |

Password rules for register / create user:

- Min 8 characters
- Uppercase + lowercase + number + special character

---

## Local setup

### Prerequisites

- Node.js **20.19+** (recommended: Node 22 via `.nvmrc`)
- MongoDB Atlas URI (or local Mongo)
- Cloudinary account (for file upload/download)

```bash
nvm use
```

### 1) Backend

```bash
cd server
cp .env.example .env
```

Edit `.env` and set at least:

- `MONGODB_URI`
- `CORS_ORIGIN=http://localhost:5173`
- `JWT_SECRET` (32+ chars)
- Cloudinary values (`CLOUDINARY_URL` or cloud name + key + secret)

```bash
npm install
npm run seed:admin
npm run seed -- 1000
npm run dev
```

API: `http://localhost:8080`

### 2) Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

App: `http://localhost:5173`

`VITE_API_BASE_URL` should point to `http://localhost:8080/api/v1`.
Vite also proxies `/api` and `/health` to the backend for same-origin usage.

### Optional: generate bulk upload sample

```bash
cd server
npm run generate:sample -- 1000 ./sample-upload-1000.json
```

---

## Environment variables

### Server (`server/.env`)

| Variable | Purpose |
|---|---|
| `NODE_ENV` | `development` / `production` |
| `PORT` | API port (default `8080`) |
| `MONGODB_URI` | Mongo connection string |
| `CORS_ORIGIN` | Allowed origins (comma-separated) |
| `LOG_LEVEL` | Winston level |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window |
| `RATE_LIMIT_MAX` | General request max |
| `UPLOAD_RATE_LIMIT_MAX` | Bulk upload max |
| `BODY_LIMIT` | JSON body size (default `5mb`) |
| `UPLOAD_MAX_RECORDS` | Max records per bulk upload |
| `JWT_SECRET` | JWT signing secret |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `8h`) |
| `CLOUDINARY_URL` | `cloudinary://<key>:<secret>@<cloud_name>` |
| `CLOUDINARY_CLOUD_NAME` | Cloud name |
| `CLOUDINARY_API_KEY` | API key |
| `CLOUDINARY_API_SECRET` | API secret |

### Client (`client/.env`)

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | API base, e.g. `http://localhost:8080/api/v1` |

Never commit real secrets. `server/.env` is gitignored.

---

## Scripts

### Root

| Script | Description |
|---|---|
| `npm run dev:server` | Start API |
| `npm run dev:client` | Start Vite |
| `npm run build` | Build both apps |
| `npm run typecheck` | Typecheck both apps |
| `npm run seed` | Seed logs |

### Server

| Script | Description |
|---|---|
| `npm run dev` | `tsx watch` API |
| `npm run build` | Compile TypeScript |
| `npm run start` | Run compiled `dist` |
| `npm run seed` | Seed security logs |
| `npm run seed:admin` | Seed/reset demo admin |
| `npm run generate:sample` | Generate bulk JSON file |

### Client

| Script | Description |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview build |

---

## Bulk upload format

Request body:

```json
{
  "records": [
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
  ]
}
```

A bare JSON array is also accepted by the UI (it wraps into `{ records: [...] }`).

Behavior:

1. Array size validated (max 10,000)
2. Each record validated independently
3. Valid rows inserted in chunks of 1,000
4. Invalid rows returned in a capped failure report
5. If all rows invalid → `422`
6. Partial success → `201` with counts + failures

---

## Files and Cloudinary

Upload flow:

1. Browser reads file as base64 (max 2 MB)
2. API validates metadata + content
3. File is uploaded to Cloudinary (`resource_type: auto`)
4. Metadata stored in MongoDB
5. `UPLOAD_FILE` audit event written

Download flow:

1. Authenticated `GET /api/v1/files/:id/download`
2. Server fetches bytes from Cloudinary URL
3. Response streamed with `Content-Disposition: attachment`
4. `DOWNLOAD_FILE` audit event written

Files uploaded before Cloudinary integration may not download; re-upload them once.

---

## Exports

From **Employees → Exports**:

- Click **Export logs (JSON)**
- Browser downloads `gidy-security-logs-YYYY-MM-DD.json`
- Payload includes export metadata + `records[]`
- `EXPORT_DATA` audit event is written

Endpoint: `GET /api/v1/exports/download` (requires `export:create`).

---

## Security controls

| Threat | Control |
|---|---|
| NoSQL injection | mongo sanitize + Zod strict schemas + trusted operators only in server-built filters |
| XSS | React escaping + Helmet headers |
| Auth abuse | JWT bearer auth, bcrypt passwords, inactive-account checks |
| Brute force / abuse | Global + upload rate limits |
| Oversized payloads | Body limit + max upload records + file size cap |
| Parameter pollution | HPP |
| Mass assignment | Zod `.strict()` objects |
| CORS misuse | Explicit origin allowlist |
| Secret leakage | Central error handler; no stacks in production responses |

Additional hardening: compression, `trust proxy`, disabled `X-Powered-By`, request logging, operational vs non-operational error classification.

---

## Performance notes

- Lean queries + projections for list endpoints
- Compound indexes aligned to filter/sort patterns
- Parallel find + count for paginated lists
- Chunked `insertMany` for bulk ingestion
- Debounced search on the client (filtering still server-side)
- Lazy-loaded routes and skeleton loaders

Trade-offs:

- Offset pagination is simple and assignment-friendly; deep pages are slower than cursor pagination
- Regex multi-field search is flexible; Atlas Search is the high-scale upgrade path

---

## Deployment

### MongoDB Atlas

1. Create cluster + database user
2. Allow Render egress (or `0.0.0.0/0` for demos)
3. Put SRV URI in `MONGODB_URI`

### Backend (Render)

- Root directory: `server`
- Build: `npm install && npm run build`
- Start: `npm run start`
- Health check: `/health`
- Blueprint: `render.yaml`

Required production env vars:

- `MONGODB_URI`
- `CORS_ORIGIN` (Vercel URL)
- `JWT_SECRET`
- `NODE_ENV=production`
- Cloudinary credentials

### Frontend (Vercel)

- Root directory: `client`
- Framework: Vite
- Build: `npm run build`
- Output: `dist`
- Env: `VITE_API_BASE_URL=https://<your-render-service>/api/v1`
- SPA fallback via `vercel.json`

---

## Troubleshooting

| Symptom | Likely fix |
|---|---|
| Frontend cannot reach API | Check `VITE_API_BASE_URL` and `CORS_ORIGIN` |
| Login fails for demo admin | Run `npm run seed:admin` |
| Create user returns 401 | Stale JWT; log out and sign in again |
| Date filter errors | Ensure Date From ≤ Date To |
| File download fails on old rows | Re-upload after Cloudinary setup |
| Bulk upload validation failures | Match enum values and email/IP/timestamp formats exactly |
| Cloudinary upload fails | Verify `CLOUDINARY_*` env vars and restart API |

---

## License

Private assignment / portfolio project. All rights reserved by the author unless otherwise stated.
