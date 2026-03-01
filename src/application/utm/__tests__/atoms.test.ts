import { describe, it, expect } from "vitest";
import { createStore } from "jotai";
import { utmSourceAtom, utmInitializedAtom } from "../atoms";
import type { UtmEntry } from "@/domain/utm/types";

describe("utmSourceAtom", () => {
  it("초기값은 null이어야 한다", () => {
    const store = createStore();
    expect(store.get(utmSourceAtom)).toBeNull();
  });

  it("utmInitializedAtom 초기값은 false이어야 한다", () => {
    const store = createStore();
    expect(store.get(utmInitializedAtom)).toBe(false);
  });

  it("utmInitializedAtom을 true로 설정하면 초기화 완료를 표현해야 한다", () => {
    const store = createStore();
    store.set(utmInitializedAtom, true);
    expect(store.get(utmInitializedAtom)).toBe(true);
  });

  it("UtmEntry를 설정하면 해당 값을 반환해야 한다", () => {
    const store = createStore();
    const entry: UtmEntry = {
      source: "google",
      retentionType: "30_DAYS",
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      createdAt: Date.now(),
    };

    store.set(utmSourceAtom, entry);
    expect(store.get(utmSourceAtom)).toEqual(entry);
  });

  it("null로 설정하면 UTM 소스가 없는 상태를 표현해야 한다", () => {
    const store = createStore();
    const entry: UtmEntry = {
      source: "naver",
      retentionType: "7_DAYS",
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      createdAt: Date.now(),
    };

    store.set(utmSourceAtom, entry);
    store.set(utmSourceAtom, null);
    expect(store.get(utmSourceAtom)).toBeNull();
  });

  it("구독 중인 상태가 변경되면 새 값을 반영해야 한다", () => {
    const store = createStore();
    const values: (UtmEntry | null)[] = [];

    store.sub(utmSourceAtom, () => {
      values.push(store.get(utmSourceAtom));
    });

    const entry: UtmEntry = {
      source: "facebook",
      retentionType: "SESSION",
      expiresAt: null,
      createdAt: Date.now(),
    };

    store.set(utmSourceAtom, entry);
    store.set(utmSourceAtom, null);

    expect(values).toEqual([entry, null]);
  });
});
