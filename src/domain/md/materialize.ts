import { blockFromDef, type MdBlock } from "./page";
import { findModuleDef } from "./modules";
import { normalizeGroups, isContentField } from "./group";

export interface BlockInput {
  moduleType: string;
  values?: Record<string, unknown>;
  group?: { type: string; id: string };
}

let seq = 0;
const newId = () => `b${Date.now().toString(36)}${(seq++).toString(36)}`;

/** LLM 이 넘긴 블록을 실제 모듈 정의로 다시 세운다 — 임의 필드가 못 들어온다 */
export function materialize(input: BlockInput[]): { blocks: MdBlock[]; skipped: string[] } {
  const skipped: string[] = [];
  const blocks: MdBlock[] = [];

  for (const b of input) {
    const def = findModuleDef(b.moduleType);
    if (!def) {
      skipped.push(b.moduleType);
      continue;
    }
    const base = blockFromDef(def, newId(), b.group);
    const given = b.values ?? {};

    // 샘플은 «이런 모양입니다» 를 보여주는 데모 문구다.
    // 캔버스에서는 사람이 보고 지우니 괜찮지만, MCP 로 만든 초안은 그대로 발행될 수 있다.
    // 히어로 샘플에는 「가을 오사카 특가」와 「지금 예약하면 최대 30% 할인」이 들어 있다 —
    // **아무 근거 없는 할인율이 실제 기획전 문구가 된다.**
    // 그래서 넘어오지 않은 «내용» 칸은 비운다. 모양(preset·fixed) 기본값은 그대로 둔다.
    const values: Record<string, unknown> = { ...base.values };
    for (const f of def.fields) {
      if (f.key in given) continue;
      if (isContentField(f)) delete values[f.key];
    }

    blocks.push({ ...base, values: { ...values, ...given } });
  }

  return { blocks: normalizeGroups(blocks), skipped };
}
