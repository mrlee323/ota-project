import { NextResponse } from "next/server";
import {
  generateImageWithFlux,
  buildFluxPrompt,
} from "@/infrastructure/imageGeneration/huggingFaceApi";
import { uploadImage } from "@/infrastructure/supabase/storageApi";

interface GenerateImageBody {
  cityName: string;
  title?: string;
  prompt?: string;
  folder?: string;
}

/**
 * POST /api/upload/image/generate
 * Hugging Face FLUX 모델로 이미지를 생성하고 Supabase Storage에 업로드한다.
 *
 * Body: JSON
 *   - cityName: string (필수)
 *   - title: string (선택)
 *   - prompt: string (선택)
 *   - folder: string (선택, 기본값 "showcase")
 *
 * Response: { url: string }
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateImageBody;
    const { cityName, title, prompt, folder = "showcase" } = body;

    if (!cityName) {
      return NextResponse.json(
        { error: "cityName이 필요합니다" },
        { status: 400 },
      );
    }

    const fluxPrompt = buildFluxPrompt(cityName, title, prompt);
    const blob = await generateImageWithFlux(fluxPrompt);

    // Supabase Storage는 비ASCII 문자를 허용하지 않으므로 slug로 변환
    const safeCity = cityName
      .normalize("NFD")
      .replace(/[^\x00-\x7F]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase() || `city-${Date.now()}`;
    const path = `${folder}/${safeCity}/${Date.now()}.jpg`;
    const url = await uploadImage(path, blob);

    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "이미지 생성 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
