-- 캐시·쇼핑포인트 코어 스키마 + 안전 RPC
-- Supabase SQL Editor에서 1회 실행하세요.
-- 전제: is_admin() 함수가 이미 존재합니다.

create table if not exists cash_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  cash_balance numeric(14,2) not null default 0 check (cash_balance >= 0),
  point_balance numeric(14,2) not null default 0 check (point_balance >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists cash_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in (
    'settle_earn',
    'convert_to_point',
    'withdraw_request',
    'withdraw_paid',
    'withdraw_reject',
    'farm_earn',
    'point_spend',
    'point_refund'
  )),
  cash_delta numeric(14,2) not null default 0,
  point_delta numeric(14,2) not null default 0,
  cash_after numeric(14,2) not null,
  point_after numeric(14,2) not null,
  source text,
  ref_type text,
  ref_id text,
  memo text,
  created_at timestamptz not null default now()
);

create index if not exists cash_ledger_user_created_idx
  on cash_ledger(user_id, created_at desc);

create table if not exists cash_withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  bank_name text not null,
  bank_account text not null,
  bank_holder text not null,
  status text not null default 'requested' check (status in ('requested', 'approved', 'paid', 'rejected')),
  admin_memo text,
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by uuid
);

create index if not exists cash_withdrawals_user_requested_idx
  on cash_withdrawals(user_id, requested_at desc);

create table if not exists app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into app_settings (key, value)
values ('point_earn_enabled', 'false'::jsonb)
on conflict (key) do nothing;

alter table cash_accounts enable row level security;
alter table cash_ledger enable row level security;
alter table cash_withdrawals enable row level security;
alter table app_settings enable row level security;

drop policy if exists "cash_accounts_select_owner_or_admin" on cash_accounts;
create policy "cash_accounts_select_owner_or_admin" on cash_accounts
  for select using (auth.uid() = user_id or is_admin());

drop policy if exists "cash_ledger_select_owner_or_admin" on cash_ledger;
create policy "cash_ledger_select_owner_or_admin" on cash_ledger
  for select using (auth.uid() = user_id or is_admin());

drop policy if exists "cash_withdrawals_select_owner_or_admin" on cash_withdrawals;
create policy "cash_withdrawals_select_owner_or_admin" on cash_withdrawals
  for select using (auth.uid() = user_id or is_admin());

drop policy if exists "app_settings_select_public" on app_settings;
create policy "app_settings_select_public" on app_settings
  for select using (true);

drop policy if exists "app_settings_insert_admin" on app_settings;
create policy "app_settings_insert_admin" on app_settings
  for insert with check (is_admin());

drop policy if exists "app_settings_update_admin" on app_settings;
create policy "app_settings_update_admin" on app_settings
  for update using (is_admin()) with check (is_admin());

drop policy if exists "app_settings_delete_admin" on app_settings;
create policy "app_settings_delete_admin" on app_settings
  for delete using (is_admin());

create or replace function cp_add_cash(
  p_user uuid,
  p_amount numeric,
  p_source text,
  p_ref_type text,
  p_ref_id text,
  p_memo text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account cash_accounts%rowtype;
begin
  if not is_admin() then
    raise exception 'admin only';
  end if;

  if p_user is null then
    raise exception 'user required';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  insert into cash_accounts (user_id)
  values (p_user)
  on conflict (user_id) do nothing;

  update cash_accounts
  set cash_balance = cash_balance + p_amount,
      updated_at = now()
  where user_id = p_user
  returning * into v_account;

  if not found or v_account.cash_balance < 0 or v_account.point_balance < 0 then
    raise exception 'invalid balance';
  end if;

  insert into cash_ledger (
    user_id, kind, cash_delta, point_delta, cash_after, point_after,
    source, ref_type, ref_id, memo
  ) values (
    p_user, 'settle_earn', p_amount, 0, v_account.cash_balance, v_account.point_balance,
    p_source, p_ref_type, p_ref_id, p_memo
  );
end;
$$;

create or replace function cp_convert_to_point(p_amount numeric) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_account cash_accounts%rowtype;
begin
  if v_user is null then
    raise exception 'login required';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  insert into cash_accounts (user_id)
  values (v_user)
  on conflict (user_id) do nothing;

  update cash_accounts
  set cash_balance = cash_balance - p_amount,
      point_balance = point_balance + p_amount,
      updated_at = now()
  where user_id = v_user
    and cash_balance >= p_amount
  returning * into v_account;

  if not found then
    raise exception 'insufficient cash balance';
  end if;

  if v_account.cash_balance < 0 or v_account.point_balance < 0 then
    raise exception 'invalid balance';
  end if;

  insert into cash_ledger (
    user_id, kind, cash_delta, point_delta, cash_after, point_after,
    source, ref_type, ref_id, memo
  ) values (
    v_user, 'convert_to_point', -p_amount, p_amount, v_account.cash_balance, v_account.point_balance,
    'partner_convert', null, null, null
  );
end;
$$;

create or replace function cp_request_withdraw(
  p_amount numeric,
  p_bank_name text,
  p_bank_account text,
  p_bank_holder text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_account cash_accounts%rowtype;
  v_withdrawal_id uuid;
begin
  if v_user is null then
    raise exception 'login required';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  if nullif(trim(p_bank_name), '') is null
    or nullif(trim(p_bank_account), '') is null
    or nullif(trim(p_bank_holder), '') is null then
    raise exception 'bank information required';
  end if;

  insert into cash_accounts (user_id)
  values (v_user)
  on conflict (user_id) do nothing;

  update cash_accounts
  set cash_balance = cash_balance - p_amount,
      updated_at = now()
  where user_id = v_user
    and cash_balance >= p_amount
  returning * into v_account;

  if not found then
    raise exception 'insufficient cash balance';
  end if;

  if v_account.cash_balance < 0 or v_account.point_balance < 0 then
    raise exception 'invalid balance';
  end if;

  insert into cash_withdrawals (
    user_id, amount, bank_name, bank_account, bank_holder
  ) values (
    v_user, p_amount, trim(p_bank_name), trim(p_bank_account), trim(p_bank_holder)
  )
  returning id into v_withdrawal_id;

  insert into cash_ledger (
    user_id, kind, cash_delta, point_delta, cash_after, point_after,
    source, ref_type, ref_id, memo
  ) values (
    v_user, 'withdraw_request', -p_amount, 0, v_account.cash_balance, v_account.point_balance,
    'withdraw_request', 'cash_withdrawals', v_withdrawal_id::text, null
  );

  return v_withdrawal_id;
end;
$$;

create or replace function cp_process_withdraw(
  p_id uuid,
  p_status text,
  p_memo text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_withdrawal cash_withdrawals%rowtype;
  v_account cash_accounts%rowtype;
begin
  if not is_admin() then
    raise exception 'admin only';
  end if;

  if p_id is null then
    raise exception 'withdrawal id required';
  end if;

  if p_status not in ('approved', 'paid', 'rejected') then
    raise exception 'invalid withdrawal status';
  end if;

  select *
  into v_withdrawal
  from cash_withdrawals
  where id = p_id
  for update;

  if not found then
    raise exception 'withdrawal not found';
  end if;

  if v_withdrawal.status in ('paid', 'rejected') then
    raise exception 'withdrawal already finalized';
  end if;

  if p_status = 'approved' then
    update cash_withdrawals
    set status = 'approved',
        admin_memo = p_memo,
        processed_at = now(),
        processed_by = auth.uid()
    where id = p_id
    returning * into v_withdrawal;

  elsif p_status = 'paid' then
    update cash_withdrawals
    set status = 'paid',
        admin_memo = p_memo,
        processed_at = now(),
        processed_by = auth.uid()
    where id = p_id
    returning * into v_withdrawal;

    select *
    into v_account
    from cash_accounts
    where user_id = v_withdrawal.user_id
    for update;

    if not found or v_account.cash_balance < 0 or v_account.point_balance < 0 then
      raise exception 'invalid balance';
    end if;

    insert into cash_ledger (
      user_id, kind, cash_delta, point_delta, cash_after, point_after,
      source, ref_type, ref_id, memo
    ) values (
      v_withdrawal.user_id, 'withdraw_paid', 0, 0, v_account.cash_balance, v_account.point_balance,
      'withdraw_paid', 'cash_withdrawals', p_id::text, p_memo
    );

  elsif p_status = 'rejected' then
    update cash_accounts
    set cash_balance = cash_balance + v_withdrawal.amount,
        updated_at = now()
    where user_id = v_withdrawal.user_id
    returning * into v_account;

    if not found or v_account.cash_balance < 0 or v_account.point_balance < 0 then
      raise exception 'invalid balance';
    end if;

    update cash_withdrawals
    set status = 'rejected',
        admin_memo = p_memo,
        processed_at = now(),
        processed_by = auth.uid()
    where id = p_id;

    insert into cash_ledger (
      user_id, kind, cash_delta, point_delta, cash_after, point_after,
      source, ref_type, ref_id, memo
    ) values (
      v_withdrawal.user_id, 'withdraw_reject', v_withdrawal.amount, 0, v_account.cash_balance, v_account.point_balance,
      'withdraw_reject', 'cash_withdrawals', p_id::text, p_memo
    );
  end if;
end;
$$;

create or replace function cp_farm_earn(
  p_user uuid,
  p_amount numeric,
  p_ref_type text,
  p_ref_id text,
  p_memo text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_enabled boolean;
  v_account cash_accounts%rowtype;
begin
  if not (is_admin() or auth.role() = 'service_role') then
    raise exception 'admin or service_role only';
  end if;

  select coalesce(value = 'true'::jsonb, false)
  into v_enabled
  from app_settings
  where key = 'point_earn_enabled';

  if not coalesce(v_enabled, false) then
    raise exception 'point earn disabled';
  end if;

  if p_user is null then
    raise exception 'user required';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  insert into cash_accounts (user_id)
  values (p_user)
  on conflict (user_id) do nothing;

  update cash_accounts
  set point_balance = point_balance + p_amount,
      updated_at = now()
  where user_id = p_user
  returning * into v_account;

  if not found or v_account.cash_balance < 0 or v_account.point_balance < 0 then
    raise exception 'invalid balance';
  end if;

  insert into cash_ledger (
    user_id, kind, cash_delta, point_delta, cash_after, point_after,
    source, ref_type, ref_id, memo
  ) values (
    p_user, 'farm_earn', 0, p_amount, v_account.cash_balance, v_account.point_balance,
    'farm_earn', p_ref_type, p_ref_id, p_memo
  );
end;
$$;

create or replace function cp_spend_point(
  p_user uuid,
  p_amount numeric,
  p_ref_type text,
  p_ref_id text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account cash_accounts%rowtype;
begin
  if not (is_admin() or auth.role() = 'service_role') then
    raise exception 'admin or service_role only';
  end if;

  if p_user is null then
    raise exception 'user required';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  insert into cash_accounts (user_id)
  values (p_user)
  on conflict (user_id) do nothing;

  update cash_accounts
  set point_balance = point_balance - p_amount,
      updated_at = now()
  where user_id = p_user
    and point_balance >= p_amount
  returning * into v_account;

  if not found then
    raise exception 'insufficient point balance';
  end if;

  if v_account.cash_balance < 0 or v_account.point_balance < 0 then
    raise exception 'invalid balance';
  end if;

  insert into cash_ledger (
    user_id, kind, cash_delta, point_delta, cash_after, point_after,
    source, ref_type, ref_id, memo
  ) values (
    p_user, 'point_spend', 0, -p_amount, v_account.cash_balance, v_account.point_balance,
    'point_spend', p_ref_type, p_ref_id, null
  );
end;
$$;

create or replace function cp_refund_point(
  p_user uuid,
  p_amount numeric,
  p_ref_type text,
  p_ref_id text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account cash_accounts%rowtype;
begin
  if not (is_admin() or auth.role() = 'service_role') then
    raise exception 'admin or service_role only';
  end if;

  if p_user is null then
    raise exception 'user required';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  insert into cash_accounts (user_id)
  values (p_user)
  on conflict (user_id) do nothing;

  update cash_accounts
  set point_balance = point_balance + p_amount,
      updated_at = now()
  where user_id = p_user
  returning * into v_account;

  if not found or v_account.cash_balance < 0 or v_account.point_balance < 0 then
    raise exception 'invalid balance';
  end if;

  insert into cash_ledger (
    user_id, kind, cash_delta, point_delta, cash_after, point_after,
    source, ref_type, ref_id, memo
  ) values (
    p_user, 'point_refund', 0, p_amount, v_account.cash_balance, v_account.point_balance,
    'point_refund', p_ref_type, p_ref_id, null
  );
end;
$$;
