import type { UtmEntry } from "@/domain/utm/types";
import {
  parseUtmEntry,
  serializeUtmEntry,
  isExpired,
} from "@/domain/utm/validation";

/** sessionStorage 키 (탭 격리용) */
const SESSION_STORAGE_KEY = "utm_entry";
/** localStorage 키 (교차 탭 공유, last-write-wins) */
const LOCAL_STORAGE_KEY = "utm_entry_persistent";

/** 이중 저장소(sessionStorage + localStorage) 기반 UTM 저장소 서비스 */
export const utmStorageService = {
  /**
   * UTM_Entry를 저장한다.
   * - 항상 sessionStorage에 저장 (탭 격리)
   * - 항상 localStorage에도 저장 (last-write-wins, 보존 기간 유형 무관)
   * - SESSION 엔트리도 localStorage에 저장하여 기존 시간 기반 엔트리를 덮어쓴다
   */
  save(entry: UtmEntry): void {
    try {
      const json = serializeUtmEntry(entry);
      sessionStorage.setItem(SESSION_STORAGE_KEY, json);
      localStorage.setItem(LOCAL_STORAGE_KEY, json);
    } catch {
      // 저장소 접근 불가 시 무시 (SSR 등)
    }
  },

  /**
   * 유효한 UTM_Entry를 조회한다.
   * 읽기 우선순위: sessionStorage → localStorage (폴백)
   * 만료 또는 무효하면 해당 저장소에서 삭제 후 null 반환
   */
  load(): UtmEntry | null {
    try {
      // 1. sessionStorage 우선 조회 (탭 격리)
      const sessionEntry = this._loadFrom("session");
      if (sessionEntry !== null) return sessionEntry;

      // 2. localStorage 폴백 (브라우저 재시작 복원)
      const localEntry = this._loadFrom("local");
      if (localEntry !== null) {
        // localStorage에서 복원한 값을 sessionStorage에도 저장하여 탭 격리 유지
        sessionStorage.setItem(
          SESSION_STORAGE_KEY,
          serializeUtmEntry(localEntry),
        );
        return localEntry;
      }

      return null;
    } catch {
      return null;
    }
  },

  /** 양쪽 저장소에서 UTM_Entry를 삭제한다 */
  remove(): void {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // sessionStorage 접근 불가 시 무시
    }
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {
      // localStorage 접근 불가 시 무시
    }
  },

  /** 특정 저장소에서 UTM_Entry를 읽어온다. 만료/무효 시 삭제 후 null 반환 */
  _loadFrom(type: "session" | "local"): UtmEntry | null {
    const storage = type === "session" ? sessionStorage : localStorage;
    const key = type === "session" ? SESSION_STORAGE_KEY : LOCAL_STORAGE_KEY;

    const raw = storage.getItem(key);
    if (raw === null) return null;

    // 무효한 JSON이면 삭제 후 null 반환
    const entry = parseUtmEntry(raw);
    if (entry === null) {
      storage.removeItem(key);
      return null;
    }

    // 만료된 엔트리면 삭제 후 null 반환
    if (isExpired(entry)) {
      storage.removeItem(key);
      return null;
    }

    // localStorage에서 SESSION 엔트리를 로드할 때, sessionStorage가 비어있으면
    // 브라우저 재시작으로 판단하여 만료 처리한다
    if (type === "local" && entry.retentionType === "SESSION") {
      const sessionRaw = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (sessionRaw === null) {
        storage.removeItem(key);
        return null;
      }
    }

    return entry;
  },
};
