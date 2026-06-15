-- 가상계좌 입금통보(웹훅) 위변조 검증용 secret 저장 컬럼
-- Supabase SQL Editor에 붙여넣고 RUN
alter table general_orders   add column if not exists vbank_secret text;
alter table retail_orders    add column if not exists vbank_secret text;
alter table wholesale_orders add column if not exists vbank_secret text;

-- 자동발행 설정 기본값(수동). 관리자 화면 토글로 변경됨.
insert into system_settings (key, value, updated_at)
select 'auto_issue', 'off', now()
where not exists (select 1 from system_settings where key = 'auto_issue');
