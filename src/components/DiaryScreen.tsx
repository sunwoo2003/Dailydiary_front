// src/components/DiaryScreen.tsx
import React, { useState, useEffect } from "react";
import {
  fetchMonthlyDiaries,
  fetchDiaryDetail,
  searchDiaries,
  MonthlyDiarySummary,
  SearchDiaryResult,
} from "./services/api";

interface DiaryScreenProps {
  onSelectUnwrittenDate?: (dateStr: string) => void;
}

export const DiaryScreen: React.FC<DiaryScreenProps> = ({ onSelectUnwrittenDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [diaries, setDiaries] = useState<MonthlyDiarySummary[]>([]);
  const [selectedDiary, setSelectedDiary] = useState<any | null>(null);

  // 검색 상태
  const [searchKeyword, setSearchKeyword] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchResults, setSearchResults] = useState<SearchDiaryResult[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  // 월별 일기 목록 로드
  useEffect(() => {
    const loadDiaries = async () => {
      const data = await fetchMonthlyDiaries(year, month);
      setDiaries(data || []);
    };
    loadDiaries();
  }, [year, month]);

  // 다중 조건 검색 핸들러
  const handleSearch = async () => {
    if (!startDate && !endDate && !searchKeyword.trim()) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchDiaries({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        keyword: searchKeyword.trim() || undefined,
      });
      setSearchResults(results);
    } catch (e) {
      console.error("일기 검색 에러:", e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchKeyword("");
    setStartDate("");
    setEndDate("");
    setSearchResults(null);
  };

  // 달력 날짜 계산
  const firstDay = new Date(year, month - 1, 1).getDay();
  const lastDate = new Date(year, month, 0).getDate();

  // 가장 행복한 날 계산
  const highestScoreDiary = diaries.reduce((max, item) => {
    return item.weighted_avg > (max?.weighted_avg ?? -999) ? item : max;
  }, null as MonthlyDiarySummary | null);

  // 날짜 또는 검색 결과 클릭 시 상세 조회
  const openDiaryDetail = async (diaryId: number) => {
    try {
      const detail = await fetchDiaryDetail(diaryId);
      setSelectedDiary(detail);
    } catch (e: any) {
      alert(e.message || "일기 상세를 불러올 수 없습니다.");
    }
  };

  const handleDateClick = async (day: number) => {
    const formattedMonth = String(month).padStart(2, "0");
    const formattedDay = String(day).padStart(2, "0");
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

    const todayStr = new Date().toISOString().split("T")[0];
    if (dateStr > todayStr) {
      alert("아직 오지 않은 날짜의 일기는 작성할 수 없습니다! ⏳");
      return;
    }

    const existing = diaries.find((d) => d.diary_date === dateStr);

    if (existing) {
      await openDiaryDetail(existing.diary_id);
    } else {
      if (onSelectUnwrittenDate) {
        onSelectUnwrittenDate(dateStr);
      } else {
        alert(`${month}월 ${day}일 일기 작성 화면으로 이동합니다.`);
      }
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-[#f8fafc] p-4 font-sans">
      {/* 1. 상단 다중 조건 검색 영역 */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-3 mb-4">
        <div className="relative">
          <span className="absolute left-3.5 top-3 text-slate-400">🔍</span>
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="메모 내용, 해시태그 검색..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-700 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-xs text-slate-500"
          />
          <span className="text-slate-300">~</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-xs text-slate-500"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs transition-colors"
          >
            {isSearching ? "검색 중..." : "검색"}
          </button>
        </div>

        {/* 검색 모드일 때 초기화 버튼 표시 */}
        {searchResults !== null && (
          <div className="flex justify-between items-center pt-1 border-t border-slate-50 text-xs">
            <span className="text-indigo-600 font-bold">
              검색 결과 {searchResults.length}건
            </span>
            <button
              onClick={handleClearSearch}
              className="text-slate-400 hover:text-slate-600 underline text-[11px] cursor-pointer"
            >
              달력으로 돌아가기
            </button>
          </div>
        )}
      </div>

      {/* 2. 검색 결과 리스트 모드 */}
      {searchResults !== null ? (
        <div className="bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm flex-1 space-y-2 overflow-y-auto max-h-[450px]">
          {searchResults.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              검색 조건에 일치하는 일기가 없습니다. 😅
            </div>
          ) : (
            searchResults.map((item) => (
              <div
                key={item.diary_id}
                onClick={() => openDiaryDetail(item.diary_id)}
                className="p-3.5 bg-slate-50 hover:bg-indigo-50/50 rounded-2xl border border-slate-100 transition-colors cursor-pointer flex justify-between items-center gap-3"
              >
                <div>
                  <span className="text-[11px] font-bold text-indigo-600 block mb-0.5">
                    📅 {item.diary_date}
                  </span>
                  <p className="text-xs text-slate-700 line-clamp-1 font-medium">
                    {item.memo_preview || "메모 없음"}
                  </p>
                </div>
                <span className="text-slate-300 text-xs shrink-0">›</span>
              </div>
            ))
          )}
        </div>
      ) : (
        /* 3. 기본 달력 모드 */
        <>
          <div className="flex justify-between items-center px-4 py-2 mb-2">
            <button
              onClick={() => setCurrentDate(new Date(year, month - 2, 1))}
              className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
            >
              ‹
            </button>
            <h2 className="text-base font-extrabold text-slate-800">
              {year}년 {month}월
            </h2>
            <button
              onClick={() => setCurrentDate(new Date(year, month, 1))}
              className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
            >
              ›
            </button>
          </div>

          <div className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm mb-4">
            <div className="grid grid-cols-7 text-center text-xs font-bold mb-3">
              <span className="text-red-400">일</span>
              <span className="text-slate-400">월</span>
              <span className="text-slate-400">화</span>
              <span className="text-slate-400">수</span>
              <span className="text-slate-400">목</span>
              <span className="text-slate-400">금</span>
              <span className="text-blue-400">토</span>
            </div>

            <div className="grid grid-cols-7 gap-y-3 text-center">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {Array.from({ length: lastDate }).map((_, i) => {
                const day = i + 1;
                const formattedMonth = String(month).padStart(2, "0");
                const formattedDay = String(day).padStart(2, "0");
                const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

                const todayStr = new Date().toISOString().split("T")[0];
                const isFuture = dateStr > todayStr;

                const diary = diaries.find((d) => d.diary_date === dateStr);
                const isHighest = highestScoreDiary?.diary_date === dateStr;

                let bgStyle = "text-slate-600 hover:bg-slate-50";
                if (diary) {
                  const avg = diary.weighted_avg;
                  if (avg > 15) bgStyle = "bg-indigo-100 text-indigo-700 font-bold";
                  else if (avg < -15) bgStyle = "bg-amber-100 text-amber-700 font-bold";
                  else bgStyle = "bg-slate-100 text-slate-700 font-bold";
                }

                if (isFuture) {
                  bgStyle = "text-slate-300 bg-slate-50/50 opacity-40 cursor-not-allowed";
                }

                return (
                  <div
                    key={day}
                    onClick={() => handleDateClick(day)}
                    className={`relative flex items-center justify-center py-1 ${
                      isFuture ? "cursor-not-allowed" : "cursor-pointer"
                    }`}
                  >
                    {isHighest && (
                      <span className="absolute -top-2 text-[10px]">👑</span>
                    )}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${bgStyle} ${
                        isHighest ? "ring-2 ring-amber-400" : ""
                      }`}
                    >
                      {day}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-center items-center gap-4 text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-200" /> 긍정
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200" /> 보통
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-200" /> 부정
            </span>
            <span className="flex items-center gap-1">
              <span>👑</span> 가장 행복한 날
            </span>
          </div>
        </>
      )}

      {/* 4. 일기 상세 모달 (GET /api/diaries/{diary_id} 데이터 매핑) */}
      {selectedDiary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-6 space-y-4 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-800">
                  {selectedDiary.diary_date}
                </h3>
                <span className="text-xs px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full font-bold flex items-center gap-1">
                  ☀️ {selectedDiary.weather || "맑음"}
                </span>
              </div>
              <button
                onClick={() => setSelectedDiary(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 영역별 키워드 및 가중치 반영 점수 */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
              <p className="text-xs font-bold text-slate-500 mb-2">영역별 감정 점수</p>
              <div className="grid grid-cols-5 gap-1 text-[10px] font-bold text-indigo-600 bg-white p-2.5 rounded-xl border border-slate-100 shadow-xs">
                {(selectedDiary.keyword_names || ["수면", "식사", "정서", "몰입", "관계"]).map(
                  (name: string, idx: number) => {
                    const score = selectedDiary.weighted_scores?.[idx] ?? 0;
                    return (
                      <div key={idx} className="flex flex-col items-center">
                        <span className="text-slate-400 text-[9px] mb-0.5">{name}</span>
                        <span>{score >= 0 ? `+${score}` : score}</span>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* 작성된 추가 메모 */}
            <div className="flex justify-end">
              <div className="bg-indigo-600 text-white text-xs px-4 py-3 rounded-2xl rounded-tr-none max-w-[85%] leading-relaxed shadow-xs">
                {selectedDiary.memo || "작성된 메모가 없습니다."}
              </div>
            </div>

            {/* AI 피드백 내용 */}
            {selectedDiary.ai_reply && (
              <div className="flex items-start gap-2 pt-2">
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs shrink-0">
                  🤖
                </div>
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl rounded-tl-none text-xs text-slate-700 leading-relaxed flex-1">
                  <p className="text-[10px] font-bold text-indigo-600 mb-0.5">AI 카운슬러 피드백</p>
                  {selectedDiary.ai_reply}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiaryScreen;