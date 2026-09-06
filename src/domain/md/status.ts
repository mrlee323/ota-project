import { z } from "zod";
import type { MdPage } from "./page";
import { validatePage } from "./page";
import type { ModuleDef } from "./moduleDef";

// ─── 발행 상태 ──────────────────────────────────────────────────────────────

export const mdStatusSchema = z.enum(["draft", "published", "archived"]);
export type MdStatus = z.infer<typeof mdStatusSchema>;

export const STATUS_LABEL: Record<MdStatus, string> = {
  draft: "작성 중",
  published: "발행됨",
  archived: "보관됨",
};

/** 담당자가 누를 수 있는 행위 */
export const mdActionSchema = z.enum(["publish", "unpublish", "archive", "restore"]);
export type MdAction = z.infer<typeof mdActionSchema>;

export const ACTION_LABEL: Record<MdAction, string> = {
  publish: "발행",
  unpublish: "발행 취소",
  archive: "보관",
  restore: "작성 중으로",
};

/**
 * 상태 전이 표.
 *
 * 되돌릴 수 있게 짠다 — 잘못 발행했을 때 되돌릴 길이 없으면
 * 담당자가 발행 버튼을 무서워하고, 그러면 도구를 안 쓴다.
 */
const TRANSITIONS: Record<MdStatus, MdAction[]> = {
  draft: ["publish", "archive"],
  published: ["unpublish", "archive"],
  archived: ["restore"],
};

const NEXT: Record<MdAction, MdStatus> = {
  publish: "published",
  unpublish: "draft",
  archive: "archived",
  restore: "draft",
};

export function allowedActions(status: MdStatus): MdAction[] {
  return TRANSITIONS[status];
}

export function nextStatus(status: MdStatus, action: MdAction): MdStatus | null {
  return TRANSITIONS[status].includes(action) ? NEXT[action] : null;
}

// ─── 발행 가능 여부 ─────────────────────────────────────────────────────────

export interface PublishInput {
  page: MdPage;
  startsAt: string | null;
  endsAt: string | null;
}

export type PublishBlocker = { reason: string };

/**
 * 발행을 막는 이유를 모두 모은다.
 *
 * 저장(FR-2.5)보다 기준이 높다 — 저장은 «작성 중» 이라 비어 있어도 되지만,
 * 발행은 사람이 보는 화면이 된다.
 */
export function publishBlockers(input: PublishInput, defs: ModuleDef[]): PublishBlocker[] {
  const out: PublishBlocker[] = [];

  if (input.page.blocks.length === 0) {
    out.push({ reason: "블록이 하나도 없습니다" });
  }

  const issues = validatePage(input.page, defs);
  if (issues.length > 0) {
    out.push({ reason: `채우지 않은 항목이 ${issues.length}개 있습니다` });
  }

  // 실사 F2 — 표본 6/6 전부에 유의사항이 있었다. 법적 고지라 빠지면 안 된다
  if (!input.page.blocks.some((b) => b.moduleType === "notes")) {
    out.push({ reason: "유의사항 블록이 없습니다" });
  }

  if (input.startsAt && input.endsAt && input.startsAt >= input.endsAt) {
    out.push({ reason: "종료일이 시작일보다 빠릅니다" });
  }

  return out;
}

/**
 * 지금 공개되는 상태인가.
 *
 * 상태와 기간을 «함께» 본다 — 발행했어도 기간 밖이면 안 보인다 (FR-4.3).
 */
export function isVisibleNow(
  status: MdStatus,
  startsAt: string | null,
  endsAt: string | null,
  now: Date = new Date(),
): boolean {
  if (status !== "published") return false;
  const t = now.toISOString();
  if (startsAt && startsAt > t) return false;
  if (endsAt && endsAt < t) return false;
  return true;
}

/** 담당자에게 보여줄 한 줄 — «발행됨» 만으로는 지금 보이는지 알 수 없다 */
export function visibilityNote(
  status: MdStatus,
  startsAt: string | null,
  endsAt: string | null,
  now: Date = new Date(),
): string {
  if (status === "archived") return "보관됨 — 공개되지 않습니다";
  if (status === "draft") return "작성 중 — 공개되지 않습니다";
  const t = now.toISOString();
  if (startsAt && startsAt > t) return "발행됨 — 노출 시작 전입니다";
  if (endsAt && endsAt < t) return "발행됨 — 노출 기간이 끝났습니다";
  return "공개 중";
}
