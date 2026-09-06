import { z } from "zod";

/**
 * 요청서 — L1 의 입력.
 *
 * 자유 대화가 아니라 «정형 폼» 이다. 실사에서 요청 오염(다른 호텔 소개문·이전 값이
 * 복붙으로 섞임)이 확인됐고, 그건 AI 로 거르는 것보다 **폼을 구조화**하는 편이 낫다.
 */
export const mdRequestSchema = z.object({
  templateId: z.string().min(1),
  /** 무엇을 파는가 — 가장 중요한 한 줄 */
  intent: z.string().min(2).max(500),
  /** 실제로 넣을 호텔. 담당자가 고른다 — LLM 이 지어내지 않는다 (FR-5.5) */
  hotelIds: z.array(z.string()).default([]),
  /** 노출 기간 문구에 쓰인다 */
  period: z.string().max(100).optional(),
  /** 강조하고 싶은 것 */
  highlight: z.string().max(300).optional(),
});

export type MdRequest = z.infer<typeof mdRequestSchema>;
