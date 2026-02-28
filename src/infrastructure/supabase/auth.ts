import { createClient } from "./server";
import type { AuthResult } from "@/domain/auth/types";
import type { User } from "@supabase/supabase-js";

/**
 * 이메일/비밀번호로 로그인한다.
 * Supabase Auth의 signInWithPassword를 호출하여 인증을 수행한다.
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch {
    return { success: false, error: "인증 처리 중 오류가 발생했습니다" };
  }
}

/**
 * 이메일/비밀번호로 회원가입한다.
 * Supabase Auth의 signUp을 호출하여 새 계정을 생성한다.
 */
export async function signUpWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch {
    return { success: false, error: "인증 처리 중 오류가 발생했습니다" };
  }
}

/**
 * 현재 세션에서 로그아웃한다.
 * Supabase Auth의 signOut을 호출하여 세션을 종료한다.
 */
export async function signOut(): Promise<AuthResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch {
    return { success: false, error: "로그아웃 처리 중 오류가 발생했습니다" };
  }
}

/**
 * 현재 인증된 사용자 정보를 조회한다.
 * 인증되지 않은 경우 null을 반환한다.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user;
  } catch {
    return null;
  }
}
