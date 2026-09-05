import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// .mts 로 둔다 — package.json 에 "type": "module" 이 없어 .ts 는 CJS 로 로드되고,
// ESM 전용인 vite 7 을 require 하다 ERR_REQUIRE_ESM 이 난다.
// ESM 이라 __dirname 이 없으므로 import.meta.url 로 만든다.
const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  // .tsx 테스트에서 JSX 를 쓸 수 있게 automatic 런타임을 켠다.
  // 없으면 esbuild 가 classic(React.createElement)으로 변환해 ReferenceError 가 난다.
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: {
      "@": root + "src",
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    passWithNoTests: true,
  },
});
