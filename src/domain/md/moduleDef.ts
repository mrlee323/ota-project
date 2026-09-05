import { z } from "zod";

// ─── 모듈 정의 ──────────────────────────────────────────────────────────────
//
// 모듈 정의는 «데이터» 다. 한 소스가 네 곳에 쓰인다 —
//   ① 저장 검증(validateBlock)  ② L1 출력 스키마  ③ 어드민 편집 폼  ④ MCP 도구 스키마
// 그래서 모듈을 하나 추가할 때 고치는 곳이 2개를 넘지 않는다 (AC-2).
//   1) domain/md/modules/index.ts  2) ui/patterns/md/registry.ts

/** 필드 입력 방식 — 어드민 폼이 이걸 보고 컨트롤을 고른다 */
export const fieldInputSchema = z.enum([
  "text",
  "textarea",
  "image",
  "number",
  "color-token", // 토큰에서 고른다
  "color-free", // 자유 색 — 구간 배경 전용 (FR-2.3 의 유일한 예외)
  "link",
  "hotel-refs", // 호텔 id 배열. 가격은 저장하지 않는다 (Q1)
]);
export type FieldInput = z.infer<typeof fieldInputSchema>;

/**
 * 자유도 등급 (FR-1.7 · D7).
 * 「다양성」과 「일관성」은 페이지 단위로 못 푼다 — 필드마다 정한다.
 * `free` 는 예외 목록으로 관리한다. 늘어나면 페이지가 다시 제각각이 된다.
 */
export const freedomSchema = z.enum(["fixed", "preset", "free"]);

export const fieldDefSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  input: fieldInputSchema,
  required: z.boolean().default(false),
  repeatable: z.boolean().default(false),
  freedom: freedomSchema.default("preset"),
  /** freedom === "preset" 일 때 고를 수 있는 값 */
  options: z.array(z.string()).optional(),
  /** LLM 이 그대로 읽는다 (FR-1.5) — 프롬프트에 필드 설명을 따로 쓰지 않는다 */
  description: z.string(),
});
export type FieldDef = z.infer<typeof fieldDefSchema>;

export const moduleDefSchema = z.object({
  type: z.string().min(1),
  version: z.literal(1),
  name: z.string().min(1),
  category: z.enum(["헤더", "본문", "푸터"]),
  /** 이게 무엇인가 */
  description: z.string(),
  /** 언제 쓰는 모듈인가 — 모듈이 100개가 됐을 때 고르는 근거 (FR-1.8) */
  whenToUse: z.string(),
  fields: z.array(fieldDefSchema),
  /** 캔버스에 처음 올렸을 때 들어가는 값. 빈 껍데기를 보지 않게 한다 (FR-1.4) */
  sample: z.record(z.string(), z.unknown()),
});
export type ModuleDef = z.infer<typeof moduleDefSchema>;

// ─── 값 검증 ────────────────────────────────────────────────────────────────

export type ValidationIssue = { key: string; message: string };

/**
 * 모듈 정의를 읽어 블록 값을 런타임에 검증한다 (D4).
 *
 * 모듈마다 필드가 달라 `values` 를 정적 타입으로 좁힐 수 없다.
 * **이 함수가 스키마 층의 핵심**이고, 캔버스·MCP·L1 이 전부 이걸 통과해야 저장된다.
 */
export function validateBlock(
  def: ModuleDef,
  values: Record<string, unknown>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const f of def.fields) {
    const v = values[f.key];
    const empty = v === undefined || v === null || v === "";

    if (empty) {
      if (f.required) issues.push({ key: f.key, message: `${f.label}은(는) 필수입니다` });
      continue;
    }

    if (f.repeatable) {
      if (!Array.isArray(v)) {
        issues.push({ key: f.key, message: `${f.label}은(는) 목록이어야 합니다` });
        continue;
      }
      for (const item of v) issues.push(...checkOne(f, item));
      continue;
    }

    issues.push(...checkOne(f, v));
  }

  // 정의에 없는 필드는 거부한다 — 캔버스든 MCP 든 임의 필드를 못 만든다 (D6)
  const known = new Set(def.fields.map((f) => f.key));
  for (const key of Object.keys(values)) {
    if (!known.has(key)) issues.push({ key, message: `정의에 없는 필드입니다` });
  }

  return issues;
}

function checkOne(f: FieldDef, v: unknown): ValidationIssue[] {
  const fail = (message: string) => [{ key: f.key, message }];

  switch (f.input) {
    case "number":
      return typeof v === "number" && Number.isFinite(v) ? [] : fail(`${f.label}은(는) 숫자여야 합니다`);

    case "image":
      return typeof v === "string" && /^https?:\/\//.test(v)
        ? []
        : fail(`${f.label}은(는) http(s) 주소여야 합니다`);

    case "link":
      return typeof v === "string" || (typeof v === "object" && v !== null)
        ? []
        : fail(`${f.label} 형식이 올바르지 않습니다`);

    case "hotel-refs":
      return typeof v === "string" && v.length > 0 ? [] : fail(`호텔 id 가 올바르지 않습니다`);

    case "color-free":
      return typeof v === "string" && /^#[0-9a-fA-F]{3,8}$/.test(v)
        ? []
        : fail(`${f.label}은(는) 색상 코드여야 합니다`);

    default:
      if (typeof v !== "string") return fail(`${f.label}은(는) 문자열이어야 합니다`);
      // preset 은 정해진 값 중에서만 고른다 (FR-1.7)
      if (f.freedom === "preset" && f.options && !f.options.includes(v)) {
        return fail(`${f.label}은(는) ${f.options.join(" / ")} 중 하나여야 합니다`);
      }
      return [];
  }
}
