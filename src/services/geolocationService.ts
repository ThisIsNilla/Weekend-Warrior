import { Geolocation } from '@capacitor/geolocation';
import type { LocationCoords } from '../types';

export const DEFAULT_CLIFTON_PARK_COORDS: LocationCoords = {
  latitude: 42.85,
  longitude: -73.82,
};

export interface GeolocationResult {
  coords: LocationCoords;
  isFallback: boolean;
  source: 'capacitor' | 'browser' | 'default';
  errorMessage?: string;
}

export interface GeolocationOptions {
  timeoutMs?: number;
  enableHighAccuracy?: boolean;
}

function getBrowserLocation(options?: GeolocationOptions): Promise<LocationCoords> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Browser geolocation is not available'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (
          !position ||
          !position.coords ||
          typeof position.coords.latitude !== 'number' ||
          Number.isNaN(position.coords.latitude) ||
          typeof position.coords.longitude !== 'number' ||
          Number.isNaN(position.coords.longitude)
        ) {
          reject(new Error('Browser geolocation returned invalid coordinates'));
          return;
        }

        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: options?.enableHighAccuracy ?? true,
        timeout: options?.timeoutMs ?? 10000,
        maximumAge: 60000,
      },
    );
  });
}

/**
 * Gets user coordinates prioritizing Capacitor Geolocation, falling back to
 * browser Geolocation, and finally to Clifton Park / Halfmoon default coordinates.
 */
export async function getCurrentUserLocation(
  options?: GeolocationOptions,
): Promise<GeolocationResult> {
  const timeoutMs = options?.timeoutMs ?? 10000;
  const enableHighAccuracy = options?.enableHighAccuracy ?? true;

  // 1. Try Capacitor Geolocation plugin
  try {
    let isGranted = false;
    try {
      const status = await Geolocation.checkPermissions();
      if (status.location === 'granted' || status.coarseLocation === 'granted') {
        isGranted = true;
      } else if (status.location !== 'denied') {
        const req = await Geolocation.requestPermissions();
        isGranted = req.location === 'granted' || req.coarseLocation === 'granted';
      }
    } catch {
      // If checkPermissions/requestPermissions throws (e.g. unsupported platform),
      // we attempt getCurrentPosition directly below which will throw if unavailable.
      isGranted = true;
    }

    if (isGranted) {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy,
        timeout: timeoutMs,
      });

      if (
        position &&
        position.coords &&
        typeof position.coords.latitude === 'number' &&
        !Number.isNaN(position.coords.latitude) &&
        typeof position.coords.longitude === 'number' &&
        !Number.isNaN(position.coords.longitude)
      ) {
        return {
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
          },
          isFallback: false,
          source: 'capacitor',
        };
      }
    }
  } catch {
    // Continue to browser fallback
  }

  // 2. Try browser navigator.geolocation
  try {
    const coords = await getBrowserLocation(options);
    return {
      coords,
      isFallback: false,
      source: 'browser',
    };
  } catch (browserError) {
    const errorMessage =
      browserError instanceof Error ? browserError.message : 'Geolocation unavailable or denied';

    // 3. Fallback to default Clifton Park / Halfmoon coordinates
    return {
      coords: { ...DEFAULT_CLIFTON_PARK_COORDS },
      isFallback: true,
      source: 'default',
      errorMessage,
    };
  }
}
