-- MD 자동화 어드민 권한.
--
-- 기존 admin_permissions 는 feature 로 기능을 나눈다. 'md' 를 더한다.
-- 데이터가 없으면 어드민에서 MD 메뉴가 안 보인다.

insert into admin_permissions (user_id, feature, can_read, can_write)
select user_id, 'md', can_read, can_write
from admin_permissions
where feature = 'showcase'
  and not exists (
    select 1 from admin_permissions p2
    where p2.user_id = admin_permissions.user_id and p2.feature = 'md'
  );
