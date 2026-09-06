import type { ModuleDef } from "../moduleDef";

/**
 * 호텔 카드 목록 — **효용이 가장 큰 모듈**.
 *
 * 실사 F5: 야놀자는 카드가 실데이터라 가격이 바뀌면 페이지가 저절로 맞는다.
 * 이미지로 만든 기획전은 가격이 바뀔 때마다 디자이너가 이미지를 다시 만들어야 한다.
 *
 * **호텔 id 만 저장한다** (Q1). 가격·할인율·평점은 조회 시점에 채운다 —
 * 저장하는 순간 그 값이 굳고, 이 모듈의 존재 이유가 사라진다.
 */
export const hotelCardList: ModuleDef = {
  type: "hotel-card-list",
  version: 1,
  name: "호텔 카드 목록",
  category: "본문",
  description: "호텔 여러 곳을 카드로 늘어놓는다. 가격·할인율은 보는 시점의 실제 값이다.",
  whenToUse:
    "기획전에서 파는 숙소를 실제로 보여줄 때. 이미지로 만든 목록과 달리 가격이 저절로 최신이 되므로, " +
    "숙소를 나열하는 자리라면 거의 항상 이걸 쓴다. 브랜드 소개처럼 «분위기» 가 목적이면 image 를 쓴다.",
  fields: [
    {
      key: "hotelRefs",
      label: "호텔",
      input: "hotel-refs",
      required: true,
      repeatable: true,
      freedom: "free",
      description: "보여줄 호텔의 id 목록. 실제로 존재하는 호텔만 넣는다 — 지어내지 않는다.",
    },
    {
      key: "layout",
      label: "배치",
      input: "text",
      required: false,
      repeatable: false,
      freedom: "preset",
      options: ["grid", "carousel"],
      description: "grid 는 격자로 전부 보여주고, carousel 은 옆으로 넘긴다. 5개를 넘으면 carousel 이 낫다.",
    },
  ],
  sample: {
    hotelRefs: ["1", "2", "3"],
    layout: "grid",
  },
};
