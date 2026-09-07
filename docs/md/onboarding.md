# 다른 기기에서 이어서 하기

**용도** 새 노트북에서 이 프로젝트를 처음부터 돌리는 절차.
**핵심** 코드와 DB 는 이미 공유 상태다. **환경변수만 다시 채우면 된다.**

---

## 1. 지금 어디까지 왔나

```
SETUP ✅  P0 ✅  P1 ✅  P2 ✅  P3 ✅  P4 ✅  P5 ✅
S0 ✅  M1 ✅  M2 ✅  M3 ✅
수용기준 AC-1~7 전부 실측 통과
```

`docs/md/plan.md` §7 이 진행 상태의 단일 소스다. 계획된 작업은 전부 끝났다.

**남은 것은 내가(사람이) 해야 하는 확인 두 가지뿐이다** — `plan.md` §9 의 Q-M1·Q-M2·Q-M5·Q-M6.
Codex 와 ChatGPT 에 실제로 붙여봐야 답이 난다.

---

## 2. 필요한 것

| | 버전 | 확인 |
|---|---|---|
| Node | **22.12+** | `.nvmrc` 에 고정. **20 에서는 테스트 31파일이 전부 실패한다** (`require(ESM)` 미지원) |
| pnpm | 9.15.9 | `packageManager` 에 고정 |

```bash
git clone https://github.com/mrlee323/ota-project.git
cd ota-project
pnpm install
```

corepack 이 `pnpm` 을 못 띄우면(서명 키 만료) 최초 1회만:

```bash
COREPACK_INTEGRITY_KEYS=0 pnpm --version    # 또는 npm i -g corepack@latest
```

**커밋 author 를 개인 계정으로 맞춘다** (전역 설정이 업무 계정일 수 있다):

```bash
git config user.name  "mrlee323"
git config user.email "mrlee3233@gmail.com"
```

푸시 전에는 `gh auth switch --user mrlee323`.

---

## 3. 환경변수 — 여기가 전부다

`.env.example` 을 `.env.local` 로 복사하고 아래를 채운다.
**Vercel 에 다 들어가 있지만 Secret 타입은 내려주지 않는다** (`vercel env pull` 로는 URL·ANON 만 온다).

### 반드시 필요 (없으면 아무것도 안 된다)

| 변수 | 어디서 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | [Supabase → Settings → API Keys](https://supabase.com/dashboard/project/aapvsizzcugmfsxakpvi/settings/api-keys) · Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 같은 화면의 **Publishable key** (`sb_publishable_…`) |
| `SUPABASE_SERVICE_ROLE_KEY` | 같은 화면의 **Secret key** — `admin_service_role` 쪽. Reveal 눌러 복사 |

> 새 키 체계라 `anon`/`service_role` 이라는 이름은 없다.
> **Publishable = anon**, **Secret = service_role** 이다. 변수 이름은 그대로 둔다
> (Vercel 에도 같은 이름으로 있어서 바꾸면 배포가 깨진다).

### MD 자동화 (L1 · 요청서 → 초안)

| 변수 | 값 |
|---|---|
| `LLM_EXTRACT_URL` | `https://generativelanguage.googleapis.com/v1beta/openai/` |
| `LLM_EXTRACT_MODEL` | `gemini-2.5-flash` |
| `LLM_EXTRACT_KEY` | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) — 카드 없이 즉시 발급 |

### 이미지 생성 (L3)

| 변수 | 값 |
|---|---|
| `GEMINI_API_KEY` | **`LLM_EXTRACT_KEY` 와 같은 값**을 넣으면 된다 (같은 Google AI Studio 키) |
| `HF_API_TOKEN` | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) — Read 권한이면 충분 |
| `HF_IMAGE_PROVIDER` | `nscale` (기본값). 죽으면 §6 참고 |

### MCP

| 변수 | 값 |
|---|---|
| `MCP_DEV_TOKEN` | **아무 임의 문자열**. 받아오는 값이 아니다. `openssl rand -base64 32` |

### 안 채워도 되는 것

`INNGEST_*` 는 쇼케이스 배치 생성용이고 MD 와 무관하다. 비워 둬도 MD 는 전부 동작한다.

---

## 4. DB 는 다시 만들 필요 없다

마이그레이션 6개가 **이미 적용돼 있다** (Supabase 는 기기와 무관하게 공유된다).

```
md_pages · md_templates · md_template_favorites
md_page_events · md_ai_runs · md_image_runs
md_mcp_tokens · md_mcp_calls
+ admin_permissions 에 'md' 권한
```

새 기기에서 다시 돌리지 않는다. 확인만 하려면:

```bash
pnpm dev
# 로그인 → /admin/content/md 에 목록이 보이면 정상
```

---

## 5. 돌려보기

```bash
pnpm dev                 # localhost:3000
pnpm test -- --run       # 45파일 423테스트
pnpm exec tsc --noEmit   # 0 errors
pnpm build               # ● /md/[slug] 가 나와야 한다 (ISR)
```

로그인 계정은 `README.md` 에 있다.

| 화면 | 주소 |
|---|---|
| 기획전 목록·토큰 발급 | `/admin/content/md` |
| 캔버스 | `/admin/content/md/<id>` |
| 공개 페이지 | `/md/<slug>` |
| 발행 전 미리보기 | `/md/<slug>/preview` |
| MCP | `/api/mcp` |

---

## 6. 알아두면 시간 아끼는 것들

`docs/md/context.md` §6 에 「반복되는 실수」 목록이 있다. 특히 —

- **ISR 페이지에서 쿠키를 읽으면 프로덕션에서만 500 이 난다.** dev 서버는 이 검사를 안 한다
- **`max_tokens` 를 짜게 주면** thinking 모델이 JSON 을 잘라서 «스키마 위반» 처럼 보인다
- **Supabase 쿼리 빌더는 lazy 다.** `await` 없이 던지면 실행되지 않는다
- **HF 이미지 공급자는 죽는다.** 410 이 나면 살아 있는 공급자를 찾아 `HF_IMAGE_PROVIDER` 를 바꾼다:
  `https://huggingface.co/api/models/<model>?expand[]=inferenceProviderMapping`

---

## 7. 회사 기기를 떠날 때

이 프로젝트는 개인 작업이고 코드는 GitHub 에 다 올라가 있다.
회사 기기에 남는 건 `.env.local` 의 **개인 API 키**뿐이다. 정리하려면:

```bash
rm ~/private/ota-project/.env.local
```

키를 아예 무르려면 각 서비스에서 폐기하면 된다 (Google AI Studio · HuggingFace).
Supabase Secret key 는 Vercel 배포가 쓰고 있으므로 **폐기하지 않는다**.

---

## 8. 새 세션에서 이어가기

```
docs/md/context.md   배경 · 폐기된 안 · 반복되는 실수   ← 먼저 읽는다
docs/md/plan.md      작업 목록 · 진행 상태
docs/md/requirements.md · design.md · llm.md · mcp.md · module-survey.md
```

새 AI 세션에 넣을 프롬프트는 `plan.md` §1 에 있다.
