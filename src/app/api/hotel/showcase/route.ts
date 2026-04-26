import { NextResponse } from "next/server";
import { getActiveShowcaseContent } from "@/infrastructure/admin/showcaseContentApi";

export async function GET() {
  try {
    const content = await getActiveShowcaseContent();

    if (!content) {
      return NextResponse.json(
        { error: "활성화된 쇼케이스 컨텐츠가 없습니다" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      promoTitle: content.promoTitle,
      regions: content.regions,
    });
  } catch (err) {
    console.error("showcase API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
