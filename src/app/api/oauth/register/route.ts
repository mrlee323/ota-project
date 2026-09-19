import { NextResponse } from "next/server";
import { z } from "zod";
import { validateRedirectUri } from "@/domain/auth/oauth";
import { registerClient } from "@/infrastructure/mcp/oauthStore";

// ─── RFC 7591 동적 클라이언트 등록 ──────────────────────────────────────────
//
// MCP 클라이언트는 미리 등록할 수 없다 — 누가 붙을지 모르기 때문이다.
// 그래서 이 엔드포인트는 «아무나» 부를 수 있다.
//
// **그래도 위험하지 않은 이유** 등록은 client_id 하나를 받아 갈 뿐이고,
// 실제 권한은 /oauth/authorize 에서 사람이 로그인해야 생긴다.
// 등록만으로는 아무것도 읽거나 쓸 수 없다.

export const dynamic = "force-dynamic";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
};

const schema = z.object({
  client_name: z.string().max(120).optional(),
  redirect_uris: z.array(z.string()).min(1).max(10),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_client_metadata", error_description: "redirect_uris 가 필요합니다" },
      { status: 400, headers: cors },
    );
  }

  const { redirect_uris: uris, client_name: name } = parsed.data;

  // 코드가 흘러갈 주소다. 여기서 느슨하면 뒤를 아무리 조여도 소용없다
  const bad = uris.filter((u) => !validateRedirectUri(u));
  if (bad.length > 0) {
    return NextResponse.json(
      {
        error: "invalid_redirect_uri",
        error_description: `받을 수 없는 주소입니다: ${bad.join(", ")}`,
      },
      { status: 400, headers: cors },
    );
  }

  try {
    const client = await registerClient(name ?? "AI 도구", uris);
    return NextResponse.json(
      {
        client_id: client.clientId,
        client_name: client.clientName,
        redirect_uris: client.redirectUris,
        token_endpoint_auth_method: "none",
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
      },
      { status: 201, headers: cors },
    );
  } catch (e) {
    return NextResponse.json(
      { error: "server_error", error_description: (e as Error).message },
      { status: 500, headers: cors },
    );
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}
