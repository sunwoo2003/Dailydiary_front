// src/components/record/FreeMemoStep.tsx
import React from "react";

interface FreeMemoStepProps {
  memo: string;
  isEditing?: boolean;
  onMemoChange: (val: string) => void;
  onSave: (memoToSave: string) => void;
}

export const FreeMemoStep: React.FC<FreeMemoStepProps> = ({
  memo,
  isEditing = false,
  onMemoChange,
  onSave,
}) => {
  const handlePass = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onSave("");
  };

  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onSave(memo);
  };

  return (
    <div className="flex flex-col flex-1 bg-[#f8fafc] p-4 font-sans">
      <div className="mb-6 px-1">
        <h1 className="text-[24px] font-extrabold text-slate-800 tracking-tight mb-2 leading-snug">
          조금 더 남기고 싶은<br />이야기가 있나요?
        </h1>
        <p className="text-xs text-slate-400 font-medium">
          AI 카운슬러가 점수와 메모를 바탕으로 일기를 완성해드려요.
        </p>
      </div>

      <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm space-y-4 mb-8">
        <textarea
          value={memo}
          onChange={(e) => onMemoChange(e.target.value)}
          placeholder="여기에 대답을 적어주세요. (선택사항)"
          className="w-full h-36 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 resize-none"
        />

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handlePass}
            className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm rounded-2xl transition-colors cursor-pointer"
          >
            패스 (건너뛰기)
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl transition-colors shadow-md shadow-indigo-100 cursor-pointer"
          >
            {isEditing ? "일기 수정" : "일기 저장하기"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FreeMemoStep;