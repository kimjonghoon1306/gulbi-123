alter table if exists general_orders
  add column if not exists point_used numeric(14,2) not null default 0;

alter table if exists retail_orders
  add column if not exists point_used numeric(14,2) not null default 0;

alter table if exists wholesale_orders
  add column if not exists point_used numeric(14,2) not null default 0;
