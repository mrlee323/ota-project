import { NextResponse, type NextRequest } from "next/server";
import { getHotelPrices } from "@/infrastructure/md/hotelLookup";

/**
 * 호텔 가격 조회 — MD 공개 페이지의 «변동 값» 층 (design.md §6).
 *
 * 페이지 골격은 ISR 로 캐시되고, 가격만 이 경로로 매번 새로 온다.
 * 그래서 캐시하지 않는다.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("ids") ?? "";
  const ids = raw.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 50);

  if (ids.length === 0) return NextResponse.json({ prices: [] });

  return NextResponse.json({ prices: await getHotelPrices(ids) });
}
