# Phase 1 Authentication Deployment

The frontend now uses the backend session API for buyer, seller, and Super Admin authentication.

## Frontend configuration

Set `VITE_API_URL` in the frontend build environment to the backend API base URL, including the `/api` suffix.

Example:

```env
VITE_API_URL=https://your-backend-host.example/api
```

For local development, the client uses `http://localhost:4000/api` when `VITE_API_URL` is not set. In production, it falls back to same-origin `/api`; this requires a reverse proxy that routes `/api` to the backend. A static GitHub Pages deployment cannot host the Express API, so configure the real backend URL before building the production frontend.

## Backend configuration

Set these values in the backend hosting provider (never commit real secrets):

- `NODE_ENV=production`
- `DATABASE_URL` to the managed PostgreSQL connection string
- `FRONTEND_ORIGIN` to the exact frontend origin, including scheme and hostname
- `SESSION_COOKIE_NAME=kk_session`
- `SESSION_TTL_DAYS=14`
- `ADMIN_EMAIL`, `ADMIN_PHONE`, `ADMIN_FULL_NAME`
- `ADMIN_PASSWORD` to a unique secret of at least 12 characters

Run the Prisma migrations and seed the Super Admin from the backend environment before enabling admin access.

## Supported account flows in this phase

- Buyer registration creates an active account and establishes a server session.
- Seller registration creates a pending account; a Super Admin must approve it before seller login.
- Super Admin login uses the role-restricted `/api/auth/admin/login` endpoint.
- Logistics registration remains paused in the frontend because the current backend schema has no Logistics role or company models. It is not written to browser LocalStorage as a substitute.
- Password reset is not yet implemented by the backend; the UI no longer displays a false “reset sent” success message.

## Important boundary

This phase secures identity and role checks at the authentication boundary. Other marketplace data panels still contain LocalStorage-backed functionality and must be migrated to backend APIs in subsequent phases. Do not treat the entire marketplace as production-ready solely because authentication is connected.
