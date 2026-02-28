// Tripbtoz Design System - Tag & Badge Components

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

// 프로모션 태그 - 검정 배경
export function PromoTag({ children }: BadgeProps) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-gray-900 text-white text-[10px] font-medium whitespace-nowrap">
      {children}
    </span>
  );
}

// 프로모션 태그 - 테두리만
export function PromoTagOutline({ children }: BadgeProps) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border border-gray-900 text-gray-900 text-[10px] font-medium whitespace-nowrap">
      {children}
    </span>
  );
}

// 할인율 뱃지 - Primary 보라색
export function DiscountBadge({ percent }: { percent: number }) {
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-white text-[11px] font-bold"
      style={{ backgroundColor: "#6728E0" }}
    >
      {percent}%
    </span>
  );
}

// 최저가 보장 뱃지
export function LowestPriceBadge() {
  return (
    <span
      className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border"
      style={{ color: "#E0458C", borderColor: "#E0458C", backgroundColor: "#FFF0F5" }}
    >
      최저가보장
    </span>
  );
}

// AI 뱃지 - 보라 계열
export function AIBadge({ variant = "filled" }: { variant?: "filled" | "outline" }) {
  if (variant === "outline") {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
        style={{ color: "#6728E0", borderColor: "#6728E0", backgroundColor: "#F4EFFE" }}
      >
        ✦ AI가격분석
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-[10px] font-bold"
      style={{ background: "linear-gradient(90deg, #6728E0, #9B5CF6)" }}
    >
      ✦ AI SAVE
    </span>
  );
}

// 지도/지역 태그
type LocationColor = "orange" | "green" | "teal" | "blue" | "purple" | "lime";

const locationColorMap: Record<LocationColor, { bg: string; text: string }> = {
  orange: { bg: "#FF8800", text: "#fff" },
  green: { bg: "#44BB44", text: "#fff" },
  teal: { bg: "#00CCCC", text: "#fff" },
  blue: { bg: "#0088FF", text: "#fff" },
  purple: { bg: "#6728E0", text: "#fff" },
  lime: { bg: "#99CC00", text: "#fff" },
};

export function LocationTag({
  children,
  color = "purple",
}: {
  children: React.ReactNode;
  color?: LocationColor;
}) {
  const { bg, text } = locationColorMap[color];
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold"
      style={{ backgroundColor: bg, color: text }}
    >
      {children}
    </span>
  );
}

// SPECIAL / EVENT 태그
export function SpecialTag({ children }: BadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold"
      style={{ backgroundColor: "#6728E0", color: "#fff" }}
    >
      ✦ {children}
    </span>
  );
}

// 기간한정 태그
export function TimeLimitTag() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-gray-900 text-white text-[10px] font-medium">
      ⏱ 기간한정
    </span>
  );
}

// 조식포함 태그
export function BreakfastTag() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-gray-900 text-white text-[10px] font-medium">
      🍳 조식포함
    </span>
  );
}

// BEST 추천 태그
export function BestTag() {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold"
      style={{ backgroundColor: "#FF8800", color: "#fff" }}
    >
      ★ BEST 추천
    </span>
  );
}

// 리뷰 평점 태그
export function RatingTag({ score }: { score: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold"
      style={{ backgroundColor: "#FFCC00", color: "#111" }}
    >
      ★ {score.toFixed(2)}
    </span>
  );
}

// 가성비 태그
export function ValueTag() {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border"
      style={{ color: "#0088FF", borderColor: "#0088FF", backgroundColor: "#EFF6FF" }}
    >
      가성비
    </span>
  );
}

// 일반 텍스트 뱃지
export function TextBadge({
  children,
  color = "gray",
}: {
  children: React.ReactNode;
  color?: "gray" | "purple" | "blue" | "green" | "red";
}) {
  const colorMap = {
    gray: "bg-gray-100 text-gray-600",
    purple: "text-white",
    blue: "text-white",
    green: "text-white",
    red: "text-white",
  };
  const bgMap = {
    gray: {},
    purple: { backgroundColor: "#6728E0" },
    blue: { backgroundColor: "#0088FF" },
    green: { backgroundColor: "#44BB44" },
    red: { backgroundColor: "#FF4D4D" },
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${colorMap[color]}`}
      style={bgMap[color]}
    >
      {children}
    </span>
  );
}
