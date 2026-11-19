# Supabase Edge API migration — Phase 1

Status: **Edge Function deployed (version 2, ACTIVE); GitHub Pages production has not been switched over.**

## Safety boundary
- Work branch: `chatgpt-access-test-2026-11-17`
- Keep `main`, GitHub Pages production, and the existing Express backend unchanged until the full migration is tested and separately approved.
- The Edge Function uses the Supabase secret/service-role credential only server-side. Never place it in Vite variables, browser code, or committed files.
- The private `payment-receipts` bucket remains private; only authenticated Super Admin endpoints may issue five-minute signed URLs.

## Runtime design
GitHub Pages serves the static Vite frontend. Supabase Edge Functions provide the server runtime and access the existing PostgreSQL schema through the server-side Supabase client. No Northflank or Render service is required.

The deployed function is `api` at:
`https://efirbpzfimzmpchsovbz.supabase.co/functions/v1/api`

It uses the existing opaque `kk_session` cookie model, bcrypt password hashes, database-backed session hashes, origin allowlisting, publishable-key validation, and database-backed auth rate limiting. The function is configured with `verify_jwt = false` because it validates the project's publishable key and its own session cookie in the handler.

## Implemented route groups
- Authentication: register, login, Admin login, current session, logout, and one-time secret-protected first Admin bootstrap.
- Buyer and Seller profiles; persistent buyer cart; seller product CRUD.
- Public catalog, categories, reviews, product reports, announcements, advertisements, flash sales, newsletter.
- Admin users/status, category management, product moderation/edit/removal, reports, announcements, advertisements and flash-sale management.
- Orders: transactional checkout, Buyer/Seller/Admin order lists, OPay payment confirmation, private receipt upload, Admin receipt signed URL, OPay verification, COD approval, Seller processing/rejection, logistics hand-off, Admin logistics status transitions.
- Frontend client wiring: API URL and public key, buyer cart, buyer profile/order history, seller profile, seller order/product/report actions, Admin data and logistics console, product reviews/reports, public announcements.

## Database-side functions
- `edge_checkout_order`: validates one-seller checkout, locks/checks stock, decrements inventory, creates order/items/tracking steps in one transaction.
- `edge_order_action`: role-checked state transitions for payment, COD approval, Seller fulfillment, logistics and cancellation; restores stock on rejection/cancellation.
- `edge_consume_rate_limit`: database-backed authentication rate limiting.
- `edge_bootstrap_first_admin`: serializes first-Admin creation and prevents duplicate first Admin accounts.
- `edge_sync_order_tracking_steps`: keeps dispatched/delivered timeline steps synchronized with order status.

All callable RPC functions are executable by `service_role` only; anon and authenticated roles have no execute permission. Public marketplace tables remain inaccessible directly to anon/authenticated; the Edge API is the access boundary.

## Verified so far
- Deno Edge API type-check: passed.
- Frontend build and backend checks: passed on the working branch.
- Edge Function deployment: version 2, status ACTIVE.
- Database permission check: service_role-only execution for checkout, order-state, rate-limit and first-Admin RPCs; anon/authenticated cannot execute them.
- Public tables: anon/authenticated SELECT grants remain zero.
- Security advisor reports the expected INFO notice for RLS-enabled tables without policies. Direct table privileges are revoked from anon/authenticated, and all application access goes through the authenticated Edge API.

## Remaining before Phase 1 is complete
1. Run a live smoke test of the deployed health endpoint and confirm the browser accepts the cross-site `kk_session` cookie from GitHub Pages to Supabase.
2. Set `BOOTSTRAP_ADMIN_TOKEN` in Supabase Edge Function Secrets and create the first Super Admin using `ADMIN-BOOTSTRAP.md`. No Super Admin account exists yet.
3. End-to-end test registration/login/logout, cart, checkout/stock rollback, OPay receipt flow, COD approval, Seller contact privacy, reports, and logistics tracking.
4. Only after those tests pass should the frontend be switched on in production. Do not merge PR #2 or update `main` without the user's explicit approval.
