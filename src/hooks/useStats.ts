// src/hooks/useStats.ts
import { useState, useEffect } from "react";
import { fetchWeeklyAverage, fetchWeeklyTrend } from "../components/services/api";

export function useStats(statsKey?: number) {
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

        const avgValue =
          avgRes?.result?.total_weighted_average ??
          avgRes?.total_weighted_average ??
          null;

        if (avgValue !== null) {
          setWeeklyAverage(avgValue);
        }

        const trend = trendRes?.result || trendRes;
        if (trend?.dates && trend?.weighted_scores) {
          setWeeklyData({
            dates: trend.dates,
            scores: trend.weighted_scores,
          });
        }
      } catch (e) {
        console.error("통계 데이터 로딩 에러:", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [statsKey]);

  return { weeklyAverage, weeklyData, isLoading };
}