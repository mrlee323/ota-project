module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // 새로운 기능
        "fix", // 버그 수정
        "docs", // 문서 수정
        "style", // 코드 포맷팅 (세미콜론 누락 등)
        "refactor", // 코드 리팩토링
        "test", // 테스트 코드
        "chore", // 빌드 업무, 패키지 매니저 설정 등
        "revert", // 복구
      ],
    ],
    "subject-case": [0], // 대소문자 제한 해제
  },
};
