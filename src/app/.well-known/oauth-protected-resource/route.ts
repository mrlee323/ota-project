import { NextResponse } from "next/server";
import { getPublicOrigin } from "mcp-handler";
import { protectedResourceMetadata } from "@/domain/auth/oauth";

// ─── RFC 9728 ───────────────────────────────────────────────────────────────
//
// /api/mcp 의 401 이 `resource_metadata` 로 **이 주소를 가리킨다.**
// 이게 없으면 없는 문서를 광고하는 셈이고, OAuth 를 쓰는 클라이언트는
// 디스커버리 첫 단계에서 404 를 받고 포기한다. 실제로 그렇게 막혀 있었다.
//
// 배포 뒤 origin 은 프록시 헤더에서 읽는다 — req.url 은 내부 주소다.

export const dynamic = "force-dynamic";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

export function GET(request: Request) {
  return NextResponse.json(protectedResourceMetadata(getPublicOrigin(request)), { headers: cors });
}

// 브라우저 안에서 도는 클라이언트(ChatGPT 웹)는 프리플라이트를 보낸다
export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}
