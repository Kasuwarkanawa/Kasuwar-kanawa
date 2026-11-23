create table if not exists public."UserActivityLog" (
  "id" text primary key,
  "userId" text not null references public."User"("id") on delete cascade,
  "eventType" text not null,
  "description" text not null default '',
  "metadata" jsonb not null default '{}'::jsonb,
  "createdAt" timestamptz not null default now()
);
create index if not exists "UserActivityLog_user_created_idx"
  on public."UserActivityLog" ("userId", "createdAt" desc);
create index if not exists "UserActivityLog_type_created_idx"
  on public."UserActivityLog" ("eventType", "createdAt" desc);
alter table public."UserActivityLog" enable row level security;
revoke all on public."UserActivityLog" from anon, authenticated;
grant select, insert, update, delete on public."UserActivityLog" to service_role;
