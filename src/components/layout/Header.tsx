// src/components/layout/Header.tsx
import React from "react";

export const Header: React.FC = () => {
  return (
    <div className="bg-white px-8 py-5 border-b border-slate-100 flex items-center justify-between">
      <div className="flex items-center">
        <span className="text-xl mr-2">✍️</span>
        <span className="font-bold text-xl text-slate-800 tracking-tight">하루한줄</span>
      </div>
    </div>
  );
};