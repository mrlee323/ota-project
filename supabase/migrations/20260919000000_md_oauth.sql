-- MCP 용 OAuth 2.1 인가 서버 (docs/md/plan.md §9·§11).
--
-- M3 까지는 어드민에서 토큰 원문을 복사해 클라이언트에 붙여넣는 방식이었다.
-- Codex·Claude 처럼 헤더를 직접 넣을 수 있는 클라이언트는 그걸로 되지만,
-- ChatGPT 웹 커넥터는 OAuth 디스커버리를 요구한다 — 붙을 방법이 없었다.
--
-- 사람이 하는 일은 «로그인» 하나로 끝나야 한다. 토큰을 옮기는 단계를 없앤다.

-- ─── 클라이언트 (RFC 7591 동적 등록) ────────────────────────────────────────
--
-- MCP 클라이언트는 미리 등록할 수 없다. 처음 붙을 때 스스로 등록하고
-- client_id 를 받아 간다. 우리는 «누가 등록했는지» 를 모르므로,
-- 실제 권한은 authorize 단계의 로그인에서 결정된다.

create table if not exists md_oauth_clients (
  id            uuid primary key default gen_random_uuid(),
  client_id     text not null unique,
  client_name   text not null default '',
  -- 정확히 일치해야 한다. 부분 일치를 허용하면 코드를 남의 주소로 흘릴 수 있다
  redirect_uris text[] not null default '{}',
  created_at    timestamptz not null default now()
);

-- ─── 인가 코드 ──────────────────────────────────────────────────────────────
--
-- 수명이 짧고(10분) 한 번만 쓴다. 원문은 저장하지 않는다.
-- PKCE 는 선택이 아니라 필수다 — 공개 클라이언트뿐이라 client_secret 이 없다.

create table if not exists md_oauth_codes (
  id             uuid primary key default gen_random_uuid(),
  code_hash      text not null unique,
  client_id      text not null,
  user_id        uuid not null,
  redirect_uri   text not null,
  code_challenge text not null,
  resource       text,
  expires_at     timestamptz not null,
  used_at        timestamptz,
  created_at     timestamptz not null default now()
);

create index if not exists md_oauth_codes_lookup_idx on md_oauth_codes (code_hash) where used_at is null;

-- ─── 토큰은 기존 테이블을 쓴다 ──────────────────────────────────────────────
--
-- 별도 테이블을 만들면 폐기 UI·레이트리밋·감사를 두 벌로 관리하게 된다.
-- md_mcp_tokens 에 컬럼만 더한다. 수동 발급 토큰은 이 컬럼들이 전부 null 이다.
--
-- **refresh 는 30일이다.** 회사 서비스에서 짧게 잡았다가 대화 도중 만료돼
-- 다시 로그인하는 일이 반복됐다 (§9). access 만 짧게 돌린다.
--
-- refresh 할 때 «새 행» 을 만들지 않고 이 행의 해시만 갈아끼운다 —
-- 그래야 md_mcp_calls 의 감사 이력이 한 연결로 이어진다.

alter table md_mcp_tokens add column if not exists client_id          text;
alter table md_mcp_tokens add column if not exists expires_at         timestamptz;
alter table md_mcp_tokens add column if not exists refresh_token_hash text;
alter table md_mcp_tokens add column if not exists refresh_expires_at timestamptz;

create unique index if not exists md_mcp_tokens_refresh_idx
  on md_mcp_tokens (refresh_token_hash) where refresh_token_hash is not null;

alter table md_oauth_clients enable row level security;
alter table md_oauth_codes   enable row level security;
