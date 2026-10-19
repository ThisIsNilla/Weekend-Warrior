import { useCallback, useEffect, useRef, useState } from 'react';
import type { LocationCoords } from '../types';
import {
  DEFAULT_CLIFTON_PARK_COORDS,
  getCurrentUserLocation,
} from '../services/geolocationService';
import type { GeolocationResult } from '../services/geolocationService';

export interface UseGeolocationReturn {
  coords: LocationCoords;
  loading: boolean;
  isFallback: boolean;
  source: GeolocationResult['source'];
  errorMessage?: string;
  refreshLocation: () => Promise<GeolocationResult>;
}

/**
 * Custom hook managing user GPS coordinates, loading state, fallback status
 * (Clifton Park / Halfmoon default 42.85, -73.82), and manual refresh.
 */
export function useGeolocation(): UseGeolocationReturn {
  const [coords, setCoords] = useState<LocationCoords>(() => ({
    ...DEFAULT_CLIFTON_PARK_COORDS,
  }));
  const [loading, setLoading] = useState<boolean>(true);
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [source, setSource] = useState<GeolocationResult['source']>('default');
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const requestIdRef = useRef<number>(0);
  const mountedRef = useRef<boolean>(true);

  const refreshLocation = useCallback(async (): Promise<GeolocationResult> => {
    const requestId = ++requestIdRef.current;
    if (mountedRef.current) {
      setLoading(true);
    }

    try {
      const result = await getCurrentUserLocation();
      if (mountedRef.current && requestId === requestIdRef.current) {
        setCoords((prev) =>
          prev.latitude === result.coords.latitude &&
          prev.longitude === result.coords.longitude
            ? prev
            : result.coords,
        );
        setIsFallback(result.isFallback);
        setSource(result.source);
        setErrorMessage(result.errorMessage);
        setLoading(false);
      }
      return result;
    } catch (error) {
      const fallbackResult: GeolocationResult = {
        coords: { ...DEFAULT_CLIFTON_PARK_COORDS },
        isFallback: true,
        source: 'default',
        errorMessage: error instanceof Error ? error.message : 'Unable to determine location',
      };
      if (mountedRef.current && requestId === requestIdRef.current) {
        setCoords((prev) =>
          prev.latitude === fallbackResult.coords.latitude &&
          prev.longitude === fallbackResult.coords.longitude
            ? prev
            : fallbackResult.coords,
        );
        setIsFallback(true);
        setSource('default');
        setErrorMessage(fallbackResult.errorMessage);
        setLoading(false);
      }
      return fallbackResult;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const requestId = ++requestIdRef.current;
    getCurrentUserLocation()
      .then((result) => {
        if (!mountedRef.current || requestId !== requestIdRef.current) return;
        setCoords((prev) =>
          prev.latitude === result.coords.latitude &&
          prev.longitude === result.coords.longitude
            ? prev
            : result.coords,
        );
        setIsFallback(result.isFallback);
        setSource(result.source);
        setErrorMessage(result.errorMessage);
        setLoading(false);
      })
      .catch((error: unknown) => {
        if (!mountedRef.current || requestId !== requestIdRef.current) return;
        setCoords((prev) =>
          prev.latitude === DEFAULT_CLIFTON_PARK_COORDS.latitude &&
          prev.longitude === DEFAULT_CLIFTON_PARK_COORDS.longitude
            ? prev
            : { ...DEFAULT_CLIFTON_PARK_COORDS },
        );
        setIsFallback(true);
        setSource('default');
        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to determine location',
        );
        setLoading(false);
      });
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    coords,
    loading,
    isFallback,
    source,
    errorMessage,
    refreshLocation,
  };
}
