create table if not exists public."SellerSubscriptionPlan" (
  "id" text primary key,
  "name" text not null,
  "description" text not null default '',
  "price" numeric(12,2) not null check ("price" >= 0),
  "durationDays" integer not null check ("durationDays" between 1 and 3660),
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
create index if not exists "SellerSubscriptionPlan_active_idx"
  on public."SellerSubscriptionPlan" ("isActive", "price");

create table if not exists public."SellerSubscription" (
  "id" text primary key,
  "sellerId" text not null references public."User"("id") on delete cascade,
  "planId" text not null references public."SellerSubscriptionPlan"("id"),
  "status" text not null default 'pending_payment'
    check ("status" in ('pending_payment','pending_approval','active','expired','cancelled','rejected')),
  "amountPaid" numeric(12,2) not null default 0 check ("amountPaid" >= 0),
  "paymentMethod" text,
  "paymentReference" text,
  "paymentReceiptPath" text,
  "startsAt" timestamptz,
  "expiresAt" timestamptz,
  "approvedBy" text references public."User"("id"),
  "approvedAt" timestamptz,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  check (("status" = 'active' and "startsAt" is not null and "expiresAt" is not null and "expiresAt" > "startsAt") or "status" <> 'active')
);
create index if not exists "SellerSubscription_seller_status_idx"
  on public."SellerSubscription" ("sellerId", "status", "expiresAt" desc);
create index if not exists "SellerSubscription_expiry_idx"
  on public."SellerSubscription" ("expiresAt")
  where "status" = 'active';

create table if not exists public."UserNotification" (
  "id" text primary key,
  "userId" text not null references public."User"("id") on delete cascade,
  "type" text not null,
  "title" text not null,
  "message" text not null,
  "data" jsonb not null default '{}'::jsonb,
  "dedupeKey" text,
  "readAt" timestamptz,
  "createdAt" timestamptz not null default now()
);
create unique index if not exists "UserNotification_user_dedupe_idx"
  on public."UserNotification" ("userId", "dedupeKey")
  where "dedupeKey" is not null;
create index if not exists "UserNotification_user_created_idx"
  on public."UserNotification" ("userId", "createdAt" desc);

alter table public."SellerSubscriptionPlan" enable row level security;
alter table public."SellerSubscription" enable row level security;
alter table public."UserNotification" enable row level security;
revoke all on public."SellerSubscriptionPlan", public."SellerSubscription", public."UserNotification" from anon, authenticated;
grant select, insert, update, delete on public."SellerSubscriptionPlan", public."SellerSubscription", public."UserNotification" to service_role;
