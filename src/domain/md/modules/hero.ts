import type { ModuleDef } from "../moduleDef";

/**
 * 히어로 — 기획전 최상단 비주얼.
 *
 * 실사 7/7 전부에 있었다 (module-survey.md F2). 없는 기획전이 없다.
 * 필드는 실사에서 «실제로 쓰인 것» 만 넣는다 — 안 쓰이는 필드는 만들지 않는다.
 */
export const hero: ModuleDef = {
  type: "hero",
  version: 1,
  name: "히어로",
  category: "헤더",
  description: "기획전 최상단의 큰 배경 이미지와 제목.",
  whenToUse:
    "모든 기획전의 첫 블록. 페이지가 무엇에 관한 것인지 한눈에 보여준다. 페이지당 하나만 쓴다.",
  fields: [
    {
      key: "imageUrl",
      label: "배경 이미지",
      input: "image",
      required: true,
      repeatable: false,
      freedom: "free",
      description: "기획전 분위기를 보여주는 배경 사진. 글자가 들어간 이미지를 쓰지 않는다.",
    },
    {
      key: "title",
      label: "제목",
      input: "text",
      required: true,
      repeatable: false,
      freedom: "free",
      description: "기획전 이름. 20자 안팎.",
    },
    {
      key: "subtitle",
      label: "부제",
      input: "text",
      required: false,
      repeatable: false,
      freedom: "free",
      description: "제목을 보충하는 한 줄. 없어도 된다.",
    },
    {
      key: "period",
      label: "기간 문구",
      input: "text",
      required: false,
      repeatable: false,
      freedom: "free",
      description: "화면에 보여줄 기간 표기. 예: 9.1(월) ~ 9.30(화)",
    },
  ],
  sample: {
    imageUrl: "https://placehold.co/1200x600/1f2937/ffffff?text=Hero",
    title: "가을 오사카 특가",
    subtitle: "지금 예약하면 최대 30% 할인",
    period: "9.1(월) ~ 9.30(화)",
  },
};
