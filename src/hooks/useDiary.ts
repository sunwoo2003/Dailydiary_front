// src/hooks/useDiary.ts
import { useState, useEffect } from "react";
import {
  saveDiaryRecord,
  fetchMonthlyDiaries,
  deleteDiaryRecord,
  fetchCurrentWeather,
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
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });

  const loadSettingsAndInitScores = () => {
    const saved = localStorage.getItem("haru_line_settings");
    let categoryList = DEFAULT_CATEGORIES;

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.categories && parsed.categories.length > 0) {
          categoryList = parsed.categories;
        }
      } catch (e) {
        console.error("설정 불러오기 실패", e);
      }
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
      console.error("오늘 일기 체크 실패", e);
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
        console.error("기존 일기 삭제 실패", e);
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

  // 🎯 별도 AI 피드백 API 호출 없이 일기 저장 1회로 AI 메시지 수신
  const handleSaveDiary = async (memoToSave: string) => {
    setRecordStep(3);
    setIsLoadingAi(true);

    try {
      // 1. 날씨 1회 조회 (완료 화면 표시용)
      let weatherResult = "맑음";
      try {
        if ("geolocation" in navigator) {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
          });
          const nx = Math.floor(position.coords.latitude);
          const ny = Math.floor(position.coords.longitude);
          weatherResult = await fetchCurrentWeather(nx, ny);
        } else {
          weatherResult = await fetchCurrentWeather();
        }
      } catch (e) {
        weatherResult = await fetchCurrentWeather();
      }
      setCurrentWeather(weatherResult);

      // 2. 백엔드 전달 Payload
      const diaryPayload: CreateDiaryPayload = {
        diary_date: selectedDate,
        domain_id: 1,
        weight_id: 1,
        score1: scores[1] ?? 0,
        score2: scores[2] ?? 0,
        score3: scores[3] ?? 0,
        score4: scores[4] ?? 0,
        score5: scores[5] ?? 0,
        weather: weatherResult,
        memo: memoToSave,
      };

      // 3. 일기 저장 호출 (백엔드가 일기 저장 + AI 피드백 생성 후 한 번에 응답)
      const res = await saveDiaryRecord(diaryPayload);

      // 4. 응답값 내 ai_reply (또는 ai_message) 적용
      const aiReply =
        res?.result?.ai_reply ||
        res?.result?.ai_message ||
        res?.ai_reply ||
        res?.ai_message ||
        "오늘 하루도 수고 많으셨어요! 👏";

      setAiFeedback(aiReply);
      setStatsKey((prev) => prev + 1);
    } catch (error: any) {
      alert(error.message || "처리 중 오류가 발생했습니다.");
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