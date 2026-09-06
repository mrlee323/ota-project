-- 이미지 생성 이력 · 일일 상한 (docs/md/requirements.md FR-11.5).
--
-- 이미지는 «비용이 우리 쪽에 남는» 유일한 기능이다. 나머지 쓰기 작업은
-- 전부 DB 에 쓰는 것이라 호출 비용이 0 인데 이것만 외부 생성 API 를 부른다.
-- 그래서 상한이 선택이 아니라 필수다.

create table if not exists md_image_runs (
  id         bigserial primary key,
  user_id    uuid not null,
  page_id    uuid,
  block_id   text,
  prompt     text,
  url        text,
  created_at timestamptz not null default now()
);

create index if not exists md_image_runs_quota_idx on md_image_runs (user_id, created_at desc);

alter table md_image_runs enable row level security;
