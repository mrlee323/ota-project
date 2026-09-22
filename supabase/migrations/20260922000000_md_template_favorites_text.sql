-- 사용자 템플릿·즐겨찾기를 실제로 쓰기 위한 정리 (FR-9.3 · FR-9.4).
--
-- ① 시스템 템플릿은 코드가 원본이다 (src/domain/md/template.ts).
--    DB 시드와 두 벌로 두니 이미 설명 문구가 갈렸다. 읽는 코드도 없다.
--    그래서 DB 에는 «사용자가 만든 것» 만 남긴다.
-- ② 즐겨찾기는 시스템 템플릿에도 걸려야 한다. 그런데 시스템 id 는
--    uuid 가 아니라 코드 상수('t1-brand' 등)다. uuid FK 를 버리고 text 로 받는다.
--    고아 행이 생길 수 있지만 읽을 때 아는 템플릿과 교차하므로 무해하다.

delete from md_templates where kind = 'system';

alter table md_template_favorites
  drop constraint if exists md_template_favorites_template_id_fkey;

alter table md_template_favorites
  alter column template_id type text using template_id::text;

comment on table md_templates is
  '사용자가 저장한 템플릿만 들어온다. 시스템 템플릿 4종은 src/domain/md/template.ts 가 원본이다.';
comment on column md_template_favorites.template_id is
  '시스템 템플릿의 코드 상수 id 또는 md_templates.id(uuid). FK 가 없는 이유는 그래서다.';
