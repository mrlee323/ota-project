"use client";

import { Suspense } from "react";
import { useUtmInit } from "@/application/utm/useUtmInit";

/** useSearchParams를 사용하므로 Suspense 경계 내부에서 실행 */
function UtmInitInner() {
  useUtmInit();
  return null;
}

/** 앱 레이아웃에서 UTM 초기화를 수행하는 컴포넌트 */
export function UtmInitializer() {
  return (
    <Suspense fallback={null}>
      <UtmInitInner />
    </Suspense>
  );
}
