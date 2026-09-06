-- MD 성과 측정.
--
-- 담당자가 자유롭게 만들 수 있게 해도, 잘 만들었는지 판단할 근거가 없으면
-- 개선으로 이어지지 않는다 (docs/md/requirements.md FR-8).
--
-- block_id 를 함께 쌓는 게 핵심이다. 페이지 단위로만 세면
-- «이미지 12장 중 어느 것이 눌렸나» 를 모르고, 그러면 모듈을 늘릴지 줄일지
-- 판단할 근거가 안 생긴다.

create table if not exists md_page_events (
  id          bigserial primary key,
  page_id     uuid not null references md_pages(id) on delete cascade,
  block_id    text,                       -- null 이면 페이지 조회
  module_type text,                       -- 모듈 «종류별» 성과를 보려면 필요하다
  event       text not null,              -- view | click
  created_at  timestamptz not null default now(),
  constraint md_page_events_event_check check (event in ('view', 'click'))
);

create index if not exists md_page_events_page_idx on md_page_events (page_id, event, created_at desc);
create index if not exists md_page_events_module_idx on md_page_events (module_type, event);

-- 집계는 매번 count 하지 않는다. 목록 화면이 페이지 수만큼 쿼리를 돌게 된다
create or replace view md_page_stats as
select
  page_id,
  count(*) filter (where event = 'view'  and block_id is null) as views,
  count(*) filter (where event = 'click')                      as clicks
from md_page_events
group by page_id;

alter table md_page_events enable row level security;

-- 공개 페이지에서 익명으로 적재된다. 읽기는 어드민(service_role)만.
drop policy if exists md_page_events_insert on md_page_events;
create policy md_page_events_insert on md_page_events
  for insert to anon, authenticated
  with check (event in ('view', 'click'));
