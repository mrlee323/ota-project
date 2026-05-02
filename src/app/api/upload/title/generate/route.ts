import { NextResponse } from "next/server";
import { generateTitle } from "@/infrastructure/admin/showcaseAiService";

interface GenerateTitleBody {
  cityName: string;
  prompt?: string;
}

/**
 * POST /api/upload/title/generate
 * Gemini API로 쇼케이스 타이틀을 생성한다.
 *
 * Body: JSON
 *   - cityName: string (필수)
 *   - prompt: string (선택)
 *
 * Response: { title: string }
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateTitleBody;
    const { cityName, prompt } = body;

    if (!cityName) {
      return NextResponse.json({ error: "cityName이 필요합니다" }, { status: 400 });
    }

    const title = await generateTitle(cityName, prompt);
    return NextResponse.json({ title });
  } catch (err) {
    const message = err instanceof Error ? err.message : "타이틀 생성 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
