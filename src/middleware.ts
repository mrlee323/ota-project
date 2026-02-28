import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { validateSupabaseEnv } from "./infrastructure/supabase/env";

/**
 * 모든 요청에서 Supabase 세션을 갱신한다.
 * 정적 자산 요청은 matcher 설정으로 제외한다.
 * 세션 갱신 실패 시 에러를 로깅하고 요청 처리를 계속 진행한다.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    const env = validateSupabaseEnv();

    // 미들웨어 전용 Supabase 서버 클라이언트 생성
    // request/response 쿠키를 직접 다루기 위해 인라인으로 생성한다
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            for (const { name, value, options } of cookiesToSet) {
              request.cookies.set(name, value);
              response.cookies.set(name, value, options);
            }
          },
        },
      },
    );

    // 세션 갱신을 위해 getUser 호출
    await supabase.auth.getUser();
  } catch (error) {
    // 세션 갱신 실패가 사용자 요청을 차단하지 않도록 에러를 로깅하고 계속 진행
    console.error("Supabase 세션 갱신 중 오류 발생:", error);
  }

  return response;
}

/** 미들웨어 적용 대상 경로 설정 - 정적 자산 및 이미지 파일 제외 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
