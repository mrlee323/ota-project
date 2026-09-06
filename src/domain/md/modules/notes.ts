import type { ModuleDef } from "../moduleDef";

/**
 * 유의사항 — **표본 6/6 전부에 있었고, 유일하게 «텍스트» 였다** (실사 F2).
 *
 * 다른 블록이 전부 이미지인 페이지에서도 이것만은 실제 텍스트였다.
 * 법적 고지라 검색·복사가 돼야 하기 때문이다. 그 성질을 유지한다 (FR-6.2 · NFR-3).
 */
export const notes: ModuleDef = {
  type: "notes",
  version: 1,
  name: "유의사항",
  category: "푸터",
  description: "예약 조건·환불 규정 같은 안내 문구 목록.",
  whenToUse:
    "거의 모든 기획전의 마지막 블록. 할인 조건·기간·제외 대상처럼 나중에 분쟁이 될 수 있는 것을 적는다. " +
    "이미지로 대체하지 않는다 — 검색과 복사가 돼야 한다.",
  fields: [
    {
      key: "title",
      label: "제목",
      input: "text",
      required: false,
      repeatable: false,
      freedom: "preset",
      options: ["유의사항", "꼭 확인하세요", "예약 전 확인사항"],
      description: "안내 묶음의 제목.",
    },
    {
      key: "items",
      label: "항목",
      input: "textarea",
      required: true,
      repeatable: true,
      freedom: "free",
      description: "안내 문구 한 줄씩. 사실만 적는다 — 조건을 지어내지 않는다.",
    },
  ],
  sample: {
    title: "유의사항",
    items: [
      "본 혜택은 예약 가능 객실 소진 시 조기 종료될 수 있습니다.",
      "표시 금액은 세금 및 봉사료가 포함된 가격입니다.",
      "환불 규정은 숙소별 정책을 따릅니다.",
    ],
  },
};
