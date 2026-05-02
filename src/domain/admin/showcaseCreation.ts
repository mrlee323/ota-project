import { z } from "zod";
import { showcaseHotelCardSchema } from "@/domain/hotel/showcaseTypes";

/** 쇼케이스 생성 카드 상태 */
export const showcaseCreationCityStatusSchema = z.enum([
  "draft",
  "generated",
  "saved",
  "error",
]);
export type ShowcaseCreationCityStatus = z.infer<
  typeof showcaseCreationCityStatusSchema
>;

/** 쇼케이스 생성 대상 도시 초안 */
export const showcaseCreationCityDraftSchema = z.object({
  id: z.string().min(1),
  cityName: z.string().min(1),
  prompt: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  title: z.string().optional(),
  imageUrl: z.string().url().optional(),
  hotels: z.array(showcaseHotelCardSchema).optional(),
  status: showcaseCreationCityStatusSchema,
  titleGenerationKey: z.string().optional(),
  imageGenerationKey: z.string().optional(),
  hotelsGenerationKey: z.string().optional(),
  savedShowcaseId: z.string().uuid().optional(),
  errorMessage: z.string().optional(),
});
export type ShowcaseCreationCityDraft = z.infer<
  typeof showcaseCreationCityDraftSchema
>;

/** 쇼케이스 생성 입력 */
export const showcaseCreationDraftSchema = z.object({
  cities: z.array(showcaseCreationCityDraftSchema).min(1),
});
export type ShowcaseCreationDraft = z.infer<typeof showcaseCreationDraftSchema>;

/** 현재 카드의 생성 스코프 키를 만든다. (도시명 + 프롬프트만 포함, 노출기간은 생성 결과와 무관) */
export function buildShowcaseCreationKey(input: {
  cityName: string;
  prompt?: string;
}): string {
  return [
    input.cityName.trim(),
    input.prompt?.trim() ?? "",
  ].join("::");
}
