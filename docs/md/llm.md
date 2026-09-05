# LLM 층 — 두 갈래

**상태** v0.3 · 2026-09-05
**선행** [requirements.md](./requirements.md) · [design.md](./design.md) D6
**관련** [mcp.md](./mcp.md)

> v0.2 는 기존 Gemini 를 그대로 쓰는 안이었다. **무료 한도가 작아 바꾼다** —
> 공급자를 코드에 박지 않고 **OpenAI 호환 `baseURL` 교체**로 간다 (§2).
> 이미지·업로드 배관은 기존 것을 그대로 쓴다.

---

## 1. 두 갈래

MD 자동화에 붙는 LLM 은 **성격이 다른 둘**이다. 하나로 묶으면 둘 다 어정쩡해진다.

| | **L1 · 요청서 → MD** | **L2 · MCP 대화** |
|---|---|---|
| 입력 | 정형 요청서 (담당자가 채운 폼) | 자유 대화 |
| 하는 일 | 요청서에서 **데이터를 뽑아** 템플릿에 적용 | 템플릿 **선택·구성**부터 전반 |
| 템플릿 | 담당자가 이미 고른 것 | AI 가 고른다 |
| 실행 위치 | 서버 (어드민 내장) | 호출자의 AI 클라이언트 |
| 모델 | **OpenAI 호환 무료 티어** (교체 가능) | 호출자 것 (Codex·Claude) |
| 토큰 비용 | 서비스 | 호출자 |
| 사용자 | 요청서 쓰는 데 익숙한 담당자 | 무엇을 만들지만 아는 사람 |

**L1 은 정확도, L2 는 자유도.** 둘 다 필요하다 — 대체 관계가 아니다.

```
정형 요청서 ──▶ L1 ──▶ 템플릿 + 데이터 ──▶ MD 초안 ──┐
                                                      ├──▶ 캔버스에서 마감·발행
자유 대화   ──▶ L2 (MCP) ──▶ 템플릿 선택 + 구성 ─────┘
```

---

## 2. L1 · 요청서 → MD

### 흐름

```
① 요청서 접수      정형 폼 (기획전명·기간·대상 호텔·강조 문구·톤)
      ▼
② 데이터 추출      요청서 → 구조화된 값 (Gemini · JSON 모드)
      ▼
③ 템플릿 선택      담당자가 고른 템플릿 (또는 요청 유형으로 기본값)
      ▼
④ 적용            템플릿의 블록 순서에 ②의 값을 꽂는다
      ▼
⑤ 검증            mdPageSchema → validateBlock → 호텔 실재 확인
      ▼
⑥ draft 저장 + 편집 URL
```

**핵심은 ③④가 LLM 이 아니라는 것이다.** 템플릿은 이미 정해진 블록 배열이고,
LLM 은 **②의 값 추출만** 한다. 그래서 결과가 흔들리지 않는다.

> L1 이 정확한 이유가 여기 있다 — LLM 에게 «페이지를 만들어라» 가 아니라
> «이 요청서에서 이 필드들을 뽑아라» 를 시킨다. 훨씬 좁은 일이다.

### 무엇이 한도를 먹는가

공급자를 고르기 전에 **실제 사용량**을 세야 한다. 셋은 성격이 완전히 다르다.

| | 건당 | 하루 50건이면 | 누가 낸다 |
|---|---|---|---|
| **L2 (MCP)** | 0 | **0** | 호출자 |
| **L1 텍스트** | 입력 ~4K + 출력 ~2K = **6K** | **300K 토큰** | 우리 |
| **이미지 생성** | 1장 | 수십 장 | 우리 (**별도 한도**) |

**L1 의 텍스트 사용량은 작다.** 하루 300K 는 웬만한 무료 티어 안에 들어온다.
평가 20건(AC-4)은 120K 로 끝난다.

한도에 부딪히는 건 대개 **토큰 총량이 아니라 분당 요청 수(RPM)·분당 토큰(TPM)** 이다 —
여러 건을 병렬로 돌리는 배치 생성이 그렇다.
그리고 **이미지 생성은 텍스트와 별개 한도**라 따로 세야 한다.

> 결론 — L1 텍스트는 무료 티어로 충분하다. 조심할 것은 **배치 동시 호출**과 **이미지**다.

### 공급자 — OpenAI 호환으로 통일하고 `baseURL` 만 바꾼다

무료 티어는 자주 바뀐다. **공급자를 코드에 박지 않는다.**

주요 무료 공급자가 전부 **OpenAI 호환 엔드포인트**와
`response_format: { type: "json_schema" }` 구조화 출력을 지원한다.
그래서 OpenAI SDK 를 쓰되 **`baseURL` 을 환경변수로 뺀다** — 교체가 환경변수 한 줄이 된다.

```typescript
// infrastructure/md/llmClient.ts
import "server-only";
import OpenAI from "openai";

export const llm = new OpenAI({
  baseURL: process.env.LLM_BASE_URL,   // ← 공급자 교체 지점
  apiKey:  process.env.LLM_API_KEY,
});
export const LLM_MODEL = process.env.LLM_MODEL!;
```

추상화 층을 만들지 않는다. 공급자들이 이미 같은 인터페이스를 말한다.

#### 무료 티어 (2026-09 확인)

| 공급자 | 무료 한도 | 카드 | 구조화 출력 | 주의 |
|---|---|:--:|:--:|---|
| **Cerebras** | **1M 토큰/일**, ~30K TPM | 불필요 | ✅ | 오픈 모델(Llama·Qwen) |
| **OpenAI 데이터공유** | 소형 2.5M~10M · 대형 250K~1M 토큰/일 | 티어1 도달에 $5 | ✅ 최고 | **프롬프트가 학습에 쓰인다** |
| **Mistral (Experiment)** | 1B 토큰/월 | 불필요 | ✅ | **2 RPM** · 학습 공유 필수 |
| **Groq** | ~30 RPM, **~6K TPM** | 불필요 | ✅ | TPM 이 작다 — 건당 6K 면 **분당 1건** |
| **OpenRouter** | 20 RPM / **50 RPD** ($10 결제 시 1000 RPD) | 불필요 | 모델별 | 여러 모델을 **한 API** 로 |
| **GitHub Models** | 100+ 모델, 일일 한도 | 불필요 | 모델별 | 개발용 |

#### 결정

| 용도 | 공급자 | 이유 |
|---|---|---|
| **기본** | **Cerebras** | 카드 없이 1M/일 · 30K TPM 이면 배치도 견딘다 |
| **평가 (AC-4)** | **OpenRouter** | 모델을 갈아끼우며 통과율을 **비교**할 수 있다. 50 RPD 로 20건 충분 |
| **품질이 모자라면** | OpenAI 데이터공유 | 구조화 출력이 가장 확실. 단 학습 공유를 감수 |

**Groq 는 안 쓴다.** 빠르지만 6K TPM 이 우리 건당 토큰과 같아 분당 1건이 상한이다.

**측정한 다음에 바꾼다.** AC-4(1차 통과율 ≥70%)를 재기 전에 «비싼 게 낫겠지» 로 고르지 않는다 —
통과율이 낮을 때 원인이 모델인지 프롬프트인지 스키마인지 못 가린다.
`baseURL` 교체가 한 줄이라 언제든 되돌린다.

> **학습 공유 주의** — OpenAI 데이터공유·Mistral Experiment 는 프롬프트가 학습에 쓰인다.
> 이 프로젝트는 mock 데이터라 무해하지만 **실데이터를 다루는 곳에서는 못 쓴다.**
> 프로세스를 정의하는 문서로서 이 조건은 기록해 둔다.

### 구조화 출력

`response_format: { type: "json_schema" }` 를 쓴다. 스키마는 **모듈 정의에서 만든다.**

```typescript
// domain/md/aiSchema.ts
export function templateExtractionSchema(template: Template, defs: ModuleDef[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const b of template.blocks) {
    const def = defs.find((d) => d.type === b.moduleType)!;
    for (const f of def.fields) shape[f.key] = fieldToZod(f);
  }
  return z.object(shape);
}
```

```typescript
const schema = templateExtractionSchema(tpl, MODULE_DEFS);

const res = await llm.chat.completions.create({
  model: LLM_MODEL,
  messages: [{ role: "system", content: sys }, { role: "user", content: request }],
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "md_extract",
      strict: true,
      // zod4 는 JSON Schema 변환이 내장이다 — 별도 라이브러리가 필요 없다
      schema: z.toJSONSchema(schema),
    },
  },
});

const parsed = schema.safeParse(JSON.parse(res.choices[0].message.content!));
```

`z.toJSONSchema()` 결과를 한 번 다듬어야 할 수 있다 (`$ref` 평탄화, 미지원 키워드 제거).
그 변환기는 `aiSchema.ts` 안에 둔다 — **공급자를 바꿔도 고치는 곳이 한 곳**이다.

**한 소스가 네 곳에 쓰인다.**

```
        MODULE_DEFS (모듈 정의 = 데이터)
              │
    ┌─────────┼──────────┬──────────────┐
    ▼         ▼          ▼              ▼
 저장 검증  L1 출력 스키마  어드민 폼   MCP 도구 스키마
```

### 이미지는 별도 예산이다

기존 `generateImageWithFlux()` 는 HuggingFace 를 쓴다.
**텍스트 한도와 무관한 별도 한도**이고 장당 비용이 더 크다. 그래서 —

- 이미지 생성은 **명시적 요청에만** 돈다. 페이지 생성이 자동으로 부르지 않는다
- 사용자당 **일일 상한**을 건다 ([mcp.md §6](./mcp.md))
- 한도를 넘으면 «빈 이미지 슬롯» 으로 두고 캔버스에서 업로드하게 한다

### 기존 코드는 그대로 둔다

`showcaseAiService.ts` 의 Gemini 호출(쇼케이스 타이틀·이미지)은 **건드리지 않는다.**
동작하고 있고 교체 이득이 없다.

새로 만드는 건 둘뿐이다.

```
infrastructure/md/llmClient.ts    OpenAI 호환 클라이언트
infrastructure/md/mdAiService.ts  L1 본체
```

이미지는 기존 것을 가져다 쓴다 — `buildFluxPromptWithGemini()` 가 이미
**「사람·얼굴 없는 풍경」** 으로 고정돼 있어 MD 이미지 제약([mcp.md §5](./mcp.md))의 절반이 돼 있다.

### 실패 처리

| 상황 | 처리 |
|---|---|
| JSON 파싱 실패 / 스키마 불일치 | 오류를 붙여 **재요청 1회** |
| 재요청도 실패 | 뽑힌 값만 넣어 `draft` 저장. **버리지 않는다** |
| 없는 호텔 id | 후보 목록에 없으면 그 카드만 제거 |
| 필수 필드 누락 | 빈 채로 draft 저장 → 캔버스에서 담당자가 채운다 |

**항상 `draft` 다.** 자동 발행하지 않는다.

## 3. L2 · MCP 대화

전체 설계는 [mcp.md](./mcp.md).

L1 과 겹치지 않는 이유 —

| | L1 | L2 |
|---|---|---|
| 템플릿을 **고르는 주체** | 사람 | AI |
| 모듈이 100개일 때 | 상관없다 (템플릿이 이미 정해짐) | **이 문제를 푸는 게 목적** |
| 입력의 정형성 | 요청서 폼 | 자유 |

**요청서 문화가 있는 조직엔 L1 이, 없으면 L2 가 맞는다.**
둘 다 만들어 보는 게 이 프로젝트가 프로세스를 정의하는 방식이다.

---

## 4. 측정

L1 만 잰다. L2 는 호출자 모델이 제각각이라 통제가 안 된다.

```sql
create table md_ai_runs (
  id          bigserial primary key,
  request     text not null,
  template    text not null,
  attempt     int  not null,      -- 1 = 1차, 2 = 재요청
  ok          boolean not null,
  error       text,
  created_at  timestamptz default now()
);
```

| 지표 | 목표 |
|---|---|
| 1차 스키마 통과율 | ≥ 70% (AC-4) |
| 재요청 포함 최종 | ≥ 90% |
| 실패 사유 분포 | 어디를 고칠지 알려주는 유일한 근거 |

평가 요청서 20건은 실사 7건의 유형 분포(브랜드 2 · 테마 2 · 허브 2 · 단독 1)에 맞춰 만든다.
**직접 지어낸 20건이라 과대평가**라는 점을 기록해 둔다.

---

## 5. 키 관리

| 규칙 | 이유 |
|---|---|
| `LLM_API_KEY` · `GEMINI_API_KEY` 는 서버 전용 | |
| `LLM_BASE_URL` · `LLM_MODEL` 도 서버 전용 | 공급자를 바꿔도 코드를 안 고친다 |
| `mdAiService.ts` 최상단 `import "server-only"` | 클라이언트에서 import 하면 **빌드가 깨진다** |
| `NEXT_PUBLIC_` 접두사 금지 | 붙는 순간 브라우저로 나간다 |
| 호출은 Route Handler / Server Action 에서만 | |

**공개 레포다.** 키가 커밋에 한 번 들어가면 회전밖에 답이 없다.
`.gitignore` 에 `.env*` 확인 완료.

---

## 6. 안 하는 것

- **새 모델·새 공급자 도입** — 있는 걸 쓴다
- **에이전트 루프** — L1 은 요청 1회로 끝난다
- **스트리밍** — 결과를 한 번에 받아 캔버스에 얹는다
- **멀티 모델 폴백** — 실패 원인을 못 가린다
- **RAG·파인튜닝** — 모듈 정의가 프롬프트에 다 들어간다
