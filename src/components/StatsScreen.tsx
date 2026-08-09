// src/components/StatsScreen.tsx
import React, { useEffect, useState } from "react";
import { fetchWeeklyAverage, fetchWeeklyTrend } from "./services/api";

export const StatsScreen: React.FC = () => {
  const [weeklyAverage, setWeeklyAverage] = useState<number | null>(null);
  const [weeklyData, setWeeklyData] = useState<{
    dates: string[];
    scores: (number | null)[];
  }>({
    dates: ["D-6", "D-5", "D-4", "D-3", "D-2", "D-1", "오늘"],
    scores: [null, null, null, null, null, null, null],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      try {
        const [avgRes, trendRes] = await Promise.all([
          fetchWeeklyAverage(),
          fetchWeeklyTrend(),
        ]);

        console.log("주간 평균 API 응답 데이터:", avgRes);
        console.log("주간 추세 API 응답 데이터:", trendRes);

        // 1. 주간 평균 점수 파싱 (다양한 백엔드 응답 형태 모두 지원)
        const avgValue =
          avgRes?.result?.total_weighted_average ??
          avgRes?.total_weighted_average ??
          avgRes?.result?.average ??
          avgRes?.average ??
          null;

        if (avgValue !== null) {
          setWeeklyAverage(avgValue);
        }

        // 2. 주간 추세 데이터 파싱
        const trendResult = trendRes?.result || trendRes;
        if (
          trendResult &&
          Array.isArray(trendResult.dates) &&
          Array.isArray(trendResult.weighted_scores)
        ) {
          setWeeklyData({
            dates: trendResult.dates,
            scores: trendResult.weighted_scores,
          });
        }
      } catch (e) {
        console.error("통계 데이터 로딩 에러:", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  // SVG 그래프 좌표 계산 로직 (-10 ~ +10 점 기준)
  const renderLineChart = () => {
    const width = 280;
    const height = 180;
    const paddingLeft = 35;
    const paddingBottom = 25;
    const paddingTop = 15;
    const paddingRight = 15;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const getEvY = (val: number) => {
      const clamped = Math.max(-10, Math.min(10, val));
      return paddingTop + chartHeight - ((clamped + 10) / 20) * chartHeight;
    };

    const getEvX = (index: number) => {
      const step = chartWidth / (weeklyData.dates.length - 1 || 1);
      return paddingLeft + index * step;
    };

    const points = weeklyData.scores
      .map((score, idx) => (score !== null ? `${getEvX(idx)},${getEvY(score)}` : null))
      .filter((p) => p !== null)
      .join(" ");

    const yGridValues = [10, 5, 0, -5, -10];

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        {yGridValues.map((val) => {
          const y = getEvY(val);
          return (
            <g key={val}>
              <text
                x={paddingLeft - 8}
                y={y + 3.5}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-medium"
              >
                {val}
              </text>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="#E2E8F0"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
            </g>
          );
        })}

        {weeklyData.dates.map((date, idx) => {
          const x = getEvX(idx);
          const label = date.length > 5 ? date.slice(-5) : date;
          return (
            <text
              key={idx}
              x={x}
              y={height - 5}
              textAnchor="middle"
              className="text-[10px] fill-slate-400 font-medium"
            >
              {label}
            </text>
          );
        })}

        {points && (
          <polyline
            fill="none"
            stroke="#6366F1"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
        )}

        {weeklyData.scores.map((score, idx) => {
          if (score === null) return null;
          const cx = getEvX(idx);
          const cy = getEvY(score);
          return (
            <circle
              key={idx}
              cx={cx}
              cy={cy}
              r="4"
              className="fill-indigo-600 stroke-white stroke-2"
            />
          );
        })}
      </svg>
    );
  };

  return (
    <div className="flex flex-col flex-1 bg-[#f8fafc] p-4 font-sans">
      <h1 className="text-[20px] font-extrabold text-slate-800 mb-4 tracking-tight">
        내 감정 통계
      </h1>

      <div className="bg-indigo-600 rounded-[28px] p-6 text-white shadow-md mb-5 flex justify-between items-center relative overflow-hidden">
        <div>
          <p className="text-xs font-medium text-indigo-100 mb-1">
            최근 1주일 누적 점수 평균
          </p>
          <div className="text-3xl font-black tracking-tight">
            {isLoading ? (
              <span className="text-lg opacity-70">계산 중...</span>
            ) : (
              `${(weeklyAverage ?? 0) >= 0 ? "+" : ""}${
                weeklyAverage !== null ? weeklyAverage.toFixed(2) : "0.00"
              }점`
            )}
          </div>
        </div>
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl shrink-0">
          {(weeklyAverage ?? 0) >= 0 ? "🙂" : "🙁"}
        </div>
      </div>

      <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-800">
            일주일 감정 점수 변화
          </h2>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            -10점 ~ +10점 척도 기준의 주간 흐름입니다.
          </p>
        </div>

        <div className="pt-2 pb-1">
          {isLoading ? (
            <div className="h-44 flex items-center justify-center text-xs text-slate-400">
              추세 데이터를 불러오는 중...
            </div>
          ) : (
            renderLineChart()
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsScreen;