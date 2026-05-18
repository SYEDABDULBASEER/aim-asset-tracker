# Firebase setup (Firestore + Web app)

This app can load **assets** and **service desk tickets** from **Cloud Firestore** when you provide the Firebase **Web app** configuration as Vite environment variables. Until those variables are set, the app uses an **in-memory demo store** (no persistence).

## What gets stored in Firestore

- **Collection:** `assets`
- **Document ID:** the asset id (for example `LAP-0001`, `GEN-00042`)
- **Fields:** same shape as the in-app `Asset` model (`id`, `name`, `category`, `assignedTo`, `department`, `status`, `warrantyUntil`, `lastServiceAt`, `serial`, `location`, `purchaseDate`)

- **Collection:** `tickets`
- **Document ID:** the ticket id (for example `TKT-1031` or a generated `TKT-…` id)
- **Fields:** same shape as the in-app `Ticket` model (`id`, `title`, `assetId`, `priority`, `status`, `assigneeName`, `requesterName`, `createdAt`, `updatedAt`, `slaDueAt`, `messages` — `messages` is an array of `{ id, author, body, createdAt }`)

The dashboard summary, assets APIs, and tickets APIs read from Firestore when Firebase is configured.

## Prerequisites

- A Google account
- Node.js and npm (this repo)
- Optional: Firebase CLI (`npm i -g firebase-tools`) for emulators or rule deployment

## Step 1 — Create a Firebase project

1. Open [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or use an existing project).
3. Follow the wizard (Google Analytics is optional for this feature).

## Step 2 — Enable Firestore

1. In the left sidebar, go to **Build → Firestore Database**.
2. Click **Create database**.
3. Choose a mode:
   - **Start in test mode** is fine for local development only (data is open for a short time; see Firebase’s warning). You will tighten rules before any real data.
   - Or **Start in production mode** and immediately add the rules in Step 5.

Pick a **region** close to your users (cannot be changed later without creating a new database).

## Step 3 — Register a Web app and copy config

1. In **Project settings** (gear icon) → **Your apps**, click the **Web** icon (`</>`) to add a web app.
2. Register the app (nickname is arbitrary, for example `asset-desk-web`).
3. Copy the `firebaseConfig` object values. You need these keys (names used by this repo’s `.env`):

| Firebase config key | Environment variable in this repo   |
| ------------------- | ----------------------------------- |
| `apiKey`            | `VITE_FIREBASE_API_KEY`             |
| `authDomain`        | `VITE_FIREBASE_AUTH_DOMAIN`         |
| `projectId`         | `VITE_FIREBASE_PROJECT_ID`          |
| `storageBucket`     | `VITE_FIREBASE_STORAGE_BUCKET`      |
| `messagingSenderId` | `VITE_FIREBASE_MESSAGING_SENDER_ID` |
| `appId`             | `VITE_FIREBASE_APP_ID`              |

## Step 4 — Configure the repo     

1. Copy `.env.example` to `.env` in the project root.
2. Paste all six values into the matching `VITE_FIREBASE_*` variables.
3. Restart the dev server (`npm run dev`) so Vite picks up the new env vars.

**Security note:** These are **public Web SDK** values. Protection comes from **Firestore Security Rules** (and later **Firebase Authentication**), not from hiding the API key.

## Step 5 — Firestore and Storage rules

Use the versioned rules in the repo root:

- `firestore.rules` — authenticated reads; writes for `admin` / `agent` custom claims; admin-only employee/vendor/org settings; audit logs are server-written only.
- `storage.rules` — authenticated reads; writes for `admin` / `agent` under `assets/{assetId}/documents/**`.

Deploy with Firebase CLI (`firebase deploy --only firestore:rules,storage`) or paste into the Firebase console.

## Step 5b — Roles (custom claims)

| Role | Capabilities |
| ---- | ------------ |
| `admin` | Full read/write including employees, vendors, org settings, audit log reads, demo seed (non-production builds) |
| `agent` | Operational read/write on assets, tickets, transfers, maintenance |
| `viewer` | Read-only on operational domains |

Bootstrap the first admin with the Firebase Admin SDK or CLI by setting `role: "admin"` on the user’s custom claims.

## Step 5c — Server Admin SDK (Cloudflare Workers)

Set `FIREBASE_SERVICE_ACCOUNT_JSON` to the service account JSON string (Wrangler secret in production). Server mutations verify the caller’s Firebase ID token, enforce RBAC, and write through the Admin SDK when this secret is present.

## Step 6 — Seed demo data into Firestore

After rules allow writes:

1. Run the app and open **Settings**.
2. Use **Seed Firestore with demo data** (writes ~200 documents into `assets` and demo rows into `tickets`).

Alternatively, call the server function from your app’s existing RPC mechanism (the button uses the same `seedFirestoreDemoData` server function).

If the collection is empty before seeding, the Assets page will show **0** rows until the seed completes.

## Step 7 — Verify

1. Open **Assets** (`/assets`). You should see paging and filters working against Firestore.
2. Open **Dashboard** (`/`). KPIs and charts should reflect Firestore data.

## Optional: Firebase Emulator Suite

1. Install CLI: `npm i -g firebase-tools`
2. `firebase login`
3. In an empty folder or project subfolder, `firebase init emulators` and enable **Firestore**.
4. Start emulators and point the Web SDK at emulator hosts (requires extra client config not wired in this demo). For production-like testing, using a real dev project is simpler.

## Cloudflare Workers / production note

This project can be built for **Cloudflare Workers** (`wrangler.jsonc`). The **Firebase JS SDK** is intended for browsers and **Node-style** server runtimes. On **strict Workers** edge runtimes, Firestore access may require a different approach (HTTP API, proxy service, or a small Node backend).

For **local `npm run dev`** and typical **Node SSR** deployments, the current integration is appropriate. Before going live on Workers, run a production build and confirm Firestore calls succeed in that runtime.

## Troubleshooting

| Symptom                       | What to check                                                                           |
| ----------------------------- | --------------------------------------------------------------------------------------- |
| App still uses in-memory data | All six `VITE_FIREBASE_*` variables set? Dev server restarted?                          |
| Permission denied             | Firestore rules; project billing if using features that require it                      |
| Empty Assets list             | Seed the `assets` collection; confirm document fields match the `Asset` shape           |
| Wrong or partial documents    | `id` in the document body should match the document id; use **Seed** to reset demo data |

## Related files in this repo

- `src/lib/firebase/env.ts` — detects configuration from `import.meta.env`
- `src/lib/firebase/init.ts` — initializes the Firebase app and Firestore
- `src/lib/firebase/assets.firestore.ts` — CRUD + seed batch writes
- `src/utils/assets-source.server.ts` — chooses Firestore vs in-memory store
- `src/utils/assets.functions.ts` — server functions used by the UI
- `src/utils/seed.assets.ts` — demo dataset used for local store and Firestore seed
