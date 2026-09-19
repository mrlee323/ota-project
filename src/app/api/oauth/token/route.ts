import { NextResponse } from "next/server";
import { SCOPE } from "@/domain/auth/oauth";
import { exchangeCode, refreshTokens } from "@/infrastructure/mcp/oauthStore";

// ─── 토큰 엔드포인트 ────────────────────────────────────────────────────────
//
// 공개 클라이언트뿐이라 client_secret 이 없다 (`token_endpoint_auth_method: none`).
// 코드를 가로챈 쪽이 그대로 교환하는 것을 막는 수단은 PKCE 하나뿐이고,
// 그 검사는 exchangeCode 안에 있다.
//
// 본문은 OAuth 규격대로 form-urlencoded 다. JSON 으로 보내는 클라이언트도
// 있어서 둘 다 받는다.

export const dynamic = "force-dynamic";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, authorization",
};

const fail = (error: string, description: string, status = 400) =>
  NextResponse.json({ error, error_description: description }, { status, headers: cors });

async function readBody(request: Request): Promise<Record<string, string>> {
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const json = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(json).map(([k, v]) => [k, String(v ?? "")]));
  }
  const form = await request.formData().catch(() => null);
  if (!form) return {};
  return Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));
}

export async function POST(request: Request) {
  const body = await readBody(request);
  const grant = body.grant_type;

  if (grant === "authorization_code") {
    if (!body.code || !body.client_id || !body.redirect_uri || !body.code_verifier) {
      return fail("invalid_request", "code · client_id · redirect_uri · code_verifier 가 필요합니다");
    }

    const pair = await exchangeCode({
      code: body.code,
      clientId: body.client_id,
      redirectUri: body.redirect_uri,
      codeVerifier: body.code_verifier,
    });

    // 무엇이 틀렸는지 알려주지 않는다 — 구별해 주면 그 자체가 단서가 된다
    if (!pair) return fail("invalid_grant", "코드를 교환할 수 없습니다");

    return NextResponse.json(
      {
        access_token: pair.accessToken,
        token_type: "Bearer",
        expires_in: pair.expiresIn,
        refresh_token: pair.refreshToken,
        scope: SCOPE,
      },
      { headers: { ...cors, "Cache-Control": "no-store" } },
    );
  }

  if (grant === "refresh_token") {
    if (!body.refresh_token || !body.client_id) {
      return fail("invalid_request", "refresh_token 과 client_id 가 필요합니다");
    }

    const pair = await refreshTokens(body.refresh_token, body.client_id);
    if (!pair) return fail("invalid_grant", "갱신할 수 없습니다");

    return NextResponse.json(
      {
        access_token: pair.accessToken,
        token_type: "Bearer",
        expires_in: pair.expiresIn,
        refresh_token: pair.refreshToken,
        scope: SCOPE,
      },
      { headers: { ...cors, "Cache-Control": "no-store" } },
    );
  }

  return fail("unsupported_grant_type", `${grant ?? "(없음)"} 는 지원하지 않습니다`);
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}
