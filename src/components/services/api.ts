// src/components/services/api.ts
const BASE_URL = "http://localhost:8080/api";

export interface CategoryDomain {
  id: number;
  name: string;
  weight: number;
}

// 🟢 신규: 도메인/가중치 메타데이터 포함 인터페이스
export interface LatestDomainResponse {
  domain_id: number;
  weight_id: number;
  categories: CategoryDomain[];
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
  weather: string;
}

export interface UpdateDiaryPayload {
  score1: number;
  score2: number;
  score3: number;
  score4: number;
  score5: number;
  memo?: string;
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
  };
}

// 공통 에러 처리 헬퍼 함수
const handleResponse = async (res: Response) => {
  const data = await res.json();
  if (!res.ok) {
    const errorMsg = data.message || `API Error (${res.status}): ${res.statusText}`;
    console.error("🔴 API 통신 에러 상세:", { status: res.status, data });
    throw new Error(errorMsg);
  }
  return data;
};

// 1. 최신 도메인/가중치 설정 조회 (🟢 수정: domain_id, weight_id 및 categories를 함께 반환)
export const fetchLatestDomain = async (): Promise<LatestDomainResponse | null> => {
  const res = await fetch(`${BASE_URL}/domain/latest`);
  const data = await handleResponse(res);
  const domain = data.result;

  if (domain && domain.domain1_name) {
    return {
      domain_id: Number(domain.domain_id || 1),
      weight_id: Number(domain.weight_id || 1),
      categories: [
        { id: 1, name: domain.domain1_name, weight: Number(domain.weight1_value || 1) },
        { id: 2, name: domain.domain2_name, weight: Number(domain.weight2_value || 1) },
        { id: 3, name: domain.domain3_name, weight: Number(domain.weight3_value || 1) },
        { id: 4, name: domain.domain4_name, weight: Number(domain.weight4_value || 1) },
        { id: 5, name: domain.domain5_name, weight: Number(domain.weight5_value || 1) },
      ],
    };
  }
  return null;
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

  const res = await fetch(`${BASE_URL}/domain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return await handleResponse(res);
};

// 3. 일기 저장
export const saveDiaryRecord = async (payload: CreateDiaryPayload) => {
  const res = await fetch(`${BASE_URL}/diaries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return await handleResponse(res);
};

// 3-1. 일기 수정
export const updateDiaryRecord = async (diaryId: number | string, payload: UpdateDiaryPayload) => {
  const res = await fetch(`${BASE_URL}/diaries/${diaryId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return await handleResponse(res);
};

// 4. AI 분석 요청
export const requestAiFeedback = async (diaryId: number): Promise<string> => {
  const res = await fetch(`${BASE_URL}/ai/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ diary_id: diaryId }),
  });
  const data = await handleResponse(res);
  return data.result?.ai_reply || "AI 피드백 응답이 없습니다.";
};

// 5. 현 위치 날씨 조회
export const fetchCurrentWeather = async (nx: number = 58, ny: number = 127): Promise<string> => {
  const res = await fetch(`${BASE_URL}/weather?nx=${nx}&ny=${ny}`);
  const data = await handleResponse(res);
  return data.result?.weather || "알 수 없음";
};

// 6. 월별 조회
export const fetchMonthlyDiaries = async (year: number, month: number): Promise<MonthlyDiarySummary[]> => {
  const res = await fetch(`${BASE_URL}/diaries?year=${year}&month=${month}`);
  const data = await handleResponse(res);
  return data.result || [];
};

// 7. 상세 조회
export const fetchDiaryDetail = async (diaryId: number | string) => {
  const res = await fetch(`${BASE_URL}/diaries/${diaryId}`);
  const data = await handleResponse(res);
  return data.result;
};

// 8. 검색
export const searchDiaries = async (params: { startDate?: string; endDate?: string; keyword?: string }): Promise<SearchDiaryResult[]> => {
  const query = new URLSearchParams();
  if (params.startDate) query.append("start_date", params.startDate);
  if (params.endDate) query.append("end_date", params.endDate);
  if (params.keyword) query.append("keyword", params.keyword);

  const res = await fetch(`${BASE_URL}/diaries/search?${query.toString()}`);
  const data = await handleResponse(res);
  return data.result || [];
};

// 9. 통계 - 주간 평균
export const fetchWeeklyAverage = async () => {
  const res = await fetch(`${BASE_URL}/statistics/average`);
  return await handleResponse(res);
};

// 10. 통계 - 주간 추세
export const fetchWeeklyTrend = async () => {
  const res = await fetch(`${BASE_URL}/statistics/weekly`);
  return await handleResponse(res);
};

// 11. 삭제
export const deleteDiaryRecord = async (diaryId: number | string) => {
  const res = await fetch(`${BASE_URL}/diaries/${diaryId}`, { method: "DELETE" });
  return await handleResponse(res);
};