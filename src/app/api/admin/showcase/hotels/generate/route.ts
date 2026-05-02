import { NextResponse } from "next/server";
import { generateHotels } from "@/infrastructure/admin/showcaseAiService";

interface GenerateHotelsBody {
  cityName: string;
  title?: string;
  prompt?: string;
}

/**
 * POST /api/admin/showcase/hotels/generate
 * Gemini API로 쇼케이스 호텔 목록을 생성한다.
 *
 * Body: JSON
 *   - cityName: string (필수)
 *   - title: string (선택)
 *   - prompt: string (선택)
 *
 * Response: { hotels: ShowcaseHotelCard[] }
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateHotelsBody;
    const { cityName, title, prompt } = body;

    if (!cityName) {
      return NextResponse.json({ error: "cityName이 필요합니다" }, { status: 400 });
    }

    const hotels = await generateHotels(cityName, title, prompt);
    return NextResponse.json({ hotels });
  } catch (err) {
    const message = err instanceof Error ? err.message : "호텔 생성 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
