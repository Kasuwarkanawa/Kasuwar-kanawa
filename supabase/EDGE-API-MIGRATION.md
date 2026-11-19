# Supabase Edge API migration — Phase 1

Status: **implementation in progress; Edge Function is not deployed and GitHub Pages production is not connected yet.**

## Safety boundary
- Work branch: `chatgpt-access-test-2026-11-17`
- Keep `main`, GitHub Pages production, and the existing Express backend unchanged until the full migration is tested and separately approved.
- The Edge Function uses the Supabase service-role key only in server-side Edge Function secrets. Never place it in Vite variables, browser code, or committed files.
- The private `payment-receipts` bucket remains private; only authenticated Super Admin endpoints may issue five-minute signed URLs.

## Runtime design
GitHub Pages serves the static Vite frontend. Supabase Edge Functions provide the server runtime and access the existing PostgreSQL schema through the server-side Supabase client. No Northflank or Render service is required.

The function uses the existing opaque `kk_session` cookie model, bcrypt password hashes, database-backed session hashes, origin allowlisting, publishable-key validation, and database-backed auth rate limiting. The API is configured with `verify_jwt = false` because it validates its own session cookie and checks the project's publishable key in the handler.

## Implemented route groups
- Authentication: register, login, Admin login, current session, logout.
- Buyer and Seller profiles; persistent buyer cart; seller product CRUD.
- Public catalog, categories, reviews, product reports, announcements, advertisements, flash sales, newsletter.
- Admin users/status, category management, product moderation/edit/removal, reports, announcements, advertisements and flash-sale management.
- Orders: transactional checkout, Buyer/Seller/Admin order lists, OPay payment confirmation, private receipt upload, Admin receipt signed URL, OPay verification, COD approval, Seller processing/rejection, logistics hand-off, Admin logistics status transitions.
- Frontend client wiring: API URL and public key, buyer cart, buyer profile/order history, seller profile, seller order/product/report actions, Admin data and logistics console, product reviews/reports, public announcements.

## Database-side functions
- `edge_checkout_order`: validates one-seller checkout, locks/checks stock, decrements inventory, creates order/items/tracking steps in one transaction.
- `edge_order_action`: role-checked state transitions for payment, COD approval, Seller fulfillment, logistics and cancellation; restores stock on rejection/cancellation.
- `edge_consume_rate_limit`: database-backed authentication rate limiting.
- `edge_sync_order_tracking_steps`: keeps dispatched/delivered timeline steps synchronized with order status.

All callable RPC functions are executable by `service_role` only; anon and authenticated roles have no execute permission. Public marketplace tables remain inaccessible directly to anon/authenticated; Edge API is the access boundary.

## Remaining before deployment
1. Deno type-check and frontend/backend CI must pass on the current branch.
2. Deploy the `api` Edge Function and verify its health endpoint using the publishable key.
3. Test registration/login/logout, session persistence from the GitHub Pages origin, cart, checkout/stock rollback, OPay receipt flow, COD approval, seller contact privacy, and tracking updates.
4. Create the first Super Admin securely. No Super Admin account is seeded yet; do not put a password in source code or chat.
5. Only after the above tests pass should the frontend be switched on in production. Do not merge PR #2 or update `main` without the user's explicit approval.
