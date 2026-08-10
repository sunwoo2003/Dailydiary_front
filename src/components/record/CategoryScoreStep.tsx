// src/components/record/CategoryScoreStep.tsx
import React from "react";

interface CategoryScoreStepProps {
  selectedDate: string;
  categories: Array<{ id: number; name: string }>;
  scores: Record<number, number>;
  onScoreChange: (id: number, val: string) => void;
  onNext: () => void;
}

export const CategoryScoreStep: React.FC<CategoryScoreStepProps> = ({
  selectedDate,
  categories,
  scores,
  onScoreChange,
  onNext,
}) => {
  const todayStr = new Date().toISOString().split("T")[0];
  const isToday = selectedDate === todayStr;

  const getHeaderTitle = () => {
    if (isToday) {
      return "오늘 하루, 어땠나요?";
    }
    const [, month, day] = selectedDate.split("-");
    return `${parseInt(month, 10)}월 ${parseInt(day, 10)}일, 어땠나요?`;
  };

  return (
    <div className="flex flex-col flex-1 bg-[#f8fafc] p-4 font-sans">
      <div className="mb-6 px-1">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">
          {getHeaderTitle()}
        </h1>
        <p className="text-xs text-slate-400 font-medium">
          슬라이더를 움직여 -10 ~ 10점 사이로 평가해주세요.
        </p>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto mb-6 pr-1">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-slate-800 text-base">{cat.name}</h3>
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
              className="w-full h-[6px] bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 mb-2"
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
        className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-2xl shadow-md transition-all cursor-pointer"
      >
        다음 단계 (메모 작성)
      </button>
    </div>
  );
};

export default CategoryScoreStep;