import { z } from "zod";

/** 로그인/회원가입 폼 입력값 검증 스키마 */
export const authCredentialsSchema = z.object({
  email: z.string().email("유효한 이메일 주소를 입력해주세요"),
  password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다"),
});

/** 검증된 인증 자격증명 타입 */
export type AuthCredentials = z.infer<typeof authCredentialsSchema>;
