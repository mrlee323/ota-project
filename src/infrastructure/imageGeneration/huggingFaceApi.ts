import "server-only";

const HF_MODEL_URL =
  "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell";

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
  const mood = prompt
    ? `Focus on the mood of "${prompt}".`
    : "Focus on a luxurious and iconic city view.";

  const parts = [
    `A high-end editorial travel photography of ${cityName}.`,
    mood,
    "Cinematic lighting, 8k resolution, architectural symmetry, elegant hotel atmosphere, highly detailed textures, shot on 35mm lens.",
  ];

  if (title) parts.push(`Theme: ${title}.`);

  return parts.join(" ");
}
