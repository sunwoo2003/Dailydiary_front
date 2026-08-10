// src/services/api.ts

const USE_MOCK = false;
const BASE_URL = "http://localhost:8080/api";

export interface CategoryDomain {
  id: number;
  name: string;
  weight: number;
}

export interface CreateDiaryPayload {
  diary_date: string;
  domain_id: number | string; 
  weight_id: number;
  score1: number;
  score2: number;
  score3: number;
  score4: number;
  score5: number;
  memo: string; 
}
export interface MonthlyDiarySummary {
  diary_id: number;
  diary_date: string;
  weighted_avg: number;
}

export interface SearchDiaryResult {
  diary_id: number;
  diary_date: string;
  memo_preview: string;
}

export interface AiAnalyzePayload {
  weighted_scores: number[];
  memo: string;
}

export interface WeatherResponse {
  status: number;
  code: string;
  message: string;
  result?: {
    weather: string;
    temperature?: string;
  };
}

// 1. 최신 도메인/가중치 설정 조회
export const fetchLatestDomain = async () => {
  if (!USE_MOCK) {
    try {
      const res = await fetch(`${BASE_URL}/domain/latest`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("백엔드 연결 실패, 로컬 데이터로 폴백합니다.", e);
    }
  }

  const saved = localStorage.getItem("haru_line_settings");
  if (!saved) return null;
  const parsed = JSON.parse(saved);
  return {
    domain1_name: parsed.categories[0]?.name || "수면",
    domain2_name: parsed.categories[1]?.name || "식사",
    domain3_name: parsed.categories[2]?.name || "정서",
    domain4_name: parsed.categories[3]?.name || "몰입",
    domain5_name: parsed.categories[4]?.name || "관계",
    weight1_value: parsed.categories[0]?.weight || 1,
    weight2_value: parsed.categories[1]?.weight || 1,
    weight3_value: parsed.categories[2]?.weight || 1,
    weight4_value: parsed.categories[3]?.weight || 1,
    weight5_value: parsed.categories[4]?.weight || 1,
  };
};

// 2. 도메인 및 가중치 저장 (설정 상태 항상 저장)
export const saveDomainSettings = async (categories: CategoryDomain[]) => {
  const payload = {
    domain1_name: categories[0]?.name || "",
    domain2_name: categories[1]?.name || "",
    domain3_name: categories[2]?.name || "",
    domain4_name: categories[3]?.name || "",
    domain5_name: categories[4]?.name || "",
    weight1_value: categories[0]?.weight || 1,
    weight2_value: categories[1]?.weight || 1,
    weight3_value: categories[2]?.weight || 1,
    weight4_value: categories[3]?.weight || 1,
    weight5_value: categories[4]?.weight || 1,
  };


  localStorage.setItem("haru_line_settings", JSON.stringify({ categories }));

  if (!USE_MOCK) {
    try {
      const res = await fetch(`${BASE_URL}/domain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("백엔드 저장 실패, 로컬스토리지로 지속합니다.", e);
    }
  }

  return { status: 201, code: "DOMAIN_CREATE_SUCCESS", result: { domain_id: Date.now(), weight_id: Date.now() } };
};

export const saveDiaryRecord = async (payload: CreateDiaryPayload) => {
  if (!USE_MOCK) {
    try {
      const res = await fetch(`${BASE_URL}/diaries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      // 백엔드 응답의 status가 200/201이 아닌 경우 (400, 409, 500 등)
      if (!res.ok || data.status >= 400) {
        throw new Error(data.message || "일기 저장 중 오류가 발생했습니다.");
      }

      // 성공 시 { status: 201, code: "DIARY_CREATE_SUCCESS", message: "...", result: { diary_id: 1 } } 반환
      return data;
    } catch (e: any) {
      console.error("일기 저장 통신 오류:", e);
      throw e;
    }
  }

  // USE_MOCK = true 시 동작
  await new Promise((resolve) => setTimeout(resolve, 800));
  const newRecord = {
    diary_id: Date.now(),
    ...payload,
  };

  const existing = localStorage.getItem("haru_line_logs");
  const logs = existing ? JSON.parse(existing) : [];
  localStorage.setItem("haru_line_logs", JSON.stringify([newRecord, ...logs]));

  return {
    status: 201,
    code: "DIARY_CREATE_SUCCESS",
    message: "일기가 저장되었습니다.",
    result: { diary_id: newRecord.diary_id },
  };
};

// 4. 월별 일기장 요약 목록 조회
export const fetchMonthlyDiaries = async (year: number, month: number): Promise<MonthlyDiarySummary[]> => {
  if (!USE_MOCK) {
    try {
      const res = await fetch(`${BASE_URL}/diaries?year=${year}&month=${month}`);
      const data = await res.json();

      if (res.status === 404) return [];
      if (res.ok && Array.isArray(data.result)) return data.result;
    } catch (e) {
      console.warn("백엔드 월별 조회 실패", e);
    }
  }

  const existing = localStorage.getItem("haru_line_logs");
  const logs = existing ? JSON.parse(existing) : [];
  return logs.map((log: any) => ({
    diary_id: log.diary_id || log.id,
    diary_date: log.diary_date || log.date,
    weighted_avg: log.weighted_avg ?? 0,
  }));
};

// 5. 일기 상세 조회
export const fetchDiaryDetail = async (diaryId: number | string) => {
  if (!USE_MOCK) {
    try {
      const res = await fetch(`${BASE_URL}/diaries/${diaryId}`);
      const data = await res.json();

      if (res.status === 404) throw new Error("해당 일기를 찾을 수 없습니다.");
      if (res.ok && data.result) return data.result;
    } catch (e: any) {
      console.warn("백엔드 상세조회 실패", e);
      if (e.message?.includes("찾을 수 없습니다")) throw e;
    }
  }

  const existing = localStorage.getItem("haru_line_logs");
  const logs = existing ? JSON.parse(existing) : [];
  const found = logs.find((item: any) => String(item.diary_id || item.id) === String(diaryId));
  if (!found) return null;

  return {
    diary_id: found.diary_id || found.id,
    diary_date: found.diary_date || found.date,
    weather: found.weather || "맑음",
    keyword_names: ["수면", "식사", "정서", "몰입", "관계"],
    weighted_scores: [found.score1 || 0, found.score2 || 0, found.score3 || 0, found.score4 || 0, found.score5 || 0],
    memo: found.memo,
    ai_reply: found.ai_reply || found.aiFeedback,
  };
};

// 6. 일기 검색
export const searchDiaries = async (params: {
  startDate?: string;
  endDate?: string;
  keyword?: string;
}): Promise<SearchDiaryResult[]> => {
  if (!USE_MOCK) {
    try {
      const query = new URLSearchParams();
      if (params.startDate) query.append("startDate", params.startDate);
      if (params.endDate) query.append("endDate", params.endDate);
      if (params.keyword) query.append("keyword", params.keyword);

      const res = await fetch(`${BASE_URL}/diaries/search?${query.toString()}`);
      const data = await res.json();

      if (res.ok && Array.isArray(data.result)) return data.result;
    } catch (e) {
      console.warn("백엔드 일기 검색 실패", e);
    }
  }

  const existing = localStorage.getItem("haru_line_logs");
  const logs = existing ? JSON.parse(existing) : [];

  return logs
    .filter((log: any) => {
      const logDate = log.diary_date || log.date;
      if (params.startDate && logDate < params.startDate) return false;
      if (params.endDate && logDate > params.endDate) return false;
      if (params.keyword && !log.memo?.includes(params.keyword)) return false;
      return true;
    })
    .map((log: any) => ({
      diary_id: log.diary_id || log.id,
      diary_date: log.diary_date || log.date,
      memo_preview: log.memo || "",
    }));
};

// 7. 주간 평균 감정 점수 조회
export const fetchWeeklyAverage = async () => {
  if (!USE_MOCK) {
    try {
      const res = await fetch(`${BASE_URL}/statistics/average`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("백엔드 주간 평균 조회 실패", e);
    }
  }

  return {
    status: 200,
    code: "STAT_AVG_SUCCESS",
    message: "주간 평균 점수 조회 성공",
    result: { total_weighted_average: 4.25 },
  };
};

// 8. 주간 감정 점수 추세 조회
export const fetchWeeklyTrend = async () => {
  if (!USE_MOCK) {
    try {
      const res = await fetch(`${BASE_URL}/statistics/weekly`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("백엔드 주간 추세 조회 실패", e);
    }
  }

  return {
    status: 200,
    code: "STAT_WEEKLY_SUCCESS",
    message: "주간 추세 데이터 조회 성공",
    result: {
      dates: ["D-6", "D-5", "D-4", "D-3", "D-2", "D-1", "오늘"],
      weighted_scores: [2.5, null, 6.0, 7.5, -4.0, 8.1, 4.25],
    },
  };
};


// 10. 일기 삭제 (DELETE /api/diaries/{diary_id})
export const deleteDiaryRecord = async (diaryId: number | string) => {
  if (!USE_MOCK) {
    try {
      const res = await fetch(`${BASE_URL}/diaries/${diaryId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) return data;
    } catch (e) {
      console.warn("백엔드 일기 삭제 실패, 로컬 스토리지에서 처리합니다.", e);
    }
  }

  // MOCK 및 네트워크 에러 시 Fallback
  const existing = localStorage.getItem("haru_line_logs");
  if (existing) {
    const logs = JSON.parse(existing);
    const filtered = logs.filter(
      (item: any) => String(item.diary_id || item.id) !== String(diaryId)
    );
    localStorage.setItem("haru_line_logs", JSON.stringify(filtered));
  }

  return { status: 200, code: "DIARY_DELETE_SUCCESS", message: "일기가 삭제되었습니다." };
};

// 11. 현 위치 날씨 조회 (GET /api/weather?nx={nx}&ny={ny})
export const fetchCurrentWeather = async (
  nx: number = 58,
  ny: number = 127
): Promise<string> => {
  if (!USE_MOCK) {
    try {
      const res = await fetch(`${BASE_URL}/weather?nx=${nx}&ny=${ny}`);
      
      // 💡 백엔드에서 500, 404, 502 등의 에러 응답이 와도 에러를 던지지 않고 '맑음' 반환
      if (!res.ok) {
        console.warn(`날씨 API 응답 이상 (${res.status}), 기본값('맑음')으로 처리합니다.`);
        return "맑음";
      }

      const data: WeatherResponse = await res.json();
      if (data.result?.weather) {
        return data.result.weather;
      }
    } catch (e) {
      // 💡 네트워크 에러나 서버 다운 시에도 에러를 던지지 않고 '맑음' 반환
      console.warn("날씨 API 호출 실패, 기본값('맑음')으로 처리합니다.", e);
    }
  }

  return "맑음";
};