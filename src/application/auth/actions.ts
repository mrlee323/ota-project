"use server";

import { redirect } from "next/navigation";
import { authCredentialsSchema } from "@/domain/auth/schema";
import {
  signInWithEmail,
  signUpWithEmail,
  signOut,
} from "@/infrastructure/supabase/auth";

/**
 * 로그인 Server Action
 * FormData에서 이메일/비밀번호를 추출하여 검증 후 로그인을 수행한다.
 * 성공 시 홈으로, 실패 시 에러 메시지와 함께 /login으로 리다이렉트한다.
 */
export async function loginAction(formData: FormData): Promise<void> {
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");

  // 입력값 검증
  const parsed = authCredentialsSchema.safeParse({
    email: rawEmail,
    password: rawPassword,
  });

  if (!parsed.success) {
    const errorMessage = parsed.error.errors[0]?.message ?? "입력값이 올바르지 않습니다";
    redirect(`/login?error=${encodeURIComponent(errorMessage)}`);
  }

  const { email, password } = parsed.data;

  // Supabase Auth 로그인 호출
  const result = await signInWithEmail(email, password);

  if (!result.success) {
    const errorMessage = result.error ?? "이메일 또는 비밀번호가 올바르지 않습니다";
    redirect(`/login?error=${encodeURIComponent(errorMessage)}`);
  }

  redirect("/");
}

/**
 * 회원가입 Server Action
 * FormData에서 이메일/비밀번호/비밀번호 확인을 추출하여 검증 후 회원가입을 수행한다.
 * 성공 시 홈으로, 실패 시 에러 메시지와 함께 /signup으로 리다이렉트한다.
 */
export async function signupAction(formData: FormData): Promise<void> {
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");
  const rawPasswordConfirm = formData.get("passwordConfirm");
  const agreedTerms = formData.get("terms");

  // 약관 동의 확인
  if (!agreedTerms) {
    redirect(`/signup?error=${encodeURIComponent("이용약관에 동의해주세요")}`);
  }

  // 비밀번호 확인 일치 검증
  if (rawPassword !== rawPasswordConfirm) {
    redirect(`/signup?error=${encodeURIComponent("비밀번호가 일치하지 않습니다")}`);
  }

  // 입력값 검증
  const parsed = authCredentialsSchema.safeParse({
    email: rawEmail,
    password: rawPassword,
  });

  if (!parsed.success) {
    const errorMessage = parsed.error.errors[0]?.message ?? "입력값이 올바르지 않습니다";
    redirect(`/signup?error=${encodeURIComponent(errorMessage)}`);
  }

  const { email, password } = parsed.data;

  // Supabase Auth 회원가입 호출
  const result = await signUpWithEmail(email, password);

  if (!result.success) {
    const errorMessage = result.error ?? "회원가입 처리 중 오류가 발생했습니다";
    redirect(`/signup?error=${encodeURIComponent(errorMessage)}`);
  }

  redirect("/");
}

/**
 * 로그아웃 Server Action
 * 세션을 종료하고 홈으로 리다이렉트한다.
 * 오류 발생 시 로깅 후에도 홈으로 리다이렉트한다.
 */
export async function logoutAction(): Promise<void> {
  const result = await signOut();

  if (!result.success) {
    console.error("로그아웃 오류:", result.error);
  }

  redirect("/");
}
