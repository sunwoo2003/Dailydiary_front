// src/App.tsx
import React, { useState, useEffect } from "react";
import { Header } from "./components/layout/Header";
import { BottomNavigation, TabType } from "./components/layout/BottomNavigation";
import SettingScreen, { SettingData } from "./components/SettingScreen";
import { CategoryScoreStep } from "./components/record/CategoryScoreStep";
import { FreeMemoStep } from "./components/record/FreeMemoStep";
import { AiFeedbackStep } from "./components/record/AiFeedbackStep";
import { DiaryScreen } from "./components/DiaryScreen";
import { StatsScreen } from "./components/StatsScreen";
import {
  saveDiaryRecord,
  analyzeAiFeedback,
  fetchMonthlyDiaries,
  deleteDiaryRecord, // 👈 추가
  CategoryDomain,
} from "./components/services/api";

const DEFAULT_CATEGORIES: CategoryDomain[] = [
  { id: 1, name: "수면", weight: 1 },
  { id: 2, name: "식사", weight: 1 },
  { id: 3, name: "정서 안정", weight: 1 },
  { id: 4, name: "성취/몰입", weight: 1 },
  { id: 5, name: "대인 관계", weight: 1 },
];

function App() {
  const [isConfigured, setIsConfigured] = useState<boolean>(() => {
    return !!localStorage.getItem("haru_line_settings");
  });

  const [activeTab, setActiveTab] = useState<TabType>("diary");
  const [recordStep, setRecordStep] = useState<1 | 2 | 3>(1);

  const [categories, setCategories] = useState<CategoryDomain[]>([]);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [memo, setMemo] = useState<string>("");
  const [aiFeedback, setAiFeedback] = useState<string>("");
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [statsKey, setStatsKey] = useState<number>(0);

  // 컨펌 모달 및 삭제 대상 일기 ID 상태
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
        const parsed: SettingData = JSON.parse(saved);
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

  // 탭 전환 핸들러 (오늘 일기 존재 시 diary_id 저장)
  const handleTabChange = async (tab: TabType) => {
    if (tab === "record") {
      const todayStr = new Date().toISOString().split("T")[0];
      const now = new Date();

      try {
        const diaries = await fetchMonthlyDiaries(now.getFullYear(), now.getMonth() + 1);
        const todayDiary = diaries?.find((d) => d.diary_date === todayStr);

        if (todayDiary) {
          setTodayDiaryId(todayDiary.diary_id);
          setShowOverwriteConfirm(true);
          return;
        }
      } catch (e) {
        console.error("오늘 일기 체크 실패", e);
      }

      setSelectedDate(todayStr);
      setTodayDiaryId(null);
      resetRecordForm();
    }
    setActiveTab(tab);
  };

  // 💡 '네' 선택 시: 백엔드 삭제 API 호출 후 새로 기록 시작
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
    setActiveTab("record");
  };

  const handleCancelOverwrite = () => {
    setShowOverwriteConfirm(false);
  };

  const handleSettingComplete = (updatedCategories?: CategoryDomain[]) => {
    setIsConfigured(true);
    setActiveTab("diary");
    setRecordStep(1);
    setSelectedDate(new Date().toISOString().split("T")[0]);

    const targetCategories =
      updatedCategories && updatedCategories.length > 0
        ? updatedCategories
        : DEFAULT_CATEGORIES;

    setCategories(targetCategories);
    const initialScores: Record<number, number> = {};
    targetCategories.forEach((c) => {
      initialScores[c.id] = 0;
    });
    setScores(initialScores);
  };

  const handleOpenSetting = () => {
    setIsConfigured(false);
  };

  const handleScoreChange = (id: number, val: string) => {
    setScores((prev) => ({ ...prev, [id]: parseInt(val, 10) }));
  };

  const handleSaveDiary = async (memoToSave: string) => {
    setRecordStep(3);
    setIsLoadingAi(true);

    try {
      const weightedScores = [
        scores[1] ?? 0,
        scores[2] ?? 0,
        scores[3] ?? 0,
        scores[4] ?? 0,
        scores[5] ?? 0,
      ];

      const generatedAiReply = await analyzeAiFeedback({
        weighted_scores: weightedScores,
        memo: memoToSave,
      });

      setAiFeedback(generatedAiReply);

      const diaryPayload = {
        diary_date: selectedDate,
        domain_id: 1,
        weight_id: 1,
        score1: scores[1] ?? 0,
        score2: scores[2] ?? 0,
        score3: scores[3] ?? 0,
        score4: scores[4] ?? 0,
        score5: scores[5] ?? 0,
        weather: "맑음",
        memo: memoToSave,
      };

      await saveDiaryRecord(diaryPayload);
      setStatsKey((prev) => prev + 1);
    } catch (error: any) {
      alert(error.message || "처리 중 오류가 발생했습니다.");
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleGoToDiary = () => {
    setActiveTab("diary");
    setRecordStep(1);
    setMemo("");
    setSelectedDate(new Date().toISOString().split("T")[0]);
    loadSettingsAndInitScores();
  };

  return (
    <div className="min-h-screen bg-[#d2d6dc] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-[580px] bg-[#1e2229] p-[16px] rounded-[48px] shadow-2xl">
        <div className="w-full bg-[#f8fafc] rounded-[36px] overflow-hidden flex flex-col min-h-[720px] max-h-[85vh] relative">
          <Header onOpenSetting={handleOpenSetting} />

          <div className="flex-1 overflow-y-auto flex flex-col">
            {!isConfigured ? (
              <SettingScreen onSaveComplete={handleSettingComplete} />
            ) : (
              <div className="p-8 flex-1">
                {activeTab === "record" && (
                  <>
                    {recordStep === 1 && (
                      <CategoryScoreStep
                        selectedDate={selectedDate}
                        categories={categories}
                        scores={scores}
                        onScoreChange={handleScoreChange}
                        onNext={() => setRecordStep(2)}
                      />
                    )}
                    {recordStep === 2 && (
                      <FreeMemoStep
                        memo={memo}
                        onMemoChange={setMemo}
                        onSave={handleSaveDiary}
                      />
                    )}
                    {recordStep === 3 && (
                      <AiFeedbackStep
                        memo={memo}
                        aiFeedback={aiFeedback}
                        isLoadingAi={isLoadingAi}
                        onGoToDiary={handleGoToDiary}
                      />
                    )}
                  </>
                )}

                {activeTab === "diary" && (
                  <DiaryScreen
                    onSelectUnwrittenDate={(dateStr) => {
                      setSelectedDate(dateStr);
                      setActiveTab("record");
                      setRecordStep(1);
                    }}
                  />
                )}
                {activeTab === "stats" && <StatsScreen key={statsKey} />}
              </div>
            )}
          </div>

          {isConfigured && (
            <BottomNavigation
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          )}

          {/* 재작성 안내 모달 팝업 */}
          {showOverwriteConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white w-full max-w-sm rounded-[32px] p-6 space-y-5 shadow-2xl text-center animate-in fade-in zoom-in duration-200">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto text-xl">
                  📝
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-slate-800">
                    오늘 일기가 이미 작성되어 있습니다.
                  </h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    일기를 다시 작성하시겠습니까? <br />
                    (다시 작성하면 기존 일기 데이터는 삭제되고 새로 등록됩니다.)
                  </p>
                </div>
                <div className="flex gap-2.5 pt-1">
                  <button
                    onClick={handleCancelOverwrite}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
                  >
                    아니오
                  </button>
                  <button
                    onClick={handleConfirmOverwrite}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs transition-colors cursor-pointer shadow-sm"
                  >
                    네
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;