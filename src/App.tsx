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
import { saveDiaryRecord, analyzeAiFeedback } from "./components/services/api";

export interface DailyRecord {
  id: string;
  date: string;
  scores: Record<number, number>;
  memo: string;
  aiFeedback?: string;
  createdAt: string;
}

function App() {
  const [isConfigured, setIsConfigured] = useState<boolean>(() => {
    return !!localStorage.getItem("haru_line_settings");
  });

  const [activeTab, setActiveTab] = useState<TabType>("record");
  const [recordStep, setRecordStep] = useState<1 | 2 | 3>(1);

  const [categories, setCategories] = useState<SettingData["categories"]>([]);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [memo, setMemo] = useState<string>("");
  const [aiFeedback, setAiFeedback] = useState<string>("");
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });

  const loadSettingsAndInitScores = () => {
    const saved = localStorage.getItem("haru_line_settings");
    if (saved) {
      try {
        const parsed: SettingData = JSON.parse(saved);
        setCategories(parsed.categories);

        const initialScores: Record<number, number> = {};
        parsed.categories.forEach((c) => {
          initialScores[c.id] = 0;
        });
        setScores(initialScores);
      } catch (e) {
        console.error("설정 불러오기 실패", e);
      }
    }
  };

  useEffect(() => {
    if (isConfigured) {
      loadSettingsAndInitScores();
    }
  }, [isConfigured]);

  const handleSettingComplete = () => {
    setIsConfigured(true);
    setActiveTab("record");
    setRecordStep(1);
    setSelectedDate(new Date().toISOString().split("T")[0]);
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
        keword_id: 1,
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
          <Header />

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
                {activeTab === "stats" && <StatsScreen />}
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