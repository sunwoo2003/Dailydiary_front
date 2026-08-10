// src/hooks/useWeather.ts
import { useState, useEffect } from "react";
import { fetchCurrentWeather } from "../components/services/api";

export function useWeather() {
  const [currentWeather, setCurrentWeather] = useState<string>("맑음");

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const nx = Math.floor(position.coords.latitude);
          const ny = Math.floor(position.coords.longitude);
          const weather = await fetchCurrentWeather(nx, ny);
          setCurrentWeather(weather);
        },
        async () => {
          const weather = await fetchCurrentWeather();
          setCurrentWeather(weather);
        }
      );
    } else {
      fetchCurrentWeather().then(setCurrentWeather);
    }
  }, []);

  return currentWeather;
}