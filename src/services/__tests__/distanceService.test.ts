import { describe, expect, it } from 'vitest';
import {
  calculateDistance,
  calculateDistanceKm,
  calculateDistanceMiles,
  getProximityBand,
} from '../distanceService';
import type { LocationCoords } from '../../types';

describe('distanceService', () => {
  const cliftonPark: LocationCoords = { latitude: 42.85, longitude: -73.82 };
  const cliftonCommon: LocationCoords = { latitude: 42.8617, longitude: -73.8159 };
  const nysMuseumAlbany: LocationCoords = { latitude: 42.6486, longitude: -73.7622 };
  const saratogaCongressPark: LocationCoords = { latitude: 43.0784, longitude: -73.7847 };
  const lakePlacid: LocationCoords = { latitude: 44.2795, longitude: -73.9799 };

  it('calculates zero distance between identical coordinates', () => {
    expect(calculateDistanceMiles(cliftonPark, cliftonPark)).toBe(0);
    expect(calculateDistanceKm(cliftonPark, cliftonPark)).toBe(0);
  });

  it('calculates accurate distance between Clifton Park and Clifton Common', () => {
    const miles = calculateDistanceMiles(cliftonPark, cliftonCommon);
    expect(miles).toBeGreaterThan(0.7);
    expect(miles).toBeLessThan(1.0);

    const km = calculateDistanceKm(cliftonPark, cliftonCommon);
    expect(km).toBeGreaterThan(1.1);
    expect(km).toBeLessThan(1.6);
  });

  it('calculates accurate distance between Clifton Park and Albany NYS Museum', () => {
    const miles = calculateDistanceMiles(cliftonPark, nysMuseumAlbany);
    expect(miles).toBeGreaterThan(13);
    expect(miles).toBeLessThan(16);
  });

  it('calculates distance between Clifton Park and Saratoga Springs', () => {
    const miles = calculateDistanceMiles(cliftonPark, saratogaCongressPark);
    expect(miles).toBeGreaterThan(14);
    expect(miles).toBeLessThan(18);
  });

  it('correctly maps proximity bands according to specification', () => {
    expect(getProximityBand(0)).toBe('walking');
    expect(getProximityBand(1.0)).toBe('walking');
    expect(getProximityBand(1.5)).toBe('walking');

    expect(getProximityBand(1.51)).toBe('short_drive');
    expect(getProximityBand(5.0)).toBe('short_drive');
    expect(getProximityBand(10.0)).toBe('short_drive');

    expect(getProximityBand(10.01)).toBe('medium_drive');
    expect(getProximityBand(18.5)).toBe('medium_drive');
    expect(getProximityBand(25.0)).toBe('medium_drive');

    expect(getProximityBand(25.01)).toBe('day_trip');
    expect(getProximityBand(100.0)).toBe('day_trip');
  });

  it('calculateDistance returns combined miles, km, and proximityBand', () => {
    const resultClose = calculateDistance(cliftonPark, cliftonCommon);
    expect(resultClose.proximityBand).toBe('walking');
    expect(resultClose.miles).toBeLessThan(1.5);
    expect(resultClose.km).toBeGreaterThan(0);

    const resultMid = calculateDistance(cliftonPark, nysMuseumAlbany);
    expect(resultMid.proximityBand).toBe('medium_drive');

    const resultFar = calculateDistance(cliftonPark, lakePlacid);
    expect(resultFar.proximityBand).toBe('day_trip');
    expect(resultFar.miles).toBeGreaterThan(80);
  });

  it('handles antipodal coordinates without returning NaN due to floating point precision', () => {
    const northPole: LocationCoords = { latitude: 90, longitude: 0 };
    const southPole: LocationCoords = { latitude: -90, longitude: 0 };

    const miles = calculateDistanceMiles(northPole, southPole);
    expect(Number.isNaN(miles)).toBe(false);
    expect(miles).toBeGreaterThan(12000);

    const km = calculateDistanceKm(northPole, southPole);
    expect(Number.isNaN(km)).toBe(false);
    expect(km).toBeGreaterThan(19000);
  });

  it('safely handles invalid inputs and coordinates', () => {
    const invalidCoords = { latitude: NaN, longitude: 0 } as unknown as LocationCoords;
    expect(Number.isNaN(calculateDistanceMiles(cliftonPark, invalidCoords))).toBe(true);
    expect(Number.isNaN(calculateDistanceKm(invalidCoords, cliftonPark))).toBe(true);

    expect(getProximityBand(-1)).toBe('day_trip');
    expect(getProximityBand(Number.NaN)).toBe('day_trip');
  });
});
