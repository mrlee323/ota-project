import { NextResponse } from "next/server";
import type { RegionShowcaseData } from "@/domain/hotel/showcaseTypes";
import { getActiveShowcaseContents } from "@/infrastructure/admin/showcaseContentApi";
import { getAutoConfig } from "@/infrastructure/admin/autoConfigApi";
import type { ShowcaseContent } from "@/domain/admin/showcaseContent";

function contentToRegion(content: ShowcaseContent) {
  return {
    tab: {
      id: content.id,
      name: content.cityName,
      themeText: content.title,
      backgroundImageUrl: content.imageUrl,
    },
    hotels: content.hotels,
  };
}

export async function GET() {
  try {
    const [contents, autoConfig] = await Promise.all([
      getActiveShowcaseContents(),
      getAutoConfig(),
    ]);

    if (contents.length === 0) {
      return NextResponse.json({ promoTitle: autoConfig.promoTitle, regions: [] } satisfies RegionShowcaseData);
    }

    const data: RegionShowcaseData = {
      promoTitle: autoConfig.promoTitle,
      regions: contents.map(contentToRegion),
    };

    return NextResponse.json(data);
  } catch (err) {
    console.error("showcase API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
