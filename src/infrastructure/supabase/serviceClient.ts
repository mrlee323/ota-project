import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { validateSupabaseServiceEnv } from "./env";

/**
 * service_role 키를 사용하는 Supabase 클라이언트를 반환한다.
 * RLS를 우회하므로 서버 사이드 쓰기 작업(INSERT/UPDATE/DELETE)에만 사용한다.
 * 절대 클라이언트 컴포넌트에서 사용하지 않는다.
 */
export function createServiceClient() {
  const env = validateSupabaseServiceEnv();
  return createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );
}
