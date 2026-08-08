// src/components/record/AiFeedbackStep.tsx
import React from "react";

interface AiFeedbackStepProps {
  memo: string;
  aiFeedback: string;
  isLoadingAi: boolean;
  onGoToDiary: () => void;
}

export const AiFeedbackStep: React.FC<AiFeedbackStepProps> = ({
  memo,
  aiFeedback,
  isLoadingAi,
  onGoToDiary,
}) => {
  return (
    <div className="space-y-6">
      {/* 저장 완료 배너 */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm">
          <span>🎉</span> 오늘의 일기가 저장되었습니다!
        </div>
        <span className="text-xs text-emerald-600 font-semibold bg-white px-2.5 py-1 rounded-xl shadow-xs">
          ☁️ 흐림
        </span>
      </div>

      {/* 내 메모 말풍선 */}
      {memo && (
        <div className="flex justify-end">
          <div className="bg-indigo-600 text-white text-sm font-medium px-5 py-3 rounded-3xl rounded-tr-none max-w-[80%] shadow-sm">
            {memo}
          </div>
        </div>
      )}

      {/* AI 피드백 말풍선 */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-2xl bg-indigo-100 flex items-center justify-center text-lg shrink-0">
          🤖
        </div>
        <div className="bg-white border border-slate-100 p-5 rounded-3xl rounded-tl-none shadow-sm flex-1">
          <h4 className="text-xs font-extrabold text-indigo-600 mb-2">
            AI 카운슬러 피드백
          </h4>
          {isLoadingAi ? (
            <div className="text-xs text-slate-400 animate-pulse py-2">
              오늘 하루를 분석하고 피드백을 작성 중이에요... 🤖
            </div>
          ) : (
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              {aiFeedback}
            </p>
          )}
        </div>
      </div>

      {/* 내 일기장 보러가기 버튼 */}
      <div className="pt-6 text-center">
        <button
          onClick={onGoToDiary}
          className="w-full max-w-[280px] py-4 bg-slate-900 hover:bg-black text-white text-sm font-bold rounded-full shadow-xl transition-all cursor-pointer"
        >
          내 일기장 보러가기
        </button>
      </div>
    </div>
  );
};