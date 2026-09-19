import { NextResponse } from "next/server";
import { getPublicOrigin } from "mcp-handler";
import { authorizationServerMetadata } from "@/domain/auth/oauth";

// ─── RFC 8414 ───────────────────────────────────────────────────────────────
//
// 클라이언트가 «어디로 보내고 어디서 교환하나» 를 읽는 문서.
// 인가 서버를 따로 두지 않는다 — 어드민과 같은 앱이 겸한다.

export const dynamic = "force-dynamic";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

export function GET(request: Request) {
  return NextResponse.json(authorizationServerMetadata(getPublicOrigin(request)), { headers: cors });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}
