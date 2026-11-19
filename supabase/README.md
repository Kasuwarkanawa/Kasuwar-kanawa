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

All 18 public tables have RLS enabled. Direct table access is revoked from `anon` and `authenticated`; the current Express API is expected to enforce the application session and role rules and connect using a trusted server-side PostgreSQL credential. Do not expose database credentials or the Supabase service-role key in frontend code.

The `public.rls_auto_enable()` SECURITY DEFINER function remains attached to its PostgreSQL DDL event trigger, but execution was revoked from `PUBLIC`, `anon`, and `authenticated`.

## Private payment receipt storage

A private Storage bucket named `payment-receipts` is provisioned with a 5 MB file-size limit and MIME allowlist:

- `image/jpeg`
- `image/png`
- `image/webp`
- `application/pdf`

There are no client Storage object policies. Receipt upload and 5-minute signed URL creation must be performed by the trusted backend with `SUPABASE_SERVICE_ROLE_KEY`. Never put this key in Vite variables or commit it to Git.

## Backend configuration still required

The Express/Prisma API needs these server-side settings:

- `DATABASE_URL`: Supabase PostgreSQL connection string (prefer the Supabase pooler when the runtime requires it).
- `SUPABASE_URL`: project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only secret used for private receipt storage.
- `FRONTEND_ORIGIN`: exact GitHub Pages origin, including the repository path is not part of the origin; configure the origin only.
- `ADMIN_EMAIL`, `ADMIN_PHONE`, `ADMIN_FULL_NAME`, `ADMIN_PASSWORD`: used by the protected bootstrap workflow to create the first Super Admin. Password must be at least 12 characters.

The database currently has no Super Admin account. Do not create a default or weak password.

## Important deployment boundary

GitHub Pages serves static frontend files; it does not run the current Express/Node API. Supabase PostgreSQL and Storage are ready, but the Express API still needs a runtime endpoint, or the API must be deliberately migrated to Supabase Edge Functions. Do not set `VITE_API_URL` to `/api` on GitHub Pages and assume it will execute the Express server.

The active implementation branch is `chatgpt-access-test-2026-11-17`. Do not merge to `main` or deploy production as part of this database setup.
