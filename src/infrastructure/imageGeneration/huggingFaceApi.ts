import "server-only";

const HF_MODEL_URL =
  "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell";

/**
 * Hugging Face FLUX.1-schnell 모델로 이미지를 생성한다.
 * @returns 생성된 이미지 Blob (image/jpeg)
 */
export async function generateImageWithFlux(prompt: string): Promise<Blob> {
  const token = process.env.HF_API_TOKEN;
  if (!token) throw new Error("HF_API_TOKEN 환경변수가 설정되지 않았습니다");

  const response = await fetch(HF_MODEL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: prompt }),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`Hugging Face API 오류 (${response.status}): ${message}`);
  }

  return response.blob();
}

/**
 * 도시명/타이틀/프롬프트를 받아 FLUX용 이미지 프롬프트를 생성한다.
 */
export function buildFluxPrompt(
  cityName: string,
  title?: string,
  prompt?: string,
): string {
  const parts = [
    `${cityName} luxury hotel`,
    "travel photography",
    "cinematic",
    "high quality",
    "8k",
  ];
  if (title) parts.push(title);
  if (prompt) parts.push(prompt);
  return parts.join(", ");
}
