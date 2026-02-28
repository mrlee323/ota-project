"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/ui/components/Card";
import { Input } from "@/ui/components/Input";
import { Button } from "@/ui/components/Button";
import { createClient } from "@/infrastructure/supabase/client";
import { authCredentialsSchema } from "@/domain/auth/schema";

/**
 * 로그인 페이지 (Client Component)
 * 브라우저 Supabase 클라이언트로 직접 로그인하여
 * onAuthStateChange가 즉시 감지되도록 한다.
 */
export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const rawEmail = formData.get("email");
    const rawPassword = formData.get("password");

    // Zod 검증
    const parsed = authCredentialsSchema.safeParse({
      email: rawEmail,
      password: rawPassword,
    });

    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "입력값이 올바르지 않습니다");
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });

      if (authError) {
        setError(authError.message);
        setIsLoading(false);
        return;
      }

      // 로그인 성공 → onAuthStateChange가 자동 감지 → Header 즉시 업데이트
      router.push("/");
      router.refresh();
    } catch {
      setError("로그인 처리 중 오류가 발생했습니다");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-400 via-purple-600 to-brand-500 px-4">
      {/* 로고 */}
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
          <span className="text-lg font-black text-white">T</span>
        </div>
        <span className="text-2xl font-black tracking-tight text-white">OTA</span>
      </div>

      <Card className="w-full max-w-md border-0 shadow-2xl">
        <CardContent className="space-y-6 p-8">
          <div className="space-y-1 text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              여행의 시작, 로그인
            </h1>
            <p className="text-sm text-gray-500">
              이메일로 로그인하거나 새 계정을 만드세요
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              name="email"
              type="email"
              label="이메일"
              placeholder="이메일을 입력하세요"
              required
              className="focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
            <Input
              name="password"
              type="password"
              label="비밀번호"
              placeholder="비밀번호를 입력하세요"
              required
              className="focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
            <div className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full rounded-lg"
                disabled={isLoading}
              >
                {isLoading ? "처리 중..." : "로그인"}
              </Button>
              <p className="text-center text-sm text-gray-500">
                계정이 없으신가요?{" "}
                <a href="/signup" className="font-medium text-purple-600 hover:text-purple-700">
                  회원가입
                </a>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 text-sm text-white/60">
        국내외 최저가 호텔을 트립비토즈에서 찾아보세요
      </p>
    </div>
  );
}
