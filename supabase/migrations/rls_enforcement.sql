-- ─── ClaimGuard Row Level Security (RLS) Enforcement ───
-- 1. Enable RLS on all sensitive tables
-- 2. Drop existing loose policies
-- 3. Create strict policies where user_id must match auth.uid()

-- Enable RLS
alter table public.negotiations_v2 enable row level security;
alter table public.manual_payments enable row level security;
alter table public.payments enable row level security;
alter table public.bills enable row level security;

-- Drop existing public/loose policies if they exist (ignore errors if they don't)
drop policy if exists "Enable all for authenticated users" on public.negotiations_v2;
drop policy if exists "Enable all for authenticated users" on public.manual_payments;
drop policy if exists "Enable all for authenticated users" on public.payments;
drop policy if exists "Enable all for authenticated users" on public.bills;
drop policy if exists "Public access" on public.negotiations_v2;
drop policy if exists "Public access" on public.manual_payments;
drop policy if exists "Public access" on public.payments;
drop policy if exists "Public access" on public.bills;

-- Create Strict RLS Policies for negotiations_v2
create policy "Users can only see their own negotiations"
    on public.negotiations_v2 for select
    using (auth.uid() = user_id);

create policy "Users can only insert their own negotiations"
    on public.negotiations_v2 for insert
    with check (auth.uid() = user_id);

create policy "Users can only update their own negotiations"
    on public.negotiations_v2 for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can only delete their own negotiations"
    on public.negotiations_v2 for delete
    using (auth.uid() = user_id);

-- Create Strict RLS Policies for manual_payments
create policy "Users can only see their own manual payments"
    on public.manual_payments for select
    using (auth.uid() = user_id);

create policy "Users can only insert their own manual payments"
    on public.manual_payments for insert
    with check (auth.uid() = user_id);

create policy "Users can only update their own manual payments"
    on public.manual_payments for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can only delete their own manual payments"
    on public.manual_payments for delete
    using (auth.uid() = user_id);

-- Create Strict RLS Policies for payments
create policy "Users can only see their own payments"
    on public.payments for select
    using (auth.uid() = user_id);

create policy "Users can only insert their own payments"
    on public.payments for insert
    with check (auth.uid() = user_id);

create policy "Users can only update their own payments"
    on public.payments for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can only delete their own payments"
    on public.payments for delete
    using (auth.uid() = user_id);

-- Create Strict RLS Policies for bills
create policy "Users can only see their own bills"
    on public.bills for select
    using (auth.uid() = user_id);

create policy "Users can only insert their own bills"
    on public.bills for insert
    with check (auth.uid() = user_id);

create policy "Users can only update their own bills"
    on public.bills for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can only delete their own bills"
    on public.bills for delete
    using (auth.uid() = user_id);
