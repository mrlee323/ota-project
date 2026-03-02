"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAtomValue } from "jotai";
import { Heart, Star } from "lucide-react";
import {
  AIBadge,
  LowestPriceBadge,
  PromoTag,
  SpecialTag,
  BestTag,
  BreakfastTag,
  TimeLimitTag,
} from "../components/Badge";
import { HotelCardItem } from "@/domain/hotel/types";
import { serializeSearchParams } from "@/domain/search/validation";
import { createDefaultSearchParams } from "@/domain/search/defaults";
import { searchParamsAtom } from "@/application/search/atoms";

export type Hotel = HotelCardItem;

interface HotelCardProps {
  hotel: Hotel;
  size?: "sm" | "md" | "lg";
}

function renderPromoTag(tag: string, idx: number) {
  if (tag === "기간한정") return <TimeLimitTag key={idx} />;
  if (tag === "조식포함") return <BreakfastTag key={idx} />;
  if (tag === "BEST") return <BestTag key={idx} />;
  if (tag.startsWith("SPECIAL"))
    return <SpecialTag key={idx}>{tag.replace("SPECIAL ", "")}</SpecialTag>;
  return <PromoTag key={idx}>{tag}</PromoTag>;
}

export function HotelCard({ hotel, size = "md" }: HotelCardProps) {
  const [liked, setLiked] = useState(false);
  const currentSearchParams = useAtomValue(searchParamsAtom);

  // 검색 파라미터가 없으면 기본값을 생성하여 쿼리 문자열에 포함한다
  const detailHref = useMemo(() => {
    const params = currentSearchParams ?? createDefaultSearchParams();
    const queryString = serializeSearchParams(params);
    return `/hotel/${hotel.id}?${queryString}`;
  }, [currentSearchParams, hotel.id]);

  const cardWidth =
    size === "lg" ? "w-[268px]" : size === "sm" ? "w-[200px]" : "w-[240px]";
  const imgHeight =
    size === "lg" ? "h-[176px]" : size === "sm" ? "h-[140px]" : "h-[160px]";

  return (
    <Link href={detailHref} className={`${cardWidth} shrink-0 group cursor-pointer block`}>
      {/* Image */}
      <div className={`relative ${imgHeight} rounded-2xl overflow-hidden mb-3`}>
        <img
          src={hotel.image}
          alt={hotel.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Discount badge */}
        {hotel.discount && (
          <div className="absolute top-2.5 left-2.5 text-white text-[11px] font-bold px-2 py-0.5 rounded bg-brand">
            {hotel.discount}% OFF
          </div>
        )}
        {/* Badge */}
        {hotel.badge && !hotel.discount && (
          <div className="absolute top-2.5 left-2.5 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">
            {hotel.badge}
          </div>
        )}
        {/* Heart button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setLiked(!liked);
          }}
          className="absolute top-2.5 right-2.5 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
        >
          <Heart
            size={14}
            className={liked ? "fill-brand text-brand" : "text-gray-300"}
          />
        </button>
        {/* Bottom promo tags on image */}
        {hotel.promoTags && hotel.promoTags.length > 0 && (
          <div className="absolute bottom-2.5 left-2.5 flex gap-1 flex-wrap">
            {hotel.promoTags.slice(0, 2).map((tag, idx) => renderPromoTag(tag, idx))}
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <div className="text-xs text-gray-400 mb-0.5">{hotel.location}</div>
        <h3 className="text-sm text-gray-900 font-semibold truncate mb-1.5 group-hover:text-brand transition-colors">
          {hotel.name}
        </h3>
        {/* Badges row */}
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <div className="flex items-center gap-1">
            <Star size={12} className="fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-semibold text-gray-800">
              {hotel.rating.toFixed(2)}
            </span>
            <span className="text-xs text-gray-400">
              ({hotel.reviewCount.toLocaleString()})
            </span>
          </div>
          {hotel.isLowestPrice && <LowestPriceBadge />}
          {hotel.isAI && <AIBadge variant="outline" />}
        </div>
        {/* Price */}
        <div className="flex items-baseline gap-1.5">
          {hotel.originalPrice && (
            <span className="text-xs text-gray-400 line-through">
              {hotel.originalPrice.toLocaleString()}원~
            </span>
          )}
          {hotel.discount && (
            <span className="text-xs font-bold text-brand">
              {hotel.discount}%
            </span>
          )}
          <span className="text-sm font-bold text-gray-900">
            {hotel.price.toLocaleString()}원~
          </span>
        </div>
      </div>
    </Link>
  );
}
