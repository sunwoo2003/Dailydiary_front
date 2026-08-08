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
  keword_id: number;
  weight_id: number;
  score1: number;
  score2: number;
  score3: number;
  score4: number;
  score5: number;
  weather: string;
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

// 1. 최신 도메인/가중치 설정 조회 (GET /api/domain/latest)
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

// 2. 도메인 및 가중치 저장 (POST /api/domain)
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

  if (!USE_MOCK) {
    try {
      const res = await fetch(`${BASE_URL}/domain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("백엔드 저장 실패, 로컬스토리지로 폴백합니다.", e);
    }
  }

  localStorage.setItem("haru_line_settings", JSON.stringify({ categories }));
  return { success: true };
};

// 3. 일기 작성 (POST /api/diaries)
export const saveDiaryRecord = async (payload: CreateDiaryPayload) => {
  if (!USE_MOCK) {
    try {
      const res = await fetch(`${BASE_URL}/diaries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.status === 409) {
        throw new Error(data.message || "해당 날짜에 이미 일기가 존재합니다.");
      }

      if (res.ok) return data;
    } catch (e: any) {
      console.warn("백엔드 일기 저장 실패/오류, 로컬스토리지로 폴백합니다.", e);
      if (e.message?.includes("이미 일기가 존재")) throw e;
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 800));
  const newRecord = {
    diary_id: Date.now(),
    ...payload,
    ai_reply: "일기 저장이 완료되었습니다! 오늘 하루도 고생 많으셨습니다. 👏",
  };

  const existing = localStorage.getItem("haru_line_logs");
  const logs = existing ? JSON.parse(existing) : [];
  localStorage.setItem("haru_line_logs", JSON.stringify([newRecord, ...logs]));

  return { status: 201, result: { diary_id: newRecord.diary_id } };
};

// 4. 월별 일기장 요약 목록 조회 (GET /api/diaries?year={year}&month={month})
export const fetchMonthlyDiaries = async (year: number, month: number): Promise<MonthlyDiarySummary[]> => {
  if (!USE_MOCK) {
    try {
      const res = await fetch(`${BASE_URL}/diaries?year=${year}&month=${month}`);
      const data = await res.json();

      if (res.status === 404) return [];

      if (res.ok && Array.isArray(data.result)) {
        return data.result;
      }
    } catch (e) {
      console.warn("백엔드 월별 조회 실패, 로컬 데이터로 폴백합니다.", e);
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

// 5. 일기 상세 조회 (GET /api/diaries/{diary_id})
export const fetchDiaryDetail = async (diaryId: number | string) => {
  if (!USE_MOCK) {
    try {
      const res = await fetch(`${BASE_URL}/diaries/${diaryId}`);
      const data = await res.json();

      if (res.status === 404) {
        throw new Error("해당 일기를 찾을 수 없습니다.");
      }

      if (res.ok && data.result) {
        return data.result;
      }
    } catch (e: any) {
      console.warn("백엔드 상세조회 실패, 로컬스토리지로 폴백합니다.", e);
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

// 6. 일기 검색 (GET /api/diaries/search?startDate=&endDate=&keyword=)
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

      if (res.ok && Array.isArray(data.result)) {
        return data.result;
      }
    } catch (e) {
      console.warn("백엔드 일기 검색 실패, 로컬 데이터로 폴백합니다.", e);
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

// 7. 주간 평균 감정 점수 조회 (GET /api/statistics/average)
export const fetchWeeklyAverage = async () => {
  if (!USE_MOCK) {
    try {
      const res = await fetch(`${BASE_URL}/statistics/average`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("백엔드 주간 평균 조회 실패, 로컬 데이터로 폴백합니다.", e);
    }
  }

  return {
    status: 200,
    code: "STAT_AVG_SUCCESS",
    message: "주간 평균 점수 조회 성공",
    result: {
      total_weighted_average: 4.25,
    },
  };
};

// 8. 주간 감정 점수 추세 조회 (GET /api/statistics/weekly)
export const fetchWeeklyTrend = async () => {
  if (!USE_MOCK) {
    try {
      const res = await fetch(`${BASE_URL}/statistics/weekly`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("백엔드 주간 추세 조회 실패, 로컬 데이터로 폴백합니다.", e);
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

// 9. AI 피드백 생성 (POST /api/ai/analyze)
export const analyzeAiFeedback = async (payload: AiAnalyzePayload) => {
  if (!USE_MOCK) {
    try {
      const res = await fetch(`${BASE_URL}/ai/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.status === 500) {
        throw new Error(data.message || "AI API 연동에 실패하였습니다.");
      }

      if (res.ok && data.result) {
        return data.result.ai_reply;
      }
    } catch (e: any) {
      console.warn("백엔드 AI 분석 실패, 기본 텍스트로 폴백합니다.", e);
    }
  }

  // MOCK / Fallback 처리
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return "오늘 선택하신 영역의 점수와 작성해주신 메모를 바탕으로 분석을 마쳤어요! 열심히 살아낸 오늘 하루, 정말 고생 많으셨습니다. 👏";
};