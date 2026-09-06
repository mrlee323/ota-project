import type { MdBlock } from "./page";
import type { ModuleDef } from "./moduleDef";

// ─── 반복 묶음 ──────────────────────────────────────────────────────────────
//
// 실사 F3 — 브랜드형 기획전의 본문은 호텔 한 곳마다 같은 3~4블록이 반복된다.
// 담당자의 조립 단위는 «블록» 이 아니라 «호텔 한 곳» 이다.
//
// 묶음은 **엔티티가 아니라 태그**다 (design.md §5).
// 그룹 모듈(정의가 재귀가 된다)도, 섹션 템플릿(관리 대상이 는다)도 만들지 않는다.
// 계층은 `template → module` 2단계를 유지한다.

export interface Group {
  type: string;
  id: string;
  /** [start, end) */
  start: number;
  end: number;
}

/**
 * 연속 블록을 묶음으로 자른다. `group.id` 가 바뀌는 지점이 경계다.
 *
 * `type` 만으로는 안 된다 — 호텔이 4곳이면 type="hotel" 블록이 12개 연속이라
 * 어디서 끊기는지 알 수 없다.
 */
export function findGroups(blocks: MdBlock[]): Group[] {
  const groups: Group[] = [];
  let cur: Group | null = null;

  blocks.forEach((b, i) => {
    if (!b.group) {
      cur = null;
      return;
    }
    if (cur && cur.id === b.group.id) {
      cur.end = i + 1;
      return;
    }
    cur = { type: b.group.type, id: b.group.id, start: i, end: i + 1 };
    groups.push(cur);
  });

  return groups;
}

/** 담당자에게 보여줄 묶음 종류 — 「호텔 구간 추가」 버튼의 라벨이 여기서 나온다 */
export function groupTypesIn(blocks: MdBlock[]): string[] {
  return [...new Set(findGroups(blocks).map((g) => g.type))];
}

/**
 * 복제할 때 무엇을 비우고 무엇을 남기나.
 *
 * 값을 통째로 복사하면 호텔명이 중복되고, 전부 비우면 모양이 무너진다.
 * **새 규칙을 만들지 않고 모듈 정의의 `input` 과 `freedom` 을 그대로 쓴다.**
 *
 *   비운다  묶음마다 달라야 하는 «내용» — 이미지·링크·호텔, 그리고 자유 입력 문구
 *   남긴다  묶음끼리 같아야 하는 «모양» — 색·숫자, 그리고 preset 선택값
 *
 * `input` 만 보면 안 된다. `cta.style` 은 input="text" 지만 preset 이라 모양 쪽이다 —
 * 이걸 비우면 복제본이 직전 묶음과 다르게 생긴다.
 */
const ALWAYS_CONTENT = new Set(["image", "link", "hotel-refs"]);
const TEXTUAL = new Set(["text", "textarea"]);

function isContent(f: ModuleDef["fields"][number]): boolean {
  if (ALWAYS_CONTENT.has(f.input)) return true;
  // 자유 입력 문구만 내용이다. preset·fixed 는 정해진 값 중 «선택» 이라 모양이다
  return TEXTUAL.has(f.input) && f.freedom === "free";
}

function clearedValues(def: ModuleDef | undefined, values: Record<string, unknown>) {
  if (!def) return { ...values };
  const out: Record<string, unknown> = {};
  for (const f of def.fields) {
    if (isContent(f)) continue;
    if (f.key in values) out[f.key] = values[f.key];
  }
  return out;
}

let counter = 0;
const nextGroupId = () => `g${Date.now().toString(36)}${(counter++).toString(36)}`;
const nextBlockId = () => `b${Date.now().toString(36)}${(counter++).toString(36)}`;

/**
 * 묶음을 복제해 **그 뒤에** 붙인다.
 *
 * 담당자가 보는 결과 — 「직전 호텔과 같은 모양의 빈 칸」이 생긴다.
 */
export function duplicateGroup(
  blocks: MdBlock[],
  groupId: string,
  defs: ModuleDef[],
): MdBlock[] {
  const g = findGroups(blocks).find((x) => x.id === groupId);
  if (!g) return blocks;

  const byType = new Map(defs.map((d) => [d.type, d]));
  const newId = nextGroupId();

  const copies = blocks.slice(g.start, g.end).map((b) => ({
    ...b,
    id: nextBlockId(),
    values: clearedValues(byType.get(b.moduleType), b.values),
    group: { type: g.type, id: newId },
  }));

  return [...blocks.slice(0, g.end), ...copies, ...blocks.slice(g.end)];
}

/** 묶음 하나를 통째로 지운다 */
export function removeGroup(blocks: MdBlock[], groupId: string): MdBlock[] {
  return blocks.filter((b) => b.group?.id !== groupId);
}

/**
 * 흩어진 묶음을 첫 등장 위치로 모은다.
 *
 * **막는 대신 고친다.** 묶음 밖으로 끌어내는 걸 UI 에서 금지하면
 * 드래그·삭제·순서변경마다 예외 처리가 붙는다.
 * 저장 직전에 이 함수를 한 번 돌리면 사용자가 무슨 짓을 해도 데이터가 성립한다.
 */
export function normalizeGroups(blocks: MdBlock[]): MdBlock[] {
  const firstIndex = new Map<string, number>();
  blocks.forEach((b, i) => {
    const id = b.group?.id;
    if (id && !firstIndex.has(id)) firstIndex.set(id, i);
  });

  const out: MdBlock[] = [];
  const placed = new Set<string>();

  blocks.forEach((b, i) => {
    const id = b.group?.id;
    if (!id) {
      out.push(b);
      return;
    }
    if (firstIndex.get(id) !== i) return; // 뒤에 흩어진 것은 여기서 건너뛴다
    if (placed.has(id)) return;
    placed.add(id);
    // 같은 묶음의 블록을 원래 순서대로 한자리에 모은다
    out.push(...blocks.filter((x) => x.group?.id === id));
  });

  return out;
}
