-- 공급사 정산 테이블 (이미 있으면 컬럼만 보강됨 — 안전)
-- Supabase SQL Editor에 붙여넣고 RUN
create table if not exists settlements (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null,
  period_start date not null,
  period_end date not null,
  total_sales integer not null default 0,
  commission_rate numeric not null default 10,
  commission integer not null default 0,
  settlement_amount integer not null default 0,
  status text not null default '정산예정',   -- 정산예정 | 정산완료
  note text,
  settled_at timestamptz,
  created_at timestamptz not null default now()
);

-- 이미 테이블이 있던 경우 누락 컬럼 보강
alter table settlements add column if not exists period_start date;
alter table settlements add column if not exists period_end date;
alter table settlements add column if not exists total_sales integer default 0;
alter table settlements add column if not exists commission_rate numeric default 10;
alter table settlements add column if not exists commission integer default 0;
alter table settlements add column if not exists settlement_amount integer default 0;
alter table settlements add column if not exists status text default '정산예정';
alter table settlements add column if not exists note text;
alter table settlements add column if not exists settled_at timestamptz;

create index if not exists settlements_supplier on settlements (supplier_id, period_start desc);

-- 공급사별 수수료율(없으면 추가). 관리자가 공급업체 관리에서 설정 가능.
alter table suppliers add column if not exists commission_rate numeric default 10;
