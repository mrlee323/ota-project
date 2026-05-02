import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ShowcaseHotelCard } from "@/domain/hotel/showcaseTypes";
import {
  generateImageWithFlux,
  buildFluxPrompt,
} from "@/infrastructure/imageGeneration/huggingFaceApi";
import { uploadImage } from "@/infrastructure/supabase/storageApi";

function getGeminiModel() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY 환경변수가 설정되지 않았습니다");
  const genAI = new GoogleGenerativeAI(key);
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
}

/**
 * Gemini API를 사용해 쇼케이스 타이틀을 생성한다.
 */
export async function generateTitle(cityName: string, prompt?: string): Promise<string> {
  const model = getGeminiModel();

  const userMessage = `
[시스템 지시사항]
당신은 숙박 앱의 메인 카피라이터입니다. 아래 정보를 바탕으로 쇼케이스 타이틀을 작성하세요.

도시: ${cityName}
추가 키워드/분위기: ${prompt ?? "없음 (도시의 가장 대표적인 매력을 살려주세요)"}

[작성 가이드]
${prompt
  ? "- 해당 키워드의 분위기를 80% 이상 반영하세요."
  : `- ${cityName} 하면 떠오르는 가장 대중적이고 고급스러운 이미지를 활용하세요.`
}
- 제약: 20자 이내, 명사형 종결, 감성적인 문체.

결과값에는 오직 타이틀만 출력하세요.
`.trim();

  const result = await model.generateContent(userMessage);
  const text = result.response.text().trim().replace(/^["']|["']$/g, "");

  if (!text) throw new Error("Gemini가 빈 타이틀을 반환했습니다");
  return text;
}

/**
 * HuggingFace FLUX 모델로 도시 이미지를 생성하고 Supabase Storage에 업로드한다.
 */
export async function generateImage(cityName: string, prompt?: string): Promise<string> {
  const fluxPrompt = buildFluxPrompt(cityName, undefined, prompt);
  const blob = await generateImageWithFlux(fluxPrompt);

  const safeCity = cityName
    .normalize("NFD")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase() || `city-${Date.now()}`;
  const path = `showcase/${safeCity}/${Date.now()}.jpg`;
  return uploadImage(path, blob);
}

/**
 * Gemini API를 사용해 쇼케이스 호텔 목록을 생성한다.
 */
export async function generateHotels(
  cityName: string,
  title?: string,
  prompt?: string,
): Promise<ShowcaseHotelCard[]> {
  const model = getGeminiModel();

  const lines = [
    `도시: ${cityName}`,
    title ? `쇼케이스 타이틀: ${title}` : null,
    prompt ? `분위기/키워드: ${prompt}` : null,
    "",
    "위 도시의 여행 앱 쇼케이스에 등록할 호텔 3개를 JSON 배열로 생성해 주세요.",
    "",
    "각 항목 필드:",
    '- id: "gen-" + 영문소문자+숫자 조합 (고유값)',
    "- name: 호텔명 (한국어)",
    "- location: 지역명 (한국어, 도시 내 구체적인 위치)",
    "- imageUrl: https://picsum.photos/seed/SLUG/480/320 형식 (SLUG는 영문소문자+하이픈)",
    "- stars: 1~5 정수",
    "- originalPrice: 100000~500000 사이 정수 (원화)",
    "- discountPrice: originalPrice 이하 정수",
    "- discountRate: 0~100 정수 또는 null",
    "- isAppDiscount: boolean",
    "- taxIncluded: boolean",
    '- badges: ["플러스딜","최저가보장","조식포함","무료취소"] 중 0~2개 배열',
    "",
    "JSON 배열만 출력하고 다른 텍스트는 포함하지 마세요.",
  ].filter((l) => l !== null);

  const result = await model.generateContent(lines.join("\n"));
  const raw = result.response.text().trim();
  const json = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error(`Gemini 호텔 응답 파싱 실패: ${raw.slice(0, 200)}`);
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Gemini가 유효한 호텔 목록을 반환하지 않았습니다");
  }

  return (parsed as Record<string, unknown>[]).map((h, i) => ({
    id: String(h.id ?? `gen-${cityName}-${i}`),
    name: String(h.name ?? ""),
    location: String(h.location ?? cityName),
    imageUrl: String(h.imageUrl ?? `https://picsum.photos/seed/${cityName}-${i}/480/320`),
    stars: Number(h.stars ?? 3),
    originalPrice: Number(h.originalPrice ?? 200000),
    discountPrice: Number(h.discountPrice ?? 200000),
    discountRate: h.discountRate != null ? Number(h.discountRate) : undefined,
    isAppDiscount: Boolean(h.isAppDiscount),
    taxIncluded: h.taxIncluded !== false,
    badges: Array.isArray(h.badges) ? (h.badges as string[]) : [],
  }));
}
