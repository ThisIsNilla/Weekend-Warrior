import type { LocationCoords, ProximityBand } from '../types';
import { isLocationCoords } from '../types';

const EARTH_RADIUS_MILES = 3958.8;
const EARTH_RADIUS_KM = 6371.0;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculates the Haversine spherical distance between two sets of coordinates in miles.
 */
export function calculateDistanceMiles(from: LocationCoords, to: LocationCoords): number {
  if (!isLocationCoords(from) || !isLocationCoords(to)) {
    return Number.NaN;
  }

  if (from.latitude === to.latitude && from.longitude === to.longitude) {
    return 0;
  }

  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const clampedA = Math.max(0, Math.min(1, a));
  const c = 2 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(1 - clampedA));
  const distance = EARTH_RADIUS_MILES * c;

  return Math.round(distance * 100) / 100;
}

/**
 * Calculates the Haversine spherical distance between two sets of coordinates in kilometers.
 */
export function calculateDistanceKm(from: LocationCoords, to: LocationCoords): number {
  if (!isLocationCoords(from) || !isLocationCoords(to)) {
    return Number.NaN;
  }

  if (from.latitude === to.latitude && from.longitude === to.longitude) {
    return 0;
  }

  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const clampedA = Math.max(0, Math.min(1, a));
  const c = 2 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(1 - clampedA));
  const distance = EARTH_RADIUS_KM * c;

  return Math.round(distance * 100) / 100;
}

/**
 * Determines the ProximityBand category from distance in miles:
 * - walking: <= 1.5 miles
 * - short_drive: <= 10 miles
 * - medium_drive: <= 25 miles
 * - day_trip: > 25 miles
 */
export function getProximityBand(distanceMiles: number): ProximityBand {
  if (typeof distanceMiles !== 'number' || Number.isNaN(distanceMiles) || distanceMiles < 0) {
    return 'day_trip';
  }
  if (distanceMiles <= 1.5) {
    return 'walking';
  }
  if (distanceMiles <= 10) {
    return 'short_drive';
  }
  if (distanceMiles <= 25) {
    return 'medium_drive';
  }
  return 'day_trip';
}

export interface DistanceCalculationResult {
  miles: number;
  km: number;
  proximityBand: ProximityBand;
}

/**
 * Calculates both miles, kilometers, and proximity band between two sets of coordinates.
 */
export function calculateDistance(from: LocationCoords, to: LocationCoords): DistanceCalculationResult {
  const miles = calculateDistanceMiles(from, to);
  const km = calculateDistanceKm(from, to);
  const proximityBand = getProximityBand(miles);

  return { miles, km, proximityBand };
}
