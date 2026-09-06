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
| `P4` | **코드 완료** | `feat/md-P4` | LLM 키가 있어야 AC-4 측정 가능 |
| `P5` | 대기 | | |
| `S0` | **로컬 확인 완료** | `feat/md-S0` | curl 로 initialize·tools/list·tools/call 통과. 배포·클라이언트 연결은 남음 |
| `M1` | 대기 | | |
| `M2` | 대기 | | |
| `M3` | 대기 | | |

### 파일럿에서 답할 질문 (답이 나오면 여기 적는다)

| # | 질문 | 답 |
|---|---|---|
| Q-M1 | MCP 클라이언트 인증 방식 (Bearer / OAuth) | 서버는 **둘 다 준비됨** — Bearer 검증 동작, 401 에 `resource_metadata` 를 실어 OAuth 디스커버리 경로도 열려 있다. 클라이언트 쪽 확인 남음 |
| Q-M2 | ChatGPT 웹 커넥터에서 쓰기 도구가 통과하나 | |
| Q-M3 | 모듈 30개에서 `search_modules` 가 맞는 걸 고르나 | |
| Q-M5 | 같은 도구를 Codex 와 Claude 가 다르게 쓰나 | |
| Q-M6 | 대화 몇 번에 초안이 나오나 | |

### 측정 기록 (이력용)

| 지표 | 값 | 출처 |
|---|---|---|
| 실사 규모 | 기획전 7건 · 이미지 378장 · 이미지 의존 ~90% | module-survey.md |
| 모듈 추가 비용 | **2곳** — 등록 파일만. 테스트로 고정 (`moduleCost.test.ts`) | AC-2 |
| AC-1 통과 | 실사 3건 구조 재현 (`reproduce.test.ts`) | P1 커밋 |
| 이미지 0장 발행 | 허브·특가 템플릿으로 발행 성공 | AC-3 |
| L1 1차 통과율 | | AC-4 |
