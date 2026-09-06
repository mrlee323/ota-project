import type { ModuleDef } from "../moduleDef";

/**
 * 구간 제목.
 *
 * 야놀자 허브는 11개 섹션이 전부 «제목 + 카드» 였다 (실사 F5).
 * 여기어때는 같은 역할을 이미지로 때우고 있었다 — 그래서 검색도 복사도 안 된다.
 *
 * `sectionBgColor` 는 자유 입력이 허용되는 몇 안 되는 필드다 (D7).
 * 배경 위 글자색은 명도로 자동 결정되므로 담당자가 색을 잘못 골라도 글자는 읽힌다.
 */
export const sectionTitle: ModuleDef = {
  type: "section-title",
  version: 1,
  name: "구간 제목",
  category: "본문",
  description: "구간을 여는 제목과 부제. 배경색을 줄 수 있다.",
  whenToUse:
    "페이지가 길어져 «여기부터 다른 이야기» 라고 알려야 할 때. 호텔 카드 목록 앞에 두는 것이 가장 흔하다. " +
    "구간이 하나뿐인 짧은 기획전에는 쓰지 않는다.",
  fields: [
    {
      key: "title",
      label: "제목",
      input: "text",
      required: true,
      repeatable: false,
      freedom: "free",
      description: "구간 제목. 15자 안팎.",
    },
    {
      key: "subtitle",
      label: "부제",
      input: "text",
      required: false,
      repeatable: false,
      freedom: "free",
      description: "제목을 보충하는 한 줄.",
    },
    {
      key: "sectionBgColor",
      label: "구간 배경색",
      input: "color-free",
      required: false,
      repeatable: false,
      freedom: "free",
      description: "구간 배경 색상 코드(#RRGGBB). 기획전마다 다르므로 토큰이 아니라 자유 입력이다.",
    },
  ],
  sample: {
    title: "이번 주 특가",
    subtitle: "지금 예약하면 더 저렴해요",
  },
};
