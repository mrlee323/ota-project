import { execSync } from "child_process";

/**
 * 1. Git Diff 추출
 */
const getGitDiff = () => {
  try {
    const diff = execSync("git diff --cached").toString();
    if (!diff.trim()) {
      console.log(
        "✨ 스테이징된 변경 사항이 없습니다. 먼저 'git add .'를 실행하세요.",
      );
      process.exit(0);
    }
    return diff;
  } catch (e) {
    console.error("❌ Git 상태를 읽는 중 오류가 발생했습니다.");
    process.exit(1);
  }
};

/**
 * 2. 수정된 레이어 분석
 */
const analyzeLayers = (diff: string) => {
  const layers = [
    "domain",
    "application",
    "infrastructure",
    "ui",
    "automation",
  ];
  const modifiedLayers = layers.filter((layer) =>
    diff.includes(`src/${layer}`),
  );
  return modifiedLayers.length > 0 ? `(${modifiedLayers.join(", ")})` : "";
};

/**
 * 3. 메인 실행 로직: 분석 및 커밋 실행
 */
const runAutoCommit = () => {
  const diff = getGitDiff();
  const layerInfo = analyzeLayers(diff);

  // AI가 참고할 수 있게 터미널에 가이드 프롬프트를 먼저 출력합니다.
  console.log(`
🤖 [AI 가이드 프롬프트 생성 완료]
--------------------------------------------------
[변경 레이어]: ${layerInfo}
[작성 규칙]: <type>${layerInfo}: <한글 요약>
--------------------------------------------------
  `);

  try {
    // 💡 실제 커밋을 시도합니다.
    // 처음엔 제목만 자동으로 생성하고, 상세 내용은 Cursor AI에게 완성을 맡깁니다.
    const tempTitle = `feat${layerInfo}: 작업 내용 요약 (AI에게 메시지 작성을 요청하세요)`;

    console.log("🚀 Husky 검사 및 커밋 시도 중...");

    // stdio: "inherit"를 설정해야 Husky의 린트 에러 메시지가 터미널에 실시간으로 보입니다.
    execSync(`git commit -m "${tempTitle}"`, { stdio: "inherit" });

    console.log("\n✅ 커밋 성공! (기본 메시지로 커밋되었습니다.)");
    console.log("💡 상세한 요약이 필요하면 Cursor Chat에서 수정을 요청하세요.");
  } catch (e) {
    console.log(
      "\n❌ 커밋 실패: Husky(Lint/Commitlint) 검사를 통과하지 못했습니다.",
    );
    console.log("코드의 에러를 수정하거나 커밋 메시지 형식을 확인하세요.");
  }
};

// 함수 실행
runAutoCommit();
