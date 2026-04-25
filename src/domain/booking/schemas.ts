import { z } from "zod";

// ─── 예약 확인 페이지 쿼리 파라미터 스키마 ──────────────────────────────────
// 호텔 상세 페이지에서 전달되는 객실 기본 정보
export const confirmPageParamsSchema = z.object({
  roomId: z.string().min(1),
  roomName: z.string().min(1),
  price: z.coerce.number().positive(),
  hotelName: z.string().min(1).optional().default("호텔"),
});

// ─── 결제 페이지 쿼리 파라미터 스키마 ───────────────────────────────────────
// 예약 확인 페이지에서 추가된 투숙 정보 포함
export const paymentPageParamsSchema = confirmPageParamsSchema.extend({
  checkIn: z.string().min(1), // YYYY-MM-DD 형식
  checkOut: z.string().min(1), // YYYY-MM-DD 형식
  guestName: z.string().min(1),
});

// ─── 완료 페이지 쿼리 파라미터 스키마 ───────────────────────────────────────
// 결제 성공 후 PG 응답 데이터 + 예약자/투숙객/할인 정보 포함
export const completePageParamsSchema = paymentPageParamsSchema.extend({
  transactionId: z.string().min(1),
  approvalNumber: z.string().min(1),
  // 예약자 정보
  bookerName: z.string().min(1),
  bookerPhone: z.string().min(1),
  bookerEmail: z.string().min(1),
  // 투숙객 정보 (guestName은 paymentPageParamsSchema에서 상속)
  guestInfoPhone: z.string().min(1),
  // 인원 정보
  adultCount: z.coerce.number().int().min(1).default(2),
  childrenAges: z.string().default("[]"), // JSON 문자열로 전달
  // 결제 금액 정보
  originalAmount: z.coerce.number().min(0),
  promotionDiscount: z.coerce.number().min(0).default(0),
  couponDiscount: z.coerce.number().min(0).default(0),
  finalAmount: z.coerce.number().min(0),
});

// ─── 추론된 TypeScript 타입 ─────────────────────────────────────────────────
export type ConfirmPageParams = z.infer<typeof confirmPageParamsSchema>;
export type PaymentPageParams = z.infer<typeof paymentPageParamsSchema>;
export type CompletePageParams = z.infer<typeof completePageParamsSchema>;

// ─── 한국 전화번호 형식 (010-XXXX-XXXX) ─────────────────────────────────────
export const phoneSchema = z
  .string()
  .regex(/^010-\d{4}-\d{4}$/, "올바른 전화번호 형식이 아닙니다");

// ─── 예약자 정보 스키마 ─────────────────────────────────────────────────────
export const bookerInfoSchema = z
  .object({
    name: z.string().min(1, "이름을 입력해주세요"),
    phone: phoneSchema,
    email: z.string().email("올바른 이메일 형식이 아닙니다"),
    emailConfirm: z.string().email("올바른 이메일 형식이 아닙니다"),
  })
  .refine((data) => data.email === data.emailConfirm, {
    message: "이메일이 일치하지 않습니다",
    path: ["emailConfirm"],
  });

// ─── 투숙객 정보 스키마 ─────────────────────────────────────────────────────
export const guestInfoSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요"),
  phone: phoneSchema,
});

// ─── 할인 정보 스키마 ───────────────────────────────────────────────────────
export const discountInfoSchema = z.object({
  promotionId: z.string().optional(),
  promotionDiscount: z.coerce.number().min(0).default(0),
  couponCode: z.string().optional(),
  couponDiscount: z.coerce.number().min(0).default(0),
});

// ─── 전체 예약 확인 데이터 통합 스키마 ──────────────────────────────────────
export const bookingConfirmDataSchema = z.object({
  // 객실 기본 정보
  roomId: z.string().min(1),
  roomName: z.string().min(1),
  price: z.coerce.number().positive(),
  // 숙박 일정
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  // 인원 정보
  adultCount: z.coerce.number().int().min(1),
  childrenAges: z.array(z.coerce.number().int().min(0).max(17)).default([]),
  // 예약자/투숙객/할인
  bookerInfo: bookerInfoSchema,
  guestInfo: guestInfoSchema,
  discountInfo: discountInfoSchema,
});

// ─── 추론된 TypeScript 타입 (신규) ──────────────────────────────────────────
export type BookerInfo = z.infer<typeof bookerInfoSchema>;
export type GuestInfo = z.infer<typeof guestInfoSchema>;
export type DiscountInfo = z.infer<typeof discountInfoSchema>;
export type BookingConfirmData = z.infer<typeof bookingConfirmDataSchema>;

