import { describe, expect, it } from 'vitest';
import type { LocationCoords, Spot, WeatherState } from '../../types';
import { isTriageOutput } from '../../types';
import { SEED_SPOTS } from '../../storage/seedData';
import { DEFAULT_CLIFTON_PARK_COORDS } from '../../services/geolocationService';
import { runTriage, stratifyAndSelectCandidates } from '../triageAlgorithm';

describe('triageAlgorithm', () => {
  const userLocation: LocationCoords = { ...DEFAULT_CLIFTON_PARK_COORDS };

  const fairWeather: WeatherState = {
    temperatureF: 72,
    condition: 'clear',
    isRaining: false,
    isSnowing: false,
    isExtremeCold: false,
    isExtremeHeat: false,
  };

  const rainyWeather: WeatherState = {
    temperatureF: 55,
    condition: 'rain',
    isRaining: true,
    isSnowing: false,
    isExtremeCold: false,
    isExtremeHeat: false,
  };

  const snowyWeather: WeatherState = {
    temperatureF: 26,
    condition: 'snow',
    isRaining: false,
    isSnowing: true,
    isExtremeCold: true,
    isExtremeHeat: false,
  };

  describe('Option Count Selection (3, 5, 10, all)', () => {
    it('returns up to 3 candidates when countOption is 3', () => {
      const output = runTriage(
        SEED_SPOTS,
        { userLocation, countOption: 3 },
        fairWeather,
      );
      expect(isTriageOutput(output)).toBe(true);
      expect(output.candidates).toHaveLength(3);
      expect(output.totalCandidates).toBe(SEED_SPOTS.length);
    });

    it('returns up to 5 candidates when countOption is 5', () => {
      const output = runTriage(
        SEED_SPOTS,
        { userLocation, countOption: 5 },
        fairWeather,
      );
      expect(output.candidates).toHaveLength(5);
    });

    it('returns up to 10 candidates when countOption is 10', () => {
      const output = runTriage(
        SEED_SPOTS,
        { userLocation, countOption: 10 },
        fairWeather,
      );
      expect(output.candidates).toHaveLength(10);
    });

    it('returns all matching candidates sorted strictly by ascending distance when countOption is all', () => {
      const output = runTriage(
        SEED_SPOTS,
        { userLocation, countOption: 'all' },
        fairWeather,
      );
      expect(output.candidates).toHaveLength(SEED_SPOTS.length);

      for (let i = 1; i < output.candidates.length; i++) {
        const prevDist = output.candidates[i - 1].distanceMiles ?? 0;
        const currDist = output.candidates[i].distanceMiles ?? 0;
        expect(currDist).toBeGreaterThanOrEqual(prevDist);
      }
    });
  });

  describe('Category Diversity & Stratification', () => {
    it('maximizes distinct spot categories in Quick 3 and Top 5 modes', () => {
      const quick3 = runTriage(
        SEED_SPOTS,
        { userLocation, countOption: 3 },
        fairWeather,
      );
      const uniqueCategories3 = new Set(
        quick3.candidates.map((c) => c.spot.category),
      );
      expect(uniqueCategories3.size).toBe(3);

      const top5 = runTriage(
        SEED_SPOTS,
        { userLocation, countOption: 5 },
        fairWeather,
      );
      const uniqueCategories5 = new Set(
        top5.candidates.map((c) => c.spot.category),
      );
      expect(uniqueCategories5.size).toBe(5);
    });

    it('handles round-robin wrap-around when requested count exceeds distinct categories', () => {
      const singleCategorySpots: Spot[] = SEED_SPOTS.filter(
        (s) => s.category === 'park',
      );
      expect(singleCategorySpots.length).toBeGreaterThanOrEqual(3);

      const result = runTriage(
        singleCategorySpots,
        { userLocation, countOption: 3 },
        fairWeather,
      );
      expect(result.candidates).toHaveLength(3);
      const uniqueIds = new Set(result.candidates.map((c) => c.spot.id));
      expect(uniqueIds.size).toBe(3);
    });

    it('returns empty array when stratifying 0 candidates', () => {
      expect(stratifyAndSelectCandidates([], 5)).toEqual([]);
    });
  });

  describe('Step 1: Weather Filtering & Overrides', () => {
    it('excludes uncovered outdoor spots during rain when override is false', () => {
      const output = runTriage(
        SEED_SPOTS,
        { userLocation, countOption: 'all' },
        rainyWeather,
      );
      expect(output.candidates.length).toBeGreaterThan(0);
      expect(
        output.candidates.every((c) => c.spot.spotType !== 'outdoor'),
      ).toBe(true);
    });

    it('excludes uncovered outdoor spots during snow when override is false', () => {
      const output = runTriage(
        SEED_SPOTS,
        { userLocation, countOption: 'all' },
        snowyWeather,
      );
      expect(output.candidates.length).toBeGreaterThan(0);
      expect(
        output.candidates.every((c) => c.spot.spotType !== 'outdoor'),
      ).toBe(true);
    });

    it('includes outdoor spots with caution warnings when includeOutdoorAnyway is enabled during rain', () => {
      const output = runTriage(
        SEED_SPOTS,
        { userLocation, countOption: 'all' },
        rainyWeather,
        { includeOutdoorAnyway: true },
      );
      expect(output.candidates).toHaveLength(SEED_SPOTS.length);
      const outdoorCandidate = output.candidates.find(
        (c) => c.spot.spotType === 'outdoor',
      );
      expect(outdoorCandidate).toBeDefined();
      expect(outdoorCandidate?.cautions?.length).toBeGreaterThan(0);
    });

    it('respects filter.weatherOverride when provided', () => {
      const output = runTriage(
        SEED_SPOTS,
        {
          userLocation,
          countOption: 'all',
          weatherOverride: fairWeather,
        },
        rainyWeather,
      );
      expect(output.candidates).toHaveLength(SEED_SPOTS.length);
    });
  });

  describe('Step 3: Strict Kid Filtering, Free Only, Energy, and Distance', () => {
    it('strictly excludes non-toddler spots when requireToddlerFriendly is true', () => {
      const customSpots: Spot[] = [
        {
          ...SEED_SPOTS[0],
          id: 'toddler-yes',
          isToddlerFriendly: true,
          isYoungKidFriendly: true,
        },
        {
          ...SEED_SPOTS[1],
          id: 'toddler-no',
          isToddlerFriendly: false,
          isYoungKidFriendly: true,
        },
      ];

      const output = runTriage(
        customSpots,
        { userLocation, requireToddlerFriendly: true, countOption: 'all' },
        fairWeather,
      );

      expect(output.candidates).toHaveLength(1);
      expect(output.candidates[0].spot.id).toBe('toddler-yes');
    });

    it('strictly excludes non-young-kid spots when requireYoungKidFriendly is true', () => {
      const customSpots: Spot[] = [
        {
          ...SEED_SPOTS[0],
          id: 'young-yes',
          isToddlerFriendly: true,
          isYoungKidFriendly: true,
        },
        {
          ...SEED_SPOTS[1],
          id: 'young-no',
          isToddlerFriendly: true,
          isYoungKidFriendly: false,
        },
      ];

      const output = runTriage(
        customSpots,
        { userLocation, requireYoungKidFriendly: true, countOption: 'all' },
        fairWeather,
      );

      expect(output.candidates).toHaveLength(1);
      expect(output.candidates[0].spot.id).toBe('young-yes');
    });

    it('excludes paid spots when costLevels is restricted to free', () => {
      const output = runTriage(
        SEED_SPOTS,
        { userLocation, costLevels: ['free'], countOption: 'all' },
        fairWeather,
      );

      expect(output.candidates.length).toBeGreaterThan(0);
      expect(
        output.candidates.every((c) => c.spot.costLevel === 'free'),
      ).toBe(true);
    });

    it('filters by energyLevels, maxDistanceMiles, requiredAmenities, and searchQuery', () => {
      const output = runTriage(
        SEED_SPOTS,
        {
          userLocation,
          energyLevels: ['medium'],
          maxDistanceMiles: 20,
          requiredAmenities: { strollerFriendly: true, restroomsAvailable: true },
          searchQuery: 'Colonie',
          countOption: 'all',
        },
        fairWeather,
      );

      expect(output.candidates.length).toBeGreaterThan(0);
      for (const candidate of output.candidates) {
        expect(candidate.spot.energyLevel).toBe('medium');
        expect(candidate.distanceMiles).toBeLessThanOrEqual(20);
        expect(candidate.spot.parentAmenities.strollerFriendly).toBe(true);
        expect(candidate.spot.parentAmenities.restroomsAvailable).toBe(true);
      }
    });

    it('stratifies across distinct categories and supports shuffle even when candidates.length <= countOption', () => {
      const pool: Spot[] = [
        {
          ...SEED_SPOTS[0],
          id: 'park-1',
          category: 'park',
          coordinates: { latitude: 42.851, longitude: -73.821 },
        },
        {
          ...SEED_SPOTS[0],
          id: 'park-2',
          category: 'park',
          coordinates: { latitude: 42.852, longitude: -73.822 },
        },
        {
          ...SEED_SPOTS[2],
          id: 'museum-1',
          category: 'museum',
          coordinates: { latitude: 42.75, longitude: -73.75 },
        },
      ];

      const stratified = runTriage(
        pool,
        { userLocation, countOption: 5 },
        fairWeather,
      );
      expect(stratified.candidates).toHaveLength(3);
      // Round 1 picks the top park and the top museum before Round 2 picks the second park
      expect(stratified.candidates[0].spot.category).toBe('park');
      expect(stratified.candidates[1].spot.category).toBe('museum');
      expect(stratified.candidates[2].spot.category).toBe('park');

      expect(stratified.candidates[0].spot.id).toBe('park-1');

      // Shuffling with deterministic randomFn reorders candidates even when candidates.length <= countOption
      let toggle = false;
      const customRandom = () => {
        toggle = !toggle;
        return toggle ? 0.0 : 1.0;
      };
      const shuffled = runTriage(
        pool,
        { userLocation, countOption: 5 },
        fairWeather,
        { shuffle: true, randomFn: customRandom },
      );
      expect(shuffled.candidates[0].spot.id).toBe('park-2');
    });

    it('honors filter.includeOutdoorAnyway and explicit outdoor spotTypes even when options.includeOutdoorAnyway is false', () => {
      const withFilterOverride = runTriage(
        SEED_SPOTS,
        { userLocation, countOption: 'all', includeOutdoorAnyway: true },
        rainyWeather,
        { includeOutdoorAnyway: false },
      );
      expect(withFilterOverride.candidates).toHaveLength(SEED_SPOTS.length);

      const withExplicitOutdoorType = runTriage(
        SEED_SPOTS,
        { userLocation, countOption: 'all', spotTypes: ['outdoor'] },
        rainyWeather,
        { includeOutdoorAnyway: false },
      );
      expect(withExplicitOutdoorType.candidates.length).toBeGreaterThan(0);
      expect(
        withExplicitOutdoorType.candidates.every((c) => c.spot.spotType === 'outdoor'),
      ).toBe(true);
    });

    it('excludes spots with invalid coordinates when maxDistanceMiles or maxProximityBand is active', () => {
      const spotsWithMalformedCoords: Spot[] = [
        SEED_SPOTS[0],
        {
          ...SEED_SPOTS[1],
          id: 'corrupted-coords',
          coordinates: { latitude: Number.NaN, longitude: -73.82 },
        },
      ];

      const byDistance = runTriage(
        spotsWithMalformedCoords,
        { userLocation, maxDistanceMiles: 50, countOption: 'all' },
        fairWeather,
      );
      expect(byDistance.candidates).toHaveLength(1);
      expect(byDistance.candidates[0].spot.id).toBe(SEED_SPOTS[0].id);

      const byBand = runTriage(
        spotsWithMalformedCoords,
        { userLocation, maxProximityBand: 'day_trip', countOption: 'all' },
        fairWeather,
      );
      expect(byBand.candidates).toHaveLength(1);
      expect(byBand.candidates[0].spot.id).toBe(SEED_SPOTS[0].id);
    });
  });
});
