create table if not exists public.contributions (
  id uuid primary key default gen_random_uuid(),
  internal_reference text unique not null,
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'BRL',
  payment_provider text not null default 'amplopay',
  provider_transaction_id text,
  webhook_token text,
  payment_status text not null default 'pending'
    check (payment_status in ('pending','paid','expired','cancelled','refunded','failed')),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  refunded_at timestamptz
);
create index if not exists contributions_status_idx on public.contributions (payment_status);
-- RLS ligado e SEM políticas públicas: só o backend (service role) lê/escreve.
alter table public.contributions enable row level security;
