// src/utils/date.ts

/**
 * 한국 시간(KST, UTC+9) 기준의 YYYY-MM-DD 날짜 문자열을 반환합니다.
 */
export const getTodayKstDate = (): string => {
    const now = new Date();
    // 로컬 시간대의 오프셋을 적용하여 KST 기준 YYYY-MM-DD 반환
    const offset = now.getTimezoneOffset() * 60000;
    const kstDate = new Date(now.getTime() - offset);
    return kstDate.toISOString().split("T")[0];
  };