"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/ui/components/Button";

/**
 * 폼 제출 상태를 감지하여 제출 중 비활성화되는 버튼
 * useFormStatus는 클라이언트 컴포넌트에서만 사용 가능하므로 별도 분리한다.
 */
export function SubmitButton({
  children,
  ...props
}: ButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="flex-1" {...props}>
      {pending ? "처리 중..." : children}
    </Button>
  );
}
