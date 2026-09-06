import type { ModuleDef } from "../moduleDef";

/**
 * CTA 버튼 — **표본에서 가장 많이 나온 블록** (6/6, 총 31회. 실사 F2).
 *
 * 브랜드형 기획전에서는 호텔 하나마다 하나씩 붙는다 —
 * 그래서 반복 묶음(`group`)의 마지막 블록이 되는 경우가 많다.
 */
export const cta: ModuleDef = {
  type: "cta",
  version: 1,
  name: "버튼",
  category: "본문",
  description: "누르면 이동하는 버튼 하나.",
  whenToUse:
    "무언가를 소개한 직후, 바로 행동하게 만들 때. 호텔 소개 뒤의 «예약하기» 가 가장 흔하다. " +
    "한 페이지에 여러 개 있어도 된다 — 소개 묶음마다 하나씩 두는 것이 보통이다.",
  fields: [
    {
      key: "label",
      label: "버튼 문구",
      input: "text",
      required: true,
      repeatable: false,
      freedom: "free",
      description: "버튼에 쓸 문구. «예약하기», «지금 구매하기» 처럼 행동을 적는다. 10자 안팎.",
    },
    {
      key: "link",
      label: "링크",
      input: "link",
      required: true,
      repeatable: false,
      freedom: "free",
      description: "이동할 주소.",
    },
    {
      key: "style",
      label: "모양",
      input: "text",
      required: false,
      repeatable: false,
      freedom: "preset",
      options: ["primary", "secondary"],
      description: "primary 는 강조색, secondary 는 차분한 테두리형. 한 구간에 primary 는 하나만 둔다.",
    },
  ],
  sample: {
    label: "예약하기",
    link: "/hotel/1",
    style: "primary",
  },
};
