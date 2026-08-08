// src/components/SettingScreen.tsx
import React, { useState } from "react";
import { saveDomainSettings, CategoryDomain } from "./services/api";

export interface SettingData {
  categories: CategoryDomain[];
}

interface SettingScreenProps {
  onSaveComplete: () => void;
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
      // 💡 백엔드/Mock 통합 API 호출
      await saveDomainSettings(categories);
      onSaveComplete();
    } catch (error) {
      console.error("설정 저장 에러:", error);
      alert("설정 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 flex flex-col flex-1 bg-[#f8fafc]">
      {/* 타이틀 영역 */}
      <div className="mb-6">
        <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight mb-1">
          나만의 기록 기준 설정
        </h1>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          앞으로 매일 평가할 5가지 영역과 각각의 중요도(가중치)를 설정해주세요. (최초 1회)
        </p>
      </div>

      {/* 5가지 영역 카드 리스트 */}
      <div className="space-y-4 flex-1 overflow-y-auto pr-1">
        {categories.map((cat, index) => (
          <div
            key={cat.id}
            className="p-5 bg-white rounded-[24px] border border-slate-100 shadow-sm flex flex-col gap-3"
          >
            {/* 상단: 번호 뱃지 & 영역 이름 입력 */}
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

            {/* 하단: 가중치 배율 설정 텍스트 & 슬라이더 */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[12px] font-medium text-slate-400">
                  가중치 배율 설정
                </span>
                <span className="text-[13px] font-bold text-indigo-600">
                  x{cat.weight} 배
                </span>
              </div>

              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={cat.weight}
                onChange={(e) => handleWeightChange(cat.id, Number(e.target.value))}
                className="w-full h-[6px] bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-900"
              />
            </div>
          </div>
        ))}
      </div>

      {/* 하단 저장 버튼 */}
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