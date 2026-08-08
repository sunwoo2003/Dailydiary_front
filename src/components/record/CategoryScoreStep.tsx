// src/components/record/CategoryScoreStep.tsx
import React from "react";
import { CategoryDomain } from "../services/api";

interface CategoryScoreStepProps {
  selectedDate?: string; // 👈 추가
  categories: CategoryDomain[];
  scores: Record<number, number>;
  onScoreChange: (id: number, val: string) => void;
  onNext: () => void;
}

const CATEGORY_ICONS: Record<number, string> = {
  1: "⭐",
  2: "🔥",
  3: "💖",
  4: "⚡",
  5: "🍃",
};

export const CategoryScoreStep: React.FC<CategoryScoreStepProps> = ({
  selectedDate,
  categories,
  scores,
  onScoreChange,
  onNext,
}) => {
  // 💡 날짜에 맞는 타이틀 반환 로직
  const getTitleText = () => {
    if (!selectedDate) return "오늘 하루, 어땠나요?";

    const todayStr = new Date().toISOString().split("T")[0];
    if (selectedDate === todayStr) {
      return "오늘 하루, 어땠나요?";
    }

    // YYYY-MM-DD -> M월 D일
    const [_, m, d] = selectedDate.split("-");
    return `${parseInt(m, 10)}월 ${parseInt(d, 10)}일, 어땠나요?`;
  };

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[24px] font-extrabold text-slate-800 tracking-tight mb-1">
            {getTitleText()} {/* 👈 dynamic 멘트 로딩 */}
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            슬라이더를 움직여 -10 ~ 10점 사이로 평가해주세요.
          </p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl px-3 py-2 flex items-center gap-1.5 shadow-sm text-xs font-semibold text-slate-600">
          <span>☁️</span>
          <span>흐림</span>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm"
          >
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{CATEGORY_ICONS[cat.id] || "📌"}</span>
                <h3 className="font-bold text-slate-800 text-base">{cat.name}</h3>
              </div>
              <span className="text-sm font-extrabold text-indigo-600">
                {scores[cat.id] ?? 0}점
              </span>
            </div>

            <input
              type="range"
              min="-10"
              max="10"
              step="1"
              value={scores[cat.id] ?? 0}
              onChange={(e) => onScoreChange(cat.id, e.target.value)}
              className="w-full h-[6px] bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 mb-2"
            />

            <div className="flex justify-between text-[11px] font-medium text-slate-400">
              <span>매우 불만족 (-10)</span>
              <span>보통 (0)</span>
              <span>매우 만족 (+10)</span>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-indigo-100 cursor-pointer"
      >
        다음 단계로
      </button>
    </div>
  );
};

export default CategoryScoreStep;