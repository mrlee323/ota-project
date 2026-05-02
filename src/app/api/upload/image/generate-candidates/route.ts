import { NextResponse } from "next/server";
import {
  generateImageWithFlux,
  buildFluxPrompt,
} from "@/infrastructure/imageGeneration/huggingFaceApi";
import { uploadImage } from "@/infrastructure/supabase/storageApi";

interface GenerateCandidatesBody {
  cityName: string;
  title?: string;
  prompt?: string;
  count?: number;
}

/**
 * POST /api/upload/image/generate-candidates
 * FLUX 모델로 N장의 이미지를 병렬 생성하고 Supabase Storage에 업로드한다.
 *
 * Body: JSON
 *   - cityName: string (필수)
 *   - title: string (선택)
 *   - prompt: string (선택)
 *   - count: 2 | 3 (선택, 기본값 2)
 *
 * Response: { candidates: string[] }
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateCandidatesBody;
    const { cityName, title, prompt, count = 2 } = body;

    if (!cityName) {
      return NextResponse.json({ error: "cityName이 필요합니다" }, { status: 400 });
    }

    const safeCity = cityName
      .normalize("NFD")
      .replace(/[^\x00-\x7F]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase() || `city-${Date.now()}`;

    const fluxPrompt = buildFluxPrompt(cityName, title, prompt);
    const now = Date.now();

    const blobs = await Promise.all(
      Array.from({ length: Math.min(count, 3) }, () => generateImageWithFlux(fluxPrompt)),
    );

    const urls = await Promise.all(
      blobs.map((blob, i) =>
        uploadImage(`showcase/${safeCity}/candidates/${now}-${i}.jpg`, blob),
      ),
    );

    return NextResponse.json({ candidates: urls });
  } catch (err) {
    const message = err instanceof Error ? err.message : "이미지 후보 생성 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
