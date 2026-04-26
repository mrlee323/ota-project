"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { ImageWithFallback } from "@/ui/components/ImageWithFallback";
import {
  DiscountBadge,
  LowestPriceBadge,
  PromoTag,
  TextBadge,
} from "@/ui/components/Badge";
import {
  type ShowcaseHotelCard,
  formatPrice,
} from "@/domain/hotel/showcaseTypes";

interface ShowcaseHotelCardProps {
  hotel: ShowcaseHotelCard;
}

/** 뱃지 문자열을 적절한 Badge 컴포넌트로 매핑한다 */
function renderBadge(badge: string, idx: number) {
  if (badge === "최저가보장") return <LowestPriceBadge key={idx} />;
  if (badge === "플러스딜") return <PromoTag key={idx}>{badge}</PromoTag>;
  return <TextBadge key={idx}>{badge}</TextBadge>;
}

export function ShowcaseHotelCard({ hotel }: ShowcaseHotelCardProps) {
  return (
    <Link
      href={`/hotel/${hotel.id}`}
      className="w-[240px] shrink-0 group cursor-pointer block"
    >
      {/* 호텔 이미지 */}
      <div className="relative h-[160px] rounded-2xl overflow-hidden mb-3">
        <ImageWithFallback
          src={hotel.imageUrl}
          alt={`${hotel.name} 호텔 이미지`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* 앱 할인 뱃지 */}
        {hotel.isAppDiscount && (
          <div className="absolute top-2.5 left-2.5 bg-brand text-white text-[10px] font-bold px-2 py-0.5 rounded">
            앱 할인
          </div>
        )}
      </div>

      {/* 호텔 정보 */}
      <div>
        {/* 등급 + 지역명 */}
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">
          <span className="flex items-center gap-0.5">
            <Star size={12} className="fill-yellow-400 text-yellow-400" />
            {hotel.stars}성급
          </span>
          <span>·</span>
          <span>{hotel.location}</span>
        </div>

        {/* 호텔명 */}
        <h3 className="text-sm text-gray-900 font-semibold truncate mb-1.5 group-hover:text-brand transition-colors">
          {hotel.name}
        </h3>

        {/* 가격 영역 */}
        <div className="flex items-baseline gap-1.5">
          {hotel.discountRate != null && hotel.discountRate > 0 && (
            <DiscountBadge percent={hotel.discountRate} />
          )}
          <span className="text-xs text-gray-400 line-through">
            {formatPrice(hotel.originalPrice)}
          </span>
          <span className="text-sm font-bold text-gray-900">
            {formatPrice(hotel.discountPrice)}
          </span>
        </div>

        {/* 세금 및 봉사료 포함 */}
        {hotel.taxIncluded && (
          <p className="text-[10px] text-gray-400 mt-0.5">
            세금 및 봉사료 포함
          </p>
        )}

        {/* 뱃지 목록 */}
        {hotel.badges.length > 0 && (
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            {hotel.badges.map((badge, idx) => renderBadge(badge, idx))}
          </div>
        )}
      </div>
    </Link>
  );
}
