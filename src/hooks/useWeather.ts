import { useCallback, useEffect, useRef, useState } from 'react';
import type { LocationCoords, WeatherState } from '../types';
import {
  DEFAULT_FALLBACK_WEATHER,
  getWeatherForLocation,
} from '../services/weatherService';

export interface UseWeatherReturn {
  weather: WeatherState;
  liveWeather: WeatherState;
  loading: boolean;
  isFallback: boolean;
  weatherOverride?: WeatherState;
  setWeatherOverride: (override?: WeatherState) => void;
  includeOutdoorAnyway: boolean;
  setIncludeOutdoorAnyway: (include: boolean) => void;
  refreshWeather: (
    forceRefresh?: boolean,
    overrideCoords?: LocationCoords,
  ) => Promise<WeatherState>;
}

/**
 * Custom hook querying weatherService for the given coordinates, managing loading/fallback state,
 * and supporting weather overrides and outdoor inclusion toggles.
 */
export function useWeather(coords: LocationCoords): UseWeatherReturn {
  const [liveWeather, setLiveWeather] = useState<WeatherState>(() => ({
    ...DEFAULT_FALLBACK_WEATHER,
  }));
  const [loading, setLoading] = useState<boolean>(true);
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [weatherOverride, setWeatherOverride] = useState<WeatherState | undefined>(undefined);
  const [includeOutdoorAnyway, setIncludeOutdoorAnyway] = useState<boolean>(false);

  const requestIdRef = useRef<number>(0);
  const mountedRef = useRef<boolean>(true);
  const latitude = coords.latitude;
  const longitude = coords.longitude;

  const refreshWeather = useCallback(
    async (
      forceRefresh = true,
      overrideCoords?: LocationCoords,
    ): Promise<WeatherState> => {
      const requestId = ++requestIdRef.current;
      const targetCoords: LocationCoords = overrideCoords ?? {
        latitude,
        longitude,
      };
      if (mountedRef.current) {
        setLoading(true);
      }

      try {
        const result = await getWeatherForLocation(targetCoords, { forceRefresh });
        const detectedFallback = result.description === DEFAULT_FALLBACK_WEATHER.description;
        if (mountedRef.current && requestId === requestIdRef.current) {
          setLiveWeather(result);
          setIsFallback(detectedFallback);
          setLoading(false);
        }
        return result;
      } catch {
        const fallback: WeatherState = {
          ...DEFAULT_FALLBACK_WEATHER,
          updatedAt: new Date().toISOString(),
        };
        if (mountedRef.current && requestId === requestIdRef.current) {
          setLiveWeather(fallback);
          setIsFallback(true);
          setLoading(false);
        }
        return fallback;
      }
    },
    [latitude, longitude],
  );

  useEffect(() => {
    mountedRef.current = true;
    const requestId = ++requestIdRef.current;
    getWeatherForLocation({ latitude, longitude }, { forceRefresh: false })
      .then((result) => {
        if (!mountedRef.current || requestId !== requestIdRef.current) return;
        const detectedFallback = result.description === DEFAULT_FALLBACK_WEATHER.description;
        setLiveWeather(result);
        setIsFallback(detectedFallback);
        setLoading(false);
      })
      .catch(() => {
        if (!mountedRef.current || requestId !== requestIdRef.current) return;
        setLiveWeather({
          ...DEFAULT_FALLBACK_WEATHER,
          updatedAt: new Date().toISOString(),
        });
        setIsFallback(true);
        setLoading(false);
      });
    return () => {
      mountedRef.current = false;
    };
  }, [latitude, longitude]);

  const effectiveWeather = weatherOverride ?? liveWeather;

  return {
    weather: effectiveWeather,
    liveWeather,
    loading,
    isFallback,
    weatherOverride,
    setWeatherOverride,
    includeOutdoorAnyway,
    setIncludeOutdoorAnyway,
    refreshWeather,
  };
}
