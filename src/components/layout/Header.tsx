// src/components/layout/Header.tsx
import React from "react";

interface HeaderProps {
  onOpenSetting?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSetting }) => {
  return (
    <div className="bg-white px-8 py-5 border-b border-slate-100 flex items-center justify-between">
      <div className="flex items-center">
        <span className="text-xl mr-2">✍️</span>
        <span className="font-bold text-xl text-slate-800 tracking-tight">
          하루한줄
        </span>
      </div>

      {/* 설정 화면(가중치/카테고리) 이동 버튼 */}
      {onOpenSetting && (
        <button
          onClick={onOpenSetting}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer text-lg flex items-center justify-center"
          title="가중치 및 카테고리 설정"
        >
          ⚙️
        </button>
      )}
    </div>
  );
};