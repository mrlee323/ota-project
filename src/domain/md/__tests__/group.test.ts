import { describe, it, expect } from "vitest";
import { findGroups, duplicateGroup, removeGroup, normalizeGroups, groupTypesIn } from "../group";
import { MODULE_DEFS } from "../modules";
import type { MdBlock } from "../page";

const blk = (id: string, moduleType: string, values = {}, group?: MdBlock["group"]): MdBlock => ({
  id, moduleType, moduleVersion: 1, values, ...(group ? { group } : {}),
});

const g = (id: string) => ({ type: "hotel", id });

/** hero → [호텔1 3블록] → [호텔2 3블록] → notes */
const page = (): MdBlock[] => [
  blk("h", "hero"),
  blk("a1", "image", { imageUrl: "https://x/1.png", alt: "호텔1" }, g("g1")),
  blk("a2", "image", { imageUrl: "https://x/2.png", alt: "설명" }, g("g1")),
  blk("a3", "cta", { label: "예약", link: "/1", style: "primary" }, g("g1")),
  blk("b1", "image", { imageUrl: "https://x/3.png", alt: "호텔2" }, g("g2")),
  blk("b2", "cta", { label: "예약", link: "/2", style: "secondary" }, g("g2")),
  blk("n", "notes"),
];

describe("findGroups", () => {
  it("group.id 가 바뀌는 지점을 경계로 자른다", () => {
    // type 만으로는 안 된다 — 여기서 type="hotel" 블록은 5개 연속이다
    expect(findGroups(page())).toEqual([
      { type: "hotel", id: "g1", start: 1, end: 4 },
      { type: "hotel", id: "g2", start: 4, end: 6 },
    ]);
  });

  it("묶음이 없으면 빈 배열", () => {
    expect(findGroups([blk("h", "hero")])).toEqual([]);
  });

  it("묶음 종류를 중복 없이 뽑는다 — 버튼 라벨용", () => {
    expect(groupTypesIn(page())).toEqual(["hotel"]);
  });
});

describe("duplicateGroup", () => {
  const dup = () => duplicateGroup(page(), "g1", MODULE_DEFS);

  it("묶음 «바로 뒤» 에 붙는다", () => {
    expect(dup().map((b) => b.moduleType)).toEqual([
      "hero",
      "image", "image", "cta", // g1
      "image", "image", "cta", // 복제본
      "image", "cta",          // g2
      "notes",
    ]);
  });

  it("새 group id 를 받는다 — 원본과 섞이지 않는다", () => {
    const groups = findGroups(dup());
    expect(groups).toHaveLength(3);
    expect(new Set(groups.map((x) => x.id)).size).toBe(3);
  });

  it("콘텐츠는 비우고 스타일은 남긴다", () => {
    const copies = dup().slice(4, 7);
    // 이미지·문구·링크는 묶음마다 달라야 하므로 비운다
    expect(copies[0].values).not.toHaveProperty("imageUrl");
    expect(copies[2].values).not.toHaveProperty("label");
    // 배치·색은 묶음끼리 같아야 하므로 남긴다 — 「직전과 같은 모양의 빈 칸」
    expect(copies[2].values.style).toBe("primary");
  });

  it("블록 id 가 새로 발급된다", () => {
    const all = dup().map((b) => b.id);
    expect(new Set(all).size).toBe(all.length);
  });

  it("없는 묶음이면 원본을 그대로 돌려준다", () => {
    const before = page();
    expect(duplicateGroup(before, "없는묶음", MODULE_DEFS)).toEqual(before);
  });
});

describe("removeGroup", () => {
  it("묶음을 통째로 지운다", () => {
    expect(removeGroup(page(), "g1").map((b) => b.id)).toEqual(["h", "b1", "b2", "n"]);
  });
});

describe("normalizeGroups", () => {
  it("흩어진 묶음을 첫 등장 위치로 모은다", () => {
    // 사용자가 g1 의 마지막 블록을 맨 뒤로 끌어냈다고 하자
    const messy = [
      blk("h", "hero"),
      blk("a1", "image", {}, g("g1")),
      blk("a2", "image", {}, g("g1")),
      blk("n", "notes"),
      blk("a3", "cta", {}, g("g1")),
    ];
    // 막지 않는다 — 저장 직전에 고친다
    expect(normalizeGroups(messy).map((b) => b.id)).toEqual(["h", "a1", "a2", "a3", "n"]);
    expect(findGroups(normalizeGroups(messy))).toEqual([
      { type: "hotel", id: "g1", start: 1, end: 4 },
    ]);
  });

  it("이미 정상이면 그대로 둔다", () => {
    const before = page();
    expect(normalizeGroups(before)).toEqual(before);
  });

  it("묶음 블록이 하나만 남아도 그대로 둔다", () => {
    // 묶음이 1블록일 수도 있다 — 별도 처리를 하지 않는다
    const one = [blk("h", "hero"), blk("a1", "image", {}, g("g1"))];
    expect(normalizeGroups(one)).toEqual(one);
  });
});
