import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { createServiceClient } from "@/infrastructure/supabase/serviceClient";

// ─── MCP 토큰 ───────────────────────────────────────────────────────────────
//
// S0~M2 는 환경변수 토큰 하나로 돌았다 (`MCP_DEV_TOKEN`).
// 그러면 «누가 호출했는지» 를 모르고, 권한을 태울 수 없고,
// 유출됐을 때 그 토큰만 끊을 수도 없다.
//
// 원문은 발급 시 한 번만 보여주고 DB 에는 해시만 둔다 — 유출 경로를 하나 줄인다.

const PREFIX = "mdmcp_";

/** 토큰당 분당 호출 상한. 넘으면 거부한다 */
export const RATE_PER_MINUTE = 60;

const hash = (raw: string) => createHash("sha256").update(raw).digest("hex");

export interface McpIdentity {
  tokenId: string;
  userId: string;
}

/**
 * 토큰을 확인하고 «누구인지» 를 돌려준다.
 *
 * `withMcpAuth` 가 이 결과로 401 여부를 정한다 — 규격 응답은 라이브러리가 만든다.
 * 개발용 환경변수 토큰도 남겨 둔다: DB 가 비어 있어도 스파이크가 계속 돌아야 한다.
 */
export async function verifyMcpToken(raw?: string): Promise<McpIdentity | null> {
  if (!raw) return null;

  // 개발용 단일 토큰 — DB 토큰이 없을 때의 탈출구
  const dev = process.env.MCP_DEV_TOKEN;
  if (dev && raw === dev) return { tokenId: "dev", userId: "dev" };

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("md_mcp_tokens")
    .select("id, user_id, revoked_at")
    .eq("token_hash", hash(raw))
    .maybeSingle();

  const row = data as { id: string; user_id: string; revoked_at: string | null } | null;
  if (!row || row.revoked_at) return null;

  // 마지막 사용 시각은 «이 토큰이 아직 쓰이나» 를 판단하는 유일한 근거다.
  // Supabase 쿼리 빌더는 lazy 하다 — await 하지 않으면 실행되지 않는다
  await supabase
    .from("md_mcp_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", row.id);

  return { tokenId: row.id, userId: row.user_id };
}

/** 분당 상한을 넘었나 */
export async function isRateLimited(tokenId: string): Promise<boolean> {
  if (tokenId === "dev") return false;

  const since = new Date(Date.now() - 60_000).toISOString();
  const { count } = await createServiceClient()
    .from("md_mcp_calls")
    .select("id", { count: "exact", head: true })
    .eq("token_id", tokenId)
    .gte("created_at", since);

  return (count ?? 0) >= RATE_PER_MINUTE;
}

export async function recordMcpCall(call: {
  tokenId: string;
  userId: string;
  tool: string;
  ok: boolean;
  error?: string;
}): Promise<void> {
  if (call.tokenId === "dev") return;
  try {
    await createServiceClient().from("md_mcp_calls").insert({
      token_id: call.tokenId,
      user_id: call.userId,
      tool: call.tool,
      ok: call.ok,
      error: call.error?.slice(0, 300) ?? null,
    });
  } catch {
    // 감사 실패가 호출을 막지 않는다
  }
}

// ─── 발급·폐기 (어드민) ─────────────────────────────────────────────────────

export interface TokenSummary {
  id: string;
  label: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export async function listMcpTokens(userId: string): Promise<TokenSummary[]> {
  const { data } = await createServiceClient()
    .from("md_mcp_tokens")
    .select("id, label, last_used_at, revoked_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    label: String(r.label ?? ""),
    lastUsedAt: (r.last_used_at as string | null) ?? null,
    revokedAt: (r.revoked_at as string | null) ?? null,
    createdAt: String(r.created_at),
  }));
}

/** 발급 — 원문은 여기서만 돌려준다. 다시 볼 수 없다 */
export async function issueMcpToken(
  userId: string,
  label: string,
): Promise<{ token: string; id: string }> {
  const raw = PREFIX + randomBytes(32).toString("base64url");

  const { data, error } = await createServiceClient()
    .from("md_mcp_tokens")
    .insert({ user_id: userId, token_hash: hash(raw), label: label.slice(0, 60) })
    .select("id")
    .single();

  if (error) throw new Error(`토큰 발급 실패: ${error.message}`);
  return { token: raw, id: String((data as { id: string }).id) };
}

export async function revokeMcpToken(userId: string, tokenId: string): Promise<void> {
  const { error } = await createServiceClient()
    .from("md_mcp_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", tokenId)
    // 남의 토큰을 끊을 수 없다
    .eq("user_id", userId);

  if (error) throw new Error(`폐기 실패: ${error.message}`);
}

/**
 * JSON-RPC 본문에서 «무엇을 불렀는지» 를 읽는다.
 *
 * `onEvent` 훅에는 인증 정보가 없어서(type·method·parameters 뿐) 감사를 남길 수 없다.
 * 토큰과 도구 이름을 함께 볼 수 있는 자리는 `verifyToken` 뿐이라 여기서 남긴다 —
 * 본문은 복제해서 읽는다. 원본을 소비하면 핸들러가 못 읽는다.
 */
export async function readCalledTool(req: Request): Promise<string> {
  try {
    const body = (await req.clone().json()) as {
      method?: string;
      params?: { name?: string };
    };
    if (body.method === "tools/call" && body.params?.name) return body.params.name;
    return body.method ?? "unknown";
  } catch {
    return "unknown";
  }
}
