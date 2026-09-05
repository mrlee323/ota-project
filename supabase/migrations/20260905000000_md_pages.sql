-- MD(기획전) 페이지.
--
-- showcase 와는 다른 도메인이다 — showcase_content 는 건드리지 않는다.
-- 저장 형태는 HTML 이 아니라 모듈 배열 JSON 이다 (docs/md/design.md D3).
-- 모듈 마크업을 고치면 이미 발행된 MD 도 같이 바뀐다 (AC-5).

create table if not exists md_pages (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  page        jsonb not null default '{"schemaVersion":1,"blocks":[]}'::jsonb,
  status      text not null default 'draft',   -- draft | published | archived
  starts_at   timestamptz,
  ends_at     timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint md_pages_status_check check (status in ('draft', 'published', 'archived'))
);

-- 공개 조회는 «발행 + 노출 기간 안» 을 함께 본다 (FR-4.3)
create index if not exists md_pages_public_idx
  on md_pages (status, starts_at, ends_at);

create index if not exists md_pages_updated_idx
  on md_pages (updated_at desc);

-- updated_at 자동 갱신
create or replace function md_pages_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists md_pages_touch on md_pages;
create trigger md_pages_touch
  before update on md_pages
  for each row execute function md_pages_touch_updated_at();

-- RLS: 공개 페이지는 누구나 읽는다. 쓰기는 service_role 만 (어드민 경유).
alter table md_pages enable row level security;

drop policy if exists md_pages_public_read on md_pages;
create policy md_pages_public_read on md_pages
  for select
  using (
    status = 'published'
    and (starts_at is null or starts_at <= now())
    and (ends_at   is null or ends_at   >= now())
  );
