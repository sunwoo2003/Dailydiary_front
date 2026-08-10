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
  weather: string; // 👈 백엔드 Step 2 명세 반영
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
export const fetchLatestDomain = async (): Promise<CategoryDomain[]> => {
  const defaultCategories: CategoryDomain[] = [
    { id: 1, name: "수면", weight: 1 },
    { id: 2, name: "식사", weight: 1 },
    { id: 3, name: "정서 안정", weight: 1 },
    { id: 4, name: "성취/몰입", weight: 1 },
    { id: 5, name: "대인 관계", weight: 1 },
  ];

  if (!USE_MOCK) {
    try {
      const res = await fetch(`${BASE_URL}/domain/latest`);
      if (res.ok) {
        const data = await res.json();
        const domain = data?.result || data;
        if (domain && domain.domain1_name) {
          return [
            { id: 1, name: domain.domain1_name, weight: Number(domain.weight1_value || 1) },
            { id: 2, name: domain.domain2_name, weight: Number(domain.weight2_value || 1) },
            { id: 3, name: domain.domain3_name, weight: Number(domain.weight3_value || 1) },
            { id: 4, name: domain.domain4_name, weight: Number(domain.weight4_value || 1) },
            { id: 5, name: domain.domain5_name, weight: Number(domain.weight5_value || 1) },
          ];
        }
      }
    } catch (e) {
      console.warn("백엔드 연결 실패, 로컬 데이터로 폴백합니다.", e);
    }
  }

  const saved = localStorage.getItem("haru_line_settings");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.categories && parsed.categories.length === 5) {
        return parsed.categories;
      }
    } catch (e) {
      console.error("로컬 설정 파싱 실패", e);
    }
  }

  return defaultCategories;
};

// 2. 도메인 및 가중치 저장
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

// 3. 일기 저장 (Step 2)
export const saveDiaryRecord = async (payload: CreateDiaryPayload) => {
  if (!USE_MOCK) {
    try {
      const res = await fetch(`${BASE_URL}/diaries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data.status >= 400) {
        throw new Error(data.message || "일기 저장 중 오류가 발생했습니다.");
      }
      return data;
    } catch (e: any) {
      console.error("일기 저장 통신 오류:", e);
      throw e;
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 300));
  const newRecord = { diary_id: Date.now(), ...payload };
  const existing = localStorage.getItem("haru_line_logs");
  const logs = existing ? JSON.parse(existing) : [];
  localStorage.setItem("haru_line_logs", JSON.stringify([newRecord, ...logs]));

  return { status: 201, code: "DIARY_CREATE_SUCCESS", message: "일기가 저장되었습니다.", result: { diary_id: newRecord.diary_id } };
};

// 4. AI 분석 요청 (Step 3) 👈 신규 추가
export const requestAiFeedback = async (diaryId: number): Promise<string> => {
  if (!USE_MOCK) {
    try {
      const res = await fetch(`${BASE_URL}/ai/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diary_id: diaryId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "AI 분석 실패");
      return data.result?.ai_reply || data.ai_reply || "AI 피드백 응답을 받지 못했습니다.";
    } catch (e: any) {
      console.error("AI 분석 연동 실패:", e);
      return "오늘 하루도 정말 고생 많으셨어요! 따뜻하고 편안한 밤 되세요. 🌙";
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 2000));
  return "오늘 하루도 정말 수고 많으셨어요! 일기가 성공적으로 저장되었습니다. 👏";
};

// 5. 현 위치 날씨 조회 (Step 1)
export const fetchCurrentWeather = async (nx: number = 58, ny: number = 127): Promise<string> => {
  if (!USE_MOCK) {
    try {
      const res = await fetch(`${BASE_URL}/weather?nx=${nx}&ny=${ny}`);
      if (!res.ok) return "맑음";
      const data: WeatherResponse = await res.json();
      if (data.result?.weather) return data.result.weather;
    } catch (e) {
      console.warn("날씨 API 호출 실패, 기본값('맑음') 처리:", e);
    }
  }
  return "맑음";
};

// 6. 월별 조회
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

// 7. 상세 조회
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

// 8. 검색
export const searchDiaries = async (params: { startDate?: string; endDate?: string; keyword?: string }): Promise<SearchDiaryResult[]> => {
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

// 9. 통계 - 주간 평균
export const fetchWeeklyAverage = async () => {
  if (!USE_MOCK) {
    try {
      const res = await fetch(`${BASE_URL}/statistics/average`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("백엔드 주간 평균 조회 실패", e);
    }
  }
  return { status: 200, code: "STAT_AVG_SUCCESS", message: "조회 성공", result: { total_weighted_average: 4.25 } };
};

// 10. 통계 - 주간 추세
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
    message: "조회 성공",
    result: {
      dates: ["D-6", "D-5", "D-4", "D-3", "D-2", "D-1", "오늘"],
      weighted_scores: [2.5, null, 6.0, 7.5, -4.0, 8.1, 4.25],
    },
  };
};

// 11. 삭제
export const deleteDiaryRecord = async (diaryId: number | string) => {
  if (!USE_MOCK) {
    try {
      const res = await fetch(`${BASE_URL}/diaries/${diaryId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) return data;
    } catch (e) {
      console.warn("백엔드 삭제 실패, 로컬 처리", e);
    }
  }

  const existing = localStorage.getItem("haru_line_logs");
  if (existing) {
    const logs = JSON.parse(existing);
    const filtered = logs.filter((item: any) => String(item.diary_id || item.id) !== String(diaryId));
    localStorage.setItem("haru_line_logs", JSON.stringify(filtered));
  }
  return { status: 200, code: "DIARY_DELETE_SUCCESS", message: "일기가 삭제되었습니다." };
};