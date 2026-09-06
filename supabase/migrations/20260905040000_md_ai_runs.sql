-- L1 통과율 측정 (docs/md/requirements.md AC-4).
--
-- 1차와 재요청을 나눠 쌓는다. 합쳐 놓으면 «프롬프트가 좋아졌는지» 를 알 수 없다.
-- 실패 사유 분포가 어디를 고칠지 알려주는 유일한 근거다.

create table if not exists md_ai_runs (
  id         bigserial primary key,
  request    text not null,
  template   text not null,
  attempt    int  not null,       -- 1 = 1차, 2 = 재요청
  ok         boolean not null,
  error      text,
  created_at timestamptz not null default now()
);

create index if not exists md_ai_runs_time_idx on md_ai_runs (created_at desc);

alter table md_ai_runs enable row level security;
