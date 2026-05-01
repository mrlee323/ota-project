import { NextResponse } from "next/server";
import { uploadImage } from "@/infrastructure/supabase/storageApi";

/**
 * POST /api/upload/image
 * 사용자가 선택한 파일을 Supabase Storage에 업로드한다.
 *
 * Body: FormData
 *   - file: File (필수)
 *   - folder: string (선택, 기본값 "uploads")
 *
 * Response: { url: string }
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string | null) ?? "uploads";

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${folder}/${Date.now()}.${ext}`;

    const url = await uploadImage(path, file);

    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "업로드 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
