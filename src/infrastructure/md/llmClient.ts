import "server-only";
import OpenAI from "openai";

// ─── LLM 클라이언트 ─────────────────────────────────────────────────────────
//
// **공급자를 코드에 박지 않는다** (llm.md §2).
//
// 무료 티어는 자주 바뀐다. 주요 공급자가 전부 OpenAI 호환 엔드포인트와
// `response_format: { type: "json_schema" }` 를 지원하므로,
// baseURL 만 환경변수로 빼면 교체가 한 줄이 된다.
//
// 추상화 층을 만들지 않는다 — 공급자들이 이미 같은 인터페이스를 말한다.

export const LLM_MODEL = process.env.LLM_EXTRACT_MODEL ?? "";

export function isLlmConfigured(): boolean {
  return Boolean(process.env.LLM_EXTRACT_KEY && process.env.LLM_EXTRACT_URL && LLM_MODEL);
}

let client: OpenAI | null = null;

export function getLlm(): OpenAI {
  if (!isLlmConfigured()) {
    throw new Error(
      "LLM 설정이 없습니다. .env.local 에 LLM_EXTRACT_URL · LLM_EXTRACT_KEY · LLM_EXTRACT_MODEL 을 채우세요.",
    );
  }
  if (!client) {
    client = new OpenAI({
      baseURL: process.env.LLM_EXTRACT_URL,
      apiKey: process.env.LLM_EXTRACT_KEY,
    });
  }
  return client;
}
