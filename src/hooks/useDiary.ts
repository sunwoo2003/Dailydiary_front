// src/hooks/useDiary.ts
import { useState, useEffect } from "react";
import { getTodayKstDate } from "../utils/date";
import {
  saveDiaryRecord,
  updateDiaryRecord,
  fetchMonthlyDiaries,
  deleteDiaryRecord,
  requestAiFeedback,
  fetchLatestDomain,
  fetchDiaryDetail,
  CategoryDomain,
  CreateDiaryPayload,
  UpdateDiaryPayload,
} from "../components/services/api";
import { useWeather } from "./useWeather";

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

  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [todayDiaryId, setTodayDiaryId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayKstDate);

  // 수정 모드 관리 (null이면 신규 작성, number면 수정 모드)
  const [editingDiaryId, setEditingDiaryId] = useState<number | null>(null);

  const currentWeather = useWeather();

  const loadSettingsAndInitScores = async () => {
    let categoryList = DEFAULT_CATEGORIES;

    try {
      const latestData = await fetchLatestDomain();
      if (latestData && latestData.categories?.length === 5) {
        categoryList = latestData.categories;
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
    setEditingDiaryId(null);
    loadSettingsAndInitScores();
  };

  // 기존 일기 상세 데이터를 기반으로 수정 폼 상태 채우기
  const startEditDiary = async (diaryId: number) => {
    try {
      const detail = await fetchDiaryDetail(diaryId);
      if (!detail) return;

      setEditingDiaryId(diaryId);
      setSelectedDate(detail.diary_date || getTodayKstDate());
      setMemo(detail.memo || "");

      const latestData = await fetchLatestDomain();
      const currentCategories = latestData?.categories?.length === 5 ? latestData.categories : DEFAULT_CATEGORIES;
      setCategories(currentCategories);

      const loadedScores: Record<number, number> = {};
      const catIds = currentCategories.map((c) => c.id);
      
      const domainScores = detail.domain_scores || [0, 0, 0, 0, 0];
      catIds.forEach((id, idx) => {
        loadedScores[id] = domainScores[idx] ?? 0;
      });

      setScores(loadedScores);
      setRecordStep(1);
    } catch (e) {
      console.error("수정 데이터 로드 실패:", e);
      alert("일기 데이터를 불러오는데 실패했습니다.");
    }
  };

  const checkTodayDiaryBeforeRecord = async () => {
    const todayStr = getTodayKstDate();
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

  // "네" 버튼 클릭 시 기존 ID를 가지고 수정 모드로 전환
  const handleConfirmOverwrite = async () => {
    if (todayDiaryId) {
      await startEditDiary(todayDiaryId);
    } else {
      resetRecordForm();
    }
    setShowOverwriteConfirm(false);
  };

  const handleCancelOverwrite = () => {
    setShowOverwriteConfirm(false);
  };

  const handleScoreChange = (id: number, val: string) => {
    setScores((prev) => ({ ...prev, [id]: parseInt(val, 10) || 0 }));
  };

  const handleSaveDiary = async (memoToSave: string) => {
    setRecordStep(3);
    setIsLoadingAi(true);

    try {
      const catIds = categories.map((c) => c.id);
      let targetDiaryId: number | null = editingDiaryId;

      if (editingDiaryId) {
        // ✏️ 일기 수정 (PUT /api/diaries/{diary_id})
        const updatePayload: UpdateDiaryPayload = {
          score1: scores[catIds[0]] ?? 0,
          score2: scores[catIds[1]] ?? 0,
          score3: scores[catIds[2]] ?? 0,
          score4: scores[catIds[3]] ?? 0,
          score5: scores[catIds[4]] ?? 0,
          memo: memoToSave,
        };
        await updateDiaryRecord(editingDiaryId, updatePayload);
      } else {
        // ➕ 신규 작성 (POST /api/diaries)
        const latestData = await fetchLatestDomain();
        const domainId = latestData?.domain_id ?? 1;
        const weightId = latestData?.weight_id ?? 1;

        const createPayload: CreateDiaryPayload = {
          diary_date: selectedDate,
          domain_id: domainId,
          weight_id: weightId,
          score1: scores[catIds[0]] ?? 0,
          score2: scores[catIds[1]] ?? 0,
          score3: scores[catIds[2]] ?? 0,
          score4: scores[catIds[3]] ?? 0,
          score5: scores[catIds[4]] ?? 0,
          memo: memoToSave,
          weather: currentWeather,
        };

        const res = await saveDiaryRecord(createPayload);
        targetDiaryId = res?.result?.diary_id || res?.diary_id;
      }

      // AI 피드백 재호출
      if (targetDiaryId) {
        const reply = await requestAiFeedback(targetDiaryId);
        setAiFeedback(reply);
      } else {
        setAiFeedback("오늘 하루도 수고 많으셨습니다!");
      }

      setStatsKey((prev) => prev + 1);
    } catch (error: any) {
      alert(error.message || "일기 저장/수정 중 오류가 발생했습니다.");
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
    editingDiaryId,
    startEditDiary,
    checkTodayDiaryBeforeRecord,
    handleConfirmOverwrite,
    handleCancelOverwrite,
    handleScoreChange,
    handleSaveDiary,
    resetRecordForm,
  };
}