import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import { MODULE_DEFS } from "@/domain/md/modules";
import { searchModules } from "@/domain/md/search";

// ─── MD 자동화 MCP 서버 ─────────────────────────────────────────────────────
//
// 어드민과 «같은 앱» 안의 route handler 다 (docs/md/mcp.md §2).
// 도구가 MODULE_DEFS 를 직접 import 하므로 검증이 캔버스와 물리적으로 같은 코드가 된다.
//
// S0 는 읽기 전용 1도구로 배관(인증·전송·클라이언트 호환)만 확정한다.
// 여기서 막히면 도구를 아무리 잘 만들어도 소용없다.

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "search_modules",
      {
        title: "MD 모듈 검색",
        description:
          "기획전에 쓸 수 있는 MD 모듈을 찾는다. 요약만 돌려주므로, " +
          "고른 모듈의 전체 필드 정의가 필요하면 get_module 을 부른다. " +
          "읽기 전용이며 아무것도 만들거나 바꾸지 않는다.",
        inputSchema: z.object({
          query: z
            .string()
            .optional()
            .describe("만들려는 기획전의 의도. 예: 오사카 호텔들을 소개하고 예약으로 보내고 싶다"),
          category: z.enum(["헤더", "본문", "푸터"]).optional().describe("페이지에서의 위치"),
          limit: z.number().int().min(1).max(30).default(10).describe("최대 개수"),
        }),
      },
      async ({ query, category, limit }) => {
        const hits = searchModules(MODULE_DEFS, query, category).slice(0, limit ?? 10);
        return {
          content: [
            {
              type: "text",
              text:
                hits.length === 0
                  ? "맞는 모듈이 없습니다. query 를 빼고 다시 부르면 전체 목록을 볼 수 있습니다."
                  : JSON.stringify(hits, null, 2),
            },
          ],
        };
      },
    );
  },
  {
    serverInfo: { name: "md-automation", version: "0.1.0" },
  },
);

/**
 * S0 는 단일 토큰이다. `md_mcp_tokens` 테이블은 M3 에서 붙인다.
 *
 * 토큰 검증을 직접 짜지 않는다 — `withMcpAuth` 가 Bearer 를 파싱하고
 * 401 + WWW-Authenticate 를 규격대로 돌려준다.
 */
const authed = withMcpAuth(
  handler,
  async (_req, bearer) => {
    const expected = process.env.MCP_DEV_TOKEN;
    if (!expected || !bearer || bearer !== expected) return undefined;
    return { token: bearer, scopes: [], clientId: "dev" };
  },
  { required: true },
);

export { authed as GET, authed as POST, authed as DELETE };
