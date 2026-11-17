# Phase 1B — Supabase PostgreSQL + Render API

## Deployment topology

- Frontend: GitHub Pages (existing deployment workflow).
- API: Render Node web service, rooted at `backend/`.
- Database: Supabase PostgreSQL.
- ORM: Prisma 6.

## 1. Create the Supabase project

1. Create a new Supabase project and save its database password securely.
2. Wait until the database is ready.
3. Open **Connect** and choose **Session pooler** (port 5432) for a Render-hosted service where direct IPv6 connectivity is not confirmed.
4. Copy the complete PostgreSQL connection URI. Do not paste it into GitHub source files, issues, screenshots, or this chat.

Supabase's direct endpoint is IPv6 by default on many projects; the shared session pooler is IPv4-compatible. Use the exact host and username from the Connect dialog. URL-encode reserved characters in the password.

## 2. Create the Render service

The repository root contains `render.yaml`. In Render:

1. Choose **New → Blueprint** and connect `Kasuwarkanawa/Kasuwar-kanawa`.
2. Select branch `chatgpt-access-test-2026-11-17` while Phase 1B is being verified.
3. Review the proposed service. It must be named `kasuwar-kanawa-api` and use `backend` as its root directory.
4. Add the requested secret values when prompted:
   - `DATABASE_URL`: Supabase Session Pooler URI.
   - `FRONTEND_ORIGIN`: exact browser origin of the deployed frontend (scheme + hostname only, no path).
   - `ADMIN_EMAIL`, `ADMIN_PHONE`, `ADMIN_FULL_NAME`: initial administrator identity.
   - `ADMIN_PASSWORD`: a unique password of at least 12 characters.
5. Deploy and wait for the Render service to become healthy.

The service listens on Render's `PORT` and exposes `GET /api/health`. A successful health response must report both `status: ok` and `database: connected`.

## 3. Bootstrap a NEW, EMPTY Supabase database

Important: this repository currently has no complete initial Prisma migration. Its migrations README explicitly directs new databases to be created from `schema.prisma` with `prisma db push`. The existing migration only removes legacy OTP structures; it is not a complete initial schema.

Do not run this against a database containing valuable data.

1. In GitHub repository **Settings → Secrets and variables → Actions → New repository secret**, add:
   - `SUPABASE_DATABASE_URL` (same Supabase Session Pooler URI).
   - `ADMIN_EMAIL`
   - `ADMIN_PHONE`
   - `ADMIN_FULL_NAME`
   - `ADMIN_PASSWORD` (at least 12 characters).
2. Open **Actions → Bootstrap Supabase Database → Run workflow**.
3. Keep the workflow branch set to `chatgpt-access-test-2026-11-17`.
4. Tick the confirmation only if this is a new, empty database, then run it.
5. Confirm the Prisma schema push and Super Admin seed steps both pass.

This workflow is manual and confirmation-gated. It is not part of every deployment. Do not rerun it on a database containing production data without reviewing the schema diff first.

## 4. Point GitHub Pages to Render

1. Copy the Render service URL, for example `https://kasuwar-kanawa-api.onrender.com`.
2. In GitHub repository **Settings → Secrets and variables → Actions**, create/update secret `VITE_API_URL` with the full API base URL ending in `/api`, e.g. `https://kasuwar-kanawa-api.onrender.com/api`.
3. The existing `.github/workflows/deploy.yml` already passes `VITE_API_URL` into the Vite build.
4. Deploy the frontend from the tested branch only after reviewing the deployment plan. The current Pages workflow deploys `main`, so do not merge this branch until the production configuration and tests are verified.

## 5. Cookie and custom-domain requirement

The current production session cookie is configured as `Secure; SameSite=None` to support cross-origin requests. Some browsers restrict third-party cookies, which can break login persistence when a `github.io` frontend calls an `onrender.com` API.

For reliable production sessions, use a custom frontend domain and an API subdomain under the same registrable domain (for example, `www.your-domain` and `api.your-domain`), then set `FRONTEND_ORIGIN` to the exact frontend origin and configure the corresponding DNS/custom domains. Do not assume the example domain is yours; use a domain you control.

## 6. Production verification checklist

- Render deploy succeeds and `/api/health` returns database connected.
- Supabase schema exists and the initial Super Admin is seeded.
- GitHub Pages build receives the correct `VITE_API_URL`.
- Buyer registration, login, `/api/auth/me`, and logout work in a real browser.
- Seller registration remains pending until approved.
- Admin login and protected admin endpoints reject non-admin users.
- Test cookie persistence on Android Chrome and desktop browsers.
- Keep secrets only in Supabase/Render/GitHub secret settings; never commit them.

## Current boundary

A successful Render deploy and health check prove the API can reach PostgreSQL; they do not prove every marketplace feature is migrated from LocalStorage. Product, cart, checkout, and order data integration remain subsequent work.
