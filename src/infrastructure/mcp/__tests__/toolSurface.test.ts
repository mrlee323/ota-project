import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");
const READ_TOOLS = read("src/infrastructure/mcp/tools.ts");
const WRITE_TOOLS = read("src/infrastructure/mcp/writeTools.ts");
const ALL = READ_TOOLS + WRITE_TOOLS;

/** registerTool("이름", ...) 에서 도구 이름만 뽑는다 */
const toolNames = (src: string) =>
  [...src.matchAll(/registerTool\(\s*"([^"]+)"/g)].map((m) => m[1]);

describe("MCP 도구 표면 — draft-only (mcp.md §4)", () => {
  it("되돌리기 어려운 도구를 만들지 않는다", () => {
    // ① 사람이 UI 에서 한다 ② ChatGPT 안전 검사 통과 조건
    // ③ 프롬프트 인젝션 피해 상한을 «draft 하나» 로 묶는다
    const names = toolNames(ALL);
    for (const banned of ["publish", "unpublish", "delete", "archive", "set_status", "set_period"]) {
      expect(names.some((n) => n.includes(banned)), `${banned} 도구가 생겼다`).toBe(false);
    }
  });

  it("이미지 생성 도구를 만들지 않는다", () => {
    // 비용이 우리 쪽에 남는 유일한 기능이다 (llm.md §4)
    expect(toolNames(ALL).some((n) => n.includes("image"))).toBe(false);
  });

  it("모든 쓰기 도구가 draft-only 를 설명에 명시한다", () => {
    // ChatGPT 웹 커넥터가 쓰기를 막을 때의 해결책이기도 하다 (mcp.md §3)
    const writeNames = toolNames(WRITE_TOOLS);
    expect(writeNames.length).toBeGreaterThan(0);
    expect(WRITE_TOOLS).toContain("초안(draft)만 생성·수정한다");
  });

  it("모든 쓰기 도구가 편집 URL 을 돌려준다", () => {
    // 대화에서 시작하고 캔버스에서 마감한다 (mcp.md §4 원리 ②)
    expect(WRITE_TOOLS).toContain("editUrl");
  });

  it("읽기 도구는 저장 함수를 부르지 않는다", () => {
    for (const banned of ["saveMdPage", "createMdPage", "setMdStatus"]) {
      expect(READ_TOOLS.includes(banned), `읽기 도구가 ${banned} 를 부른다`).toBe(false);
    }
  });

  it("서버가 최종 방어선이다 — 쓰기 전에 validatePage 를 지난다", () => {
    // 클라이언트(호출자 LLM)를 믿지 않는다
    expect(WRITE_TOOLS).toContain("validatePage");
    expect(WRITE_TOOLS).toContain("filterExistingHotelIds");
  });

  it("발행된 기획전은 고치지 못한다", () => {
    expect(WRITE_TOOLS).toContain('row.status !== "draft"');
  });
});
