# 구현 계획 — 작업 지시서

**용도** 이 문서 하나로 **다른 세션이 작업을 집어 시작**할 수 있게 한다.
**갱신** 작업을 끝낸 세션이 §7 진행 상태의 체크박스를 채운다.

---

## 1. 세션 시작하는 법

새 세션을 열면 이 순서로 한다.

0. **[context.md](./context.md) 를 먼저 읽는다** — 배경과 **폐기된 안** 이 거기 있다.
   안 읽으면 이미 버린 설계를 다시 제안하게 된다
1. **§7 진행 상태**에서 선행이 끝났고 아직 아무도 안 잡은 작업을 고른다
2. 그 작업 블록(§5·§6)의 **「읽을 것」** 에 적힌 문서 절만 읽는다 — 전부 읽지 않는다
3. **「파일 소유권」** 밖의 파일은 건드리지 않는다 (다른 세션과 충돌한다)
4. **「완료 판정」** 을 통과시킨다
5. 커밋하고 §7 체크박스를 채운다

### 세션에 넣을 프롬프트

```
ota-project 에서 MD 자동화를 구현한다.
docs/md/context.md 와 docs/md/plan.md 를 먼저 읽어라.
그 다음 작업 <작업ID> 를 수행해라.
그 작업 블록의 「읽을 것」에 적힌 문서만 읽고, 「파일 소유권」 밖은 건드리지 마라.
완료 판정을 통과시킨 뒤 커밋하고 plan.md §7 을 갱신해라.
```

---

## 2. 문서 지도

| 문서 | 무엇이 있나 | 언제 읽나 |
|---|---|---|
| [context.md](./context.md) | **배경 · 폐기된 안 · 반복되는 실수** | **항상 먼저** |
| [onboarding.md](./onboarding.md) | 새 기기에서 환경 세팅 (환경변수를 어디서 받나) | 다른 노트북에서 시작할 때 |
| [module-survey.md](./module-survey.md) | 공개 기획전 7건 실사. 모듈 6종·템플릿 4종의 **근거** | 모듈·템플릿을 만들 때 |
| [requirements.md](./requirements.md) | FR 11군 · 수용기준 AC-1~7 · 실패 모드 · 결정 기록 | 항상 (해당 FR 만) |
| [design.md](./design.md) | 결정 D1~D8 · 스키마 · 토큰 · 템플릿 · **서비스 렌더링** · 단계 | 구현 전 |
| [llm.md](./llm.md) | L1(요청서→MD) · L2(MCP) · L3(이미지) · 공급자 | P4 · P5 |
| [mcp.md](./mcp.md) | MCP 도구 표면 · 인증 · S0~M3 | S0 · M1~M3 |

**결정은 전부 닫혀 있다.** 설계를 다시 논의하지 않는다 —
설계와 다르게 가야 할 이유를 찾으면 **구현하지 말고 먼저 보고**한다.

---

## 3. 공통 규약

### 스택

Next.js 14 App Router · TypeScript · **zod 4** · Tailwind · Supabase · vitest

**Node 22.12+ · pnpm 9.15.9** — `.nvmrc` 와 `packageManager` 에 고정돼 있다.
Node 20 으로 돌리면 테스트가 통째로 실패한다 (`require(ESM)` 미지원).

```bash
nvm use          # 또는 PATH 에 node@22
pnpm install
pnpm test -- --run
```

`.env.local` 이 필요하다 — `.env.example` 을 복사해 채운다.
**Supabase 키가 없으면 `pnpm build` 가 프리렌더 단계에서 실패한다** (타입체크·테스트는 통과).

### 레이어 (DDD — 기존 구조를 따른다)

```
src/domain/         순수 로직. React 를 import 하지 않는다
src/application/    훅 · 상태
src/infrastructure/ DB · 외부 API. 서버 전용은 최상단 import "server-only"
src/ui/             컴포넌트
packages/design-system/  토큰 · 프리미티브 (src 는 공개 진입점만 import)
```

### zod 4 문법

| 하지 말 것 | 할 것 |
|---|---|
| `z.record(z.unknown())` | `z.record(z.string(), z.unknown())` — 키 스키마 필수 |
| `z.string().url()` | `z.url()` (v3 형태도 동작하지만 deprecated) |
| `invalid_type_error` · `required_error` | `error` 콜백 |

### 커밋

conventional commits (`commitlint.config.js` 참조). 예 —
`feat(md): 모듈 정의 스키마와 validateBlock 추가`

### 브랜치

**작업당 브랜치 하나.** 여러 세션이 동시에 도니 main 에 직접 커밋하지 않는다.

```bash
git checkout -b feat/md-<작업ID>
```

### 금지

- 회사·사내 관련 서술을 문서나 코드에 남기지 않는다 (**공개 레포**)
- 키를 커밋하지 않는다. 서버 전용 모듈은 `import "server-only"`
- 기존 `showcase` 도메인·`showcaseTypes.ts` 를 수정하지 않는다 (MD 는 별도 도메인)
- 설계에 없는 모듈·필드·테이블을 만들지 않는다

---

## 4. 의존 관계

```
SETUP ──▶ P0 ──┬──▶ P1 ──▶ P2 ──▶ P3 ──▶ P4 ──▶ P5
               │        ★AC-1              ★AC-4
               └──▶ S0 ─────────▶ M1 ──▶ M2 ──▶ M3
```

**병렬 가능** — `S0` 은 `P0` 만 끝나면 언제든. `P1` 과 동시에 돌아도 된다.

### 관문 둘

| 관문 | 조건 | 어기면 |
|---|---|---|
| **AC-1** | 실사 3건을 모듈 6종으로 구조 재현 | 통과 전 **7번째 모듈 금지** |
| **AC-2** | 모듈 1종 추가 = 변경 파일 2개 | 3개가 되면 **되돌린다** |

---

## 5. 작업 — 서비스 트랙

### `SETUP` · 의존성과 경계

**선행** 없음 · **크기** 반나절

**할 일**
- `zod` 3.22 → 4.x — **`error.errors` → `error.issues`(3곳)**, `z.coerce.number()` → `z.number()` + `valueAsNumber`
- **Node 22 로 올린다** — 20.18 은 `require(ESM)` 이 안 돼 테스트가 전부 실패한다. `.nvmrc` · `engines`
- `packageManager: pnpm@9.15.9` 고정 (corepack 서명 버그 우회)
- `eslint-config-next` v15 + `FlatCompat` — 기존 flat config 가 안 돌고 있었다
- `pnpm-workspace.yaml` 에 `packages:` 추가 → `packages/design-system` 생성
- `src/` → `@ds` 내부 경로 import 금지 lint 규칙
- `pnpm add mcp-handler@^2 @modelcontextprotocol/server@^2 openai`
- `.env.local` · Vercel 에 `LLM_EXTRACT_URL` `LLM_EXTRACT_KEY` `LLM_EXTRACT_MODEL` `MCP_DEV_TOKEN`

**파일 소유권** `package.json` · `pnpm-workspace.yaml` · `eslint.config.mjs` · `packages/`
**완료 판정** `pnpm build` 와 `pnpm test` 가 통과한다
**읽을 것** design.md D8 · mcp.md §2

---

### `P0` · 관통 (모듈 1종)

**선행** `SETUP` · **크기** 1~2일

`hero` 하나로 **정의 → 검증 → 저장 → 공개 URL** 을 한 줄로 뚫는다.

**할 일**
- `domain/md/moduleDef.ts` — 정의 스키마 + `validateBlock`
- `domain/md/page.ts` — `MdPage` / `MdBlock` (`group` 필드 포함)
- `domain/md/modules/index.ts` + `hero.ts`
- `ui/patterns/md/registry.ts` + `MdPageRenderer.tsx` + `modules/Hero.tsx`
- `packages/design-system/tokens/md.json` 초안 (system/freeform 2층)
- `md_pages` 테이블 + `infrastructure/md/mdPageApi.ts`
- `app/md/[slug]/page.tsx`

**★ 이 작업에서 반드시 정할 것** — **골격/가격 컴포넌트 경계**.
렌더 전략(`revalidate`)은 나중에 한 줄이지만 이 경계는 나중에 가르면 구조를 뒤집는다.

**파일 소유권** `src/domain/md/**` · `src/ui/patterns/md/**` · `src/infrastructure/md/**` · `src/app/md/**` · `packages/design-system/tokens/**`
**완료 판정**
- `/md/[slug]` 에 hero 하나짜리 페이지가 뜬다
- 없는 `moduleType` 을 넣어도 나머지가 렌더된다 → **AC-6** 테스트 통과

**읽을 것** design.md §1 D1~D5 · §3 · §4 · §6 · requirements.md FR-1·FR-2·FR-6

---

### `P1` · 모듈 6종 + 재현 관문 ★

**선행** `P0` · **크기** 3~4일

**할 일**
- **`hotel-card-list` 를 먼저 만든다** — 효용이 가장 크고 값으로 렌더하는 유일한 모듈
- `image` `section-title` `notes` `cta`
- 6종 모두 `whenToUse` 작성 (모듈 100개일 때 고르는 근거)
- `md_templates` 테이블 + T1~T4 시드
- 실사 3건 재현 픽스처 + 테스트

**파일 소유권** `src/domain/md/modules/**` · `src/ui/patterns/md/modules/**` · `src/domain/md/template.ts` · 마이그레이션
**완료 판정**
- **AC-1** — 6355 · 6267 · 야놀자 허브의 블록 순서·종류를 재현한다
- **AC-2** — 모듈 추가 시 변경 파일이 2개다 (신규 생성 제외)

```typescript
const EXPECTED_6355 = ["hero", ...Array(4).fill(["image","image","cta"]).flat(), "notes"];
expect(page.blocks.map(b => b.moduleType)).toEqual(EXPECTED_6355);
```

**읽을 것** module-survey.md 전체 · design.md §5·§7 · requirements.md FR-9

---

### `P2` · 캔버스

**선행** `P1` · **크기** 4~5일

**할 일**
- `ModulePalette` · 블록 순서·삭제 · `TemplatePicker`
- `BlockInspector` — **모듈 정의로 폼을 자동 생성**한다. 모듈별 폼을 손으로 짜면 스키마 층이 무의미해진다
- `domain/md/group.ts` — `findGroups` / `duplicateGroup` / `normalizeGroups`
- 「호텔 구간 추가」 버튼 + 묶음 테두리
- 사용자 템플릿 저장 · 즐겨찾기

**파일 소유권** `src/ui/patterns/admin/md/**` · `src/app/admin/content/md/**` · `src/domain/md/group.ts`
**완료 판정** **AC-3** — T3 템플릿으로 **이미지 업로드 0회** 발행까지 간다
**읽을 것** design.md §5(반복 묶음) · requirements.md FR-3·FR-9

---

### `P3` · 발행 · 상태 · 측정

**선행** `P2` · **크기** 2~3일

측정을 여기서 같이 끝낸다. 뒤로 미루면 안 붙는다.

**할 일**
- `draft`/`published`/`archived` + 노출 기간 + `requirePermission("md")`
- 발행 시 `revalidatePath` · Draft Mode 미리보기
- `md_page_events` — 조회·클릭을 **블록 단위**로 적재
- 어드민 목록에 조회수·클릭수

**파일 소유권** `src/app/admin/content/md/**` · `src/app/api/md/**` · `src/infrastructure/md/**`
**완료 판정**
- **AC-5** — 모듈 여백을 바꾸면 재발행 없이 발행된 MD 에 반영된다
- **AC-7** — CTA 클릭이 **그 블록의** 카운트로 잡힌다

**읽을 것** design.md §6 · requirements.md FR-4·FR-6·FR-8

---

### `P4` · L1 (요청서 → MD)

**선행** `P3` · **크기** 3일

**할 일**
- `domain/md/aiSchema.ts` — `templateExtractionSchema` + JSON Schema 변환
- `infrastructure/md/llmClient.ts` — OpenAI 호환, `baseURL` 환경변수
- `infrastructure/md/mdAiService.ts` — 검증 → 재요청 1회 → draft
- 호텔 후보 주입 + id 실재 검증
- `md_ai_runs` 적재

**파일 소유권** `src/domain/md/aiSchema.ts` · `src/infrastructure/md/{llmClient,mdAiService}.ts` · `src/app/api/admin/md/**`
**완료 판정** **AC-4** — 요청서 20건 1차 통과율 ≥70%, 재요청 포함 ≥90%
**읽을 것** llm.md §1·§2 · requirements.md FR-5

---

### `P5` · L3 이미지 · 팬아웃

**선행** `P4` · **크기** 2~3일

**할 일**
- `generateModuleImage(pageId, blockId, intent?)` — **서버가 문맥을 수집**한다
- 고정 제약 4줄(텍스트·로고·얼굴·실제 건물 금지)
- 후보 제시 UI (기존 showcase 의 것 재사용) · 사용자당 일일 상한
- `app/md/[slug]/opengraph-image.tsx`

**파일 소유권** `src/infrastructure/md/mdImageService.ts` · `src/ui/patterns/admin/md/**` · `src/app/md/[slug]/opengraph-image.tsx`
**완료 판정** 같은 `intent` 로 **문맥 있음/없음을 나란히** 비교한 기록을 남긴다
**읽을 것** llm.md §4 · requirements.md FR-11

---

## 6. 작업 — MCP 트랙

### `S0` · 스파이크 (읽기 전용)

**선행** `P0` · **크기** 반나절 · **병렬 가능**

인증·전송·클라이언트 호환을 먼저 확정한다. 여기서 막히면 도구를 잘 만들어도 소용없다.

**할 일**
- `app/api/mcp/route.ts` — `createMcpHandler` + `search_modules` **하나만**
- `withMcpAuth` + `MCP_DEV_TOKEN` (DB 는 M3 에서)
- curl 로 `tools/list` 확인 → Vercel 배포 → `codex mcp add md --url <URL>`

**파일 소유권** `src/app/api/mcp/**` · `src/domain/md/search.ts`
**완료 판정** Codex 대화에서 `search_modules` 호출이 성공하고, **Q-M1(인증 방식)** 이 기록된다
**읽을 것** mcp.md §2·§4·§8(S0)

---

### `M1` · 고르기 도구

**선행** `S0` + `P1` · **크기** 2일

**할 일** `get_module` `suggest_template` `get_design_context` `search_hotels` `list_md_pages` `get_md_page`

**파일 소유권** `src/app/api/mcp/**`
**완료 판정** **모듈을 30개로 늘려 놓고** `search_modules` 가 변형(`hero-image`/`hero-split`/`hero-video`)을 구분해 고르는지 확인 → **Q-M3**. 6개로는 100개 문제를 검증할 수 없다
**읽을 것** mcp.md §1·§4

---

### `M2` · 쓰기 도구 (draft-only)

**선행** `M1` + `P3` · **크기** 2일

**할 일**
- `validate_md_page`(저장 안 함) → `create_md_draft` → `update_md_draft` (`addGroup` op 포함)
- 모든 응답에 캔버스 편집 URL
- `description` 첫 줄에 draft-only 명시

**파일 소유권** `src/app/api/mcp/**`
**완료 판정** 대화만으로 draft 가 생기고 편집 URL 이 열린다. **이미지 생성 도구를 만들지 않는다**
**읽을 것** mcp.md §4 · requirements.md FR-10

---

### `M3` · 인증 · 감사

**선행** `M2` · **크기** 1~2일

**할 일** `md_mcp_tokens` DB 전환 · `md_mcp_calls` 적재 · 토큰당 레이트리밋 · 어드민 발급·폐기 화면

**파일 소유권** `src/app/api/mcp/**` · `src/app/admin/md/tokens/**` · 마이그레이션
**완료 판정** 토큰을 폐기하면 그 토큰의 호출이 거부된다
**읽을 것** mcp.md §5·§6

---

## 7. 진행 상태

세션이 작업을 끝내면 여기를 갱신한다. **잡을 때 `진행중`, 끝나면 `완료`.**

| 작업 | 상태 | 브랜치 | 비고 |
|---|---|---|---|
| `SETUP` | **완료** | `feat/md-SETUP` | zod4 · Node22 · 워크스페이스 · lint 경계 |
| `P0` | **완료** | `feat/md-P0` | AC-6 통과 · ISR 확인(빌드 ●) |
| `P1` | **완료** | `feat/md-P1` | ★ AC-1·AC-2 통과 (테스트로 고정) |
| `P2` | **핵심 완료** | main | 2단 캔버스(블록 패널 + 실시간 미리보기)·자동폼·구간추가·저장. 사용자 템플릿/즐겨찾기는 뒤로 |
| `P3` | **완료** | `feat/md-P3` | AC-3·AC-5·AC-7 확인. 발행·기간·Draft Mode·블록 단위 측정 |
| `P4` | **완료** | `feat/md-P4` | ★ AC-4 통과 — 1차 85% · 최종 95% |
| `P5` | **완료** | `feat/md-P5` | OG · 문맥 이미지 생성 둘 다 실물 확인 |
| `S0` | **로컬 확인 완료** | `feat/md-S0` | curl 로 initialize·tools/list·tools/call 통과. 배포·클라이언트 연결은 남음 |
| `M1` | **완료** | `feat/md-M1` | 도구 7종 · Q-M3 통과 (모듈 30종 검증) |
| `M2` | **로컬 완료** | `feat/md-M2` | 쓰기 3종 · 안전장치 확인. Q-M2(ChatGPT)는 배포 후 |
| `M3` | **완료** | `feat/md-M3` | 토큰 발급·폐기·감사·레이트리밋 확인 |

### 파일럿에서 답할 질문 (답이 나오면 여기 적는다)

| # | 질문 | 답 |
|---|---|---|
| Q-M1 | MCP 클라이언트 인증 방식 (Bearer / OAuth) | **Bearer 로 붙었다 — 프로덕션 실측.** 어드민에서 발급한 `mdmcp_…` 로 `https://ota-project.vercel.app/api/mcp` 에 `initialize` · `tools/list` 통과, 도구 10종 확인. Claude Code 연결 `✔ Connected`. **OAuth 는 안 된다** — 401 이 `resource_metadata` 를 광고하지만 그 `/.well-known/oauth-protected-resource` 가 404 고 인가 서버도 없다. 방향은 §9 |
| Q-M2 | ChatGPT 웹 커넥터에서 쓰기 도구가 통과하나 | **서버 준비 완료** — OAuth 전 구간이 프로덕션에서 돈다 (§11). 커넥터 등록만 남음 |
| Q-M3 | 모듈 30개에서 `search_modules` 가 맞는 걸 고르나 | **고른다.** 「오사카 가을 브랜드 기획전 히어로」 → `hero` · `hotel-card-list` · `image` 순. `suggest_template` 도 5곳 특가에 `t3-hub`(6점)를 1위로 올렸고 `why` 로 근거를 돌려준다 |
| Q-M5 | 같은 도구를 Codex 와 Claude 가 다르게 쓰나 | **Claude 쪽만 측정** (Q-M6 참고). Codex CLI 는 붙여 놨지만(`~/.codex/config.toml` 의 `mcp_servers.md-automation`) **계정이 막는다** — `codex exec` 가 모든 모델에 400 «not supported when using Codex with a ChatGPT account» 를 돌려준다. §10 |
| Q-M6 | 대화 몇 번에 초안이 나오나 | **사용자 요청 1번 · 도구 6번.** 프로덕션 실측(2026-09-19) — `suggest_template` → `search_hotels`(빗나감) → `search_hotels`(전체) → `create_md_draft` → `get_md_page` → `update_md_draft`. 발행만 남은 초안이 나왔다 |

### 측정 기록 (이력용)

| 지표 | 값 | 출처 |
|---|---|---|
| 실사 규모 | 기획전 7건 · 이미지 378장 · 이미지 의존 ~90% | module-survey.md |
| 모듈 추가 비용 | **2곳** — 등록 파일만. 테스트로 고정 (`moduleCost.test.ts`) | AC-2 |
| AC-1 통과 | 실사 3건 구조 재현 (`reproduce.test.ts`) | P1 커밋 |
| 수용기준 | **AC-1~7 전부 실측 통과** | — |
| 이미지 0장 발행 | 허브·특가 템플릿으로 발행 성공 | AC-3 |
| L1 1차 통과율 | **85% (17/20)** · 최종 95%. 실패는 전부 rate limit | AC-4 |

---

## 9. OAuth 를 붙인다면 — 회사 서비스에서 이미 검증된 흐름

2026-09-19 기록. **이건 가설이 아니라 사람이 실무에서 돌려본 것이다.**

회사 어드민에 MCP 를 붙였을 때 실제로 동작한 모양:

- MCP 클라이언트가 인증을 걸면 **우리 어드민 로그인 페이지가 뜬다.**
  거기서 로그인하면 연동이 끝난다 — 사용자가 토큰 원문을 복사해 옮기는 단계가 없다
- 즉 401 의 `resource_metadata` → 인가 서버 디스커버리 → 로그인 → 코드 교환.
  지금 404 인 well-known 라우트가 그 입구다

### 반드시 걸린 문제 — 토큰이 하나면 세션이 끊긴다

회사 어드민은 **계정당 유효 토큰이 하나**였다. 그래서 MCP 용 토큰을 발급하면
**웹으로 로그인해 있던 세션이 끊겼다.** 둘 중 하나만 살아 있다.

해결한 방법:

| | |
|---|---|
| 토큰 계열을 **둘로 나눴다** | web 용 · mcp 용. 서로를 무효화하지 않는다 |
| mcp 용 refresh | **30일 유지** — 대화 도중 만료돼 다시 로그인하는 일이 없도록 |

**우리 쪽에 옮길 때** `md_mcp_tokens` 는 이미 web 세션과 **별개 테이블**이라
「하나만 유효」 문제는 구조적으로 없다. 가져올 것은 **30일 refresh** 와
**로그인 페이지를 인가 엔드포인트로 쓰는 흐름** 두 가지다.

> 순서는 Bearer 클라이언트(Codex · Claude)를 먼저 붙여 Q-M3 · Q-M5 · Q-M6 을
> 답한 뒤에 정한다. ChatGPT 웹 커넥터(Q-M2)가 이 흐름을 요구한다.


---

## 10. 첫 프로덕션 파일럿에서 드러난 것 (2026-09-19)

어드민 토큰으로 배포된 `/api/mcp` 에 붙여 초안 하나를 끝까지 만들어 봤다.
결과물 — `가을 제주 5성급 특가` (`autumn-jeju-5star`, draft). 캔버스에서 실제 가격까지 렌더된다.

### 되는 것

- **안전장치가 실제로 막는다.** 발행된 「가을 오사카 특가」에 `update_md_draft` 를 던지니
  «발행됨 상태라 고칠 수 없습니다» 로 거절하고 담당자가 되돌릴 URL 을 돌려줬다. MCP 로는 발행이 안 된다
- **감사가 남는다.** 토큰 목록의 «마지막 사용» 시각이 호출 시점으로 갱신됐다
- **미발행 페이지는 공개 URL 이 404 다.** 초안이 새어 나가지 않는다

### 걸린 것 두 가지

**1. 호텔 데이터가 국내 전용이다.** 「오사카 4성급」으로 `search_hotels` 를 부르면
«조건에 맞는 호텔이 없습니다» 가 나온다. 해외 기획전을 말로 시키면 **도구는 정상인데 결과가 빈다** —
AI 는 여기서 한 번 헛돌고 조건을 바꿔야 했다. 실사(module-survey)의 기획전이 해외 위주라면
이건 파일럿이 아니라 데이터 문제로 따로 잡아야 한다.

**2. 템플릿 기본값이 요청과 무관하게 들어온다.** `create_md_draft` 에 `title` 을
「가을 제주 5성급 특가」로 주고 `templateId: t3-hub` 를 줬는데, **히어로 제목은
「가을 오사카 특가」로 만들어졌다.** 템플릿의 플레이스홀더 값을 그대로 복사하기 때문이다.
`update_md_draft` 를 한 번 더 불러 고쳐야 했고 — 이게 Q-M6 의 6번 중 2번을 차지한다.

> 담당자가 이걸 못 보고 발행하면 **제목과 히어로가 어긋난 기획전이 공개된다.**
> `create_md_draft` 가 최소한 `title` 을 히어로에 반영하거나, 플레이스홀더를 비워
> 검증에 걸리게 하는 쪽이 맞다. 다음 작업 후보.


### Codex 연결은 됐고, 계정이 막는다 (Q-M5)

로컬 `codex` 바이너리가 깨져 있었다 — `vendor/aarch64-apple-darwin/` 에서 실행파일만
사라지고 `path/rg` 만 남아 있었다. `npm i -g @openai/codex@latest` 로 복구(0.130.0 → 0.155.1).

MCP 등록은 끝났다:

```toml
[mcp_servers.md-automation]
url = "https://ota-project.vercel.app/api/mcp"
bearer_token_env_var = "MD_MCP_TOKEN"
```

**막힌 곳은 우리 코드가 아니다.** `codex exec` 는 모델을 무엇으로 주든
`400 invalid_request_error — The '<model>' model is not supported when using Codex with a
ChatGPT account` 를 돌려준다 (`gpt-5.4-mini` · `gpt-5.1-codex` · `gpt-5-codex` · `gpt-5.1` ·
`o3` · `codex-mini-latest` 전부). `codex login status` 는 «Logged in using ChatGPT» 다.
CLI 로는 이 계정이 모델을 못 쓴다.

**남은 길** Codex 데스크톱 앱에서 돌린다. 위 설정은 전역이라 앱도 읽지만,
토큰을 환경변수에서 읽으므로 앱이 `MD_MCP_TOKEN` 을 볼 수 있어야 한다
(셸이 아니라 `launchctl setenv` 쪽). 거기까지 하면 Q-M5 를 닫을 수 있다.

---

## 11. M4 — OAuth 인가 서버 (완료 · 프로덕션 실측)

§9 에서 정한 방향을 그대로 구현했다. **사람이 하는 일은 로그인 하나다** —
토큰 원문을 복사해 클라이언트에 옮기는 단계가 없어진다.

### 흐름

```
클라이언트 → /.well-known/oauth-protected-resource   (401 이 가리키던 그 문서)
          → /.well-known/oauth-authorization-server
          → POST /api/oauth/register                 (RFC 7591 동적 등록)
          → /oauth/authorize                         (로그인 → 「연결」)
          → POST /api/oauth/token                    (코드 교환 · 갱신)
          → /api/mcp                                 (Bearer)
```

### 정한 것과 이유

| | |
|---|---|
| **토큰 테이블을 새로 만들지 않는다** | `md_mcp_tokens` 에 컬럼만 더한다. 새 테이블을 만들면 폐기 UI·레이트리밋·감사를 두 벌로 관리하게 된다 |
| **refresh 때 행을 새로 만들지 않는다** | 같은 행의 해시만 갈아끼운다. 그래야 `md_mcp_calls` 의 감사가 한 연결로 이어지고, 어드민 목록에도 연결 하나가 하나로 보인다 |
| **refresh 30일 · access 1시간** | §9 의 실무 교훈. 짧으면 대화 도중 만료돼 다시 로그인하게 된다 |
| **PKCE 는 S256 만** | 공개 클라이언트뿐이라 `client_secret` 이 없다. 코드를 가로챈 쪽을 막는 수단이 이것뿐이라 `plain` 은 광고도 하지 않는다 |
| **redirect_uri 는 정확히 일치** | 접두사 비교면 `https://good.example.com.evil.com` 으로 코드가 샌다. 테스트로 고정했다 |
| **등록은 아무나 할 수 있다** | MCP 클라이언트는 미리 등록할 수 없다. 등록만으로는 아무 권한도 없고, 실제 권한은 authorize 의 로그인에서 생긴다 |
| **로그인 페이지는 `?next=`** | `useSearchParams()` 대신 제출 시점에 읽는다. 훅을 쓰면 정적 프리렌더에서 빠지고 Suspense 경계를 둘러야 한다 — 로그인 폼 하나 때문에 그럴 일이 아니다 |
| **같은 사이트 경로만** | `next` 가 `//evil.com` 이면 로그인 직후 남의 사이트로 보내는 열린 리다이렉트가 된다 |

### 실측

- 디스커버리 문서 2종 **200** — `.well-known` 처럼 점으로 시작하는 폴더도 Next 14 가 라우팅한다
- 동적 등록이 `http://evil.com/cb` 를 **400 으로 거절**한다 (루프백 아닌 평문)
- 도메인 테스트 16개 — PKCE·redirect_uri·수명·메타데이터

### 프로덕션 전 구간 실측 (2026-09-19)

마이그레이션 적용 후 배포본에서 처음부터 끝까지 돌렸다. **전부 통과.**

| 확인 | 결과 |
|---|---|
| 동적 등록 | `client_id` 발급 201 |
| 로그인 안 된 상태로 authorize | `/login?next=` 에 **authorize 요청 전체가 보존**된 채 리다이렉트 |
| 동의 화면 | 「연결할까요?」 · 계정 표시 · «초안만 만들고 발행은 못 한다» 고지 |
| 「연결」 | `redirect_uri` 로 `code` 와 `state` 가 그대로 돌아옴 |
| 코드 교환 | `Bearer` · `expires_in 3600` · `scope md:draft` |
| **그 토큰으로 `/api/mcp`** | 도구 10종 응답 — 사람이 토큰을 옮긴 적이 없다 |
| 코드 재사용 | `invalid_grant` 로 거절 |
| refresh | 새 access 발급 |
| 갱신 뒤 예전 access | **401** — 제때 죽는다 |
| 쓰고 난 refresh | `invalid_grant` — 회전된다 |
| 어드민 목록 | 갱신을 두 번 해도 **연결이 한 줄**이다. 감사가 이어진다 |

거절 경로도 확인했다 — 등록 안 된 `redirect_uri` 로 authorize 를 열면
그 주소로 아무것도 돌려보내지 않고 화면에서 멈춘다. `http://evil.com/cb` 는
등록 단계에서 400 이다.

### 남은 것

**Q-M2 — ChatGPT 웹 커넥터를 실제로 붙여 본다.** 서버 쪽 준비는 끝났다.
