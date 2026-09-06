import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateImageWithFlux } from "@/infrastructure/imageGeneration/huggingFaceApi";
import { uploadImage } from "@/infrastructure/supabase/storageApi";
import type { MdPage } from "@/domain/md/page";
import { MODULE_DEFS } from "@/domain/md/modules";
import {
  collectImageContext,
  buildImagePromptBrief,
  IMAGE_CONSTRAINTS,
} from "@/domain/md/imageContext";

// ─── L3 · 이미지 생성 (캔버스 전용) ─────────────────────────────────────────
//
// MCP 도구로 만들지 않는다 (llm.md §4). 나머지 쓰기 작업은 전부 «DB 에 draft 쓰기» 라
// 호출 비용이 0 인데, 이미지만 외부 생성 API 를 불러 **비용이 우리 쪽에 남는다.**
//
// 배관은 기존 것을 그대로 쓴다 — 새로 만드는 건 «문맥을 붙이는 부분» 뿐이다.

function gemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "[SENSITIVE]") {
    throw new Error("GEMINI_API_KEY 가 없습니다. 이미지 프롬프트를 만들 수 없습니다.");
  }
  return new GoogleGenerativeAI(key).getGenerativeModel({ model: "gemini-2.5-flash" });
}

/**
 * 한국어 문맥 → FLUX 용 영문 프롬프트.
 *
 * 기존 `buildFluxPromptWithGemini` 와 하는 일은 같지만 입력이 «도시 이름» 이 아니라
 * «이 블록이 놓인 자리의 문맥» 이다. 그래서 별도로 둔다.
 */
async function buildFluxPrompt(brief: string): Promise<string> {
  const message = `
당신은 이미지 생성 AI(FLUX)를 위한 영문 프롬프트 전문가입니다.
아래는 여행 기획전 페이지의 한 자리에 들어갈 이미지의 문맥입니다.

${brief}

이 자리에 어울리는 배경 이미지를 위한 영문 프롬프트를 작성하세요.

반드시 지킬 것:
${IMAGE_CONSTRAINTS.map((c) => `- ${c}`).join("\n")}

그 밖의 규칙:
- 반드시 영어로만 작성
- 분위기·질감·빛을 묘사한다. 정보를 그리지 않는다
- cinematic lighting, 8k resolution 등 품질 키워드 포함
- 한 문단, 80단어 이내

영문 프롬프트만 출력하세요.
`.trim();

  const r = await gemini().generateContent(message);
  const text = r.response.text().trim().replace(/^["']|["']$/g, "");
  if (!text) throw new Error("이미지 프롬프트를 만들지 못했습니다");
  return text;
}

export interface GenerateImageInput {
  pageId: string;
  pageTitle: string;
  page: MdPage;
  blockId: string;
  intent?: string;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
}

/**
 * 블록 하나에 쓸 이미지를 만든다.
 *
 * **`intent` 는 비워도 된다.** 사용자가 프롬프트를 잘 쓰게 만드는 게 아니라
 * 서버가 문맥을 붙인다 — 담당자가 프롬프트 엔지니어링을 몰라도 되게 하는 것이 목표다.
 *
 * 결과를 블록에 자동으로 꽂지 않는다. 담당자가 보고 고른다 (FR-11.4).
 */
export async function generateModuleImage(
  input: GenerateImageInput,
): Promise<GeneratedImage> {
  const ctx = collectImageContext(input.page, input.blockId, MODULE_DEFS, input.pageTitle);
  if (!ctx) throw new Error("블록을 찾을 수 없습니다");

  const prompt = await buildFluxPrompt(buildImagePromptBrief(ctx, input.intent));
  const blob = await generateImageWithFlux(prompt);

  const path = `md/${input.pageId}/${input.blockId}-${Date.now()}.jpg`;
  return { url: await uploadImage(path, blob), prompt };
}
