import type { ShowcaseService } from "./mockShowcaseService";
import type { ShowcaseHotelCard } from "@/domain/hotel/showcaseTypes";

/** 쇼케이스 생성 액션에 쓰는 공통 서비스 인터페이스 */
export type ShowcaseGenerationService = Pick<
  ShowcaseService,
  "generateTitle" | "generateImage" | "generateHotels"
>;

/** 타이틀 생성 공통 래퍼 */
export async function generateShowcaseTitle(
  service: ShowcaseGenerationService,
  cityName: string,
  prompt?: string,
): Promise<string> {
  return service.generateTitle(cityName, prompt);
}

/** 이미지 생성 공통 래퍼 */
export async function generateShowcaseImage(
  service: ShowcaseGenerationService,
  cityName: string,
  title: string,
  prompt?: string,
): Promise<string> {
  return service.generateImage(cityName, title, prompt);
}

/** 호텔 생성 공통 래퍼 */
export async function generateShowcaseHotels(
  service: ShowcaseGenerationService,
  cityName: string,
  title?: string,
  prompt?: string,
): Promise<ShowcaseHotelCard[]> {
  return service.generateHotels(cityName, title, prompt);
}

/** 생성 스코프 키를 만든다. */
export function buildShowcaseCreationKey(input: {
  cityName: string;
  prompt?: string;
  startDate: string;
  endDate: string;
}): string {
  return [
    input.cityName.trim(),
    input.prompt?.trim() ?? "",
    input.startDate,
    input.endDate,
  ].join("::");
}
