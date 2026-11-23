alter table public."SellerSubscriptionPlan"
  add column if not exists "graceDays" integer not null default 7 check ("graceDays" between 0 and 30);
alter table public."SellerSubscription"
  add column if not exists "graceEndsAt" timestamptz;
alter table public."SellerSubscription"
  drop constraint if exists "SellerSubscription_status_check";
alter table public."SellerSubscription"
  add constraint "SellerSubscription_status_check"
  check ("status" in ('pending_payment','pending_approval','active','grace','expired','cancelled','rejected'));
create index if not exists "SellerSubscription_grace_idx"
  on public."SellerSubscription" ("graceEndsAt") where "status"='grace';
create or replace function public.process_seller_subscription_expiry()
returns integer language plpgsql security definer set search_path=public as $$
declare affected integer := 0;
begin
 update public."SellerSubscription" set status='grace',
  "graceEndsAt"=coalesce("graceEndsAt","expiresAt"+interval '7 days'),"updatedAt"=now()
 where status='active' and "expiresAt"<=now();
 get diagnostics affected = row_count;
 update public."SellerSubscription" set status='expired',"updatedAt"=now()
 where status='grace' and "graceEndsAt"<=now();
 return affected;
end; $$;
revoke all on function public.process_seller_subscription_expiry() from public,anon,authenticated;
grant execute on function public.process_seller_subscription_expiry() to service_role;