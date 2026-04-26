# Phase 2: 쇼케이스 컨텐츠 관리 페이지

## 개요

어드민 시스템 2차 작업.  
**현재 showcase 데이터는 mock API로 운영 중**이며, 이 페이지는 관리자가 컨텐츠를 조회/생성/수정할 수 있는 UI를 제공한다.  
DB/API/n8n 연동은 3~4차에서 진행하므로, **이 단계는 UI + 상태 머신만 구현하고 mock 데이터를 사용**한다.

---

## 프로젝트 기본 정보

| 항목 | 내용 |
|---|---|
| 프레임워크 | Next.js 14 App Router |
| 스타일 | Tailwind CSS |
| 상태 관리 | Jotai (UI), React Query (서버 상태), XState v5 (복잡한 워크플로우) |
| 유효성 검사 | Zod (스키마에서 타입 추론) |
| 아이콘 | lucide-react |
| 경로 별칭 | `@/*` → `src/*` |

---

## 이미 완료된 1차 작업

### 파일 구조 (이미 존재)
```
src/
├── domain/admin/permissions.ts          ← AdminFeature, FeatureAccess 타입
├── infrastructure/admin/
│   ├── permissionsApi.ts                ← getFeatureAccess(), getAllPermissions()
│   └── requirePermission.ts            ← Server Component 권한 guard
├── application/admin/
│   └── useAdminPermissions.ts           ← useFeatureAccess() hook
├── ui/patterns/admin/
│   └── AdminSidebar.tsx                 ← 사이드바 (이미 showcase 링크 포함)
└── app/admin/
    ├── layout.tsx                       ← 어드민 공통 레이아웃
    └── page.tsx                         ← 대시보드
```

### `requirePermission` 사용 방법
```typescript
// Server Component에서 호출 — 권한 없으면 자동 redirect
import { requirePermission } from "@/infrastructure/admin/requirePermission";

export default async function SomePage() {
  await requirePermission("showcase", "read", "/admin");
  // 이 아래는 권한이 있는 경우만 실행됨
  return <ClientView />;
}
```

---

## 기존 도메인 타입 (재사용)

**`src/domain/hotel/showcaseTypes.ts`** — 이미 존재, 수정 금지

```typescript
type ShowcaseHotelCard = {
  id: string;
  name: string;
  location: string;
  imageUrl: string;        // URL
  stars: number;           // 1~5
  discountRate?: number;   // 0~100
  originalPrice: number;
  discountPrice: number;
  isAppDiscount: boolean;
  taxIncluded: boolean;
  badges: string[];        // ["플러스딜", "최저가보장"]
};

type RegionTab = {
  id: string;
  name: string;
  themeText: string;
  backgroundImageUrl: string; // URL
};

type RegionShowcaseData = {
  promoTitle: string;
  regions: Array<{ tab: RegionTab; hotels: ShowcaseHotelCard[] }>;
};
```

---

## 새로 만들어야 할 도메인 타입

### `src/domain/admin/showcaseContent.ts` (신규)

```typescript
import { z } from "zod";
import { regionShowcaseDataSchema } from "@/domain/hotel/showcaseTypes";

export const showcaseStatusSchema = z.enum(["draft", "active", "archived"]);
export type ShowcaseStatus = z.infer<typeof showcaseStatusSchema>;

// DB에 저장되는 컨텐츠 단위 (id, 상태, 메타정보 포함)
export const showcaseContentSchema = z.object({
  id: z.string().uuid(),
  data: regionShowcaseDataSchema,
  status: showcaseStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ShowcaseContent = z.infer<typeof showcaseContentSchema>;

// 생성 위저드에서 단계별로 쌓이는 임시 상태
export const showcaseCreationDraftSchema = z.object({
  city: z.string().min(1),
  title: z.string().min(1).optional(),           // Step 2에서 채워짐
  backgroundImageUrl: z.string().url().optional(), // Step 3에서 채워짐
  hotels: z.array(z.any()).optional(),            // Step 4에서 채워짐
});
export type ShowcaseCreationDraft = z.infer<typeof showcaseCreationDraftSchema>;
```

### `src/domain/admin/autoConfig.ts` (신규)

```typescript
import { z } from "zod";

const cronExpressionSchema = z
  .string()
  .regex(
    /^(\*|[0-9,\-*/]+)\s+(\*|[0-9,\-*/]+)\s+(\*|[0-9,\-*/]+)\s+(\*|[0-9,\-*/]+)\s+(\*|[0-9,\-*/]+)$/,
    "유효한 cron 표현식이 아닙니다 (예: 0 9 * * 1)"
  );

export const autoConfigSchema = z.object({
  feature: z.literal("showcase"),
  enabled: z.boolean(),
  cronExpression: cronExpressionSchema,
  lastRunAt: z.string().datetime().nullable(),
  nextRunAt: z.string().datetime().nullable(),
});
export type AutoConfig = z.infer<typeof autoConfigSchema>;

export const updateAutoConfigSchema = z.object({
  enabled: z.boolean().optional(),
  cronExpression: cronExpressionSchema.optional(),
});
export type UpdateAutoConfigInput = z.infer<typeof updateAutoConfigSchema>;
```

---

## 생성 위저드 상태 머신

**`src/application/admin/showcaseCreationMachine.ts`** (신규)

XState v5 (`xstate` 패키지, 이미 설치됨)를 사용한다.  
`src/application/payment/paymentMachine.ts` 패턴을 참고한다.

```
States:
idle
  → (SELECT_CITY) → selectingCity
  → (CONFIRM_CITY) → generatingTitle [API 호출 중]
  → (TITLE_GENERATED) → reviewingTitle
  → (CONFIRM_TITLE) → generatingImage [API 호출 중]
  → (IMAGE_GENERATED) → reviewingImage
  → (CONFIRM_IMAGE / REGENERATE_IMAGE→generatingImage) → generatingHotels [API 호출 중]
  → (HOTELS_GENERATED) → reviewingHotels
  → (CONFIRM_HOTELS) → saving [API 호출 중]
  → (SAVED) → done
  → (ERROR, 어느 단계에서든) → error
  → (RETRY) → 이전 단계로

Context:
  city: string
  title: string | undefined
  backgroundImageUrl: string | undefined
  hotels: ShowcaseHotelCard[] | undefined
  errorMessage: string | undefined
```

**이 단계에서는 실제 API를 호출하지 않는다.**  
각 `generatingXxx` 상태는 **1~2초 지연 후 mock 데이터를 반환하는 Promise**로 구현한다.  
예:
```typescript
// mock title generator
async function mockGenerateTitle(city: string): Promise<string> {
  await new Promise(r => setTimeout(r, 1500));
  return `${city} 감성 여행 숙소`;
}
```

---

## 구현해야 할 페이지/컴포넌트

### 1. 컨텐츠 목록 페이지

**`src/app/admin/content/showcase/page.tsx`** (신규, Server Component)
```typescript
// 권한 체크 후 클라이언트 컴포넌트 렌더
await requirePermission("showcase", "read", "/admin");
return <ShowcaseListView />;
```

---

**`src/ui/patterns/admin/showcase/ShowcaseListView.tsx`** (신규, Client Component)

기능:
- 상단: "새 쇼케이스 생성" 버튼 (showcase:write 권한 있을 때만 표시)
- 상단: 자동생성 설정 패널 (토글 + cron 표현식 표시)
- 목록 테이블: promoTitle / status badge / 지역 수 / 수정일 / 액션(편집, 삭제)

**mock 데이터 (이 단계):**
```typescript
const MOCK_CONTENTS: ShowcaseContent[] = [
  {
    id: "mock-001",
    data: { promoTitle: "3월 숙소, 지금이 가장 저렴해요!", regions: [...] }, // 기존 mock 재사용
    status: "active",
    createdAt: "2025-03-01T09:00:00Z",
    updatedAt: "2025-03-15T12:00:00Z",
  },
];

const MOCK_AUTO_CONFIG: AutoConfig = {
  feature: "showcase",
  enabled: false,
  cronExpression: "0 9 * * 1",
  lastRunAt: null,
  nextRunAt: null,
};
```

UI 요구사항:
- status 뱃지 색상: `active` → 초록, `draft` → 노랑, `archived` → 회색
- 삭제 시 `confirm()` 다이얼로그로 확인
- 편집 버튼 → `/admin/content/showcase/[id]/edit` 이동

---

### 2. 컨텐츠 생성 위저드

**`src/app/admin/content/showcase/new/page.tsx`** (신규, Server Component)
```typescript
await requirePermission("showcase", "write", "/admin/content/showcase");
return <ShowcaseCreationWizard />;
```

---

**`src/ui/patterns/admin/showcase/ShowcaseCreationWizard.tsx`** (신규, Client Component)

`useMachine(showcaseCreationMachine)` 으로 XState 상태 머신 사용.

각 step을 별도 컴포넌트로 분리:

**`steps/CitySelectStep.tsx`**
- 도시 이름 텍스트 입력 (예: "교토", "제주", "파리")
- "다음" 버튼 → `CONFIRM_CITY` 이벤트

**`steps/TitleReviewStep.tsx`**
- `generatingTitle` 상태: 로딩 스피너 + "타이틀 생성 중..." 텍스트
- `reviewingTitle` 상태: 생성된 타이틀 텍스트 표시 + 수정 가능한 input
- "다시 생성" 버튼 → `SELECT_CITY` 이벤트 (도시 단계로 돌아감)
- "확인" 버튼 → `CONFIRM_TITLE` 이벤트

**`steps/ImageReviewStep.tsx`**
- `generatingImage` 상태: 로딩 스피너 + "이미지 생성 중..." 텍스트
- `reviewingImage` 상태: 생성된 이미지 미리보기 (`<img>` 태그)
- "다시 생성" 버튼 → `REGENERATE_IMAGE` 이벤트
- "확인" 버튼 → `CONFIRM_IMAGE` 이벤트

**`steps/HotelReviewStep.tsx`**
- `generatingHotels` 상태: 로딩 스피너
- `reviewingHotels` 상태: 호텔 카드 목록 표시
- 각 호텔 이름/가격 인라인 편집 가능
- "저장" 버튼 → `CONFIRM_HOTELS` 이벤트

**스텝 인디케이터** (상단에 진행 단계 표시):
```
도시 선택  →  타이틀 생성  →  이미지 생성  →  호텔 확인  →  완료
```

---

### 3. 컨텐츠 편집 페이지

**`src/app/admin/content/showcase/[id]/edit/page.tsx`** (신규, Server Component)
```typescript
await requirePermission("showcase", "write", "/admin/content/showcase");
const { id } = await params;
return <ShowcaseEditView id={id} />;
```

---

**`src/ui/patterns/admin/showcase/ShowcaseEditView.tsx`** (신규, Client Component)

기능:
- id로 컨텐츠 조회 (이 단계에서는 mock에서 찾기)
- 전체 편집 가능:
  - `promoTitle` 텍스트 입력
  - `status` 셀렉트 (draft / active / archived)
  - 지역별 탭 편집:
    - tab.name, tab.themeText 텍스트 수정
    - 배경 이미지 URL 수정
    - 각 섹션 우측에 "AI 재생성" 버튼 (이 단계에서는 클릭 시 mock 데이터로 교체)
  - 호텔 목록 편집:
    - 각 호텔의 name, location, 가격, badges 수정
    - "AI 재생성" 버튼으로 호텔 목록 교체
- 하단: "저장" / "취소" 버튼
- 저장 후 `/admin/content/showcase` 이동

---

## 기존 UI 컴포넌트 재사용

| 컴포넌트 | 경로 | 사용처 |
|---|---|---|
| `Button` | `src/ui/components/Button.tsx` | variant: primary, outline, ghost / size: sm, md |
| `Card`, `CardContent` | `src/ui/components/Card.tsx` | 목록 행, 패널 |
| `Input` | `src/ui/components/Input.tsx` | 텍스트 입력 |

---

## 라우팅 구조

```
/admin/content/showcase          → 목록 (read 권한)
/admin/content/showcase/new      → 생성 위저드 (write 권한)
/admin/content/showcase/[id]/edit → 편집 (write 권한)
```

`/admin/layout.tsx`가 이미 `AdminSidebar`를 포함하고 있으므로, 위 페이지들은 자동으로 사이드바가 포함된다.

---

## 주의사항

1. **DB/API 연동 없음**: 이 단계는 모든 데이터를 mock으로 처리한다. 실제 fetch 코드를 작성하지 않는다.
2. **Zod 타입 추론**: 타입을 직접 작성하지 말고 `z.infer<typeof schema>` 패턴을 사용한다.
3. **"use client"**: 상태가 필요한 컴포넌트에만 붙인다. Server Component에서는 생략.
4. **권한 체크**: 모든 페이지는 `requirePermission()` 으로 시작한다 (1차에서 만들어짐).
5. **XState v5 문법**: `setup({}).createMachine({})` 패턴 사용. `src/application/payment/paymentMachine.ts` 참고.
6. **파일 경로**: `src/` 기준으로 `@/` 별칭 사용.

---

## 완료 기준

- [ ] `/admin/content/showcase` 접속 시 목록 페이지 렌더
- [ ] 목록에서 mock 컨텐츠 카드 확인
- [ ] "새 쇼케이스 생성" 버튼 클릭 → 위저드 페이지 이동
- [ ] 위저드 전체 플로우 (도시→타이틀→이미지→호텔→완료) mock으로 동작
- [ ] 편집 버튼 → 편집 페이지 이동, 필드 수정 가능
- [ ] `showcase:read=false` 유저 → 목록 접근 시 `/admin` redirect
- [ ] `showcase:write=false` 유저 → 생성/편집 접근 시 `/admin/content/showcase` redirect
