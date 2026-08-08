// src/components/layout/BottomNavigation.tsx
import React from "react";

export type TabType = "record" | "diary" | "stats";

interface BottomNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const navItems: { id: TabType; label: string; icon: string } []= [
    { id: "record", label: "기록", icon: "✏️" },
    { id: "diary", label: "일기장", icon: "📅" },
    { id: "stats", label: "통계", icon: "📊" },
  ];

  return (
    <div className="w-full bg-white border-t border-slate-100 py-3 px-8 flex justify-around items-center">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${
              isActive ? "text-indigo-600 font-bold" : "text-slate-400 font-medium"
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};