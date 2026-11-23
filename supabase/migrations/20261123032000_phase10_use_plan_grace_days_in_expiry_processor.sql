create or replace function public.process_seller_subscription_expiry()
returns integer
language plpgsql
set search_path = public
as $$
declare
  transitioned integer := 0;
begin
  update public."SellerSubscription" s
  set status = 'grace',
      "graceEndsAt" = coalesce(
        s."graceEndsAt",
        s."expiresAt" + make_interval(days => coalesce(p."graceDays", 7))
      ),
      "updatedAt" = now()
  from public."SellerSubscriptionPlan" p
  where s."planId" = p.id
    and s.status = 'active'
    and s."expiresAt" is not null
    and s."expiresAt" <= now();

  get diagnostics transitioned = row_count;

  update public."SellerSubscription"
  set status = 'expired',
      "updatedAt" = now()
  where status = 'grace'
    and "graceEndsAt" is not null
    and "graceEndsAt" <= now();

  return transitioned;
end;
$$;

revoke all on function public.process_seller_subscription_expiry() from public, anon, authenticated;
grant execute on function public.process_seller_subscription_expiry() to service_role;
