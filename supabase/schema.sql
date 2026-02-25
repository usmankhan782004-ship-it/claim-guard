-- ============================================================
-- ClaimGuard — Supabase PostgreSQL Schema
-- Run this in the Supabase SQL Editor to create all tables.
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. USERS — extends auth.users with profile + ledger
-- ============================================================
create table public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null default '',
  email         text not null default '',
  avatar_url    text,
  total_saved   numeric(12,2) not null default 0.00,
  fees_paid     numeric(12,2) not null default 0.00,
  fees_owed     numeric(12,2) not null default 0.00,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.users is 'User profiles with running financial ledger for ClaimGuard.';

-- ============================================================
-- 2. BILLS — uploaded medical bill records
-- ============================================================
create type bill_status as enum (
  'uploaded',
  'analyzing',
  'analyzed',
  'disputing',
  'resolved',
  'failed'
);

create table public.bills (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.users(id) on delete cascade,
  file_name       text not null,
  file_path       text not null,
  file_url        text,
  file_type       text not null default 'application/pdf',
  status          bill_status not null default 'uploaded',
  raw_text        text,
  provider_name   text,
  total_billed    numeric(12,2),
  total_fair      numeric(12,2),
  potential_savings numeric(12,2),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_bills_user_id on public.bills(user_id);
create index idx_bills_status on public.bills(status);

comment on table public.bills is 'Uploaded medical bills with extracted data and analysis status.';

-- ============================================================
-- 3. NEGOTIATIONS — individual overcharge line items
-- ============================================================
create type negotiation_status as enum (
  'identified',
  'disputing',
  'won',
  'lost',
  'partial'
);

create table public.negotiations (
  id              uuid primary key default uuid_generate_v4(),
  bill_id         uuid not null references public.bills(id) on delete cascade,
  user_id         uuid not null references public.users(id) on delete cascade,
  cpt_code        text not null,
  description     text not null,
  billed_amount   numeric(12,2) not null,
  fair_price      numeric(12,2) not null,
  savings         numeric(12,2) not null generated always as (billed_amount - fair_price) stored,
  confidence      numeric(5,2) not null default 0.00,
  status          negotiation_status not null default 'identified',
  dispute_letter  text,
  resolution_note text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_negotiations_bill_id on public.negotiations(bill_id);
create index idx_negotiations_user_id on public.negotiations(user_id);
create index idx_negotiations_status on public.negotiations(status);

comment on table public.negotiations is 'Individual overcharge line items found by the AI analysis engine.';

-- ============================================================
-- 4. PAYMENTS — success fee payment records
-- ============================================================
create type payment_status as enum (
  'pending',
  'processing',
  'completed',
  'failed',
  'refunded'
);

create table public.payments (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.users(id) on delete cascade,
  bill_id         uuid not null references public.bills(id) on delete cascade,
  session_id      text unique not null,
  amount          numeric(12,2) not null,
  fee_percentage  numeric(5,2) not null default 20.00,
  status          payment_status not null default 'pending',
  card_last_four  text,
  card_brand      text,
  processor       text not null default 'simulated',
  error_message   text,
  paid_at         timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_payments_user_id on public.payments(user_id);
create index idx_payments_bill_id on public.payments(bill_id);
create index idx_payments_session_id on public.payments(session_id);
create index idx_payments_status on public.payments(status);

comment on table public.payments is 'Success fee payment records with mock gateway state machine.';

-- ============================================================
-- 5. UPDATED_AT TRIGGER — auto-update timestamps
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_users
  before update on public.users
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_bills
  before update on public.bills
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_negotiations
  before update on public.negotiations
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_payments
  before update on public.payments
  for each row execute function public.handle_updated_at();

-- ============================================================
-- 6. AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', null)
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 7. ROW LEVEL SECURITY (RLS): users only see their own data
-- ============================================================
alter table public.users enable row level security;
alter table public.bills enable row level security;
alter table public.negotiations enable row level security;
alter table public.payments enable row level security;

-- Users table policies
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- Bills table policies
create policy "Users can view own bills"
  on public.bills for select
  using (auth.uid() = user_id);

create policy "Users can insert own bills"
  on public.bills for insert
  with check (auth.uid() = user_id);

create policy "Users can update own bills"
  on public.bills for update
  using (auth.uid() = user_id);

create policy "Users can delete own bills"
  on public.bills for delete
  using (auth.uid() = user_id);

-- Negotiations table policies
create policy "Users can view own negotiations"
  on public.negotiations for select
  using (auth.uid() = user_id);

create policy "Users can insert own negotiations"
  on public.negotiations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own negotiations"
  on public.negotiations for update
  using (auth.uid() = user_id);

-- Payments table policies
create policy "Users can view own payments"
  on public.payments for select
  using (auth.uid() = user_id);

create policy "Users can insert own payments"
  on public.payments for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- 8. STORAGE BUCKET for bill uploads
-- ============================================================
insert into storage.buckets (id, name, public)
values ('bills', 'bills', false)
on conflict (id) do nothing;

-- Storage policies: authenticated users can upload to their own folder
create policy "Users can upload bills"
  on storage.objects for insert
  with check (
    bucket_id = 'bills'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view own bill files"
  on storage.objects for select
  using (
    bucket_id = 'bills'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own bill files"
  on storage.objects for delete
  using (
    bucket_id = 'bills'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
