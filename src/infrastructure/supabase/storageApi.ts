import { createServiceClient } from "./serviceClient";

const BUCKET = "showcase-images";

/**
 * 파일을 Supabase Storage에 업로드한다.
 * @param path 저장 경로 (예: "showcase/abc123/thumbnail.webp")
 * @param file 업로드할 File 또는 Blob
 * @returns 업로드된 파일의 public URL
 */
export async function uploadImage(path: string, file: File | Blob): Promise<string> {
  const client = createServiceClient();

  const { error } = await client.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: file instanceof File ? file.type : undefined,
  });

  if (error) throw new Error(`이미지 업로드 실패: ${error.message}`);

  return getImageUrl(path);
}

/**
 * Supabase Storage에서 파일을 삭제한다.
 * @param path 삭제할 파일 경로
 */
export async function deleteImage(path: string): Promise<void> {
  const client = createServiceClient();

  const { error } = await client.storage.from(BUCKET).remove([path]);

  if (error) throw new Error(`이미지 삭제 실패: ${error.message}`);
}

/**
 * 파일 경로로 public URL을 반환한다.
 * @param path 파일 경로
 */
export function getImageUrl(path: string): string {
  const client = createServiceClient();

  const { data } = client.storage.from(BUCKET).getPublicUrl(path);

  return data.publicUrl;
}

/**
 * 버킷 내 파일 목록을 조회한다.
 * @param folder 조회할 폴더 경로 (예: "showcase/abc123")
 */
export async function listImages(folder: string) {
  const client = createServiceClient();

  const { data, error } = await client.storage.from(BUCKET).list(folder, {
    sortBy: { column: "created_at", order: "desc" },
  });

  if (error) throw new Error(`이미지 목록 조회 실패: ${error.message}`);

  return data;
}
