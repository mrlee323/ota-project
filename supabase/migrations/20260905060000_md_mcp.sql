-- MCP 토큰과 호출 감사 (docs/md/mcp.md §5).
--
-- S0~M2 는 환경변수 토큰 하나로 돌았다. 그러면 «누가 호출했는지» 를 모르고,
-- 권한도 태울 수 없고, 유출됐을 때 그 토큰만 끊을 수도 없다.

create table if not exists md_mcp_tokens (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null,
  -- 원문은 발급 시 한 번만 보여준다. DB 에는 해시만 둔다
  token_hash   text not null unique,
  label        text not null default '',
  last_used_at timestamptz,
  revoked_at   timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists md_mcp_tokens_lookup_idx on md_mcp_tokens (token_hash) where revoked_at is null;
create index if not exists md_mcp_tokens_owner_idx on md_mcp_tokens (user_id, created_at desc);

-- 호출 감사. 레이트리밋도 이 테이블로 센다
create table if not exists md_mcp_calls (
  id         bigserial primary key,
  token_id   uuid references md_mcp_tokens(id) on delete set null,
  user_id    uuid,
  tool       text not null,
  ok         boolean not null default true,
  error      text,
  created_at timestamptz not null default now()
);

create index if not exists md_mcp_calls_rate_idx on md_mcp_calls (token_id, created_at desc);
create index if not exists md_mcp_calls_tool_idx on md_mcp_calls (tool, created_at desc);

alter table md_mcp_tokens enable row level security;
alter table md_mcp_calls  enable row level security;
