import "server-only";

// ─── 이미지 생성 (Hugging Face 라우터) ──────────────────────────────────────
//
// HF 가 자체 추론(`hf-inference`)을 내리고 외부 공급자 라우팅으로 옮겼다.
// 예전 경로(`/hf-inference/models/...`)는 전부 410 을 돌려준다 (2026-09-05 실측).
//
// 지금은 공급자를 명시하고 **OpenAI 호환 images 엔드포인트**를 쓴다.
// 공급자가 또 바뀔 수 있으므로 모델·공급자를 환경변수로 뺀다 —
// 어느 공급자가 살아 있는지는 아래로 확인한다:
//   https://huggingface.co/api/models/<model>?expand[]=inferenceProviderMapping

const PROVIDER = process.env.HF_IMAGE_PROVIDER ?? "nscale";
const MODEL = process.env.HF_IMAGE_MODEL ?? "black-forest-labs/FLUX.1-schnell";

/**
 * 프롬프트로 이미지를 만든다.
 * @returns 생성된 이미지 Blob
 */
export async function generateImageWithFlux(prompt: string): Promise<Blob> {
  const token = process.env.HF_API_TOKEN;
  if (!token || token === "[SENSITIVE]") {
    throw new Error("HF_API_TOKEN 환경변수가 설정되지 않았습니다");
  }

  const response = await fetch(
    `https://router.huggingface.co/${PROVIDER}/v1/images/generations`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, prompt, response_format: "b64_json" }),
    },
  );

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`Hugging Face API 오류 (${response.status}): ${message.slice(0, 200)}`);
  }

  const body = (await response.json()) as { data?: { b64_json?: string; url?: string }[] };
  const first = body.data?.[0];

  if (first?.b64_json) {
    const bytes = Uint8Array.from(atob(first.b64_json), (c) => c.charCodeAt(0));
    return new Blob([bytes], { type: "image/png" });
  }
  // 공급자에 따라 base64 대신 URL 을 준다
  if (first?.url) {
    const img = await fetch(first.url);
    if (!img.ok) throw new Error("생성된 이미지를 내려받지 못했습니다");
    return img.blob();
  }

  throw new Error("이미지 응답이 비어 있습니다");
}

/**
 * 도시명/타이틀/프롬프트를 받아 이미지 프롬프트를 만든다.
 * (쇼케이스용 — MD 는 domain/md/imageContext.ts 가 문맥을 붙인다)
 */
export function buildFluxPrompt(
  cityName: string,
  title?: string,
  prompt?: string,
): string {
  const parts = prompt
    ? [
        `A high-end editorial travel photography of ${cityName}.`,
        `${prompt}.`,
        "Cinematic lighting, 8k resolution, highly detailed textures, shot on 35mm lens.",
      ]
    : [
        `A high-end editorial travel photography of ${cityName}.`,
        "Luxurious and iconic city view, elegant hotel atmosphere.",
        "Cinematic lighting, 8k resolution, architectural symmetry, highly detailed textures, shot on 35mm lens.",
      ];
  if (title) parts.push(`Theme: ${title}.`);
  return parts.join(" ");
}
