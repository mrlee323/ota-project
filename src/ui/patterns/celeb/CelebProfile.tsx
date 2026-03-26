import { ImageWithFallback } from "@/ui/components/ImageWithFallback";
import { TextBadge } from "@/ui/components/Badge";
import type { Celeb, CampaignStatus } from "@/domain/celeb/types";

interface CelebProfileProps {
  /** 셀럽 정보 */
  celeb: Celeb;
  /** 캠페인 상태 */
  campaignStatus: CampaignStatus;
}

/** 셀럽 프로필 — 호텔 상세 페이지 상단에 노출 */
export function CelebProfile({ celeb, campaignStatus }: CelebProfileProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-gray-50 p-4">
      {/* 프로필 이미지 */}
      <ImageWithFallback
        src={celeb.profileImageUrl}
        alt={celeb.name}
        className="w-16 h-16 rounded-full object-cover shrink-0"
      />

      {/* 이름, 소개, 종료 배지 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-gray-900 truncate">
            {celeb.name}
          </h3>
          {campaignStatus === "ENDED" && (
            <TextBadge color="red">캠페인이 종료되었습니다</TextBadge>
          )}
        </div>
        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
          {celeb.introduction}
        </p>
      </div>
    </div>
  );
}
