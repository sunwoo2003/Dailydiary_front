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
import { saveDiaryRecord, analyzeAiFeedback, CategoryDomain } from "./components/services/api";

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

  const [activeTab, setActiveTab] = useState<TabType>("record");
  const [recordStep, setRecordStep] = useState<1 | 2 | 3>(1);

  const [categories, setCategories] = useState<CategoryDomain[]>([]);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [memo, setMemo] = useState<string>("");
  const [aiFeedback, setAiFeedback] = useState<string>("");
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [statsKey, setStatsKey] = useState<number>(0); // 👈 통계 리프레시용 key

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

  const handleSettingComplete = (updatedCategories?: CategoryDomain[]) => {
    setIsConfigured(true);
    setActiveTab("record");
    setRecordStep(1);
    setSelectedDate(new Date().toISOString().split("T")[0]);

    const targetCategories = (updatedCategories && updatedCategories.length > 0) 
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
        domain_id: 1, // 👈 keword_id 오타 수정
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

      // 👈 통계 화면 리프레시 키 변경
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

  const handleTabChange = (tab: TabType) => {
    if (tab === "record") {
      setSelectedDate(new Date().toISOString().split("T")[0]);
    }
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-[#d2d6dc] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-[580px] bg-[#1e2229] p-[16px] rounded-[48px] shadow-2xl">
        <div className="w-full bg-[#f8fafc] rounded-[36px] overflow-hidden flex flex-col min-h-[720px] max-h-[85vh]">
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
        </div>
      </div>
    </div>
  );
}

export default App;