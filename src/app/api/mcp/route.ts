import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { registerReadTools } from "@/infrastructure/mcp/tools";
import { registerWriteTools } from "@/infrastructure/mcp/writeTools";
import {
  verifyMcpToken,
  isRateLimited,
  recordMcpCall,
  readCalledTool,
} from "@/infrastructure/mcp/auth";

// ─── MD 자동화 MCP 서버 ─────────────────────────────────────────────────────
//
// 어드민과 «같은 앱» 안의 route handler 다 (docs/md/mcp.md §2).
// 도구가 MODULE_DEFS 를 직접 import 하므로 검증이 캔버스와 물리적으로 같은 코드가 된다.
//
// 도구 정의는 infrastructure/mcp/ 에 둔다 — 이 파일은 배관만 맡는다.

const handler = createMcpHandler(
  (server) => {
    registerReadTools(server);
    // 쓰기는 draft 만 만든다. publish·delete 도구는 만들지 않는다 (mcp.md §4)
    registerWriteTools(server);
  },
  { serverInfo: { name: "md-automation", version: "1.0.0" } },
);

/**
 * 토큰 검증 → 레이트리밋 → 감사.
 *
 * 검증을 직접 짜지 않는다 — `withMcpAuth` 가 Bearer 파싱과
 * 401 + WWW-Authenticate 를 규격대로 돌려준다. 우리는 «누구인지» 만 판단한다.
 *
 * **감사도 여기서 남긴다.** `onEvent` 훅에는 인증 정보가 없어서
 * (type·method·parameters 뿐) 누가 불렀는지 알 수 없다 —
 * 토큰과 도구 이름을 함께 볼 수 있는 자리는 이곳뿐이다.
 *
 * 상한을 넘으면 «인증 실패» 로 취급한다. 별도 429 경로를 만들려면
 * 핸들러를 감싸야 하고, 그 복잡도가 값을 하지 않는다.
 */
const authed = withMcpAuth(
  handler,
  async (req, bearer) => {
    const id = await verifyMcpToken(bearer);
    if (!id) return undefined;

    const tool = await readCalledTool(req);

    if (await isRateLimited(id.tokenId)) {
      await recordMcpCall({ ...id, tool, ok: false, error: "rate limited" });
      return undefined;
    }

    await recordMcpCall({ ...id, tool, ok: true });

    return { token: bearer ?? "", scopes: [], clientId: id.userId };
  },
  { required: true },
);

export { authed as GET, authed as POST, authed as DELETE };
