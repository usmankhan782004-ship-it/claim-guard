-- ============================================================
-- ClaimGuard — Pay-to-Unlock Migration
-- Run AFTER the initial schema.sql in Supabase SQL Editor.
-- ============================================================

-- ============================================================
-- 1. NEGOTIATIONS_V2 — bill-level analysis with unlock gate
-- ============================================================
create table if not exists public.negotiations_v2 (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references public.users(id) on delete cascade,
  bill_id           uuid references public.bills(id) on delete set null,

  -- The full analysis output stored as JSON
  bill_analysis     jsonb not null default '{}',

  -- Financial summary
  total_billed      numeric(12,2) not null default 0.00,
  potential_savings numeric(12,2) not null default 0.00,
  success_fee       numeric(12,2) not null default 0.00,
  fee_rate          numeric(5,2) not null default 20.00,

  -- Pay-to-unlock gate
  is_unlocked       boolean not null default false,
  unlocked_at       timestamptz,

  -- Metadata
  provider_name     text,
  status            text not null default 'analyzed',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_negotiations_v2_user on public.negotiations_v2(user_id);
create index idx_negotiations_v2_unlocked on public.negotiations_v2(is_unlocked);

comment on table public.negotiations_v2 is
  'Bill-level analysis records with pay-to-unlock gate for premium content.';

-- Auto-update timestamp
create trigger set_updated_at_negotiations_v2
  before update on public.negotiations_v2
  for each row execute function public.handle_updated_at();

-- RLS: users see only their own negotiations
alter table public.negotiations_v2 enable row level security;

create policy "Users can view own negotiations_v2"
  on public.negotiations_v2 for select
  using (auth.uid() = user_id);

create policy "Users can insert own negotiations_v2"
  on public.negotiations_v2 for insert
  with check (auth.uid() = user_id);

create policy "Users can update own negotiations_v2"
  on public.negotiations_v2 for update
  using (auth.uid() = user_id);


-- ============================================================
-- 2. PREMIUM_CONTENT — appeal letters gated by is_unlocked
-- ============================================================
create table if not exists public.premium_content (
  id                uuid primary key default uuid_generate_v4(),
  negotiation_id    uuid not null references public.negotiations_v2(id) on delete cascade,
  user_id           uuid not null references public.users(id) on delete cascade,

  -- The actual premium content (Markdown appeal letter)
  final_appeal_letter_markdown  text not null default '',

  -- Submission instructions
  submission_instructions       text not null default '',

  -- Additional fields for future use
  legal_references              jsonb default '[]',

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_premium_content_negotiation on public.premium_content(negotiation_id);
create index idx_premium_content_user on public.premium_content(user_id);

comment on table public.premium_content is
  'Premium content (appeal letters) gated by is_unlocked on negotiations_v2.';

-- Auto-update timestamp
create trigger set_updated_at_premium_content
  before update on public.premium_content
  for each row execute function public.handle_updated_at();

-- RLS: CRITICAL — content is readable ONLY if the linked negotiation is unlocked
alter table public.premium_content enable row level security;

-- SELECT: Users can only read if they own it AND the negotiation is unlocked
create policy "Users can read unlocked premium content"
  on public.premium_content for select
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.negotiations_v2 n
      where n.id = negotiation_id
        and n.user_id = auth.uid()
        and n.is_unlocked = true
    )
  );

-- INSERT: Only the system (service role) should insert.
-- Users can insert their own if needed (e.g., for demo mode).
create policy "Users can insert own premium content"
  on public.premium_content for insert
  with check (auth.uid() = user_id);

-- UPDATE: only system role should update
create policy "Users can update own premium content"
  on public.premium_content for update
  using (auth.uid() = user_id);
