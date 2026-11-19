# Supabase Edge API migration (Phase 1)

Status: **in progress — not deployed and not connected to the live website**.

## Safety boundary
- Work branch: `chatgpt-access-test-2026-11-17`
- Keep `main`, GitHub Pages production, and the existing Express backend unchanged until the full migration is tested and separately approved.
- The Edge Function uses the Supabase service-role key only in server-side Edge Function secrets. Never place it in Vite variables, browser code, or committed files.
- The private `payment-receipts` bucket remains private; only authenticated Super Admin endpoints may issue short-lived signed URLs.

## Runtime design
GitHub Pages serves the static Vite frontend. Supabase Edge Functions provide the server runtime and access the existing PostgreSQL schema through the server-side Supabase client. No Northflank or Render service is required.

## Compatibility requirements
The current frontend expects the Express-compatible `/api/*` routes and cookie-backed sessions. The migration will preserve those paths and response shapes, and keep the security rules:
- Public product responses never expose seller phone/WhatsApp.
- Seller receives buyer name/contact/address only after Admin approves the payment/order.
- OPay transfer confirmation and receipt must be reviewed by Admin.
- COD requires Admin approval before Seller receives buyer details.
- Receipts stay in private Storage and signed URLs are short-lived and Admin-only.
- Stock changes, order status, and tracking timeline updates must be atomic.

## Route coverage
The first implementation slice includes health, registration/login/session, public catalog/categories/reviews/reports, public announcements/advertisements/flash sales, and newsletter subscriptions. Remaining buyer/seller/admin/cart/order/content-management endpoints must be implemented and tested before deployment.

## Required secrets
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FRONTEND_ORIGIN=https://kasuwarkanawa.github.io`

Optional `EXTRA_ALLOWED_ORIGINS` is a comma-separated allowlist for explicitly approved preview origins. Do not add broad wildcard CORS.
