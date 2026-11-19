# Kasuwar Kanawa — Supabase Phase 1

Project: `efirbpzfimzmpchsovbz` (eu-west-1)

## Database provisioned

The Phase 1 PostgreSQL schema is provisioned in the linked Supabase project. It contains the marketplace tables:

- `User`, `Session`
- `Category`, `Product`, `ProductReview`
- `Cart`, `CartItem`
- `Order`, `OrderItem`, `OrderTrackingStep`
- `ProductReport`, `BuyerReport`, `SellerReport`
- `FlashSale`, `FlashSaleProduct`, `Advertisement`, `Announcement`, `NewsletterSubscription`

The five Kano marketplace categories (Kwari, Singa, Kurmi, Farm Center, and Wasu Kasuwanni) are seeded. No demo buyers, sellers, products, or orders have been inserted.

All 18 public tables have RLS enabled. Direct table privileges are revoked from `anon` and `authenticated`; the Supabase Edge API is the application access boundary. Never expose database credentials or the Supabase secret/service-role key in frontend code.

The `public.rls_auto_enable()` SECURITY DEFINER function remains attached to its PostgreSQL DDL event trigger, but execution was revoked from `PUBLIC`, `anon`, and `authenticated`.

## Private payment receipt storage

A private Storage bucket named `payment-receipts` is provisioned with a 5 MB file-size limit and MIME allowlist:

- `image/jpeg`
- `image/png`
- `image/webp`
- `application/pdf`

There are no client Storage object policies. Receipt upload and five-minute signed URL creation are performed only by the trusted Edge API using a server-side secret key.

## Supabase Edge API

The `api` Edge Function is deployed and ACTIVE (version 2):

`https://efirbpzfimzmpchsovbz.supabase.co/functions/v1/api`

The function uses:
- Supabase's default server-side secret key (prefers `SUPABASE_SECRET_KEYS.default`, with legacy `SUPABASE_SERVICE_ROLE_KEY` fallback).
- The project's publishable key on the browser `apikey` header.
- Exact CORS origin: `https://kasuwarkanawa.github.io`.
- Custom `kk_session` HttpOnly, Secure, SameSite=None cookie sessions.
- bcrypt password hashes, role checks, and database-backed auth rate limiting.
- Transactional checkout and order-state RPC functions.
- Private receipt storage and Admin-only short-lived signed URLs.

The function is configured with `verify_jwt = false` because it validates the publishable key and custom session cookie inside the handler. Do not remove those checks.

## First Super Admin

There is **no Super Admin account yet**. The database includes a one-time, serialized bootstrap function and the Edge API exposes `POST /auth/bootstrap-admin`.

Before creating the first Admin:
1. Set `BOOTSTRAP_ADMIN_TOKEN` (at least 32 random characters) in Supabase Dashboard → Edge Function Secrets.
2. Follow [ADMIN-BOOTSTRAP.md](./ADMIN-BOOTSTRAP.md).
3. Use a strong Admin password of at least 12 characters. Do not place it or the setup token in source control or chat.

The bootstrap endpoint refuses further first-Admin creation once a Super Admin exists.

## Deployment boundary

The current working branch is `chatgpt-access-test-2026-11-17`. It contains the frontend API wiring and GitHub Pages build configuration for the Edge API, but the branch has **not** been merged to `main`. The current live GitHub Pages site therefore has not been switched to this new backend yet.

Do not merge PR #2 or update production without the user's explicit approval. Complete the health/browser-cookie smoke test, first Admin setup, and end-to-end checkout/payment/logistics tests before calling Phase 1 complete.
