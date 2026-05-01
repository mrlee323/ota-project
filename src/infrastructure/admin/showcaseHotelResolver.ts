import { createServiceClient } from "@/infrastructure/supabase/serviceClient";
import type { ShowcaseHotelCard } from "@/domain/hotel/showcaseTypes";

const HOTELS_PER_SHOWCASE = 4;

interface HotelRow {
  id: string;
  name: string;
  location: string;
  thumbnail_url: string;
  stars: number;
  original_price: number;
  discount_price: number;
  discount_rate: number;
}

function rowToCard(row: HotelRow): ShowcaseHotelCard {
  return {
    id: String(row.id),
    name: row.name,
    location: row.location,
    imageUrl: row.thumbnail_url,
    stars: row.stars ?? 3,
    discountRate: row.discount_rate,
    originalPrice: row.original_price ?? 0,
    discountPrice: row.discount_price ?? 0,
    isAppDiscount: false,
    taxIncluded: true,
    badges: row.discount_rate >= 20 ? ["특가"] : [],
  };
}

/**
 * Supabase hotels 테이블에서 cityName으로 호텔을 조회해 ShowcaseHotelCard[] 로 반환한다.
 * 테이블이 없거나 데이터가 없으면 빈 배열을 반환한다.
 */
export async function resolveHotelsForCity(cityName: string): Promise<ShowcaseHotelCard[]> {
  try {
    const db = createServiceClient();
    const { data, error } = await db
      .from("hotels")
      .select("id, name, location, thumbnail_url, stars, original_price, discount_price, discount_rate")
      .ilike("location", `%${cityName}%`)
      .limit(HOTELS_PER_SHOWCASE * 3); // 랜덤 선택을 위해 더 많이 조회

    if (error || !data || data.length === 0) return [];

    // 랜덤으로 HOTELS_PER_SHOWCASE개 선택
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, HOTELS_PER_SHOWCASE).map(rowToCard);
  } catch (err) {
    console.error(`[showcaseHotelResolver] resolveHotelsForCity failed for ${cityName}:`, err);
    return [];
  }
}
