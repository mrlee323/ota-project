import { describe, it, expect } from "vitest";
import {
  allowedActions, nextStatus, publishBlockers, isVisibleNow, visibilityNote,
} from "../status";
import { MODULE_DEFS } from "../modules";
import { blockFromDef, type MdPage } from "../page";
import { hero } from "../modules/hero";
import { notes } from "../modules/notes";

const page = (types: { def: typeof hero; id: string }[]): MdPage => ({
  schemaVersion: 1,
  blocks: types.map((t) => blockFromDef(t.def, t.id)),
});

const ok = () => page([{ def: hero, id: "h" }, { def: notes, id: "n" }]);

describe("상태 전이", () => {
  it("모든 상태에서 되돌릴 길이 있다", () => {
    // 잘못 발행했을 때 되돌릴 수 없으면 담당자가 발행 버튼을 무서워한다
    expect(allowedActions("published")).toContain("unpublish");
    expect(allowedActions("archived")).toContain("restore");
  });

  it("허용되지 않은 전이는 null 을 준다", () => {
    expect(nextStatus("draft", "publish")).toBe("published");
    expect(nextStatus("draft", "unpublish")).toBeNull();
    expect(nextStatus("archived", "publish")).toBeNull();
  });
});

describe("publishBlockers", () => {
  it("정상 페이지는 막지 않는다", () => {
    expect(publishBlockers({ page: ok(), startsAt: null, endsAt: null }, MODULE_DEFS)).toEqual([]);
  });

  it("빈 페이지는 막는다", () => {
    const blockers = publishBlockers(
      { page: { schemaVersion: 1, blocks: [] }, startsAt: null, endsAt: null },
      MODULE_DEFS,
    );
    expect(blockers.length).toBeGreaterThan(0);
  });

  it("유의사항이 없으면 막는다", () => {
    // 실사 F2 — 표본 6/6 전부에 있었다. 법적 고지라 빠지면 안 된다
    const blockers = publishBlockers(
      { page: page([{ def: hero, id: "h" }]), startsAt: null, endsAt: null },
      MODULE_DEFS,
    );
    expect(blockers.some((b) => b.reason.includes("유의사항"))).toBe(true);
  });

  it("필수 필드가 비면 막는다", () => {
    const p = ok();
    p.blocks[0] = { ...p.blocks[0], values: {} };
    expect(publishBlockers({ page: p, startsAt: null, endsAt: null }, MODULE_DEFS).length).toBeGreaterThan(0);
  });

  it("종료일이 시작일보다 빠르면 막는다", () => {
    const blockers = publishBlockers(
      { page: ok(), startsAt: "2026-10-01T00:00:00.000Z", endsAt: "2026-09-01T00:00:00.000Z" },
      MODULE_DEFS,
    );
    expect(blockers.some((b) => b.reason.includes("종료일"))).toBe(true);
  });

  it("막는 이유를 «전부» 모은다 — 하나 고치면 다음 게 나오는 식이 아니다", () => {
    const blockers = publishBlockers(
      { page: { schemaVersion: 1, blocks: [] }, startsAt: "2026-10-01T00:00:00.000Z", endsAt: "2026-09-01T00:00:00.000Z" },
      MODULE_DEFS,
    );
    expect(blockers.length).toBeGreaterThanOrEqual(3);
  });
});

describe("isVisibleNow — 상태와 기간을 함께 본다", () => {
  const now = new Date("2026-09-15T00:00:00.000Z");

  it("발행 전에는 안 보인다", () => {
    expect(isVisibleNow("draft", null, null, now)).toBe(false);
  });

  it("발행했어도 시작 전이면 안 보인다", () => {
    expect(isVisibleNow("published", "2026-10-01T00:00:00.000Z", null, now)).toBe(false);
  });

  it("발행했어도 기간이 끝났으면 안 보인다", () => {
    expect(isVisibleNow("published", null, "2026-09-01T00:00:00.000Z", now)).toBe(false);
  });

  it("기간 안이면 보인다", () => {
    expect(isVisibleNow("published", "2026-09-01T00:00:00.000Z", "2026-09-30T00:00:00.000Z", now)).toBe(true);
  });

  it("기간을 안 정하면 계속 보인다", () => {
    expect(isVisibleNow("published", null, null, now)).toBe(true);
  });
});

describe("visibilityNote — «발행됨» 만으로는 지금 보이는지 알 수 없다", () => {
  const now = new Date("2026-09-15T00:00:00.000Z");
  it("기간 밖이면 그 이유를 알려준다", () => {
    expect(visibilityNote("published", "2026-10-01T00:00:00.000Z", null, now)).toContain("시작 전");
    expect(visibilityNote("published", null, "2026-09-01T00:00:00.000Z", now)).toContain("끝났");
    expect(visibilityNote("published", null, null, now)).toBe("공개 중");
  });
});
