-- 온종일팜 보안 보강: 느슨한 RLS/공개 RPC 권한 축소
-- Supabase SQL Editor에서 1회 실행.

-- 1) 광고 배너: 쇼핑몰 노출용 select는 공개, 쓰기는 관리자만.
drop policy if exists "ad_banners_insert_auth" on ad_banners;
drop policy if exists "ad_banners_update_auth" on ad_banners;
drop policy if exists "ad_banners_delete_auth" on ad_banners;
drop policy if exists "ad_banners_insert_admin" on ad_banners;
drop policy if exists "ad_banners_update_admin" on ad_banners;
drop policy if exists "ad_banners_delete_admin" on ad_banners;
create policy "ad_banners_insert_admin" on ad_banners for insert with check (is_admin());
create policy "ad_banners_update_admin" on ad_banners for update using (is_admin()) with check (is_admin());
create policy "ad_banners_delete_admin" on ad_banners for delete using (is_admin());

-- 2) 재입고 알림: 누구나 신청 가능하지만 연락처 목록은 본인 또는 관리자만 조회.
drop policy if exists "restock_select_own" on restock_alerts;
drop policy if exists "restock_update_auth" on restock_alerts;
drop policy if exists "restock_delete_auth" on restock_alerts;
drop policy if exists "restock_select_owner_or_admin" on restock_alerts;
drop policy if exists "restock_update_admin" on restock_alerts;
drop policy if exists "restock_delete_admin" on restock_alerts;
create policy "restock_select_owner_or_admin" on restock_alerts
  for select using (is_admin() or (user_id is not null and auth.uid() = user_id));
create policy "restock_update_admin" on restock_alerts
  for update using (is_admin()) with check (is_admin());
create policy "restock_delete_admin" on restock_alerts
  for delete using (is_admin());

-- 3) 쿠폰: 공개 조회는 유지. 생성/수정/삭제는 관리자 또는 승인 공급사 본인만.
drop policy if exists "coupons_insert_auth" on coupons;
drop policy if exists "coupons_update_own" on coupons;
drop policy if exists "coupons_delete_own" on coupons;
drop policy if exists "coupons_insert_role_guard" on coupons;
drop policy if exists "coupons_update_role_guard" on coupons;
drop policy if exists "coupons_delete_role_guard" on coupons;
create policy "coupons_insert_role_guard" on coupons
  for insert with check (
    auth.uid() = created_by
    and (
      (created_by_role = 'admin' and is_admin())
      or (
        created_by_role = 'supplier'
        and exists (
          select 1 from suppliers
          where suppliers.id = auth.uid()
            and suppliers.status not in ('대기중', '거절')
        )
      )
    )
  );
create policy "coupons_update_role_guard" on coupons
  for update using (
    auth.uid() = created_by
    and (
      (created_by_role = 'admin' and is_admin())
      or (
        created_by_role = 'supplier'
        and exists (
          select 1 from suppliers
          where suppliers.id = auth.uid()
            and suppliers.status not in ('대기중', '거절')
        )
      )
    )
  ) with check (
    auth.uid() = created_by
    and (
      (created_by_role = 'admin' and is_admin())
      or (
        created_by_role = 'supplier'
        and exists (
          select 1 from suppliers
          where suppliers.id = auth.uid()
            and suppliers.status not in ('대기중', '거절')
        )
      )
    )
  );
create policy "coupons_delete_role_guard" on coupons
  for delete using (
    auth.uid() = created_by
    and (
      (created_by_role = 'admin' and is_admin())
      or (
        created_by_role = 'supplier'
        and exists (
          select 1 from suppliers
          where suppliers.id = auth.uid()
            and suppliers.status not in ('대기중', '거절')
        )
      )
    )
  );

-- 4) 재고 차감 RPC: 결제 서버(service_role)만 직접 실행.
-- 브라우저 anon/authenticated 클라이언트가 임의로 재고를 차감하는 것을 막는다.
revoke execute on function decrement_stock(uuid, int) from public, anon, authenticated;
revoke execute on function decrement_stock_bulk(jsonb) from public, anon, authenticated;
grant execute on function decrement_stock(uuid, int) to service_role;
grant execute on function decrement_stock_bulk(jsonb) to service_role;
