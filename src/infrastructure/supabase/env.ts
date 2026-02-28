import { z } from "zod";

/** Supabase 환경 변수 Zod 스키마 */
export const supabaseEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("유효한 Supabase URL이 필요합니다"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "Supabase Anon Key가 필요합니다"),
});

/** 검증된 환경 변수 타입 */
export type SupabaseEnv = z.infer<typeof supabaseEnvSchema>;

/**
 * Supabase 환경 변수를 검증하고 타입-안전한 객체를 반환한다.
 * 검증 실패 시 구체적인 에러 메시지를 포함한 에러를 throw한다.
 */
export function validateSupabaseEnv(): SupabaseEnv {
  return supabaseEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}
