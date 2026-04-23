# ScholarlySync — Session Continuity Plan

> Keep this file. Reference it at the start of every new session.

## Stack Decision Log
| Concern | Decision |
|---|---|
| AI Provider | **Anthropic Claude** (`@anthropic-ai/sdk`) |
| Auth | **Full JWT** — access token (15 min) + refresh token (7 days, stored in Redis) |
| File Storage | **Local disk** — `backend/uploads/` via Multer |
| Database | **Supabase** (PostgreSQL) via Prisma |
| Cache / Queue Broker | **Upstash Redis** via IORedis |
| Docker | Deferred — manual Supabase + Upstash instead |

---

## 14-Step Scaffolding Tracker

- [x] Step 1  — Backend package.json, tsconfig, .env.example
- [x] Step 2  — Prisma schema (5 models: User, Course, Assignment, Submission, Material, Notification)
- [x] Step 3  — Config layer (env.ts, prisma.ts, redis.ts)
- [x] Step 4  — Express app skeleton (app.ts, index.ts)
- [x] Step 5  — Full Auth middleware (JWT authenticate, requirePremium, requireRole)
- [x] Step 6  — Multer file upload middleware + errorHandler
- [x] Step 7  — BullMQ queue definitions (submission, notification, broadcast)
- [x] Step 8  — All controllers (Auth, Assignment, Submission, Material, AI, Notification, Admin)
- [x] Step 9  — All routes wired
- [x] Step 10 — Workers (submissionWorker, notificationWorker, broadcastWorker)
- [x] Step 11 — Services (ai.service → Claude API, notification.service, file.service)
- [x] Step 12 — WebSocket server (wsServer.ts + wsEvents.ts)
- [x] Step 13 — Prisma seed file

---

## Phase 2: Frontend Implementation (Current Goal)

- [x] Step 14 — Scaffold Vite + React + TypeScript + Tailwind
- [/] Step 15 — Setup Redux Toolkit / React Query for State & API
- [x] Step 16 — Core Layout (Navbar, Sidebar, Auth Protection)
- [x] Step 17 — Auth Pages (Login, Register)
- [/] Step 18 — Dashboard (Course list, upcoming assignments)
- [ ] Step 19 — Course/Assignment View + Submission Upload
- [ ] Step 20 — AI Study Room (Real-time streaming integration)
- [ ] Step 21 — Real-time Notifications (WebSocket integration)
- [x] Step 22 — Roles & Permissions Documentation (ROLES_PERMISSIONS.md)

---

## Environment Variables Needed
Located at: `backend/.env` (copy from `backend/.env.example`)

```
DATABASE_URL=           # Supabase direct connection URL
DIRECT_URL=             # Supabase direct URL (session/pooler)
REDIS_URL=              # Upstash Redis URL (rediss://...)
JWT_SECRET=             # 32+ char random string
JWT_REFRESH_SECRET=     # Different 32+ char random string
ANTHROPIC_API_KEY=      # Your Claude API key (sk-ant-...)
FRONTEND_URL=http://localhost:5173
PORT=3000
NODE_ENV=development
```

---

## Backend Verification Status
| Feature | Status | Verification File |
|---|---|---|
| **Auth** | ✅ 100% | `auth.controller.ts` |
| **RBAC / Premium** | ✅ 100% | `requireRole.ts`, `requirePremium.ts` |
| **Assignments** | ✅ 100% | `assignment.controller.ts` |
| **Submissions** | ✅ 100% | `submissionWorker.ts` |
| **AI (Claude)** | ✅ 100% | `ai.service.ts` |
| **Real-time** | ✅ 100% | `wsServer.ts` |
| **Queues** | ✅ 100% | `bullmq` dashboard ready |

---

## How to Get Supabase DB URL
1. Go to https://supabase.com → Sign In → New Project
2. Set project name: `scholarlysync`, choose a region, set a strong password → **Save the password**
3. Wait ~2 min for project to provision
4. Go to **Settings → Database → Connection String**
5. Select **URI** tab → copy the string → replace `[YOUR-PASSWORD]` with the password you saved
6. That is your `DATABASE_URL`
7. Go to **Settings → Database → Connection Pooling** → copy the Pooler URI → that is your `DIRECT_URL` (used by Prisma for migrations)

> Note: If on Supabase free tier, use the "Transaction" pooler URL for `DATABASE_URL` and the "Session" pooler or Direct URL for `DIRECT_URL`.

---

## How to Get Upstash Redis URL
1. Go to https://upstash.com → Sign In → **Create Database**
2. Name: `scholarlysync-redis`, Region: closest to you, Type: **Regional**
3. Click **Create**
4. On the database page → copy the **Redis URL** (starts with `rediss://`)
5. That is your `REDIS_URL`

---

## Commands to Run After Filling .env

```bash
cd backend
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

---

## Key File Map
```
f:\FS_Leaner\
├── PLAN.md                          ← YOU ARE HERE
├── backend/
│   ├── prisma/schema.prisma         ← All DB models
│   ├── prisma/seed.ts               ← Demo data
│   ├── src/config/env.ts            ← Zod env validation
│   ├── src/config/prisma.ts         ← Prisma singleton
│   ├── src/config/redis.ts          ← IORedis connection
│   ├── src/index.ts                 ← Server entry point
│   ├── src/app.ts                   ← Express app
│   ├── src/middlewares/             ← Auth, Premium, Role, Upload, Error
│   ├── src/controllers/             ← All route handlers
│   ├── src/routes/                  ← Express routers
│   ├── src/queues/                  ← BullMQ queue definitions
│   ├── src/workers/                 ← BullMQ worker processes
│   ├── src/services/                ← Claude AI, Notification, File
│   └── src/websocket/               ← WebSocket server
└── frontend/                        ← Step 14 (not started)
```
