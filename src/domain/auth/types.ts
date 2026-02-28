/** 인증 액션 결과 타입 */
export interface AuthResult {
  success: boolean;
  error?: string;
}

/** 인증 상태 */
export type AuthStatus = "authenticated" | "unauthenticated" | "loading";
