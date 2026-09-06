import "server-only";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";
import { mdPageSchema, validatePage, blockFromDef, type MdBlock, type MdPage } from "@/domain/md/page";
import { MODULE_DEFS, findModuleDef } from "@/domain/md/modules";
import { normalizeGroups, duplicateGroup, removeGroup, findGroups } from "@/domain/md/group";
import { SYSTEM_TEMPLATES } from "@/domain/md/template";
import { createMdPage, getMdPageById, saveMdPage } from "@/infrastructure/md/mdAdminApi";
import { filterExistingHotelIds } from "@/infrastructure/md/hotelLookup";

// ─── MCP 쓰기 도구 — draft 만 만든다 ────────────────────────────────────────
//
// `publish` · `delete` · `archive` · 기간 변경 · 외부 전송 도구를 **만들지 않는다** (mcp.md §4).
//
//   ① 되돌리기 어려운 행위는 사람이 UI 에서 한다
//   ② ChatGPT 안전 검사 통과 조건
//   ③ 프롬프트 인젝션의 피해 상한을 «draft 하나 더 생김» 으로 묶는다
//
// 이미지 생성 도구도 없다 — 비용이 우리 쪽에 남는 유일한 기능이라 (llm.md §4).

const DRAFT_ONLY = "초안(draft)만 생성·수정한다. 발행·삭제·외부 전송은 하지 않는다.";

const json = (v: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(v, null, 2) }] });
const text = (s: string) => ({ content: [{ type: "text" as const, text: s }] });

let seq = 0;
const newId = () => `b${Date.now().toString(36)}${(seq++).toString(36)}`;

const editUrl = (id: string) => `/admin/content/md/${id}`;

/** LLM 이 넘긴 블록을 실제 모듈 정의로 다시 세운다 — 임의 필드가 못 들어온다 */
function materialize(
  input: { moduleType: string; values?: Record<string, unknown>; group?: { type: string; id: string } }[],
): { blocks: MdBlock[]; skipped: string[] } {
  const skipped: string[] = [];
  const blocks: MdBlock[] = [];

  for (const b of input) {
    const def = findModuleDef(b.moduleType);
    if (!def) {
      skipped.push(b.moduleType);
      continue;
    }
    const base = blockFromDef(def, newId(), b.group);
    // 샘플 위에 넘어온 값을 덮는다 — 못 채운 필드는 샘플이 남아 빈 껍데기가 안 된다
    blocks.push({ ...base, values: { ...base.values, ...(b.values ?? {}) } });
  }

  return { blocks: normalizeGroups(blocks), skipped };
}

/** 호텔 id 가 실재하는지 확인하고, 없는 것은 빼낸다 (FR-5.5) */
async function pruneHotels(blocks: MdBlock[]): Promise<{ blocks: MdBlock[]; dropped: string[] }> {
  const dropped: string[] = [];
  const out: MdBlock[] = [];

  for (const b of blocks) {
    if (b.moduleType !== "hotel-card-list" || !Array.isArray(b.values.hotelRefs)) {
      out.push(b);
      continue;
    }
    const asked = b.values.hotelRefs as string[];
    const real = await filterExistingHotelIds(asked);
    dropped.push(...asked.filter((id) => !real.includes(id)));
    out.push({ ...b, values: { ...b.values, hotelRefs: real } });
  }

  return { blocks: out, dropped };
}

const blockInput = z.object({
  moduleType: z.string().describe("search_modules 결과의 type"),
  values: z.record(z.string(), z.unknown()).optional().describe("get_module 의 fields 에 있는 key 만"),
  group: z
    .object({ type: z.string(), id: z.string() })
    .optional()
    .describe("반복 묶음. 같은 id 를 가진 연속 블록이 한 덩어리다"),
});

export function registerWriteTools(server: McpServer): void {
  server.registerTool(
    "validate_md_page",
    {
      title: "구성 검사",
      description:
        `블록 구성이 올바른지 검사만 한다. **아무것도 저장하지 않는다.** ${DRAFT_ONLY} ` +
        "만들기 전에 «이렇게 하면 맞나» 를 확인할 때 쓴다.",
      inputSchema: z.object({ blocks: z.array(blockInput) }),
    },
    async ({ blocks }) => {
      const { blocks: made, skipped } = materialize(blocks);
      const { dropped } = await pruneHotels(made);
      const issues = validatePage({ schemaVersion: 1, blocks: made }, MODULE_DEFS);

      return json({
        ok: issues.length === 0 && skipped.length === 0,
        blockCount: made.length,
        unknownModules: skipped,
        unknownHotels: dropped,
        issues: issues.map((i) => `${i.blockId}: ${i.message}`),
        note: "저장하지 않았습니다.",
      });
    },
  );

  server.registerTool(
    "create_md_draft",
    {
      title: "기획전 초안 만들기",
      description:
        `기획전을 초안으로 만든다. ${DRAFT_ONLY} ` +
        "발행하려면 담당자가 편집 화면에서 확인하고 직접 발행해야 한다. " +
        "templateId 를 주면 그 구성으로 시작하고, blocks 를 주면 그대로 만든다.",
      inputSchema: z.object({
        title: z.string().min(1).max(120).describe("기획전 제목"),
        slug: z
          .string()
          .min(2)
          .max(60)
          .regex(/^[a-z0-9-]+$/)
          .describe("공개 주소. 영문 소문자·숫자·하이픈만"),
        templateId: z.string().optional().describe("suggest_template 결과의 id"),
        blocks: z.array(blockInput).optional().describe("직접 구성할 때"),
      }),
    },
    async ({ title, slug, templateId, blocks }) => {
      let source = blocks;
      if (!source && templateId) {
        const t = SYSTEM_TEMPLATES.find((x) => x.id === templateId);
        if (!t) return text(`「${templateId}」 구성이 없습니다. suggest_template 로 확인하세요.`);
        source = t.blocks.map((b) => ({ moduleType: b.moduleType, values: b.values, group: b.group }));
      }
      if (!source?.length) return text("templateId 나 blocks 중 하나는 있어야 합니다.");

      const { blocks: made, skipped } = materialize(source);
      const { blocks: pruned, dropped } = await pruneHotels(made);
      const page: MdPage = mdPageSchema.parse({ schemaVersion: 1, blocks: pruned });

      // 서버가 최종 방어선이다 — 캔버스와 같은 검증을 지난다
      const issues = validatePage(page, MODULE_DEFS);
      if (issues.length > 0) {
        return json({
          created: false,
          error: "채우지 않은 항목이 있어 만들지 못했습니다.",
          issues: issues.map((i) => `${i.blockId}: ${i.message}`),
        });
      }

      try {
        const { id } = await createMdPage({ slug, title, page });
        return json({
          created: true,
          pageId: id,
          editUrl: editUrl(id),
          status: "draft",
          unknownModules: skipped,
          unknownHotels: dropped,
          note: "초안으로 만들었습니다. 편집 화면에서 확인하고 담당자가 발행하세요.",
        });
      } catch (e) {
        return text(`만들지 못했습니다: ${(e as Error).message}`);
      }
    },
  );

  server.registerTool(
    "update_md_draft",
    {
      title: "초안 수정",
      description:
        `이미 있는 초안의 블록을 고친다. ${DRAFT_ONLY} ` +
        "발행된 기획전은 고칠 수 없다 — 담당자가 먼저 발행을 취소해야 한다.",
      inputSchema: z.object({
        pageId: z.string().describe("create_md_draft 또는 list_md_pages 의 id"),
        ops: z
          .array(
            z.union([
              z.object({ op: z.literal("setTitle"), title: z.string().min(1).max(120) }),
              z.object({ op: z.literal("replaceBlocks"), blocks: z.array(blockInput) }),
              z.object({ op: z.literal("appendBlocks"), blocks: z.array(blockInput) }),
              z.object({ op: z.literal("setValues"), blockId: z.string(), values: z.record(z.string(), z.unknown()) }),
              z.object({ op: z.literal("removeBlock"), blockId: z.string() }),
              z.object({ op: z.literal("addGroup"), groupId: z.string().describe("복제할 묶음 id") }),
              z.object({ op: z.literal("removeGroup"), groupId: z.string() }),
            ]),
          )
          .min(1),
      }),
    },
    async ({ pageId, ops }) => {
      const row = await getMdPageById(pageId);
      if (!row) return text("그 기획전을 찾을 수 없습니다.");
      if (row.status !== "draft") {
        return text(
          `「${row.title}」은(는) ${row.status === "published" ? "발행됨" : "보관됨"} 상태라 고칠 수 없습니다. ` +
            `담당자가 ${editUrl(pageId)} 에서 먼저 되돌려야 합니다.`,
        );
      }

      let blocks = row.page.blocks;
      let title = row.title;
      const skipped: string[] = [];

      for (const op of ops) {
        switch (op.op) {
          case "setTitle":
            title = op.title;
            break;
          case "replaceBlocks": {
            const m = materialize(op.blocks);
            blocks = m.blocks;
            skipped.push(...m.skipped);
            break;
          }
          case "appendBlocks": {
            const m = materialize(op.blocks);
            blocks = normalizeGroups([...blocks, ...m.blocks]);
            skipped.push(...m.skipped);
            break;
          }
          case "setValues":
            blocks = blocks.map((b) =>
              b.id === op.blockId ? { ...b, values: { ...b.values, ...op.values } } : b,
            );
            break;
          case "removeBlock":
            blocks = blocks.filter((b) => b.id !== op.blockId);
            break;
          case "addGroup":
            blocks = duplicateGroup(blocks, op.groupId, MODULE_DEFS);
            break;
          case "removeGroup":
            blocks = removeGroup(blocks, op.groupId);
            break;
        }
      }

      const pruned = await pruneHotels(normalizeGroups(blocks));
      const page: MdPage = { schemaVersion: 1, blocks: pruned.blocks };

      const issues = validatePage(page, MODULE_DEFS);
      if (issues.length > 0) {
        return json({
          updated: false,
          error: "고친 결과에 채우지 않은 항목이 있어 저장하지 않았습니다.",
          issues: issues.map((i) => `${i.blockId}: ${i.message}`),
        });
      }

      try {
        await saveMdPage(pageId, page, title);
        return json({
          updated: true,
          pageId,
          editUrl: editUrl(pageId),
          blockCount: page.blocks.length,
          groups: findGroups(page.blocks).map((g) => ({ type: g.type, id: g.id })),
          unknownModules: skipped,
          unknownHotels: pruned.dropped,
          note: "초안을 고쳤습니다. 발행은 담당자가 편집 화면에서 합니다.",
        });
      } catch (e) {
        return text(`저장하지 못했습니다: ${(e as Error).message}`);
      }
    },
  );
}
