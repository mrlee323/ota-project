-- MD 템플릿.
--
-- 코드 상수가 아니라 DB 에 둔다 — 담당자가 자기 구성을 저장하고 즐겨찾기 하므로
-- 배포 없이 늘어야 한다 (docs/md/requirements.md FR-9).
--
-- 계층은 template → module 2단계다. 중간 «섹션» 엔티티를 만들지 않는다 —
-- 반복 묶음은 blocks 안의 group 태그로 표현한다 (design.md §5).

create table if not exists md_templates (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null default '',
  blocks      jsonb not null,
  kind        text not null default 'user',      -- system | user
  visibility  text not null default 'private',   -- private | shared (v1 은 private 만)
  owner_id    uuid,                              -- kind='user' 일 때만
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint md_templates_kind_check check (kind in ('system', 'user')),
  constraint md_templates_visibility_check check (visibility in ('private', 'shared')),
  -- 시스템 템플릿은 주인이 없고, 사용자 템플릿은 반드시 주인이 있다
  constraint md_templates_owner_check check (
    (kind = 'system' and owner_id is null) or (kind = 'user' and owner_id is not null)
  )
);

create index if not exists md_templates_pick_idx on md_templates (kind, visibility, owner_id);

-- 즐겨찾기는 «개인 전용» 이다. 공유 개념이 없다 (Q8).
-- 즐겨찾기는 내 목록에서 위로 올리는 행위지 자산이 아니다.
create table if not exists md_template_favorites (
  user_id     uuid not null,
  template_id uuid not null references md_templates(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, template_id)
);

drop trigger if exists md_templates_touch on md_templates;
create trigger md_templates_touch
  before update on md_templates
  for each row execute function md_pages_touch_updated_at();

alter table md_templates enable row level security;
alter table md_template_favorites enable row level security;

-- 시스템 템플릿은 로그인한 누구나 읽는다. 개인 템플릿은 본인만.
drop policy if exists md_templates_read on md_templates;
create policy md_templates_read on md_templates
  for select using (kind = 'system' or owner_id = auth.uid());

drop policy if exists md_template_favorites_own on md_template_favorites;
create policy md_template_favorites_own on md_template_favorites
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─── 시스템 템플릿 시드 (docs/md/module-survey.md §4) ────────────────────────
-- 표본 7건을 100% 커버한 4종. 원본은 src/domain/md/template.ts 에 있다.

insert into md_templates (name, description, blocks, kind, visibility)
select * from (values
  (
    '브랜드·다호텔',
    '호텔 여러 곳을 하나씩 소개한다. 호텔 한 곳이 구간 하나이고, 캔버스에서 구간을 통째로 추가할 수 있다.',
    '[{"moduleType":"hero","moduleVersion":1},
      {"moduleType":"image","moduleVersion":1,"group":{"type":"hotel","id":"g1"}},
      {"moduleType":"image","moduleVersion":1,"group":{"type":"hotel","id":"g1"}},
      {"moduleType":"cta","moduleVersion":1,"group":{"type":"hotel","id":"g1"}},
      {"moduleType":"notes","moduleVersion":1}]'::jsonb,
    'system', 'private'
  ),
  (
    '목적지 테마',
    '한 지역·테마를 소개하고 관련 숙소로 보낸다.',
    '[{"moduleType":"hero","moduleVersion":1},
      {"moduleType":"image","moduleVersion":1},
      {"moduleType":"section-title","moduleVersion":1},
      {"moduleType":"hotel-card-list","moduleVersion":1},
      {"moduleType":"cta","moduleVersion":1},
      {"moduleType":"notes","moduleVersion":1}]'::jsonb,
    'system', 'private'
  ),
  (
    '허브·특가',
    '구간마다 숙소 목록을 늘어놓는다. 이미지 없이 만들 수 있는 유일한 템플릿이다.',
    '[{"moduleType":"hero","moduleVersion":1},
      {"moduleType":"section-title","moduleVersion":1},
      {"moduleType":"hotel-card-list","moduleVersion":1},
      {"moduleType":"notes","moduleVersion":1}]'::jsonb,
    'system', 'private'
  ),
  (
    '단독·제휴',
    '한 건만 알린다. 제휴 이벤트·단독 특가처럼 내용이 짧을 때 쓴다.',
    '[{"moduleType":"hero","moduleVersion":1},
      {"moduleType":"image","moduleVersion":1},
      {"moduleType":"cta","moduleVersion":1},
      {"moduleType":"notes","moduleVersion":1}]'::jsonb,
    'system', 'private'
  )
) as seed(name, description, blocks, kind, visibility)
where not exists (select 1 from md_templates where kind = 'system');
