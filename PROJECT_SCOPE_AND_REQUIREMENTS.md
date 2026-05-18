# Project scope and requirements — aim-asset-tracker

**Document purpose:** Single source of truth for **what we are building** (scope) and **what “done” means** (requirements). Use this before prioritizing features or onboarding contributors.

**Product working name:** Enterprise Asset Desk — a web application for IT / operations teams to track hardware assets, assignments, maintenance, and related workflows.

**Stack (reference):** Vite, React 19, TanStack Start (SSR), TanStack Router, TanStack Query, Tailwind CSS v4, shadcn/ui (Radix), Zod. Deployment target: **Cloudflare Workers** (Worker entry: `src/server.ts`). Optional persistence: **Cloud Firestore** for assets when `VITE_FIREBASE_*` variables are set (see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)).

---

## 1. Vision and goals

### 1.1 Vision

Provide a **single desk** where administrators and agents can see asset health, assignments, and risk at a glance; drill into assets; and (when fully built) run ticketing, maintenance, and allocation workflows with **auditable**, **role-aware** access.

### 1.2 Primary goals

1. **Accurate asset inventory** — authoritative list of assets with identity, location, assignment, status, and warranty/service signals.
2. **Operational clarity** — dashboards and reports that surface exceptions (e.g. warranty risk, stale service) without manual spreadsheets.
3. **Controlled change** — transfers, maintenance, and tickets tied to assets and people, with history suitable for compliance conversations.
4. **Deployable SaaS shape** — SSR-friendly app, clear env configuration, path to multi-tenant auth and hardened rules.

### 1.3 Non-goals (current phase)

- Full ERP or procurement replacement.
- Native mobile apps as a first-class deliverable.
- Guaranteed production multi-tenancy until auth and data isolation are explicitly designed.

---

## 2. Project scope

### 2.1 In scope (product surface)

The **information architecture** of the app is defined by file-based routes under `src/routes/`:

| Area        | Route(s)                 | Scope summary                                                                                                                                                            |
| ----------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Dashboard   | `/`                      | Executive-style KPIs, distribution, alerts, and activity; **asset-driven metrics** where implemented; ticket/feed widgets may remain supplementary until backed by data. |
| Assets      | `/assets`, `/assets/$id` | List, search/filter, pagination, detail; **CRUD + list APIs** via server functions; Firestore or in-memory store.                                                        |
| Tickets     | `/tickets`               | Kanban/table UX, conversations — **requires** backend model and auth when promoted beyond demo.                                                                          |
| Allocation  | `/allocation`            | Transfer history / requests — **requires** persistence and workflow rules.                                                                                               |
| Maintenance | `/maintenance`           | Jobs table and summaries — **requires** scheduling data and integrations.                                                                                                |
| Employees   | `/employees`             | Directory-style cards — **requires** HR/identity source or admin CRUD.                                                                                                   |
| Vendors     | `/vendors`               | Vendor and SLA presentation — **requires** vendor master data.                                                                                                           |
| Reports     | `/reports`               | Charts and analytics — **requires** consistent metrics pipeline (not only client-side random/demo).                                                                      |
| Settings    | `/settings`              | Org configuration, seeding, Firebase status — operational entry point; **production settings** need auth and safe rules.                                                 |

### 2.2 In scope (technical platform)

- **SSR** with TanStack Start; resilient server error handling (`src/server.ts`, `src/start.ts`).
- **Server functions** for domain operations that must not live only in the browser (assets and dashboard summary today).
- **Typed models** with Zod (e.g. `Asset`, list query in `src/lib/models.ts`).
- **Styling system** — design tokens in `src/styles.css`, reusable UI in `src/components/ui` and `src/components/ui-kit`.

### 2.3 Out of scope (until explicitly added)

- **Billing**, subscriptions, and usage metering.
- **Email/SMS** delivery and full notification infrastructure.
- **Deep integrations** (Jamf, Intune, ServiceNow) unless listed in a future integration phase.

Authentication and authorization are implemented for a **single organization** using Firebase Auth, custom-claim roles (`admin`, `agent`, `viewer`), server-side ID token verification, and Firestore/Storage rules. Multi-tenant org isolation remains a future phase.

### 2.4 Phased delivery (recommended)

| Phase                     | Focus                                                | Exit criteria (high level)                                                                                 |
| ------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **P0 — Foundation**       | SSR app, routing, design system, asset read model    | Assets list/detail from server; dashboard reads same source; env + Firestore doc for optional persistence. |
| **P1 — Asset operations** | Create/update/delete, import/export, QR labels       | Mutations audited in UI; bulk paths defined; errors surfaced consistently.                                 |
| **P2 — Core workflows**   | Tickets, maintenance, allocation                     | Entities in Firestore (or chosen DB); React Query wired per domain; basic state machines documented.       |
| **P3 — Trust**            | Auth, RBAC, audit log, security rules                | No anonymous write in production; role matrix documented; observability (logging/Sentry) considered.       |
| **P4 — Scale & polish**   | Performance, pagination everywhere, reports accuracy | SLAs for list endpoints; reports backed by queries or materialized views as needed.                        |

---

## 3. Functional requirements

Requirements are grouped by domain. **Priority:** P0 = must have for “credible asset desk”; P1 = should have soon; P2 = later.

### 3.1 Assets

| ID   | Requirement                                                | Priority | Notes                                                                                 |
| ---- | ---------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------- |
| A-01 | List assets with **pagination** and stable ordering        | P0       | Filters: category, department, status, warranty band, free-text search as applicable. |
| A-02 | View **asset detail** by id (404 when missing)             | P0       |                                                                                       |
| A-03 | **Create** asset with validated payload (Zod)              | P1       | Id uniqueness enforced server-side.                                                   |
| A-04 | **Update** partial fields                                  | P1       |                                                                                       |
| A-05 | **Delete** asset (or soft-delete policy)                   | P1       | Product decision: hard vs soft delete.                                                |
| A-06 | **Persist** assets when cloud DB configured                | P0       | Today: Firestore collection `assets`; otherwise in-memory for dev/demo.               |
| A-07 | **Seed** demo dataset for Firestore from Settings (or CLI) | P1       | For demos and QA only; guard in production.                                           |

### 3.2 Dashboard

| ID   | Requirement                                               | Priority | Notes                                                                        |
| ---- | --------------------------------------------------------- | -------- | ---------------------------------------------------------------------------- |
| D-01 | KPIs and charts derived from **authoritative asset data** | P0       | Warranty and status distribution, counts by department/category as designed. |
| D-02 | “Director-level” **risk / action** panels                 | P1       | Driven by rules on asset fields (e.g. expiring warranty).                    |
| D-03 | Ticket / activity widgets                                 | P2       | Becomes P0 when tickets are persisted and scoped to user/org.                |

### 3.3 Tickets

| ID   | Requirement                                                  | Priority | Notes |
| ---- | ------------------------------------------------------------ | -------- | ----- |
| T-01 | Ticket entity (id, status, assignee, asset link, timestamps) | P1       |       |
| T-02 | Create/update status through server functions                | P1       |       |
| T-03 | Kanban and table views on same data                          | P1       |       |

### 3.4 Allocation (transfers)

| ID   | Requirement                           | Priority | Notes                        |
| ---- | ------------------------------------- | -------- | ---------------------------- |
| L-01 | Transfer request and history records  | P2       | Approve/reject workflow TBD. |
| L-02 | Tie transfers to assets and employees | P2       |                              |

### 3.5 Maintenance

| ID   | Requirement                          | Priority | Notes                           |
| ---- | ------------------------------------ | -------- | ------------------------------- |
| M-01 | Maintenance job CRUD and status      | P2       | Link to asset; optional vendor. |
| M-02 | Simple scheduling or due-date fields | P2       |                                 |

### 3.6 Employees and vendors

| ID   | Requirement                             | Priority | Notes             |
| ---- | --------------------------------------- | -------- | ----------------- |
| E-01 | Employee directory backed by data store | P2       | Or sync from IdP. |
| V-01 | Vendor master with SLA metadata         | P2       |                   |

### 3.7 Reports

| ID   | Requirement                                           | Priority | Notes                                                        |
| ---- | ----------------------------------------------------- | -------- | ------------------------------------------------------------ |
| R-01 | Charts reflect **stored** aggregates or query results | P2       | Avoid production reliance on `Math.random()` or static CSVs. |
| R-02 | Export (CSV/PDF) as product needs                     | P2       |                                                              |

### 3.8 Settings and administration

| ID   | Requirement                                                | Priority    | Notes                            |
| ---- | ---------------------------------------------------------- | ----------- | -------------------------------- |
| S-01 | Environment-driven Firebase connection status              | P1          |                                  |
| S-02 | Dangerous operations (seed, mass delete) **gated by auth** | P0 for prod | Dev-only acceptable until P3.    |
| S-03 | Categories, locations, SLA templates                       | P2          | Backed by config or collections. |

---

## 4. Non-functional requirements

| ID   | Area                | Requirement                                                                                                             |
| ---- | ------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| N-01 | **Security**        | Production Firestore rules must not use unauthenticated open write; align with Firebase Auth when introduced.           |
| N-02 | **Privacy**         | Do not log full PII in server logs; define retention for audit logs when implemented.                                   |
| N-03 | **Reliability**     | SSR errors return safe HTML fallback; log server-side failures with enough context to debug.                            |
| N-04 | **Performance**     | List endpoints support limits/offsets (assets today); avoid loading unbounded collections on dashboard in production.   |
| N-05 | **Deployability**   | Build and Worker config documented; secrets via platform env (e.g. Wrangler), not committed.                            |
| N-06 | **Maintainability** | Domain types in Zod; server-only modules not imported from client-only graphs (TanStack import-protection conventions). |

---

## 5. Implementation status (snapshot)

This matrix maps **requirements above** to the **current codebase** at the time of writing. Update this section when phases complete.

| Domain                                               | Data source                               | Server functions / API                   | UI route                                                  |
| ---------------------------------------------------- | ----------------------------------------- | ---------------------------------------- | --------------------------------------------------------- |
| Assets                                               | Firestore `assets` **or** in-memory seed  | Yes (`src/utils/assets.functions.ts`)    | Wired (CRUD, import/export, QR, warranty filters)         |
| Dashboard (assets + tickets + audit activity)        | Same stores                               | Yes (`src/utils/dashboard.functions.ts`) | KPIs, distribution, ticket volume, alerts, audit feed     |
| Tickets                                              | Firestore `tickets` **or** in-memory seed | Yes (`src/utils/tickets.functions.ts`)   | Wired (`/tickets`)                                        |
| Allocation, maintenance                              | Firestore **or** in-memory seed         | Yes (transfers/maintenance functions)    | Wired with approve/reject and asset side effects            |
| Employees, vendors                                   | Firestore **or** in-memory seed         | Yes (list + admin CRUD)                  | Wired (directory + admin CRUD)                            |
| Reports                                              | Aggregated from stored data               | Yes (`src/utils/reports.functions.ts`)   | Wired (CSV export)                                        |
| Settings                                             | Firebase status, org settings, audit      | Yes (settings/audit/seed)                | Org config, audit log, admin seed                         |

---

## 6. Related documents

- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) — Firestore collection shape, env vars (`VITE_FIREBASE_*`), security rules guidance.
- `.env.example` — Required environment variable names for local setup.

---

## 7. Document control

| Version | Date       | Summary                                                                                         |
| ------- | ---------- | ----------------------------------------------------------------------------------------------- |
| 1.1     | 2026-05-12 | Tickets: Firestore/memory, server functions, dashboard ticket widgets, seed includes `tickets`. |
| 1.0     | 2026-05-12 | Initial scope and requirements baseline aligned with repo routes and asset/Firestore work.      |

When scope changes (e.g. new integration or dropping a module), update **Section 2** and the **status matrix** in **Section 5** in the same pull request.
