// src/components/SettingScreen.tsx
import React, { useState, useEffect } from "react";
import { saveDomainSettings, CategoryDomain, fetchLatestDomain } from "./services/api";

export interface SettingData {
  categories: CategoryDomain[];
}

interface SettingScreenProps {
  onSaveComplete: (categories: CategoryDomain[]) => void;
}

export const SettingScreen: React.FC<SettingScreenProps> = ({ onSaveComplete }) => {
  const [categories, setCategories] = useState<CategoryDomain[]>([
    { id: 1, name: "수면", weight: 1 },
    { id: 2, name: "식사", weight: 1 },
    { id: 3, name: "정서 안정", weight: 1 },
    { id: 4, name: "성취/몰입", weight: 1 },
    { id: 5, name: "대인 관계", weight: 1 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 저장된 최신 키워드 및 가중치 동기화
  useEffect(() => {
    const loadSavedSettings = async () => {
      try {
        // 1. 먼저 로컬스토리지에 저장된 설정이 있다면 우선 적용 (가장 즉각적)
        const savedLocal = localStorage.getItem("haru_line_settings");
        if (savedLocal) {
          const parsed = JSON.parse(savedLocal);
          if (parsed.categories && parsed.categories.length === 5) {
            setCategories(parsed.categories);
            return;
          }
        }

        // 2. 로컬스토리지에 없거나 백엔드 최신 데이터를 조회할 경우
        const res = await fetchLatestDomain();
        const data = res?.result || res;

        if (data && data.domain1_name) {
          setCategories([
            { id: 1, name: data.domain1_name, weight: Number(data.weight1_value || 1) },
            { id: 2, name: data.domain2_name, weight: Number(data.weight2_value || 1) },
            { id: 3, name: data.domain3_name, weight: Number(data.weight3_value || 1) },
            { id: 4, name: data.domain4_name, weight: Number(data.weight4_value || 1) },
            { id: 5, name: data.domain5_name, weight: Number(data.weight5_value || 1) },
          ]);
        }
      } catch (e) {
        console.error("기존 설정 불러오기 실패:", e);
      }
    };
    loadSavedSettings();
  }, []);

  const handleNameChange = (id: number, name: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name } : c))
    );
  };

  const handleWeightChange = (id: number, weight: number) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, weight } : c))
    );
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await saveDomainSettings(categories);
      onSaveComplete(categories);
    } catch (error) {
      console.error("설정 저장 에러:", error);
      alert("설정 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 flex flex-col flex-1 bg-[#f8fafc]">
      <div className="mb-6">
        <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight mb-1">
          키워드 및 가중치 설정
        </h1>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          매일 평가할 5가지 영역과 각각의 중요도(가중치 배수 1~10)를 설정해 주세요.
        </p>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto pr-1">
        {categories.map((cat, index) => (
          <div
            key={cat.id}
            className="p-5 bg-white rounded-[24px] border border-slate-100 shadow-sm flex flex-col gap-3"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                {index + 1}
              </div>
              <input
                type="text"
                value={cat.name}
                onChange={(e) => handleNameChange(cat.id, e.target.value)}
                className="w-full text-base font-bold text-slate-800 bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                placeholder="영역 이름 입력"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[12px] font-medium text-slate-400">
                  가중치 배율 (1~10)
                </span>
                <span className="text-[13px] font-bold text-indigo-600">
                  x{cat.weight} 배
                </span>
              </div>

              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={cat.weight}
                onChange={(e) => handleWeightChange(cat.id, Number(e.target.value))}
                className="w-full h-[6px] bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-900"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={isSubmitting}
        className="w-full mt-6 bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-2xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
      >
        {isSubmitting ? "저장 중..." : "설정 완료하고 시작하기"}
      </button>
    </div>
  );
};

export default SettingScreen;