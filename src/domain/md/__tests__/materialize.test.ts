import { describe, it, expect } from "vitest";
import { materialize } from "@/domain/md/materialize";
import { findModuleDef } from "@/domain/md/modules";
import { isContentField } from "@/domain/md/group";
import { MODULE_DEFS } from "@/domain/md/modules";

// 첫 파일럿에서 나온 사고 — `create_md_draft` 로 「가을 제주 5성급 특가」를 만들었는데
// 히어로에 샘플 문구인 「가을 오사카 특가」와 「최대 30% 할인」이 실려 나왔다.
// 초안은 담당자가 그대로 발행할 수 있으므로, 근거 없는 문구가 실물이 되는 길이었다.

describe("MCP 초안에는 샘플 문구가 실리지 않는다", () => {
  it("값을 안 주면 내용 칸이 비어 있다 — 모양 기본값은 남는다", () => {
    for (const def of MODULE_DEFS) {
      const { blocks } = materialize([{ moduleType: def.type }]);
      const values = blocks[0].values;

      for (const f of def.fields) {
        if (isContentField(f)) {
          expect(values[f.key], `${def.type}.${f.key} 에 샘플이 남았다`).toBeUndefined();
        } else if (def.sample[f.key] !== undefined) {
          expect(values[f.key], `${def.type}.${f.key} 기본값이 사라졌다`).toBe(def.sample[f.key]);
        }
      }
    }
  });

  it("준 값은 그대로 들어간다", () => {
    const { blocks } = materialize([{ moduleType: "hero", values: { title: "가을 제주 5성급 특가" } }]);
    expect(blocks[0].values.title).toBe("가을 제주 5성급 특가");
    expect(blocks[0].values.subtitle).toBeUndefined();
  });

  it("히어로 샘플 자체는 여전히 채워져 있다 — 캔버스 미리보기용이라 지우면 안 된다", () => {
    expect(findModuleDef("hero")!.sample.title).toBeTruthy();
  });
});
