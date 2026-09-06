import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { registerReadTools } from "@/infrastructure/mcp/tools";

// ─── MD 자동화 MCP 서버 ─────────────────────────────────────────────────────
//
// 어드민과 «같은 앱» 안의 route handler 다 (docs/md/mcp.md §2).
// 도구가 MODULE_DEFS 를 직접 import 하므로 검증이 캔버스와 물리적으로 같은 코드가 된다.
//
// 도구 정의는 infrastructure/mcp/tools.ts 에 둔다 — 이 파일은 배관만 맡는다.

const handler = createMcpHandler(registerReadTools, {
  serverInfo: { name: "md-automation", version: "0.2.0" },
});

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
