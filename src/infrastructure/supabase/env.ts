import { z } from "zod";

/** Supabase 환경 변수 Zod 스키마 */
export const supabaseEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("유효한 Supabase URL이 필요합니다"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "Supabase Anon Key가 필요합니다"),
});

/** Supabase 서비스 롤 환경 변수 스키마 (서버 전용) */
export const supabaseServiceEnvSchema = supabaseEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "Supabase Service Role Key가 필요합니다"),
});

/** 검증된 환경 변수 타입 */
export type SupabaseEnv = z.infer<typeof supabaseEnvSchema>;
export type SupabaseServiceEnv = z.infer<typeof supabaseServiceEnvSchema>;

/** 캐싱된 환경 변수 (런타임 중 변경되지 않으므로 한 번만 파싱) */
let cachedEnv: SupabaseEnv | null = null;

/**
 * Supabase 환경 변수를 검증하고 타입-안전한 객체를 반환한다.
 * 최초 호출 시 Zod 파싱을 수행하고, 이후에는 캐싱된 결과를 반환한다.
 * 검증 실패 시 구체적인 에러 메시지를 포함한 에러를 throw한다.
 */
export function validateSupabaseEnv(): SupabaseEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  cachedEnv = supabaseEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  return cachedEnv;
}

let cachedServiceEnv: SupabaseServiceEnv | null = null;

/** service_role 키를 포함한 환경 변수를 검증한다. 서버 사이드 전용. */
export function validateSupabaseServiceEnv(): SupabaseServiceEnv {
  if (cachedServiceEnv) return cachedServiceEnv;

  cachedServiceEnv = supabaseServiceEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY:
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  return cachedServiceEnv;
}
