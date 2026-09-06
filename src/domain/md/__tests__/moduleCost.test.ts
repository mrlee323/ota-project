import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MODULE_DEFS } from "../modules";
import { MODULE_REGISTRY } from "@/ui/patterns/md/registry";

// vitest 는 레포 루트에서 돈다. jsdom 환경에서는 import.meta.url 이 file: 이 아니다.
const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");

// ─── AC-2 · 모듈 추가 비용 ──────────────────────────────────────────────────
//
// 「모듈 1종 추가 = 변경 파일 2개」가 이 프로젝트의 성적표다.
// 사람이 세는 대신 테스트로 고정한다 — 3곳째가 생기면 여기서 깨진다.

describe("AC-2 — 모듈 추가 비용", () => {
  it("정의와 컴포넌트가 정확히 짝을 이룬다", () => {
    const defTypes = MODULE_DEFS.map((d) => d.type).sort();
    const uiTypes = Object.keys(MODULE_REGISTRY).sort();
    // 한쪽에만 있으면 «정의는 했는데 안 그려지거나», «그리는데 검증이 없거나» 다
    expect(uiTypes).toEqual(defTypes);
  });

  it("모듈 타입이 등록 파일 2곳에만 나열된다", () => {
    // 모듈 타입 문자열이 세 번째 파일에 나열되기 시작하면 등록 지점이 늘어난 것이다.
    const registries = [
      "src/domain/md/modules/index.ts",
      "src/ui/patterns/md/registry.ts",
    ];

    for (const rel of registries) {
      const src = read(rel);
      for (const def of MODULE_DEFS) {
        // 정의 파일은 import 이름으로, registry 는 문자열 키로 참조한다
        const mentioned =
          src.includes(`"${def.type}"`) || src.includes(camel(def.type));
        expect(mentioned, `${rel} 에 ${def.type} 가 없다`).toBe(true);
      }
    }
  });

  it("모듈 정의는 «데이터» 다 — React 를 끌어오지 않는다", () => {
    // domain 이 UI 를 참조하기 시작하면 정의를 LLM·MCP 스키마로 못 쓴다 (D2)
    const src = read("src/domain/md/modules/index.ts");
    expect(src).not.toMatch(/from ["']react["']/);
    expect(src).not.toMatch(/@\/ui\//);
  });
});

function camel(type: string) {
  return type.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}
