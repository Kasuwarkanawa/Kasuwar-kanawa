create table if not exists public."TransferPayout" (
  "id" text primary key,
  "orderId" text not null unique references public."Order"("id") on delete cascade,
  "sellerId" text not null references public."User"("id"),
  "grossOrderAmount" numeric(12,2) not null check ("grossOrderAmount" >= 0),
  "commissionRate" numeric(5,2) not null default 5.00 check ("commissionRate" = 5.00),
  "commissionAmount" numeric(12,2) not null check ("commissionAmount" >= 0),
  "sellerPayoutAmount" numeric(12,2) not null check ("sellerPayoutAmount" >= 0),
  "sellerTransferReceiptPath" text,
  "sellerTransferredAt" timestamptz,
  "sellerAcceptedAt" timestamptz,
  "status" text not null default 'awaiting_admin_payout'
    check ("status" in ('awaiting_admin_payout','awaiting_seller_confirmation','completed','seller_receipt_rejected')),
  "adminNotes" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
create index if not exists "TransferPayout_sellerId_createdAt_idx"
  on public."TransferPayout" ("sellerId", "createdAt" desc);
alter table public."TransferPayout" enable row level security;
