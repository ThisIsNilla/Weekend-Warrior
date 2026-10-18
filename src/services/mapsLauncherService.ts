import type { LocationCoords } from '../types';
import { isLocationCoords } from '../types';

/**
 * Generates an Android native geo: URI intent scheme:
 * geo:{lat},{lng}?q={lat},{lng}({encodeURIComponent(name)})
 */
export function formatGeoUri(coords: LocationCoords, label?: string): string {
  const { latitude, longitude } = coords;
  if (label && label.trim()) {
    return `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(label.trim())})`;
  }
  return `geo:${latitude},${longitude}?q=${latitude},${longitude}`;
}

/**
 * Generates web Google Maps fallback URL:
 * https://www.google.com/maps/search/?api=1&query={lat},{lng}
 */
export function formatGoogleMapsUrl(coords: LocationCoords): string {
  const { latitude, longitude } = coords;
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

export function isAndroidEnvironment(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return /Android/i.test(navigator.userAgent || '');
}

export interface OpenMapsOptions {
  isAndroid?: boolean;
  windowTarget?: string;
}

/**
 * Opens maps location on Android via geo: intent, or on web/desktop via Google Maps search URL.
 */
export function openMapsLocation(
  coords: LocationCoords,
  label?: string,
  options?: OpenMapsOptions,
): boolean {
  if (typeof window === 'undefined' || !isLocationCoords(coords)) {
    return false;
  }

  const isAndroid = options?.isAndroid ?? isAndroidEnvironment();

  if (isAndroid) {
    const geoUri = formatGeoUri(coords, label);
    try {
      window.location.href = geoUri;
      return true;
    } catch {
      // Fallback to web link
    }
  }

  const webUrl = formatGoogleMapsUrl(coords);
  const target = options?.windowTarget ?? '_blank';
  window.open(webUrl, target, 'noopener,noreferrer');
  return true;
}
