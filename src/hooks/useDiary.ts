// src/hooks/useDiary.ts
import { useState, useEffect } from "react";
import {
  saveDiaryRecord,
  fetchMonthlyDiaries,
  deleteDiaryRecord,
  fetchCurrentWeather,
  requestAiFeedback,
  fetchLatestDomain,
  CategoryDomain,
  CreateDiaryPayload,
} from "../components/services/api";

const DEFAULT_CATEGORIES: CategoryDomain[] = [
  { id: 1, name: "수면", weight: 1 },
  { id: 2, name: "식사", weight: 1 },
  { id: 3, name: "정서 안정", weight: 1 },
  { id: 4, name: "성취/몰입", weight: 1 },
  { id: 5, name: "대인 관계", weight: 1 },
];

export function useDiary(isConfigured: boolean) {
  const [recordStep, setRecordStep] = useState<1 | 2 | 3>(1);
  const [categories, setCategories] = useState<CategoryDomain[]>([]);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [memo, setMemo] = useState<string>("");
  const [aiFeedback, setAiFeedback] = useState<string>("");
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [statsKey, setStatsKey] = useState<number>(0);

  const [currentWeather, setCurrentWeather] = useState<string>("맑음");
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [todayDiaryId, setTodayDiaryId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split("T")[0]);

  // Step 1: 최초 진입 시 날씨 가져오기
  useEffect(() => {
    const loadInitialWeather = async () => {
      try {
        const weather = await fetchCurrentWeather();
        setCurrentWeather(weather);
      } catch (e) {
        console.error("날씨 불러오기 실패:", e);
      }
    };
    loadInitialWeather();
  }, []);

  // 백엔드 DB에서 최신 도메인/가중치 로드 및 점수 초기화
  const loadSettingsAndInitScores = async () => {
    let categoryList = DEFAULT_CATEGORIES;

    try {
      const latestDomains = await fetchLatestDomain();
      if (Array.isArray(latestDomains) && latestDomains.length === 5) {
        categoryList = latestDomains;
      }
    } catch (e) {
      console.error("백엔드 도메인 설정 불러오기 실패:", e);
    }

    setCategories(categoryList);
    const initialScores: Record<number, number> = {};
    categoryList.forEach((c) => {
      initialScores[c.id] = 0;
    });
    setScores(initialScores);
  };

  useEffect(() => {
    if (isConfigured) {
      loadSettingsAndInitScores();
    }
  }, [isConfigured]);

  const resetRecordForm = () => {
    setRecordStep(1);
    setMemo("");
    setAiFeedback("");
    loadSettingsAndInitScores();
  };

  const checkTodayDiaryBeforeRecord = async () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const now = new Date();

    try {
      const diaries = await fetchMonthlyDiaries(now.getFullYear(), now.getMonth() + 1);
      const todayDiary = diaries?.find((d) => d.diary_date === todayStr);

      if (todayDiary) {
        setTodayDiaryId(todayDiary.diary_id);
        setShowOverwriteConfirm(true);
        return false;
      }
    } catch (e) {
      console.error("오늘 일기 중복 체크 실패:", e);
    }

    setSelectedDate(todayStr);
    setTodayDiaryId(null);
    resetRecordForm();
    return true;
  };

  const handleConfirmOverwrite = async () => {
    if (todayDiaryId) {
      try {
        await deleteDiaryRecord(todayDiaryId);
      } catch (e) {
        console.error("기존 일기 삭제 실패:", e);
      }
    }

    const todayStr = new Date().toISOString().split("T")[0];
    setSelectedDate(todayStr);
    setTodayDiaryId(null);
    resetRecordForm();
    setShowOverwriteConfirm(false);
  };

  const handleCancelOverwrite = () => {
    setShowOverwriteConfirm(false);
  };

  const handleScoreChange = (id: number, val: string) => {
    setScores((prev) => ({ ...prev, [id]: parseInt(val, 10) }));
  };

  // Step 2~4: 일기 저장 -> diary_id 획득 -> AI 분석 API 호출
  const handleSaveDiary = async (memoToSave: string) => {
    setRecordStep(3);
    setIsLoadingAi(true);

    try {
      // 💡 최신 domain_id / weight_id 가져오기
      const latestData = await fetchLatestDomain();
      
      const domainId = (latestData as any)?.domain_id ?? 1;
      const weightId = (latestData as any)?.weight_id ?? 1;

      const diaryPayload: CreateDiaryPayload = {
        diary_date: selectedDate,
        domain_id: domainId,
        weight_id: weightId,
        score1: scores[1] ?? 0,
        score2: scores[2] ?? 0,
        score3: scores[3] ?? 0,
        score4: scores[4] ?? 0,
        score5: scores[5] ?? 0,
        memo: memoToSave,
        weather: currentWeather,
      };

      const res = await saveDiaryRecord(diaryPayload);
      const diaryId = res?.result?.diary_id || res?.diary_id;

      if (diaryId) {
        const reply = await requestAiFeedback(diaryId);
        setAiFeedback(reply);
      } else {
        setAiFeedback("오늘 하루도 수고 많으셨습니다!");
      }

      setStatsKey((prev) => prev + 1);
    } catch (error: any) {
      alert(error.message || "일기 저장 중 오류가 발생했습니다.");
      setRecordStep(2);
    } finally {
      setIsLoadingAi(false);
    }
  };

  return {
    recordStep,
    setRecordStep,
    categories,
    setCategories,
    scores,
    setScores,
    memo,
    setMemo,
    aiFeedback,
    isLoadingAi,
    statsKey,
    selectedDate,
    setSelectedDate,
    currentWeather,
    showOverwriteConfirm,
    checkTodayDiaryBeforeRecord,
    handleConfirmOverwrite,
    handleCancelOverwrite,
    handleScoreChange,
    handleSaveDiary,
    resetRecordForm,
  };
}