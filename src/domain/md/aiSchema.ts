import { z } from "zod";
import type { ModuleDef, FieldDef } from "./moduleDef";
import type { Template } from "./template";

// ─── L1 추출 스키마 ─────────────────────────────────────────────────────────
//
// **모듈 정의에서 만든다** (FR-5.2). 프롬프트에 필드 설명을 손으로 쓰지 않는다 —
// 모듈을 늘려도 프롬프트가 저절로 따라오게 하는 것이 요점이다.
//
// L1 은 «페이지를 만들어라» 가 아니라 «이 요청서에서 이 필드들을 뽑아라» 다.
// 구성은 템플릿이 이미 정했다. 훨씬 좁은 일이라 결과가 흔들리지 않는다.

function fieldToZod(f: FieldDef): z.ZodTypeAny {
  const base = (): z.ZodTypeAny => {
    switch (f.input) {
      case "number":
        return z.number();
      case "image":
        // 이미지는 LLM 이 만들어낼 수 없다. 담당자가 캔버스에서 채운다 (FR-5.8)
        return z.string();
      case "hotel-refs":
        return z.string();
      case "color-free":
        return z.string();
      default:
        if (f.freedom === "preset" && f.options?.length) {
          return z.enum(f.options as [string, ...string[]]);
        }
        return z.string();
    }
  };

  const one = base().describe(f.description);
  const many = f.repeatable ? z.array(one) : one;
  return f.required ? many : many.optional();
}

/** 블록 하나가 요구하는 값의 모양 */
export function blockValueSchema(def: ModuleDef): z.ZodTypeAny {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of def.fields) {
    // 이미지는 LLM 에게 묻지 않는다 — 지어낼 수밖에 없고, 지어낸 URL 은 깨진 이미지가 된다
    if (f.input === "image") continue;
    shape[f.key] = fieldToZod(f);
  }
  return z.object(shape);
}

export interface ExtractionSlot {
  /** 페이지 안에서 이 블록을 가리키는 키 — 결과를 되꽂을 때 쓴다 */
  key: string;
  moduleType: string;
}

/**
 * 템플릿이 요구하는 필드만 모아 스키마를 만든다.
 *
 * 블록이 여러 개면 «몇 번째 블록의 값인가» 를 구분해야 하므로 키를 붙인다.
 */
export function templateExtractionSchema(
  template: Template,
  defs: ModuleDef[],
): { schema: z.ZodTypeAny; slots: ExtractionSlot[] } {
  const byType = new Map(defs.map((d) => [d.type, d]));
  const shape: Record<string, z.ZodTypeAny> = {};
  const slots: ExtractionSlot[] = [];

  template.blocks.forEach((b, i) => {
    const def = byType.get(b.moduleType);
    if (!def) return;
    const key = `${b.moduleType}_${i}`;
    shape[key] = blockValueSchema(def).describe(`${def.name} — ${def.whenToUse}`);
    slots.push({ key, moduleType: b.moduleType });
  });

  return { schema: z.object(shape), slots };
}

/**
 * zod → JSON Schema.
 *
 * zod 4 는 변환이 내장이라 별도 라이브러리가 필요 없다. 다만 공급자마다
 * 받는 부분집합이 달라 한 번 다듬는다 — **그 변환을 여기 한 곳에만 둔다.**
 * 공급자를 바꿔도 고치는 곳이 한 군데다 (llm.md §2).
 */
export function toProviderJsonSchema(schema: z.ZodTypeAny): Record<string, unknown> {
  const raw = z.toJSONSchema(schema, { io: "input" }) as Record<string, unknown>;
  return strip(raw) as Record<string, unknown>;
}

/** OpenAI 호환 structured outputs 가 안 받는 키를 걷어낸다 */
const DROP = new Set(["$schema", "$id", "default", "format", "examples"]);

function strip(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(strip);
  if (!node || typeof node !== "object") return node;

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
    if (DROP.has(k)) continue;
    out[k] = strip(v);
  }

  // strict 모드는 모든 속성이 required 이고 additionalProperties: false 여야 한다.
  // optional 필드는 nullable 로 표현한다 — 스키마에서 빼면 LLM 이 그 필드를 아예 모른다
  if (out.type === "object" && out.properties && typeof out.properties === "object") {
    out.additionalProperties = false;
    out.required = Object.keys(out.properties as Record<string, unknown>);
  }
  return out;
}
