import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { createServiceClient } from "@/infrastructure/supabase/serviceClient";
import {
  ACCESS_TTL_MS,
  CODE_TTL_MS,
  REFRESH_TTL_MS,
  isRegisteredRedirect,
  verifyPkce,
} from "@/domain/auth/oauth";

// ─── OAuth 저장소 ───────────────────────────────────────────────────────────
//
// 원문은 어디에도 남기지 않는다 — 코드도 토큰도 해시만 둔다.
// verifyMcpToken 과 같은 해시 함수를 쓴다 (auth.ts).

const sha256 = (raw: string) => createHash("sha256").update(raw).digest("hex");

/** PKCE 의 S256 은 base64url 이다 — 저장용 해시와 인코딩이 다르다 */
export const sha256Base64Url = (raw: string) =>
  createHash("sha256").update(raw).digest("base64url");

export interface OAuthClient {
  clientId: string;
  clientName: string;
  redirectUris: string[];
}

export async function registerClient(
  clientName: string,
  redirectUris: string[],
): Promise<OAuthClient> {
  const clientId = randomUUID();
  const { error } = await createServiceClient().from("md_oauth_clients").insert({
    client_id: clientId,
    client_name: clientName.slice(0, 120),
    redirect_uris: redirectUris,
  });
  if (error) throw new Error(`클라이언트 등록 실패: ${error.message}`);
  return { clientId, clientName, redirectUris };
}

export async function getClient(clientId: string): Promise<OAuthClient | null> {
  const { data } = await createServiceClient()
    .from("md_oauth_clients")
    .select("client_id, client_name, redirect_uris")
    .eq("client_id", clientId)
    .maybeSingle();

  const row = data as { client_id: string; client_name: string; redirect_uris: string[] } | null;
  return row
    ? { clientId: row.client_id, clientName: row.client_name, redirectUris: row.redirect_uris ?? [] }
    : null;
}

/**
 * 인가 코드를 만든다. 로그인을 이미 통과한 뒤에만 불린다 —
 * «누구인지» 는 여기서 정해져서 코드에 묶인다.
 */
export async function issueCode(input: {
  clientId: string;
  userId: string;
  redirectUri: string;
  codeChallenge: string;
  resource?: string;
}): Promise<string> {
  const code = randomBytes(32).toString("base64url");
  const { error } = await createServiceClient().from("md_oauth_codes").insert({
    code_hash: sha256(code),
    client_id: input.clientId,
    user_id: input.userId,
    redirect_uri: input.redirectUri,
    code_challenge: input.codeChallenge,
    resource: input.resource ?? null,
    expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
  });
  if (error) throw new Error(`코드 발급 실패: ${error.message}`);
  return code;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * 코드를 토큰으로 바꾼다.
 *
 * 실패 사유를 호출자에게 자세히 알려주지 않는다 — «코드가 틀렸나 PKCE 가
 * 틀렸나» 를 구별해 주면 공격자에게 단서가 된다. 하나로 뭉뚱그린다.
 */
export async function exchangeCode(input: {
  code: string;
  clientId: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<TokenPair | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("md_oauth_codes")
    .select("id, client_id, user_id, redirect_uri, code_challenge, expires_at, used_at")
    .eq("code_hash", sha256(input.code))
    .maybeSingle();

  const row = data as {
    id: string;
    client_id: string;
    user_id: string;
    redirect_uri: string;
    code_challenge: string;
    expires_at: string;
    used_at: string | null;
  } | null;

  if (!row) return null;

  // 한 번 쓴 코드는 재사용할 수 없다. 재사용 시도 자체가 유출 신호다
  if (row.used_at) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  if (row.client_id !== input.clientId) return null;
  if (row.redirect_uri !== input.redirectUri) return null;
  if (!verifyPkce(input.codeVerifier, row.code_challenge, sha256Base64Url)) return null;

  // 검사를 다 지난 뒤에 소비한다 — Supabase 쿼리 빌더는 lazy 하다, await 해야 실행된다
  await supabase
    .from("md_oauth_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("id", row.id);

  const client = await getClient(row.client_id);
  return issueTokens(row.user_id, row.client_id, client?.clientName || "AI 도구");
}

/** 토큰 한 쌍을 만들어 md_mcp_tokens 에 «연결» 한 줄로 남긴다 */
async function issueTokens(
  userId: string,
  clientId: string,
  label: string,
): Promise<TokenPair> {
  const accessToken = `mdmcp_${randomBytes(32).toString("base64url")}`;
  const refreshToken = `mdrfr_${randomBytes(32).toString("base64url")}`;
  const now = Date.now();

  const { error } = await createServiceClient().from("md_mcp_tokens").insert({
    user_id: userId,
    token_hash: sha256(accessToken),
    label: label.slice(0, 60),
    client_id: clientId,
    expires_at: new Date(now + ACCESS_TTL_MS).toISOString(),
    refresh_token_hash: sha256(refreshToken),
    refresh_expires_at: new Date(now + REFRESH_TTL_MS).toISOString(),
  });
  if (error) throw new Error(`토큰 발급 실패: ${error.message}`);

  return { accessToken, refreshToken, expiresIn: Math.floor(ACCESS_TTL_MS / 1000) };
}

/**
 * refresh — **행을 새로 만들지 않는다.**
 *
 * 같은 행의 해시만 갈아끼워야 md_mcp_calls 의 감사가 한 연결로 이어지고,
 * 어드민 목록에도 연결 하나가 하나로 보인다.
 */
export async function refreshTokens(
  refreshToken: string,
  clientId: string,
): Promise<TokenPair | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("md_mcp_tokens")
    .select("id, user_id, client_id, refresh_expires_at, revoked_at")
    .eq("refresh_token_hash", sha256(refreshToken))
    .maybeSingle();

  const row = data as {
    id: string;
    user_id: string;
    client_id: string | null;
    refresh_expires_at: string | null;
    revoked_at: string | null;
  } | null;

  if (!row || row.revoked_at) return null;
  if (row.client_id !== clientId) return null;
  if (!row.refresh_expires_at || new Date(row.refresh_expires_at).getTime() < Date.now()) return null;

  const accessToken = `mdmcp_${randomBytes(32).toString("base64url")}`;
  const nextRefresh = `mdrfr_${randomBytes(32).toString("base64url")}`;
  const now = Date.now();

  const { error } = await supabase
    .from("md_mcp_tokens")
    .update({
      token_hash: sha256(accessToken),
      expires_at: new Date(now + ACCESS_TTL_MS).toISOString(),
      // 회전시킨다 — 쓰고 난 refresh 는 더 이상 통하지 않는다
      refresh_token_hash: sha256(nextRefresh),
      refresh_expires_at: new Date(now + REFRESH_TTL_MS).toISOString(),
    })
    .eq("id", row.id);

  if (error) return null;
  return { accessToken, refreshToken: nextRefresh, expiresIn: Math.floor(ACCESS_TTL_MS / 1000) };
}

export { isRegisteredRedirect };
