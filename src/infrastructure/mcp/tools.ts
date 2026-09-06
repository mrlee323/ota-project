import "server-only";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";
import { MODULE_DEFS, findModuleDef } from "@/domain/md/modules";
import { searchModules } from "@/domain/md/search";
import { suggestTemplates } from "@/domain/md/suggest";
import { SYSTEM_TEMPLATES } from "@/domain/md/template";
import { tokens } from "@ds/design-system";
import { listMdPages, getMdPageById } from "@/infrastructure/md/mdAdminApi";
import { searchHotelsForMd } from "@/infrastructure/md/hotelLookup";

// ─── MCP 읽기 도구 ──────────────────────────────────────────────────────────
//
// 도구를 route 파일에 몰아넣지 않는다. 도구가 늘면 그 파일만 비대해지고,
// «모듈 추가 = 2곳» 같은 규율이 도구에는 없어서 금방 흐트러진다.
//
// 모든 도구가 읽기 전용이다. 쓰기는 M2 에서, draft 만 만든다 (mcp.md §4).

const json = (v: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(v, null, 2) }] });
const text = (s: string) => ({ content: [{ type: "text" as const, text: s }] });

export function registerReadTools(server: McpServer): void {
  // ── 모듈 고르기 ───────────────────────────────────────────────────────────

  server.registerTool(
    "search_modules",
    {
      title: "MD 모듈 검색",
      description:
        "기획전에 쓸 수 있는 MD 모듈을 찾는다. 요약만 돌려주므로, " +
        "고른 모듈의 전체 필드 정의가 필요하면 get_module 을 부른다. " +
        "읽기 전용이며 아무것도 만들거나 바꾸지 않는다.",
      inputSchema: z.object({
        query: z.string().optional().describe("만들려는 기획전의 의도. 예: 숙소를 나열하고 예약으로 보내고 싶다"),
        category: z.enum(["헤더", "본문", "푸터"]).optional().describe("페이지에서의 위치"),
        limit: z.number().int().min(1).max(30).default(10),
      }),
    },
    async ({ query, category, limit }) => {
      const hits = searchModules(MODULE_DEFS, query, category).slice(0, limit ?? 10);
      return hits.length === 0
        ? text("맞는 모듈이 없습니다. query 를 빼고 다시 부르면 전체 목록을 볼 수 있습니다.")
        : json(hits);
    },
  );

  server.registerTool(
    "get_module",
    {
      title: "모듈 정의 조회",
      description:
        "모듈 하나의 전체 정의를 준다 — 필드 목록, 각 필드의 입력 방식과 설명, 자유도, 샘플 값. " +
        "블록을 만들기 전에 어떤 값이 필요한지 확인할 때 쓴다. 읽기 전용이다.",
      inputSchema: z.object({
        type: z.string().describe("모듈 타입. search_modules 결과의 type 값"),
      }),
    },
    async ({ type }) => {
      const def = findModuleDef(type);
      return def
        ? json(def)
        : text(`「${type}」 모듈이 없습니다. search_modules 로 사용 가능한 모듈을 확인하세요.`);
    },
  );

  // ── 구성 고르기 ───────────────────────────────────────────────────────────

  server.registerTool(
    "suggest_template",
    {
      title: "구성 추천",
      description:
        "만들려는 기획전의 의도를 받아 어떤 구성(템플릿)이 맞는지 추천한다. " +
        "각 후보에 «왜 이걸 추천하는지» 와 블록 구성이 함께 온다. " +
        "무엇을 만들지만 정해졌고 어떻게 조립할지 모를 때 가장 먼저 부른다. 읽기 전용이다.",
      inputSchema: z.object({
        intent: z.string().describe("무엇을 파는 기획전인가. 예: 가을 오사카 4성급 호텔 특가"),
        hotelCount: z.number().int().min(0).max(100).optional().describe("소개할 숙소 수. 알면 추천이 정확해진다"),
      }),
    },
    async ({ intent, hotelCount }) => json(suggestTemplates(intent, SYSTEM_TEMPLATES, { hotelCount })),
  );

  server.registerTool(
    "get_design_context",
    {
      title: "디자인 토큰 조회",
      description:
        "쓸 수 있는 색과 글자 스타일을 준다. 색은 대부분 토큰에서 골라야 하고, " +
        "자유 입력이 허용되는 것은 구간 배경색뿐이다. 값을 채우기 전에 확인한다. 읽기 전용이다.",
      inputSchema: z.object({}),
    },
    async () =>
      json({
        color: tokens.color,
        text: Object.keys(tokens.text).filter((k) => !k.startsWith("$")),
        freeformOnly: ["sectionBgColor"],
        note: "색은 토큰 «이름» 으로 저장한다. 구간 배경색만 #RRGGBB 자유 입력이다.",
      }),
  );

  // ── 실제 데이터 ───────────────────────────────────────────────────────────

  server.registerTool(
    "search_hotels",
    {
      title: "호텔 검색",
      description:
        "기획전에 넣을 호텔을 찾는다. **여기서 나온 id 만 쓸 수 있다** — " +
        "목록에 없는 호텔을 만들어내면 저장이 거부된다. 읽기 전용이다.",
      inputSchema: z.object({
        keyword: z.string().optional().describe("호텔명이나 지역. 예: 제주, 워커힐"),
        minStars: z.number().int().min(1).max(5).optional(),
        limit: z.number().int().min(1).max(30).default(10),
      }),
    },
    async ({ keyword, minStars, limit }) => {
      const hits = await searchHotelsForMd({ keyword, minStars, limit: limit ?? 10 });
      return hits.length === 0 ? text("조건에 맞는 호텔이 없습니다.") : json(hits);
    },
  );

  // ── 기존 MD ───────────────────────────────────────────────────────────────

  server.registerTool(
    "list_md_pages",
    {
      title: "기획전 목록",
      description: "이미 만들어진 기획전 목록을 준다. 상태와 공개 주소가 함께 온다. 읽기 전용이다.",
      inputSchema: z.object({ limit: z.number().int().min(1).max(50).default(20) }),
    },
    async ({ limit }) => json((await listMdPages()).slice(0, limit ?? 20)),
  );

  server.registerTool(
    "get_md_page",
    {
      title: "기획전 구성 조회",
      description:
        "기획전 하나의 블록 구성을 준다. 기존 기획전을 참고해 새로 만들 때 쓴다. 읽기 전용이다.",
      inputSchema: z.object({ pageId: z.string().describe("list_md_pages 결과의 id") }),
    },
    async ({ pageId }) => {
      const row = await getMdPageById(pageId);
      if (!row) return text("그 기획전을 찾을 수 없습니다.");
      return json({
        id: row.id,
        slug: row.slug,
        title: row.title,
        status: row.status,
        blocks: row.page.blocks.map((b) => ({
          id: b.id,
          moduleType: b.moduleType,
          group: b.group,
          values: b.values,
        })),
      });
    },
  );
}
