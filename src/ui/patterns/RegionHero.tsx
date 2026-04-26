"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface RegionHeroProps {
  /** 배경 이미지 URL */
  backgroundImage: string;
  /** 지역명 (예: "교토") */
  regionName: string;
  /** 테마 텍스트 (예: "교토 벚꽃뷰 숙소") */
  themeText: string;
  /** "전체보기" 버튼 클릭 시 이동할 경로 */
  viewAllHref: string;
}

/** 지역 히어로 영역 — 배경 이미지 위에 지역명, 테마 텍스트, 전체보기 버튼을 오버레이한다 */
export function RegionHero({
  backgroundImage,
  regionName,
  themeText,
  viewAllHref,
}: RegionHeroProps) {
  return (
    <div className="relative w-full h-[240px] md:h-[320px] rounded-2xl overflow-hidden">
      {/* 배경 이미지 */}
      <img
        src={backgroundImage}
        alt={`${regionName} 지역 배경 이미지`}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* 어두운 그라데이션 오버레이 — 텍스트 가독성 확보 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      {/* 텍스트 + 버튼 오버레이 */}
      <div className="relative h-full flex flex-col justify-end p-5 md:p-8">
        <h3 className="text-white text-2xl md:text-3xl font-bold mb-1">
          {regionName}
        </h3>
        <p className="text-white/80 text-sm md:text-base mb-4">
          {themeText}
        </p>
        <Link
          href={viewAllHref}
          className="inline-flex items-center gap-1 text-white text-sm font-medium hover:opacity-80 transition-opacity w-fit"
        >
          전체보기 <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
