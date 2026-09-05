import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

// eslint-config-next 는 아직 eslintrc 형식(객체)이라 flat config 에 그대로 못 펼친다.
// FlatCompat 로 감싼다 — Next 공식 권장 경로다.
const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

export default [
  { ignores: [".next/**", "out/**", "build/**", "next-env.d.ts", "node_modules/**"] },

  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // 디자인시스템 경계 — src/ 는 @ds/design-system 의 공개 진입점만 쓴다.
  // 레지스트리 배포를 하지 않는 대신 이 규칙이 그 역할을 한다 (docs/md/design.md D8).
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@ds/design-system/src", "@ds/design-system/src/*"],
              message:
                "디자인시스템 내부 경로는 import 할 수 없습니다. 공개 진입점(@ds/design-system) 또는 @ds/design-system/tokens 를 쓰세요.",
            },
          ],
        },
      ],
    },
  },
];
