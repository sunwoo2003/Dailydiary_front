import React, { useState, useEffect } from "react";
import { Header } from "./components/layout/Header";
import { BottomNavigation, TabType } from "./components/layout/BottomNavigation";
import SettingScreen from "./components/SettingScreen";
import { CategoryScoreStep } from "./components/record/CategoryScoreStep";
import { FreeMemoStep } from "./components/record/FreeMemoStep";
import { AiFeedbackStep } from "./components/record/AiFeedbackStep";
import { DiaryScreen } from "./components/DiaryScreen";
import { StatsScreen } from "./components/StatsScreen";
import { CategoryDomain, fetchLatestDomain } from "./components/services/api";
import { useDiary } from "./hooks/useDiary";

function App() {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("diary");

  const diary = useDiary(Boolean(isConfigured));

  useEffect(() => {
    const checkBackendDomainStatus = async () => {
      try {
        const latestData = await fetchLatestDomain();

        // 🟢 백엔드 DB에 정상적인 도메인 5개가 설정되어 있는지 확인 (latestData.categories 사용)
        if (latestData && latestData.categories && latestData.categories.length === 5) {
          setIsConfigured(true);
        } else {
          setIsConfigured(false);
        }
      } catch (error) {
        // DB 미설정 상태이거나 에러 시 설정 화면으로 이동
        setIsConfigured(false);
      }
    };

    checkBackendDomainStatus();
  }, []);

  const handleTabChange = async (tab: TabType) => {
    if (tab === "record") {
      const canProceed = await diary.checkTodayDiaryBeforeRecord();
      if (!canProceed) return;
    }
    setActiveTab(tab);
  };

  const handleSettingComplete = (updatedCategories?: CategoryDomain[]) => {
    setIsConfigured(true);
    setActiveTab("diary");
    diary.setRecordStep(1);

    if (updatedCategories && updatedCategories.length > 0) {
      diary.setCategories(updatedCategories);
    }
  };

  const handleGoToDiary = () => {
    setActiveTab("diary");
    diary.resetRecordForm();
  };

  return (
    <div className="min-h-screen bg-[#d2d6dc] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-[580px] bg-[#1e2229] p-[16px] rounded-[48px] shadow-2xl">
        <div className="w-full bg-[#f8fafc] rounded-[36px] overflow-hidden flex flex-col min-h-[720px] max-h-[85vh] relative">
          <Header onOpenSetting={() => setIsConfigured(false)} />

          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* 1. 검증 진행 중일 때는 중앙 로딩 표시 */}
            {isConfigured === null ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs font-bold text-slate-400 animate-pulse">설정 확인 중...</p>
              </div>
            ) : !isConfigured ? (
              /* 2. DB 미설정 시: 설정 화면 */
              <SettingScreen onSaveComplete={handleSettingComplete} />
            ) : (
              /* 3. DB 설정 완료 시: 일기장 메인 */
              <div className="p-8 flex-1">
                {activeTab === "record" && (
                  <>
                    {diary.recordStep === 1 && (
                      <CategoryScoreStep
                        selectedDate={diary.selectedDate}
                        categories={diary.categories}
                        scores={diary.scores}
                        onScoreChange={diary.handleScoreChange}
                        onNext={() => diary.setRecordStep(2)}
                      />
                    )}
                    {diary.recordStep === 2 && (
                      <FreeMemoStep
                        memo={diary.memo}
                        onMemoChange={diary.setMemo}
                        onSave={diary.handleSaveDiary}
                      />
                    )}
                    {diary.recordStep === 3 && (
                      <AiFeedbackStep
                        memo={diary.memo}
                        weather={diary.currentWeather}
                        aiFeedback={diary.aiFeedback}
                        isLoadingAi={diary.isLoadingAi}
                        onGoToDiary={handleGoToDiary}
                      />
                    )}
                  </>
                )}

                {activeTab === "diary" && (
                  <DiaryScreen
                    onSelectUnwrittenDate={(dateStr) => {
                      diary.setSelectedDate(dateStr);
                      setActiveTab("record");
                      diary.setRecordStep(1);
                    }}
                  />
                )}
                {activeTab === "stats" && <StatsScreen />}
              </div>
            )}
          </div>

          {isConfigured && (
            <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
          )}

          {diary.showOverwriteConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white w-full max-w-sm rounded-[32px] p-6 space-y-5 shadow-2xl text-center">
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
                    onClick={diary.handleCancelOverwrite}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
                  >
                    아니오
                  </button>
                  <button
                    onClick={async () => {
                      await diary.handleConfirmOverwrite();
                      setActiveTab("record");
                    }}
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