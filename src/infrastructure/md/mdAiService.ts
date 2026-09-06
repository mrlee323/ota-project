import "server-only";
import type { ModuleDef } from "@/domain/md/moduleDef";
import { validateBlock } from "@/domain/md/moduleDef";
import { blockFromDef, type MdBlock, type MdPage } from "@/domain/md/page";
import { MODULE_DEFS, findModuleDef } from "@/domain/md/modules";
import { templateExtractionSchema, toProviderJsonSchema } from "@/domain/md/aiSchema";
import type { Template } from "@/domain/md/template";
import type { MdRequest } from "@/domain/md/request";
import { getLlm, LLM_MODEL } from "./llmClient";
import { filterExistingHotelIds } from "./hotelLookup";
import { recordAiRun } from "./mdAiRunApi";

// ─── L1 · 요청서 → MD ───────────────────────────────────────────────────────
//
// LLM 에게 «페이지를 만들어라» 가 아니라 «이 요청서에서 이 필드들을 뽑아라» 를 시킨다.
// 구성은 템플릿이 이미 정했다 — 훨씬 좁은 일이라 결과가 흔들리지 않는다 (llm.md §2).

export interface GenerateResult {
  page: MdPage;
  /** 1 = 1차 성공, 2 = 재요청 성공, null = 둘 다 실패(부분 결과) */
  attempt: number | null;
  issues: string[];
}

let seq = 0;
const newId = () => `b${Date.now().toString(36)}${(seq++).toString(36)}`;

function systemPrompt(template: Template, hotels: string[]): string {
  return [
    "너는 여행 기획전 페이지의 문구를 쓰는 사람이다.",
    "주어진 요청서에서 각 블록에 들어갈 값을 뽑아낸다.",
    "",
    `이번 기획전의 구성: ${template.name} — ${template.description}`,
    "",
    "규칙",
    "- 목록에 없는 호텔을 만들지 않는다. 넣을 수 있는 호텔 id: " +
      (hotels.length ? hotels.join(", ") : "(없음)"),
    "- 할인율·최저가·조건을 지어내지 않는다. 가격은 화면이 실제 데이터로 채운다.",
    "- 요청서에 없는 사실을 만들어내지 않는다. 모르면 짧게 쓴다.",
    "- 문구는 한국어. 과장하지 않는다.",
  ].join("\n");
}

function userPrompt(req: MdRequest): string {
  return [
    `무엇을 파는가: ${req.intent}`,
    req.highlight ? `강조할 점: ${req.highlight}` : null,
    req.period ? `노출 기간: ${req.period}` : null,
    req.hotelIds.length ? `고른 호텔: ${req.hotelIds.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

/** 추출 결과를 템플릿 블록에 꽂는다 — 구성은 이미 정해져 있다 */
function assemble(
  template: Template,
  extracted: Record<string, Record<string, unknown>>,
  slotKeys: string[],
  defs: ModuleDef[],
): { blocks: MdBlock[]; issues: string[] } {
  const issues: string[] = [];

  const blocks = template.blocks.map((tb, i) => {
    const def = findModuleDef(tb.moduleType);
    if (!def) return null;

    const base = blockFromDef(def, newId(), tb.group);
    const got = extracted[slotKeys[i]] ?? {};

    // 샘플 위에 뽑아낸 값을 덮는다 — 못 뽑은 필드는 샘플이 남아 빈 껍데기가 안 된다
    const values = { ...base.values, ...tb.values, ...got };

    const bad = validateBlock(def, values);
    if (bad.length > 0) {
      issues.push(...bad.map((b) => `${def.name}: ${b.message}`));
      // 틀린 필드는 샘플로 되돌린다. 버리지 않는다 (FR-5.4)
      for (const b of bad) values[b.key] = base.values[b.key];
    }

    return { ...base, values };
  });

  return { blocks: blocks.filter((b): b is MdBlock => b !== null), issues };
}

async function callOnce(
  template: Template,
  req: MdRequest,
  hotels: string[],
  retryWith?: string,
): Promise<Record<string, Record<string, unknown>>> {
  const { schema, slots } = templateExtractionSchema(template, MODULE_DEFS);

  const messages: { role: "system" | "user"; content: string }[] = [
    { role: "system", content: systemPrompt(template, hotels) },
    { role: "user", content: userPrompt(req) },
  ];
  // 재요청은 «무엇이 틀렸는지» 를 붙여 같은 대화에 이어서 묻는다
  if (retryWith) messages.push({ role: "user", content: `앞선 답에 문제가 있었다:\n${retryWith}\n고쳐서 다시 답해라.` });

  const res = await getLlm().chat.completions.create({
    model: LLM_MODEL,
    messages,
    // 넉넉히 준다. thinking 을 쓰는 모델은 여기가 좁으면 JSON 이 중간에 잘리고,
    // 그러면 파싱 실패로 «모델이 스키마를 못 지켰다» 처럼 보인다 — 통과율이 왜곡된다
    max_tokens: 4000,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "md_extract",
        strict: true,
        schema: toProviderJsonSchema(schema),
      },
    },
  });

  const text = res.choices[0]?.message?.content ?? "{}";
  const parsed = schema.safeParse(JSON.parse(text));
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" · "));
  }
  void slots;
  return parsed.data as Record<string, Record<string, unknown>>;
}

/**
 * 요청서에서 MD 초안을 만든다.
 *
 * 실패해도 버리지 않는다 — 뽑힌 값만 넣어 draft 로 남기고 사람에게 넘긴다 (FR-5.4).
 */
export async function generateFromRequest(
  req: MdRequest,
  template: Template,
): Promise<GenerateResult> {
  // LLM 이 호텔을 지어내지 못하게, 실재하는 id 만 프롬프트에 넣는다 (FR-5.5)
  const hotels = await filterExistingHotelIds(req.hotelIds);
  const { slots } = templateExtractionSchema(template, MODULE_DEFS);
  const slotKeys = slots.map((s) => s.key);

  let extracted: Record<string, Record<string, unknown>> = {};
  let attempt: number | null = null;
  let lastError = "";

  for (const n of [1, 2]) {
    try {
      extracted = await callOnce(template, req, hotels, n === 2 ? lastError : undefined);
      attempt = n;
      await recordAiRun({ request: req.intent, template: template.id, attempt: n, ok: true });
      break;
    } catch (e) {
      lastError = (e as Error).message;
      await recordAiRun({
        request: req.intent,
        template: template.id,
        attempt: n,
        ok: false,
        error: lastError,
      });
    }
  }

  const { blocks, issues } = assemble(template, extracted, slotKeys, MODULE_DEFS);
  if (attempt === null) issues.unshift(`값을 뽑지 못했습니다: ${lastError}`);

  return { page: { schemaVersion: 1, blocks }, attempt, issues };
}
