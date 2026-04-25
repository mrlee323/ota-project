import { describe, it, expect } from "vitest";
import {
  phoneSchema,
  bookerInfoSchema,
  guestInfoSchema,
  discountInfoSchema,
  bookingConfirmDataSchema,
} from "./schemas";

// ─── phoneSchema ────────────────────────────────────────────────────────────

describe("phoneSchema", () => {
  it("유효한 한국 전화번호를 파싱한다", () => {
    expect(phoneSchema.safeParse("010-1234-5678").success).toBe(true);
    expect(phoneSchema.safeParse("010-0000-0000").success).toBe(true);
  });

  it("잘못된 형식의 전화번호를 거부한다", () => {
    const invalid = ["01012345678", "011-1234-5678", "010-123-5678", "010-12345-678", "abc"];
    for (const v of invalid) {
      const result = phoneSchema.safeParse(v);
      expect(result.success, `"${v}" should be invalid`).toBe(false);
    }
  });
});

// ─── bookerInfoSchema ───────────────────────────────────────────────────────

describe("bookerInfoSchema", () => {
  const valid = {
    name: "홍길동",
    phone: "010-1234-5678",
    email: "test@example.com",
    emailConfirm: "test@example.com",
  };

  it("유효한 예약자 정보를 파싱한다", () => {
    expect(bookerInfoSchema.safeParse(valid).success).toBe(true);
  });

  it("이메일이 일치하지 않으면 실패한다", () => {
    const result = bookerInfoSchema.safeParse({ ...valid, emailConfirm: "other@example.com" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("emailConfirm");
    }
  });

  it("이름이 비어있으면 실패한다", () => {
    expect(bookerInfoSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
  });

  it("잘못된 이메일 형식이면 실패한다", () => {
    expect(bookerInfoSchema.safeParse({ ...valid, email: "not-email" }).success).toBe(false);
  });
});

// ─── guestInfoSchema ────────────────────────────────────────────────────────

describe("guestInfoSchema", () => {
  it("유효한 투숙객 정보를 파싱한다", () => {
    const result = guestInfoSchema.safeParse({ name: "김철수", phone: "010-9876-5432" });
    expect(result.success).toBe(true);
  });

  it("이름이 비어있으면 실패한다", () => {
    expect(guestInfoSchema.safeParse({ name: "", phone: "010-1234-5678" }).success).toBe(false);
  });
});

// ─── discountInfoSchema ─────────────────────────────────────────────────────

describe("discountInfoSchema", () => {
  it("기본값으로 할인 0원을 설정한다", () => {
    const result = discountInfoSchema.parse({});
    expect(result.promotionDiscount).toBe(0);
    expect(result.couponDiscount).toBe(0);
  });

  it("음수 할인 금액을 거부한다", () => {
    expect(discountInfoSchema.safeParse({ promotionDiscount: -100 }).success).toBe(false);
  });
});
