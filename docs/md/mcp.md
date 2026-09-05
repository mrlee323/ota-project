# MD 자동화 MCP 서버 — 설계와 구현 계획

**상태** 초안 v0.3 · 2026-09-05
**선행** [requirements.md](./requirements.md) · [design.md](./design.md) · [llm.md](./llm.md) L2
**목적** 디자인시스템 + MD 자동화의 **프로세스를 정의하고 검증**한다.
작동하는 것을 만들어 보는 게 목적이지, 이 코드를 어딘가에 이식하려는 게 아니다.

> v0.1 은 「비용 이전」을 1번 근거로 놨다. 순서를 고쳤다 — 실제 문제는 **선택**이다.

---

## 1. 풀려는 문제

캔버스는 **당연히 만든다.** 담당자가 직접 세팅하고 수정하는 화면이 없으면 아무것도 안 된다.
MCP 는 캔버스를 대신하는 게 아니라, **캔버스 앞에서 막히는 세 가지**를 푼다.

### P1. 모듈이 100개가 되면 고를 수가 없다

지금은 6종이라 팔레트를 훑으면 된다. 타입별로 변형이 쌓여 **100개**가 되면 그게 안 된다.

- 담당자는 100개의 차이를 모른다 — `hero-image` 와 `hero-split` 과 `hero-video` 중 뭐가 맞는지
- 팔레트를 스크롤해서 고르는 UI 는 20개쯤에서 이미 무너진다
- 결국 **아는 모듈 3~4개만 반복해서 쓴다** → 모듈을 100개 만든 의미가 사라진다

**이게 MCP 의 1번 목적이다.** "9월 오사카 브랜드 기획전" 이라고 말하면
AI 가 100개 중에서 맞는 조합을 골라 온다.

### P2. 어떤 디자인이 어울리는지 판단을 못 한다

담당자는 홍보할 상품은 알지만 **그 상품에 어떤 구성이 맞는지**는 모른다.
디자이너가 하던 판단이고, 그 판단을 빼는 게 이 프로젝트의 목적인데
빼기만 하고 대신할 게 없으면 결과물이 나빠진다.

MCP 는 그 판단을 AI 에게 맡긴다 — 단, **정의된 모듈과 토큰 안에서만** (D6).

### P3. 이미지를 만들 수가 없다

실사 F1 — 기획전의 ~90%가 디자이너 이미지다. 모듈을 아무리 늘려도
**히어로 배경 한 장**은 여전히 필요하다. 담당자는 그걸 못 만든다.

일반적인 AI 이미지 생성은 정보 없이 시키면 **너무 자유롭게 나온다.**
그런데 MD 는 다르다 — **디자인시스템 토큰이 정의돼 있고, 인접 모듈의 값을 참고할 수 있다.**
그 문맥을 프롬프트에 넣으면 어울리는 이미지가 나올 여지가 있다.

**단 이건 캔버스 기능이지 MCP 도구가 아니다** — 설계는 [llm.md §4](./llm.md), 이유는 §4.

### 덤 — 비용이 호출자에게 넘어간다

MCP 서버는 토큰을 안 쓴다. 호출자의 AI 클라이언트가 낸다.
이미 AI 구독이 있는 사람이라면 **도구 쪽에 LLM 예산이 따로 필요 없다.**

부수 효과지만 크다 — 배치 생성처럼 «비용 상한이 열려서» 못 하던 것이 가능해진다.

---

## 2. 어드민에 붙일 수 있나 — 가능하다

**별도 서버가 아니다. 어드민과 같은 Next.js 앱 안의 route handler 하나다.**

```
src/app/api/mcp/route.ts        ← MCP 서버 (mcp-handler)
        │  직접 import (HTTP 호출 아님)
        ├── domain/md/modules        MODULE_DEFS
        ├── domain/md/moduleDef      validateBlock
        ├── infrastructure/md        mdPageApi
        └── infrastructure/admin     requirePermission
```

의미 — **검증 로직이 캔버스와 물리적으로 같은 코드다.** MCP 로 들어오든
캔버스로 들어오든 `validateBlock` 을 통과해야 저장된다. 두 벌로 관리할 일이 없다.

### 기술 스택

| 항목 | 내용 |
|---|---|
| 어댑터 | `mcp-handler` (Vercel 공식). Next.js 13+ App Router 드롭인 |
| 프로토콜 | `@modelcontextprotocol/server` v2 (MCP 공식 SDK) |
| 전송 | Streamable HTTP (stateless). Redis·세션 저장소 불필요. **v2 에서 SSE 는 제거됨** |
| 배포 | 이미 있는 `ota-project.vercel.app` — 원격 MCP 에 필요한 공개 HTTPS URL 확보됨 |

### `mcp-handler` 가 하는 일 / 안 하는 일

MCP 공식 SDK 는 **프로토콜**을 안다 — `initialize` 핸드셰이크, `tools/list`, `tools/call`,
스키마 직렬화, JSON-RPC 에러 코드. 그런데 SDK 의 transport 는 Node `http` 서버나 stdio 전제라
Next.js Route Handler 의 `(req: Request) => Response` 와 모양이 안 맞는다.
**`mcp-handler` 는 그 사이의 HTTP 어댑터 층이다.**

```
[Codex / ChatGPT / Claude]
        │ JSON-RPC 2.0 over Streamable HTTP
        ▼
  mcp-handler                     ← Request/Response 변환 · 인증 · OAuth 메타데이터
        │
  @modelcontextprotocol/server    ← 프로토콜 (initialize · tools/list · tools/call)
        │
  registerTool 로 등록한 우리 함수
```

**해 주는 것** — JSON-RPC 파싱·응답 봉투, 프로토콜 버전 협상(2026-07-28 ↔ 2025 클라이언트),
zod 스키마 → JSON Schema 변환, 에러 코드 매핑, Bearer 검증, OAuth 디스커버리 메타데이터.

**안 해 주는 것** — 도구 로직(우리 몫), 권한 정책(`requirePermission` 은 우리가 태운다),
세션·상태(v2 는 stateless — 대화 상태는 클라이언트가 들고 있다).

**API 는 셋뿐이다.**

| | 하는 일 |
|---|---|
| `createMcpHandler(initialize, options)` | 서버 정의 → Request 핸들러 |
| `withMcpAuth(handler, verifyToken)` | **Bearer 토큰 검증 래퍼** |
| `protectedResourceHandler(...)` | RFC 9728 Protected Resource Metadata (OAuth 디스커버리 · CIMD) |

도구 등록은 SDK 쪽 — `server.registerTool(name, { title, description, inputSchema }, handler)`.
`inputSchema` 에 zod 객체를 그대로 넣는다. **`MODULE_DEFS` → 도구 스키마가 한 줄로 붙는 이유다.**

### 요구사항 대조 (확인 완료 · 2026-09-05)

| 요구 | 필요 | 현재 | |
|---|---|---|---|
| Next.js | 13+ (App Router) | **14.2.0** | ✅ |
| Node | 20+ | **v20.18.1** | ✅ |
| zod | **^4.2.0** | 3.22.0 | ⬆ 올린다 (Q7 결정) |
| 패키지 | `mcp-handler@^2` · `@modelcontextprotocol/server@^2` | 없음 | 추가 |

```bash
pnpm add mcp-handler@^2 @modelcontextprotocol/server@^2 zod@^4
```

### zod 4 이행 — 영향 범위

zod 를 쓰는 파일이 24개지만 **실제로 깨지는 것은 없다.**

| zod 4 에서 **제거**된 것 | 레포 사용 |
|---|---|
| `invalid_type_error` · `required_error` | 없음 ✅ |
| `z.record()` 단일 인자 | 없음 ✅ |
| `errorMap` · `.deepPartial()` | 없음 ✅ |

| **deprecated 지만 동작**하는 것 | 레포 사용 |
|---|---|
| `z.string().email()/.url()/.uuid()/.datetime()` | 다수 — **고치지 않아도 된다** |
| `message` 인자 (`z.string().email("...")`) | 다수 — 동작함 |
| `.merge()` · `z.nativeEnum()` | 없음 |

`.default()` 의미가 «출력 타입 기준» 으로 바뀌었지만 레포 사용례는 영향 없다.

**결론 — 버전만 올리면 된다.** 기존 코드 전수 수정은 필요 없고,
**새로 쓰는 MD 코드만 v4 문법으로** 쓴다 (`z.record(z.string(), z.unknown())`, `z.url()`).

### 덤 — `z.toJSONSchema()` 가 딸려 온다

zod 4 는 **JSON Schema 변환이 내장**이다. `llm.md §2` 의 L1 이 모듈 정의로
Gemini `responseSchema` 를 만들어야 하는데, 별도 라이브러리 없이 이걸로 된다.

MCP 때문에 올리는 zod 4 가 L1 의 구조화 출력까지 같이 풀어준다.

### 최소 route handler

```typescript
// src/app/api/mcp/route.ts
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { MODULE_DEFS } from "@/domain/md/modules";

const handler = createMcpHandler((server) => {
  server.registerTool(
    "search_modules",
    {
      title: "모듈 검색",
      description: "기획전 의도에 맞는 MD 모듈을 찾는다. 요약만 돌려준다.",
      inputSchema: z.object({
        query: z.string(),
        category: z.enum(["헤더", "본문", "푸터"]).optional(),
        limit: z.number().int().min(1).max(30).default(10),
      }),
    },
    async ({ query, category, limit }) => {
      const hits = searchModules(MODULE_DEFS, query, category).slice(0, limit);
      return { content: [{ type: "text", text: JSON.stringify(hits) }] };
    },
  );
});

export { handler as GET, handler as POST };
```

## 3. 클라이언트 지원 현황 (확인 완료)

| 클라이언트 | 원격 MCP | 설정 | 인증 |
|---|---|---|---|
| **Codex CLI** | ✅ Streamable HTTP | `codex mcp add <name> --url <URL>` | `bearer_token_env_var` |
| **ChatGPT (개발자 모드)** | ✅ Streamable HTTP / SSE | 설정 → 개발자 모드 → Create app | **OAuth 또는 무인증** |
| **Claude** | ✅ | 커넥터 | OAuth / 토큰 |

`~/.codex/config.toml` 은 **Codex CLI · IDE 확장 · ChatGPT 데스크톱 앱이 공유**한다.
한 번 설정하면 세 군데서 쓴다 → 개발팀 도입은 사실상 확정적이다.

### 클라이언트별 제약 (기록만)

ChatGPT **웹 커넥터**는 조직 플랜에 따라 개발자 모드가 안 켜지거나
쓰기 도구가 *"blocked by OpenAI's safety checks"* 로 막힌 사례가 보고돼 있다.
보고된 해결책은 도구 설명에 «초안만 만들고 삭제·발행·외부 전송은 하지 않는다» 를
명시하는 것 — §4 의 draft-only 설계가 곧 그 해결책이다.

**다만 Codex CLI 경로에는 이 제약이 없다.** ChatGPT 계정으로 로그인해 쓰는 CLI 라
웹 커넥터의 정책 게이트를 거치지 않는다 → §9 에서 Codex 를 1순위 클라이언트로 둔다.

---

## 4. 도구 표면

### 설계 원리 두 가지

**① 모듈 100개를 한 번에 뱉지 않는다.**
모듈 정의 하나가 300~600 토큰이다. 100개면 30~60K 토큰이 매 대화마다 나간다.
그래서 **2단계**로 나눈다 — 목록은 요약만, 전체 정의는 필요한 것만.

**② 모든 쓰기 도구는 캔버스 편집 URL 을 돌려준다.**
대화로 초안을 만들고, 마감은 캔버스에서 한다.

```
대화에서 시작  ──▶  초안 + 편집 URL  ──▶  캔버스에서 세팅·수정·발행
```

### 읽기 — 고르기를 돕는다 (P1·P2)

| 도구 | 하는 일 | 반환 |
|---|---|---|
| `search_modules` | 의도·카테고리로 모듈을 찾는다. **100개 문제의 답** | 요약만 (type · 이름 · 한 줄 설명 · 카테고리), 기본 10개 |
| `get_module` | 모듈 하나의 **전체 정의** (필드·자유도·샘플) | 정의 1개 |
| `suggest_template` | "9월 오사카 브랜드 기획전" → 템플릿 + 모듈 조합 추천 | 템플릿 + 블록 순서 + 고른 이유 |
| `get_design_context` | 색·타이포 토큰, 이 페이지에 이미 쓰인 톤 | 토큰 목록 |
| `search_hotels` | 조건으로 호텔 후보를 찾는다. **환각을 막는 유일한 수단** (FR-5.5) | 호텔 목록 |
| `list_md_pages` / `get_md_page` | 기존 MD 목록·구성 | |

> `suggest_template` 이 P1·P2 를 동시에 푼다. 담당자는 «무엇을 홍보하고 싶은지» 만 말하고,
> 모듈 선택과 구성 판단은 도구가 한다.

**모듈 정의에 `whenToUse` 를 추가해야 한다.** 지금 `description` 은 «이게 뭔가» 인데,
고르게 하려면 «언제 쓰나» 가 필요하다. 100개 중에서 고르는 근거는 그쪽이다.
→ FR-1.5 확장 (§8)

### 쓰기 — 초안만

| 도구 | 하는 일 |
|---|---|
| `validate_md_page` | 검증만 하고 **저장하지 않는다**. 대화 중 «이렇게 하면 맞나» 확인 |
| `create_md_draft` | `status='draft'` 로 생성 → 편집 URL 반환 |
| `update_md_draft` | draft 의 블록 추가·수정·순서 변경 → 편집 URL 반환 |

### 절대 만들지 않는 도구

`publish` · `delete` · `archive` · 노출 기간 변경 · 외부 전송 · **이미지 생성**

① 되돌리기 어려운 행위는 사람이 UI 에서 한다
② ChatGPT 안전 검사 통과 조건 (§3)
③ 프롬프트 인젝션 피해 상한을 «draft 하나 더 생김» 으로 묶는다

**이미지 생성을 빼는 이유는 하나 더 있다 — 비용이 우리 쪽에 남는다.**
나머지 쓰기 도구는 전부 «DB 에 draft 쓰기» 라 호출 비용이 0 이다.
이미지만 외부 생성 API 를 부르므로, MCP 에 두면 **원격에서 우리 지갑을 여는 도구**가 된다.
그것 하나 때문에 사용자당 일일 상한 같은 장치가 필요해진다 — 도구를 빼면 장치도 사라진다.

**MCP 에서 이미지가 필요하면** draft 의 `image` 블록을 빈 채로 두고 편집 URL 을 돌려준다.
담당자가 캔버스에서 「AI로 만들기」를 누르거나 직접 올린다 (원리 ②와 같은 흐름).
설계는 [llm.md §4](./llm.md).

> 모든 쓰기 도구의 `description` 첫 줄에 명시한다 —
> *"초안(draft)만 생성·수정한다. 발행·삭제·외부 전송은 하지 않는다."*

---

## 5. 인증

### 개인판 (지금)

```sql
create table md_mcp_tokens (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null,
  token_hash   text not null,       -- 원문은 발급 시 1회만
  label        text,
  last_used_at timestamptz,
  revoked_at   timestamptz,
  created_at   timestamptz default now()
);
```

- `withMcpAuth(handler, verifyToken)` 이 Bearer 검증을 한다 — **직접 짜지 않는다**.
  `verifyToken` 에 `md_mcp_tokens` 조회 함수만 넘긴다
- 토큰 → `user_id` → **기존 `requirePermission("md")` 를 그대로 태운다**
  (`withMcpAuth` 는 «누구인지» 만 알려준다. 권한 판정은 우리 몫)
- 모든 호출을 `md_mcp_calls` 에 적재

> 이 레포는 권한 체계가 없다. MCP 를 붙이면서 **최소한의 토큰 인증만** 세운다 —
> 조직 단위 권한은 이 프로젝트가 검증하려는 것이 아니다.

**대비책이 이미 있다.** 어떤 클라이언트가 Bearer 를 못 받고 OAuth 만 받더라도,
`mcp-handler` 의 `protectedResourceHandler` 가 RFC 9728 디스커버리를 제공한다.

### 프로세스로서의 결론

토큰 방식은 이 레포의 규모에 맞춘 것이다. 여기서 확인해 둘 프로세스상의 사실은 하나다 —
**MCP 도구는 어드민의 권한 판정을 부르는 얇은 층이다.**
권한 체계가 먼저 서고 MCP 가 그 위에 얹히는 순서여야 하며, 반대는 성립하지 않는다.

---

## 6. 안전

| 위협 | 대응 |
|---|---|
| **프롬프트 인젝션** — 호텔 설명·요청서에 든 문장이 도구 호출을 유도 | draft-only (§4). 피해 상한이 «draft 하나» |
| 없는 호텔을 넣음 | `search_hotels` 결과에 없는 id 는 서버가 거부 |
| 스키마에 없는 필드 | `validateBlock` 이 서버에서 막는다. 클라이언트를 믿지 않는다 |
| 토큰 유출 | 해시 저장 · 폐기 가능 · `last_used_at` 노출 |

**서버가 최종 방어선이다.** 클라이언트가 무슨 모델이든, 무슨 프롬프트를 받았든
서버는 캔버스와 **동일한 코드**로 검증한다 (§2).

---

## 7. 다른 문서에 생기는 변경

| 문서 | 변경 |
|---|---|
| `requirements.md §2 비목표` | 「이미지 생성 AI」 제외 → **캔버스 한정 포함** ([llm.md §4](./llm.md)). MCP 도구로는 안 만든다 |
| `requirements.md FR-1.5` | 필드 `description` 외에 모듈 단위 **`whenToUse`** 추가 (§4) |
| `requirements.md FR-10` | MCP 요구사항 신설. 이미지 생성 도구는 **만들지 않는다** |
| `design.md` | `moduleDefSchema` 에 `whenToUse` 필드 |
| `llm.md` | 이미지 생성을 **L3(캔버스 전용)** 으로 분리 |

---

## 8. 구현 계획

### 순서 판단 — 스파이크를 먼저 뺀다

정석은 P1(모듈)·P2(캔버스)·P3(발행)이 끝난 뒤 MCP 다. 없는 것을 대화로 만들 수는 없다.
그런데 **이 프로젝트의 목적은 프로세스가 성립하는지 보는 것이고, 배관은 읽기 전용으로 검증된다.**
Q-M1·Q-M2 를 몇 주 뒤로 미룰 이유가 없다.

```
S0 스파이크 (읽기 전용)  ─┐
   지금 가능 · 모듈 정의만 필요 · 버리는 코드 없음
                          │
P0~P3 본 개발             │   ← S0 결과와 무관하게 진행
                          │
M1~M4 MCP 본편  ←─────────┘
```

S0 에서 만드는 `moduleDef.ts` · 모듈 정의 6종은 **P0/P1 이 그대로 쓴다.** 스파이크지만 버리지 않는다.

---

### S0 · 스파이크 — 읽기 전용 1도구 (지금 가능)

**목적** 배관 검증 + 인증 방식 확정 (Q-M1)
**필요한 것** 모듈 정의뿐. DB·캔버스·발행 전부 불필요

#### 1) 의존성

```bash
pnpm add mcp-handler@^2 @modelcontextprotocol/server@^2 zod@^4
```

#### 2) 만드는 파일

```
src/domain/md/moduleDef.ts        ← P0 과 공유. 버리는 코드 아님
src/domain/md/modules/index.ts    ← 6종 정의 (whenToUse 포함)
src/domain/md/search.ts           searchModules(defs, query, category)
src/app/api/mcp/route.ts          ← MCP 서버
```

#### 3) 도구 하나

```typescript
// src/app/api/mcp/route.ts
import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import { MODULE_DEFS } from "@/domain/md/modules";
import { searchModules } from "@/domain/md/search";

const base = createMcpHandler((server) => {
  server.registerTool(
    "search_modules",
    {
      title: "MD 모듈 검색",
      description:
        "기획전 의도에 맞는 MD 모듈을 찾는다. 요약만 돌려주므로, " +
        "고른 모듈의 전체 정의가 필요하면 get_module 을 부른다. 읽기 전용이다.",
      inputSchema: z.object({
        query: z.string().describe("만들려는 기획전의 의도. 예: 오사카 브랜드 호텔 소개"),
        category: z.enum(["헤더", "본문", "푸터"]).optional(),
        limit: z.number().int().min(1).max(30).default(10),
      }),
    },
    async ({ query, category, limit }) => ({
      content: [{
        type: "text",
        text: JSON.stringify(searchModules(MODULE_DEFS, query, category).slice(0, limit)),
      }],
    }),
  );
});

// S0 은 단일 토큰. DB 테이블은 M4 에서.
const handler = withMcpAuth(base, async (token) =>
  token === process.env.MCP_DEV_TOKEN ? { userId: "dev" } : null,
);

export { handler as GET, handler as POST };
```

#### 4) 로컬 확인 — 클라이언트 없이

```bash
curl -s http://localhost:3000/api/mcp \
  -H "Authorization: Bearer $MCP_DEV_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

`search_modules` 가 `inputSchema` 와 함께 돌아오면 배관은 끝난 것이다.
(MCP Inspector 를 써도 되지만 curl 이 확실하고 빠르다.)

#### 5) 배포

```bash
# Vercel 환경변수에 MCP_DEV_TOKEN 등록 후
git push        # → https://ota-project.vercel.app/api/mcp
```

#### 6) Codex 연결

```bash
codex mcp add md --url https://ota-project.vercel.app/api/mcp
```

또는 `~/.codex/config.toml` 에 직접:

```toml
[mcp_servers.md]
url = "https://ota-project.vercel.app/api/mcp"
bearer_token_env_var = "MD_MCP_TOKEN"
enabled = true
```

확인 — `codex mcp list` 에 뜨고, 대화에서 «MD 모듈 뭐 있어?» 가 답을 하면 성공.
(`config.toml` 은 CLI·IDE 확장·ChatGPT 데스크톱이 공유한다)

#### 7) ChatGPT 웹 커넥터 (선택) ← **Q-M2 확인용**

설정 → 개발자 모드 → Create app → URL 입력.
**Bearer 헤더를 넣을 칸이 있는지 본다.**

| 결과 | 다음 |
|---|---|
| Bearer 가능 | 그대로 간다 |
| OAuth 만 됨 | `protectedResourceHandler` 로 OAuth 디스커버리 추가 (§5). 막히는 게 아니라 한 단계 늘어남 |
| 개발자 모드 자체가 안 켜짐 | **Codex 로 간다.** 웹 커넥터는 선택지 중 하나일 뿐이다 |

#### S0 완료 판정

- [ ] curl `tools/list` 응답 OK
- [ ] Codex 대화에서 도구 호출 성공
- [ ] ChatGPT 연결 성공 여부 + **인증 방식 확정** (Q-M1)
- [ ] 결과 3줄로 기록 → M 단계 계획에 반영

---

### M1 · 고르기 도구 (P1·P2 완료 후)

S0 에 도구 5개를 더한다. 전부 읽기.

| 도구 | 입력 | 출력 |
|---|---|---|
| `get_module` | `{ type }` | 모듈 전체 정의 (필드·자유도·샘플) |
| `suggest_template` | `{ intent, hotelCount? }` | 템플릿 + 블록 순서 + **고른 이유** |
| `get_design_context` | `{ pageId? }` | 색·타이포 토큰, 페이지에 이미 쓰인 톤 |
| `search_hotels` | `{ region?, minStars?, keyword?, limit }` | 호텔 후보 (id 포함) |
| `get_md_page` / `list_md_pages` | | 기존 MD 구성·목록 |

**검증 조건 — 모듈을 30개로 늘려 놓고 시험한다.**
6개로는 100개 문제(§1 P1)를 검증할 수 없다. 변형 모듈을 의도적으로 만들어
`search_modules` 가 `hero-image` / `hero-split` / `hero-video` 를 구분해 고르는지 본다. → Q-M3

### M2 · 쓰기 도구 (P3 완료 후)

| 도구 | 입력 | 출력 |
|---|---|---|
| `validate_md_page` | `{ blocks }` | 검증 결과만. **저장 안 함** |
| `create_md_draft` | `{ title, blocks }` | `{ pageId, editUrl }` |
| `update_md_draft` | `{ pageId, ops[] }` | `{ pageId, editUrl }` |

- 세 도구 모두 `description` 첫 줄에 draft-only 명시 (§4)
- 모든 응답에 `editUrl` — 대화에서 시작해 캔버스에서 마감 (§4 원리 ②)
- `create/update` 는 `validateBlock` 을 반드시 통과 (§6)

**여기서 Q-M2 가 답이 난다** — ChatGPT 가 쓰기 도구를 차단하는지.
차단되면 도구 설명을 §3 의 보고된 방식대로 고쳐 재시도한다.

### M3 · 인증·감사 정식화

S0 의 단일 토큰을 걷어낸다.

- [ ] `md_mcp_tokens` (§5) + 어드민 발급·폐기 화면
- [ ] `withMcpAuth` 의 `verifyToken` 을 DB 조회로 교체
- [ ] `requirePermission("md")` 연결
- [ ] `md_mcp_calls` 적재 · 토큰당 레이트리밋
- [ ] 프로세스 정리 1장 — 무엇이 되고 무엇이 안 됐나

---

### 준비물

| 항목 | 왜 |
|---|---|
| **Codex CLI** (ChatGPT 계정으로 로그인) | 1순위 클라이언트. 이것만 있으면 S0 가 끝난다 |
| ChatGPT 개발자 모드 (선택) | Q-M2 확인용. 안 켜져도 파일럿은 진행된다 |
| Vercel 환경변수 `MCP_DEV_TOKEN` 등록 | 배포 확인 |


## 9. 파일럿에서 답해야 할 질문

| # | 질문 | 왜 중요한가 | 어디서 |
|---|---|---|---|
| **Q-M1** | ChatGPT 커넥터에 **Bearer 토큰**을 넣을 수 있나, OAuth 만 되나? | 안 되면 `protectedResourceHandler` 로 OAuth 경로 (§5) | M0 |
| **Q-M2** | ChatGPT 웹 커넥터에서 쓰기 도구가 통과하나? draft-only 설명으로 충분한가? | 클라이언트 선택지가 몇 개인지 | M2 |
| **Q-M3** | 모듈 30개에서 `search_modules` 가 맞는 걸 고르나? 100개면? | **P1 의 답** | M1 |
| **Q-M5** | 같은 도구를 Codex(GPT)와 Claude 가 다르게 쓰나? | 도구 설명을 어느 쪽에 맞출지 | M2 |
| **Q-M6** | 대화 왕복 몇 번에 초안이 나오나? | 캔버스 대비 실제로 빠른지 | M2 |

---

## 10. L1 과의 관계

| | L1 (요청서 → MD) | L2 (MCP) |
|---|---|---|
| 토큰 비용 | 서비스 | 호출자 |
| 사용자 위치 | 어드민 화면 | 자기 AI 클라이언트 |
| 통제 | 모델·프롬프트 고정 | 호출자 것 |
| 통과율 측정 (AC-4) | **가능** | **불가** — 호출자 모델이 제각각 |

**둘 다 만든다** (Q6 결정). 성격이 다르다 — L1 은 정형 요청서·정확도, L2 는 자유 대화·자유도.
AC-4(스키마 1차 통과율)는 L1 에서만 잴 수 있다. 그 숫자가 스키마 설계의 유일한 근거라 포기하지 않는다.

---

## 11. 안 하는 것

- **MCP 서버 안에서 LLM 을 부르는 것** — 호출자가 이미 LLM 이다. 비용 이전의 의미가 사라진다
- **이미지 생성 도구** — 우리 비용이 나가는 유일한 도구가 된다 (§4)
- **발행·삭제 도구** (§4)
- **이미지 업로드 도구** — 파일 전송은 대화보다 UI 가 맞다
- **stdio 전송** — 배포된 서버에 붙을 수 없다. 원격 HTTP 만
- **조직 권한 체계 흉내** — 이 프로젝트가 검증하려는 대상이 아니다 (§5)
