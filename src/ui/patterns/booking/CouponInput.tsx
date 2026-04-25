"use client";

import React, { useState } from "react";

// ─── Props 인터페이스 ────────────────────────────────────────────────────────

interface CouponInputProps {
  /** 쿠폰 적용 콜백 — 유효한 쿠폰이면 할인 금액 반환, 무효하면 null */
  onApply: (couponCode: string) => Promise<{ discount: number } | null>;
  /** 쿠폰 적용 성공 시 콜백 */
  onSuccess: (couponCode: string, discount: number) => void;
  /** 현재 적용된 쿠폰 코드 (있으면 표시) */
  appliedCoupon?: string;
  /** 쿠폰 제거 콜백 */
  onRemove?: () => void;
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────

/** 쿠폰 코드 입력 및 적용 컴포넌트 — 유효/무효 피드백을 제공한다 */
export function CouponInput({
  onApply,
  onSuccess,
  appliedCoupon,
  onRemove,
}: CouponInputProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 쿠폰 적용 핸들러
  const handleApply = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await onApply(trimmed);

      if (result) {
        setSuccessMessage(
          `쿠폰이 적용되었습니다 (${result.discount.toLocaleString()}원 할인)`
        );
        setError(null);
        onSuccess(trimmed, result.discount);
        setCode("");
      } else {
        setError("유효하지 않은 쿠폰 코드입니다");
        setSuccessMessage(null);
      }
    } catch {
      setError("쿠폰 적용 중 오류가 발생했습니다");
      setSuccessMessage(null);
    } finally {
      setLoading(false);
    }
  };

  // 쿠폰 제거 핸들러
  const handleRemove = () => {
    setCode("");
    setError(null);
    setSuccessMessage(null);
    onRemove?.();
  };

  // 이미 적용된 쿠폰이 있는 경우
  if (appliedCoupon) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-green-800">
              적용된 쿠폰
            </span>
            <p className="mt-0.5 text-sm text-green-700">{appliedCoupon}</p>
          </div>
          {onRemove && (
            <button
              type="button"
              onClick={handleRemove}
              aria-label="쿠폰 제거"
              className="text-sm text-red-500 hover:text-red-700"
            >
              제거
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-bold text-gray-900">쿠폰 적용</h3>

      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            // 입력 변경 시 이전 피드백 초기화
            if (error) setError(null);
            if (successMessage) setSuccessMessage(null);
          }}
          placeholder="쿠폰 코드를 입력하세요"
          aria-label="쿠폰 코드"
          disabled={loading}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand disabled:bg-gray-100"
        />
        <button
          type="button"
          onClick={handleApply}
          disabled={loading || !code.trim()}
          aria-label="쿠폰 적용"
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "적용 중..." : "적용"}
        </button>
      </div>

      {/* 성공 메시지 */}
      {successMessage && (
        <p className="mt-2 text-sm text-green-600" role="alert">
          {successMessage}
        </p>
      )}

      {/* 오류 메시지 */}
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
