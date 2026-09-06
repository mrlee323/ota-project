# MD 모듈 시스템 — 설계

**상태** 초안 v0.2 · 2026-09-05
**선행** [requirements.md](./requirements.md) · [module-survey.md](./module-survey.md)
**분책** LLM 조립은 [llm.md](./llm.md) · MCP 서버는 [mcp.md](./mcp.md)
이 문서는 «어떻게» 만 다룬다. «무엇을·왜» 는 위 두 문서에 있다.

> v0.1 은 MD 를 기존 `showcase` 위에 얹는 안이었다. **폐기했다** — MD 는 메인 화면의
> 지역 특가 구좌와 다른 도메인이다. 별도 테이블·별도 라우트·별도 어드민으로 간다.

---

## 1. 결정

### D1. 모듈은 React 컴포넌트다. HTML 템플릿 + 문자열 조립기를 만들지 않는다

어드민과 공개 페이지가 같은 Next 앱이므로 컴포넌트를 직접 공유할 수 있다.
`DOMParser` 기반 조립기는 어드민과 서비스의 스택이 갈렸을 때 필요한 우회다 — 여기엔 그 원인이 없다.

**대가** — 모듈 마크업을 Next 밖(예: 이메일)에서 재사용하려면 그때 가서 직렬화 층을 얹어야 한다.
지금은 그 요구가 없다(FR 없음).

### D2. 정의는 `domain`, 렌더는 `ui`. 두 곳에서 각각 등록한다

DDD 레이어 규칙상 `domain` 은 React 를 import 하지 않는다.
그래서 «모듈 1종 = 정의 1 + 컴포넌트 1» 이고, 등록 지점도 2곳이다 — 이게 FR-1.3 의 «2곳» 이다.

### D3. 저장은 JSON. 렌더는 조회 시점

FR-2.1 / FR-2.2. HTML 을 저장하면 그 시점 모양으로 굳는다.

### D4. 값 검증은 런타임에 모듈 정의로 한다

모듈마다 필드가 달라 `values` 를 정적 타입으로 좁힐 수 없다.
`validateBlock(def, block)` 이 정의를 읽어 검사한다 — **이 함수가 스키마 층의 핵심이다.**

### D5. 모르는 타입은 스킵

FR-2.4. 어드민이 새 모듈로 저장한 페이지를 아직 배포 안 된 렌더러가 열어도 나머지는 보여야 한다.

### D6. 원천은 코드에 두고, AI 는 승인된 부품만 조립한다

LLM 이 마크업이나 CSS 를 만들지 않는다. **이미 정의된 모듈을 고르고 값을 채우는 것만** 한다.
그래서 FR-5.2(모듈 정의 = tool schema)가 선택이 아니라 필수다 — 스키마가 곧 AI 의 가드레일이다.

### D7. 자유도는 필드 단위 등급으로 건다

「다양성」과 「일관성」은 페이지 단위로는 못 푼다. 필드마다 `fixed` / `preset` / `free` 를 정한다 (FR-1.7).
`free` 는 예외 목록으로 관리한다 — 지금은 `sectionBgColor`, `notes.items`, `hero.title` 뿐이다.
`free` 가 늘어나면 그때부터 페이지가 다시 제각각이 된다.

### D8. 디자인시스템은 워크스페이스 패키지로 가른다. 레지스트리 배포는 안 한다

프로세스를 정의하는 게 목적이므로 **«서비스와 디자인시스템 사이의 경계»는 재현해야 한다.**
경계가 없으면 «서비스가 DS 내부를 직접 건드린다» 같은 실패가 안 보인다.

그런데 레지스트리(사설 npm) 배포는 **버전 협상·배포 지연 비용만 있고 검증할 게 없다.**
pnpm 워크스페이스로 가르면 경계는 그대로 서고 비용은 0 이다.

```
packages/design-system/     토큰 · 프리미티브 컴포넌트
src/                        서비스 · 어드민 · MD 모듈
```

규율은 lint 로 건다 — `src/` 는 `@ds` 의 **공개 진입점만** import 할 수 있고
내부 경로(`@ds/src/...`)는 막는다. 이게 레지스트리가 하던 일의 본질이다.

**대가** — 실제 배포에서 생기는 문제(버전 스큐, 릴리스 타이밍)는 여기서 안 드러난다.
그건 이 프로젝트가 검증하려는 것이 아니다.

---

## 2. 구조

```
src/domain/md/
├── moduleDef.ts          모듈 정의 스키마 + validateBlock()
├── page.ts               MdPage / MdBlock 스키마
├── modules/
│   ├── index.ts          ← 정의 등록 (변경 지점 1/2)
│   ├── hero.ts
│   ├── image.ts
│   ├── sectionTitle.ts
│   ├── hotelCardList.ts
│   ├── notes.ts
│   └── cta.ts
├── template.ts           템플릿 스키마 (저장은 DB · §5)
└── aiSchema.ts           모듈 정의 → zod 출력 스키마 (FR-5.2 · llm.md §3)

src/ui/patterns/md/
├── registry.ts           ← 컴포넌트 등록 (변경 지점 2/2)
├── MdPageRenderer.tsx
└── modules/*.tsx         Hero / Image / SectionTitle / HotelCardList / Notes / Cta

src/ui/patterns/admin/md/
├── MdCanvas.tsx          팔레트 + 순서 + 인스펙터
├── ModulePalette.tsx
├── BlockInspector.tsx    정의로 폼을 «자동 생성» (FR-3.3)
└── TemplatePicker.tsx

src/infrastructure/md/
├── mdPageApi.ts          Supabase CRUD
└── mdAiService.ts        LLM 조립 (FR-5)

src/app/
├── md/[slug]/page.tsx            공개 (FR-6)
├── md/[slug]/opengraph-image.tsx OG (FR-7)
├── admin/md/page.tsx             목록
├── admin/md/[id]/page.tsx        캔버스
└── api/admin/md/generate/route.ts
```

**모듈 1종 추가 = `domain/md/modules/index.ts` 1줄 + `ui/patterns/md/registry.ts` 1줄.**
정의·컴포넌트 파일은 신규 생성이라 변경에 세지 않는다. 3곳이 되면 AC-2 위반 → 되돌린다.

---

## 3. 스키마

> **zod 4 기준으로 쓴다** (Q7 결정 · [mcp.md §2](./mcp.md)).
> v3 습관 두 가지를 피한다 — `z.record()` 는 **키 스키마가 필수**이고,
> 포맷은 `z.string().url()` 이 아니라 `z.url()` 을 쓴다 (v3 형태도 동작하지만 deprecated).


### `domain/md/moduleDef.ts`

```typescript
export const fieldInputSchema = z.enum([
  "text", "textarea", "image", "number",
  "color-token",   // 토큰 선택
  "color-free",    // 자유 색 — 구간 배경 전용 (FR-2.3 예외)
  "link",          // { web_link?, deep_link? }
  "hotel-refs",    // 호텔 선택기 → id[]  (Q1 미결)
]);

export const fieldDefSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  input: fieldInputSchema,
  required: z.boolean().default(false),
  repeatable: z.boolean().default(false),
  /** 자유도 등급 (FR-1.7 · D7). free 는 예외적으로만 준다 */
  freedom: z.enum(["fixed", "preset", "free"]).default("preset"),
  /** freedom === "preset" 일 때 고를 수 있는 값 */
  options: z.array(z.string()).optional(),
  /** LLM 이 그대로 읽는다 — 프롬프트에 다시 쓰지 않는다 (FR-1.5) */
  description: z.string(),
});

export const moduleDefSchema = z.object({
  type: z.string().min(1),
  version: z.literal(1),
  name: z.string().min(1),
  category: z.enum(["헤더", "본문", "푸터"]),
  description: z.string(),          // 이게 무엇인가
  /** 언제 쓰는 모듈인가 — 모듈 100개 중에서 고르는 근거 (FR-1.8 · mcp.md §4) */
  whenToUse: z.string(),
  fields: z.array(fieldDefSchema),
  sample: z.record(z.string(), z.unknown()),   // FR-1.4 (zod4: 키 스키마 필수)
});
```

### `domain/md/page.ts`

```typescript
export const mdBlockSchema = z.object({
  id: z.string().min(1),
  moduleType: z.string().min(1),
  moduleVersion: z.number().int().positive(),
  values: z.record(z.string(), z.unknown()),   // 검증은 validateBlock 이 한다 (D4)
  /** 반복 묶음 표시 (§5). 관리 대상이 아니라 태그다 */
  group: z.object({
    type: z.string(),   // 무엇의 묶음인가 — 버튼 라벨·복제 규칙. 예: "hotel"
    id: z.string(),     // 몇 번째 묶음인가 — 경계. 예: "g1"
  }).optional(),
});

export const mdPageSchema = z.object({
  schemaVersion: z.literal(1),      // NFR-5
  blocks: z.array(mdBlockSchema),
});
```

### DB — 신규 테이블

```sql
create table md_pages (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  title        text not null,
  page         jsonb not null,               -- MdPage
  status       text not null default 'draft',-- draft|published|archived (FR-4.1)
  starts_at    timestamptz,                  -- FR-4.3
  ends_at      timestamptz,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create index on md_pages (status, starts_at, ends_at);
```

`showcase_contents` 는 건드리지 않는다.

---

## 4. 토큰 (Q5 결정)

`packages/design-system/tokens/md.json` 에 **새로 정의한다.** 값보다 구조가 중요하다.

### 규칙 — 이름이 계약이고 값은 계약이 아니다

값은 자유롭게 바꿔도 되지만 **이름은 유지한다.** 삭제·개명 금지, 추가만 허용.
저장된 MD 가 토큰 «이름» 을 들고 있으므로(FR-2.3), 이름이 바뀌면 과거 페이지가 깨진다.

### 두 층 — system 과 freeform

**토큰이 모든 색을 정하지 않는다.** MD 의 색은 성격이 갈린다.

| 층 | 무엇 | 어디 저장 |
|---|---|---|
| **system** | 캠페인이 바뀌어도 그대로인 색 — 글자·구분선·카드 표면·비활성 | 토큰 |
| **freeform** | 기획전마다 다른 색 — 구간 배경, 포인트 색 | **페이지 데이터** |

freeform 이라도 **그 위에 얹는 글자색은 토큰에서 고른다** — 배경 명도에 따라
`text.default` 와 `text.inverse` 중 하나로 자동 결정한다. 자유 입력이 접근성을 깨지 않게 하는 장치다.

### 구성

```
$meta       version · prefix(md) · rules(이름은 계약)
primitive   원시 팔레트 — 모듈에서 직접 쓰지 않는다
color       의미색 — text / bg / border / action / overlay
tone        freeform 색에서 파생되는 단계 (surface → subtle → base → strong → ink)
text        합성 이름 — {크기}-{행간}-{굵기}  예: heading-relaxed-bold
space       0 2 4 8 12 16 20 24 32
radius      0 2 4 8 12 16 20 24 full
shadow      card / floating / overlay
layout      content-max · breakpoint · gutter · margin
```

**`tone` 이 자유 입력을 구제한다.** 담당자가 배경색 하나를 고르면
거기서 파생된 단계들이 자동으로 정해져, 페이지 안에서 색이 따로 놀지 않는다.
파생 계산은 렌더 시 한 곳에서 한다 — 모듈 CSS 는 `--md-tone-*` 를 읽기만 한다.

### 규모

| | 개수 | 근거 |
|---|---|---|
| 의미색 | 20종 내외 | `preset` 자유도(FR-1.7)가 성립할 최소치 |
| 텍스트 스타일 | 8~12종 | 실사 표본의 글자 크기 분포 |

디자인시스템을 만드는 게 목적이 아니다. **`color-token` 과 `preset` 이 공허하지 않을 만큼**이면 된다.

---

## 5. 템플릿 (Q4 결정)

**DB 에 저장한다.** 코드 상수로 두지 않는 이유는 FR-9 에 있다 —
사용자가 자기 구성을 저장하고 즐겨찾기 하므로, 배포 없이 늘어야 한다.

```sql
create table md_templates (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  blocks      jsonb not null,             -- [{moduleType, moduleVersion, values?}]
  kind        text not null,                   -- 'system' | 'user'
  visibility  text not null default 'private', -- 'private' | 'shared' (v1 은 private 만)
  owner_id    uuid,                            -- kind='user' 일 때만
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table md_template_favorites (
  user_id     uuid not null,
  template_id uuid not null references md_templates(id) on delete cascade,
  created_at  timestamptz default now(),
  primary key (user_id, template_id)          -- 즐겨찾기는 개인 전용. 공유 개념 없음
);
```

- 시스템 템플릿 **T1~T4** 는 시드 (`kind='system'`, `owner_id` 없음)
- `blocks` 의 `values` 는 선택 — 있으면 «샘플이 채워진 채로» 얹힌다 (FR-9.6)
- 사라진 `moduleType` 은 **그 블록만 건너뛴다** (D5 와 같은 규칙)

### 반복 묶음은 «태그» 로 푼다 — 새 엔티티를 만들지 않는다 (Q2 결정)

실사 F3 — 브랜드형 기획전의 본문은 **호텔 한 곳마다 같은 3~4블록이 반복**된다.

```
[호텔명 이미지] → [특징] → [가격 설명] → [CTA]     × 호텔 수
```

담당자의 조립 단위는 «블록» 이 아니라 «호텔 한 곳» 이다.
블록을 4개씩 얹게 하면 캔버스가 다시 노가다가 된다 (FR-3.6).

**버린 안 두 개**

| 안 | 왜 버렸나 |
|---|---|
| **그룹 모듈** (`hotel-section` 이 안에 4블록을 품는다) | 모듈 정의가 재귀가 된다. 렌더러·검증·폼 자동생성이 전부 재귀를 다뤄야 하고 FR-1.3(모듈 추가 = 수정 2곳)이 깨진다 |
| **섹션 템플릿** (`scope='section'`) | **관리 대상이 하나 늘어난다.** 섹션마다 CRUD·즐겨찾기·공유·소유자가 붙고, 페이지 템플릿과 한 목록에 섞인다. 계층이 `template → module` 에서 `template → section → module` 로 깊어진다 |

**택한 안 — 블록에 `group` 태그를 붙인다.**

```jsonc
blocks: [
  { moduleType: "hero" },
  { moduleType: "image", group: { type: "hotel", id: "g1" } },  // ┐
  { moduleType: "image", group: { type: "hotel", id: "g1" } },  // │ 첫째 묶음
  { moduleType: "cta",   group: { type: "hotel", id: "g1" } },  // ┘
  { moduleType: "image", group: { type: "hotel", id: "g2" } },  // ┐ 둘째 묶음
  { moduleType: "cta",   group: { type: "hotel", id: "g2" } },  // ┘
  { moduleType: "notes" }
]
```

**필드가 둘인 이유** — `type` 하나로는 안 된다. 호텔이 4곳이면 `type="hotel"` 블록이
12개 연속이 되어 **어디서 끊기는지 알 수 없다.**

| 필드 | 답하는 질문 | 쓰이는 곳 |
|---|---|---|
| `type` | 무엇의 묶음인가 | 버튼 라벨(«호텔 구간 추가»)·복제 규칙 |
| `id` | 몇 번째 묶음인가 | **경계** |

템플릿에는 `id` 를 `"g1"` 하나만 넣어 둔다 — 묶음의 «본» 이 하나 있는 셈이고,
캔버스가 복제할 때 새 `id` 를 부여한다.

| | 새 테이블 | 새 관리 대상 | 계층 |
|---|---|---|---|
| 그룹 모듈 | 0 | 0 | 모듈이 재귀 |
| 섹션 템플릿 | 0 | **섹션 템플릿** | template → section → module |
| **`group` 태그** | **0** | **없음** | **template → module** |

**`group` 은 사용자에게 보이는 개념이 아니다.** 담당자는 버튼 하나만 본다.
관리 화면도, 목록도, 권한도 생기지 않는다.

`mdBlockSchema` 와 템플릿의 `blocks` 양쪽에 optional 필드 하나가 늘 뿐이다 —
그래야 발행된 MD 에서도 «구간 추가» 가 동작한다.

### 구현 — 순수 함수 셋

`src/domain/md/group.ts`. 캔버스·MCP·검증이 **같은 함수**를 쓴다.

```typescript
type Group = { type: string; id: string; start: number; end: number };  // [start, end)

/** 연속 블록을 묶음으로 자른다. group.id 가 바뀌는 지점이 경계다 */
export function findGroups(blocks: MdBlock[]): Group[]

/** 묶음을 복제해 그 뒤에 붙인다. 새 id 를 부여하고 «내용만» 비운다 */
export function duplicateGroup(blocks: MdBlock[], groupId: string): MdBlock[]

/** 흩어진 묶음을 첫 등장 위치로 모은다. 저장 직전에 한 번 돌린다 */
export function normalizeGroups(blocks: MdBlock[]): MdBlock[]
```

#### 복제할 때 무엇을 비우고 무엇을 남기나

값을 통째로 복사하면 호텔명이 중복되고, 전부 비우면 모양이 무너진다.
**모듈 정의의 `input` 과 `freedom` 을 그대로 쓴다** — 새 규칙을 만들지 않는다.

| 조건 | 복제 시 |
|---|---|
| `image` `link` `hotel-refs` | **비운다** — 언제나 내용이다 |
| `text` `textarea` **이고 `freedom: free`** | **비운다** — 자유 입력 문구 |
| `text` `textarea` 이고 `preset`/`fixed` | **유지** — 정해진 값 중 «선택» 이라 모양 쪽이다 |
| `color-*` `number` | **유지** |

> `input` 만 보면 안 된다. `cta.style` 은 `input: "text"` 지만 preset 이라 모양이다 —
> 이걸 비우면 복제본이 직전 묶음과 다르게 생긴다.

담당자가 보는 결과 — 「직전 호텔과 같은 모양의 빈 칸」이 생긴다. 그게 원하는 것이다.

#### 흩어짐 처리 — 막지 않고 정규화한다

묶음 안 블록을 밖으로 끌어내는 걸 UI 에서 **금지하지 않는다.** 금지 규칙은
드래그·삭제·순서변경마다 예외 처리를 낳는다. 대신 **저장 직전에 `normalizeGroups` 한 번**을 돌린다.

| 상황 | 처리 |
|---|---|
| 같은 `id` 블록이 흩어짐 | 첫 등장 위치로 모은다 |
| 묶음 안 블록을 지워 1개만 남음 | 그대로 둔다 — 묶음이 1블록일 수도 있다 |
| 묶음 블록을 전부 지움 | 묶음이 사라진다. 별도 처리 없음 |
| `group` 은 있는데 `id` 가 중복 안 됨 | 정상 — 묶음 1개짜리다 |

**막는 대신 고친다.** 코드가 한 함수로 끝나고, 사용자가 무슨 짓을 해도 데이터가 성립한다.

#### 캔버스

- 묶음은 테두리 하나로 감싸 보여준다 (블록 4개가 아니라 «호텔 1곳» 으로 보이게)
- 묶음 하단에 **«호텔 구간 추가»** — 라벨은 `group.type` 에서 온다
- 묶음 헤더에 **삭제** — 묶음 통째로
- 묶음 «안» 의 블록은 평소처럼 편집·순서변경 가능

#### MCP

`update_md_draft` 의 op 로 노출한다 — 도구를 새로 만들지 않는다.

```typescript
{ op: "addGroup",    groupId: "g1" }   // duplicateGroup 을 부른다
{ op: "removeGroup", groupId: "g2" }
```

### `visibility` — 개인이 기본, 공유는 명시적 승격 (Q8 결정)

| 층 | 만드는 사람 | 보는 사람 |
|---|---|---|
| 시스템 (`kind='system'`) | 관리자 | 전원 |
| 공유 (`visibility='shared'`) | 사용자 + **명시적 공유 동작** | 전원 |
| 개인 (`visibility='private'`) | 사용자 | 본인만 |

**개인 → 공유는 자동이 아니라 명시적 승격이다.** 남의 미완성 초안이 목록에 섞이면
목록이 쓰레기통이 된다. 승격은 «공유하기» 를 눌러야 일어난다.

**v1 은 `private` 만 만든다.** 컬럼 자리만 열어두고 공유 UI·권한은 필요해질 때 붙인다.

**즐겨찾기는 개인 전용으로 고정한다.** 공유 개념이 없다 —
즐겨찾기는 내 목록에서 위로 올리는 행위지 자산이 아니다.

---

## 6. 서비스 렌더링 — 어드민에서 만든 MD 가 어떻게 뜨나

### 전달 형태

```
어드민 캔버스 ──▶ md_pages.page (JSONB)  ──▶ /md/[slug]
                    모듈 배열                  MdPageRenderer
```

**서비스는 MD 를 위한 코드를 짜지 않는다.** 페이지가 하는 일은 JSON 을 읽어
`registry` 에서 컴포넌트를 찾아 순회하는 것뿐이다.

```typescript
// app/md/[slug]/page.tsx  — 서버 컴포넌트
export default async function MdPage({ params }) {
  const row = await getPublishedMdPage(params.slug);   // 기간 밖이면 null → 404
  if (!row) notFound();
  return <MdPageRenderer page={row.page} />;
}
```

```typescript
// ui/patterns/md/MdPageRenderer.tsx
export function MdPageRenderer({ page }: { page: MdPage }) {
  return page.blocks.map((b) => {
    const C = REGISTRY[b.moduleType];
    if (!C) return null;                 // D5 — 모르는 타입은 스킵. 던지지 않는다
    return <C key={b.id} {...b.values} />;
  });
}
```

모듈이 늘어도 이 파일은 안 바뀐다. 새 모듈 배포 전에 저장된 페이지가 열려도 나머지는 뜬다.

### 두 층으로 가른다 — 골격과 가격

Q1 에서 호텔 카드를 **id 참조**로 정했다 → 가격은 조회 시점 값(FR-6.3).
그런데 NFR-1 은 LCP 2.5s 이고 기획전은 발송 직후 트래픽이 몰린다.
**조회 시점 가격과 정적 캐시는 그냥은 양립하지 않는다.**

| 층 | 무엇 | 어떻게 |
|---|---|---|
| **골격** | 모듈 배열 · 텍스트 · 이미지 · 링크 | 서버 컴포넌트 + **ISR**. 발행 시 `revalidatePath` 로 즉시 반영 |
| **가격·재고** | 호텔 카드의 변동 값 | **클라이언트에서 채운다.** 카드 골격(이름·사진·링크)은 서버가 그린다 |

```typescript
// HotelCardList — 서버 컴포넌트
//   호텔의 «안 변하는 것»(이름·사진·지역)은 여기서 그린다
//   가격·재고만 클라이언트 자식이 채운다 → 카드가 CLS 없이 자리를 잡는다
<HotelCard hotel={base}>
  <HotelPrice hotelId={base.id} />   {/* "use client" */}
</HotelCard>
```

**렌더 전략은 나중에 켜도 되지만 컴포넌트 경계는 처음부터 나눈다.**
`revalidate` 를 켜는 건 한 줄이고, 골격/가격을 나중에 가르는 건 구조를 뒤집는 일이다.
그래서 **P0 부터 이 경계로 둔다.**

### 캐시 무효화

| 사건 | 처리 |
|---|---|
| 발행 / 재발행 | `revalidatePath('/md/' + slug)` |
| 노출 기간 종료 | `getPublishedMdPage` 가 기간을 보고 404 — 캐시 태그에 기간을 넣지 않는다 |
| 모듈 컴포넌트 수정 | 배포가 곧 무효화 (AC-5) |

### 스타일 전달

모듈 CSS 는 서비스 번들에 **정적으로** 들어가야 한다.

| 규칙 | 이유 |
|---|---|
| Tailwind 클래스를 **동적으로 조립하지 않는다** (`bg-${c}` 금지) | 빌드가 클래스를 못 찾아 스타일이 사라진다 |
| freeform 색(`sectionBgColor` 등)은 **인라인 CSS 변수**로 넘긴다 | 값이 페이지 데이터라 빌드 시점에 모른다 |
| `tone` 파생은 렌더 시 **한 곳**에서 계산해 `--md-tone-*` 로 주입 | 모듈 CSS 는 읽기만 한다 |

```tsx
<section style={{ "--md-bg": values.sectionBgColor, "--md-tone-strong": tone.strong }}>
```

### draft 미리보기

발행 전 페이지는 공개 URL 에서 안 보인다(FR-4.2). 미리보기는 Next 의 **Draft Mode** 로 연다 —
같은 `/md/[slug]` 라우트를 쓰고, 렌더러도 같다.

```
/api/md/preview?slug=...&token=...   →  draftMode().enable()  →  /md/[slug]
```

**별도 미리보기 라우트를 만들지 않는다.** 만드는 순간 «미리보기에선 됐는데 발행하니 다르다» 가 생긴다.
어드민 캔버스의 미리보기도 이 주소를 iframe 으로 띄운다 (FR-3.4).

### 안 하는 것

- **앱(WebView) 대응** — 웹 반응형까지다 (요구사항 §2 비목표)
- **페이지별 커스텀 CSS 주입** — 자유도는 필드 등급으로만 준다 (D7)
- **런타임 모듈 로딩** — 모듈은 빌드에 포함된다. 배포 없이 새 모듈이 도는 구조는 만들지 않는다

---

## 7. 모듈 6종 명세

필드는 실사에서 실제로 쓰인 것만 넣는다.

| 모듈 | 필드 | 근거 |
|---|---|---|
| `hero` | `imageUrl` `title` `subtitle` `period` `link` | 실사 7/7 |
| `image` | `imageUrl` `alt`(必, NFR-2) `link` | 이미지 슬라이스 ~280 · 캔버스에서 **AI 생성** 가능 (FR-11) |
| `section-title` | `title` `subtitle` `sectionBgColor`(color-free) | 야놀자 11섹션 |
| `hotel-card-list` | `hotelRefs`(호텔 id 배열) `layout`(grid\|carousel) | 야놀자 전 섹션 |
| `notes` | `title` `items`(textarea, repeatable) | 6/6 · 텍스트 필수 |
| `cta` | `label` `link` `style`(primary\|secondary) | 6/6 · 31회 |

`feature-carousel` `coupon` 은 AC-1 통과 후.

**`hotel-card-list` 는 id 만 저장한다** (Q1 결정). 가격·할인율·뱃지는 렌더 시점에 조회한다 —
값이 바뀌면 페이지가 저절로 맞는 것이 실사 F5 가 말한 효용의 원천이다.
호텔이 사라지면 그 카드만 빠지고 페이지는 뜬다 (요구사항 §8).

**자유도** — `sectionBgColor` · `notes.items` · `hero.title` 만 `free`.
`cta.style` · `hotel-card-list.layout` 은 `preset`, 여백·정렬은 필드로 노출하지 않는다(`fixed` 상당).

---

## 8. 단계

### P0 · 관통

`hero` 1종으로 **정의 → 검증 → 저장 → 공개 URL** 을 한 줄로 뚫는다.

- [ ] `moduleDef.ts` / `page.ts` / `validateBlock`
- [ ] `hero` 정의 + 컴포넌트 + 양쪽 registry
- [ ] `md_pages` 테이블 + `mdPageApi`
- [ ] `packages/design-system` 워크스페이스 + 토큰 초안 (§4 · D8)
- [ ] `/md/[slug]` 렌더 (§6) — **골격/가격 컴포넌트 경계를 여기서 정한다**
- [ ] 모르는 타입 스킵 테스트 (**AC-6**)

### P1 · 모듈 5종 + 재현 관문 ← **여기가 게이트**

나머지 5종을 붙이고 **AC-1** 을 친다 — 실사 3건(6355 · 6267 · 야놀자)을 모듈 배열로 재현.

```typescript
// domain/md/__tests__/reproduce.test.ts
// 실사에서 센 블록 순서를 그대로 적어 두고, 만든 페이지가 그 순서와 같은지 본다
const EXPECTED_6355 = ["hero", ...Array(4).fill(["image","image","cta"]).flat(), "notes"];
expect(page.blocks.map(b => b.moduleType)).toEqual(EXPECTED_6355);
```

**통과 전에는 7번째 모듈을 만들지 않는다** (리스크 §10).

- [ ] **`hotel-card-list` 를 먼저 만든다** — 실사 F5 기준 효용이 가장 큰 모듈이고, 값으로 렌더하는 유일한 모듈이라 여기서 막히면 나머지가 다 이미지로 흘러간다
- [ ] 나머지 4종 (`image` `section-title` `notes` `cta`)
- [ ] 재현 픽스처 3건 + 테스트 (**AC-1**)
- [ ] `md_templates` 테이블 + T1~T4 시드 (§5)

### P2 · 캔버스

- [ ] `ModulePalette` / 순서·삭제 / `TemplatePicker`
- [ ] 사용자 템플릿 저장 · 즐겨찾기 (FR-9.3·9.4)
- [ ] `BlockInspector` — **정의로 폼 자동 생성** (FR-3.3). 모듈별 폼을 손으로 짜기 시작하면 스키마 층이 무의미해진다
- [ ] 실렌더러로 즉시 미리보기 (FR-3.4)
- [ ] **AC-3** — 이미지 0장으로 T3 발행

### P3 · 발행·상태·측정

측정을 여기서 같이 끝낸다. 뒤로 미루면 영영 안 붙는다 (요구사항 §10 리스크).

- [ ] `draft`/`published`/`archived` + 노출 기간 + `requirePermission("md")`
- [ ] **AC-5** — 모듈 여백 변경이 발행된 MD 에 반영
- [ ] `md_page_events` — 조회·클릭을 **블록 단위**로 적재 (FR-8.1~8.2)
- [ ] 어드민 목록에 조회수·클릭수 표시 (FR-8.3)
- [ ] **AC-7** — CTA 클릭이 해당 블록 카운트로 잡힌다

```sql
create table md_page_events (
  id         bigserial primary key,
  page_id    uuid not null references md_pages(id),
  block_id   text,            -- null 이면 페이지 조회
  event      text not null,   -- view | click
  created_at timestamptz default now()
);
create index on md_page_events (page_id, event, created_at);
```

### P4 · L1 (요청서 → MD)

**L1 — 요청서에서 값을 뽑아 템플릿에 꽂는다.** 페이지 구성은 LLM 이 정하지 않는다.
설계 전체는 [llm.md §2](./llm.md).

- [ ] `aiSchema.ts` — `templateExtractionSchema(template, defs)` + Gemini `responseSchema` 변환
- [ ] `mdAiService.generateFromRequest()` — 기존 `showcaseAiService` 의 Gemini 배관 재사용
- [ ] 호텔 후보 주입 + id 실재 검증 (FR-5.5)
- [ ] `md_ai_runs` 적재 · **AC-4** 통과율 측정

### P5 · 이미지 생성 · 팬아웃

- [ ] `generateModuleImage()` — 캔버스 「AI로 만들기」 (FR-11 · [llm.md §4](./llm.md))
- [ ] 후보 제시 UI · 일일 상한
- [ ] `opengraph-image.tsx` — `hero` 값으로 OG 생성

---

## 9. 측정 (이력용)

작업하면서 그때그때 남긴다. 나중에는 못 만든다.

| 지표 | 출처 |
|---|---|
| 실사 규모 | 기획전 7건 · 이미지 378장 · 이미지 의존 ~90% |
| 재현 관문 | AC-1 통과 커밋 |
| 모듈 추가 비용 | AC-2 — 커밋별 변경 파일 수 |
| 이미지 0장 발행 | AC-3 |
| LLM 통과율 | AC-4 — 1차 / 재요청 포함 분리 기록 |

---

## 10. 미결

**없다.** Q1~Q8 이 전부 닫혔다.

| | 결정 |
|---|---|
| Q1 | 호텔 카드는 **id 참조** — 값 스냅샷 안 함 |
| Q2 | 반복 묶음은 **블록의 `group` 태그** — 그룹 모듈도 섹션 템플릿도 안 만듦. `template → module` 2단계 유지 (§5) |
| Q3 | **기존 Gemini 배관 확장** — 새 모델·새 키 없음 |
| Q4 | 템플릿은 **DB** |
| Q5 | 토큰은 **이 레포에서 새로 정의** (§4) |
| Q6 | **L1·L2 둘 다** — 성격이 다르다 |
| Q7 | **zod 4** |
| Q8 | **개인이 기본**, 공유는 명시적 승격. v1 은 `private` 만. 즐겨찾기는 개인 전용 고정 (§5) |

---

## 11. P5 이후 — MCP (M0~M3)

**캔버스를 대신하는 게 아니라 캔버스 앞을 푼다.** 모듈이 100개가 됐을 때 담당자가
고를 수 있게 하고(`search_modules`·`suggest_template`), 어떤 구성이 어울리는지 판단을 돕고,
문맥을 넣은 이미지를 만든다.

어드민과 **같은 앱 안의 route handler**다 (`app/api/mcp/route.ts`, `mcp-handler`).
MCP 도구가 `MODULE_DEFS`·`validateBlock`·`mdPageApi` 를 직접 import 하므로
**검증이 캔버스와 물리적으로 같은 코드**가 된다.

전제는 P1~P3 완료. 계획 전체는 [mcp.md](./mcp.md).
