import type { ModuleDef } from "../moduleDef";

/**
 * 이미지 — **1급 모듈이다** (실사 F4).
 *
 * 임시방편이 아니다. 가장 기능이 많은 표본(스페인, 6267)조차 49블록 중 30이 이미지였다.
 * 이미지 모듈이 없으면 실제 기획전을 하나도 재현할 수 없다.
 *
 * 다만 «글자가 든 이미지» 를 권장하지 않는다 — 그게 실사 F1 의 문제 그 자체다.
 */
export const image: ModuleDef = {
  type: "image",
  version: 1,
  name: "이미지",
  category: "본문",
  description: "이미지 한 장. 분위기·질감·브랜드 비주얼을 보여준다.",
  whenToUse:
    "데이터로 표현할 수 없는 것을 보여줄 때 — 브랜드 무드컷, 공간 사진, 지도 같은 것. " +
    "가격·호텔 목록·문구처럼 «값» 으로 표현할 수 있는 것에는 쓰지 않는다. 그건 전용 모듈이 있다.",
  fields: [
    {
      key: "imageUrl",
      label: "이미지",
      input: "image",
      required: true,
      repeatable: false,
      freedom: "free",
      description: "보여줄 이미지 주소. 글자가 박힌 이미지는 검색도 복사도 안 되므로 피한다.",
    },
    {
      key: "alt",
      label: "대체 텍스트",
      input: "text",
      required: true,
      repeatable: false,
      freedom: "free",
      description: "이미지가 무엇인지 설명하는 문장. 화면을 못 보는 사용자에게 읽힌다 (필수).",
    },
    {
      key: "link",
      label: "링크",
      input: "link",
      required: false,
      repeatable: false,
      freedom: "free",
      description: "눌렀을 때 이동할 주소. 없으면 눌리지 않는다.",
    },
  ],
  sample: {
    imageUrl: "https://placehold.co/1200x800/e5e7eb/6b7280?text=Image",
    alt: "브랜드 무드 이미지",
  },
};
