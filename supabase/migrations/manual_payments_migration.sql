-- ============================================================
-- ClaimGuard — Manual Payments Table Migration
-- ============================================================

create table if not exists public.manual_payments (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references public.users(id) on delete cascade,
  negotiation_id    uuid references public.negotiations_v2(id) on delete set null,
  receipt_url       text,
  status            text not null default 'pending',
  amount            numeric(12,2) not null default 0.00,
  created_at        timestamptz not null default now()
);

-- Indexes
create index if not exists idx_manual_payments_user on public.manual_payments(user_id);
create index if not exists idx_manual_payments_negotiation on public.manual_payments(negotiation_id);

-- Enforce Strict RLS
alter table public.manual_payments enable row level security;

-- Drop public policies if they exist (just to be clean)
drop policy if exists "Enable all for authenticated users" on public.manual_payments;
drop policy if exists "Public access" on public.manual_payments;

-- SELECT: users can only see their own
create policy "Users can only see their own manual payments"
    on public.manual_payments for select
    using (auth.uid() = user_id);

-- INSERT: users can only insert for themselves
create policy "Users can only insert their own manual payments"
    on public.manual_payments for insert
    with check (auth.uid() = user_id);

-- UPDATE: users can only update their own
create policy "Users can only update their own manual payments"
    on public.manual_payments for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- DELETE: users can only delete their own
create policy "Users can only delete their own manual payments"
    on public.manual_payments for delete
    using (auth.uid() = user_id);
