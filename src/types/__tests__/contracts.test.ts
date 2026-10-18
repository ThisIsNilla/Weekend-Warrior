import { describe, it, expect } from 'vitest';
import capacitorConfig from '../../../capacitor.config';
import { Geolocation } from '@capacitor/geolocation';
import {
  type Spot,
  type SpotCategory,
  type EnergyLevel,
  type CostLevel,
  type SpotType,
  type ParentAmenities,
  type LocationCoords,
  type WeatherState,
  type WeatherCondition,
  type TriageCountOption,
  type ProximityBand,
  type TriageFilter,
  type TriageCandidate,
  type TriageOutput,
  ENERGY_LEVELS,
  COST_LEVELS,
  SPOT_TYPES,
  SPOT_CATEGORIES,
  WEATHER_CONDITIONS,
  TRIAGE_COUNT_OPTIONS,
  PROXIMITY_BANDS,
  isSpot,
  isParentAmenities,
  isWeatherState,
  isLocationCoords,
  isTriageCandidate,
  isTriageOutput,
} from '../index';

describe('Capacitor Configuration Contract', () => {
  it('matches required app metadata and output directory', () => {
    expect(capacitorConfig.appId).toBe('com.weekendouting.triage');
    expect(capacitorConfig.appName).toBe('Weekend Outing Triage');
    expect(capacitorConfig.webDir).toBe('dist');
  });

  it('verifies capacitor geolocation plugin is imported properly', () => {
    expect(Geolocation).toBeDefined();
    expect(typeof Geolocation.getCurrentPosition).toBe('function');
    expect(typeof Geolocation.watchPosition).toBe('function');
  });
});

describe('Location Data Contract', () => {
  it('creates valid location coordinates and passes type guard', () => {
    const coords: LocationCoords = {
      latitude: 40.7128,
      longitude: -74.006,
      accuracy: 5,
    };
    expect(coords.latitude).toBeCloseTo(40.7128);
    expect(coords.longitude).toBeCloseTo(-74.006);
    expect(isLocationCoords(coords)).toBe(true);
  });

  it('rejects invalid or out of range coordinates', () => {
    expect(isLocationCoords(null)).toBe(false);
    expect(isLocationCoords(undefined)).toBe(false);
    expect(isLocationCoords({ latitude: '40', longitude: -74 })).toBe(false);
    expect(isLocationCoords({ latitude: 91, longitude: -74 })).toBe(false);
    expect(isLocationCoords({ latitude: -91, longitude: -74 })).toBe(false);
    expect(isLocationCoords({ latitude: 40, longitude: 181 })).toBe(false);
    expect(isLocationCoords({ latitude: 40, longitude: -181 })).toBe(false);
    expect(isLocationCoords({ latitude: Number.NaN, longitude: -74 })).toBe(false);
  });
});

describe('Weather Data Contract', () => {
  it('supports weather condition and full weather state', () => {
    const condition: WeatherCondition = 'rain';
    const weather: WeatherState = {
      temperatureF: 65,
      condition,
      isRaining: true,
      isSnowing: false,
      isExtremeCold: false,
      isExtremeHeat: false,
      feelsLikeF: 63,
      precipitationChance: 80,
      windSpeedMph: 12,
    };

    expect(weather.isRaining).toBe(true);
    expect(weather.temperatureF).toBe(65);
    expect(weather.feelsLikeF).toBe(63);
    expect(weather.condition).toBe('rain');
    expect(isWeatherState(weather)).toBe(true);
  });

  it('supports condition aliases and rejects corrupted weather records', () => {
    expect(WEATHER_CONDITIONS).toContain('partly_cloudy');
    expect(WEATHER_CONDITIONS).toContain('partly-cloudy');
    expect(WEATHER_CONDITIONS).toContain('heavy_rain');
    expect(WEATHER_CONDITIONS).toContain('heavy-rain');

    expect(isWeatherState(null)).toBe(false);
    expect(isWeatherState({ temperatureF: 'warm' })).toBe(false);
    expect(
      isWeatherState({
        temperatureF: 70,
        condition: 'volcanic_ash',
        isRaining: false,
        isSnowing: false,
        isExtremeCold: false,
        isExtremeHeat: false,
      })
    ).toBe(false);
  });
});

describe('Spot Data Contract', () => {
  it('enforces required parent amenities and kid flags', () => {
    const amenities: ParentAmenities = {
      strollerFriendly: true,
      restroomsAvailable: true,
      fencedPlayArea: true,
      snacksAllowedOrNearby: true,
    };

    const energy: EnergyLevel = 'high';
    const cost: CostLevel = 'free';
    const spotType: SpotType = 'outdoor';
    const category: SpotCategory = 'playground';

    const spot: Spot = {
      id: 'spot-101',
      name: 'Madison Meadow Playground',
      category,
      spotType,
      energyLevel: energy,
      costLevel: cost,
      coordinates: {
        latitude: 40.758,
        longitude: -73.9855,
      },
      parentAmenities: amenities,
      isToddlerFriendly: true,
      isYoungKidFriendly: true,
      sourceUrl: 'https://www.instagram.com/p/DA123456789/',
      sourceHandle: '@nyc_parent_outings',
    };

    expect(spot.name).toBe('Madison Meadow Playground');
    expect(spot.parentAmenities.fencedPlayArea).toBe(true);
    expect(spot.isToddlerFriendly).toBe(true);
    expect(spot.sourceHandle).toBe('@nyc_parent_outings');
    expect(spot.energyLevel).toBe('high');
    expect(spot.costLevel).toBe('free');
    expect(isParentAmenities(amenities)).toBe(true);
    expect(isSpot(spot)).toBe(true);
  });

  it('rejects spot when required fields or child amenities are missing', () => {
    expect(isSpot(null)).toBe(false);
    expect(
      isSpot({
        id: 'spot-missing',
        name: 'Incomplete Spot',
      })
    ).toBe(false);
    expect(
      isSpot({
        id: 'spot-bad-cat',
        name: 'Bad Category',
        category: 'laser_tag_arena',
        spotType: 'indoor',
        energyLevel: 'high',
        costLevel: '$$',
        coordinates: { latitude: 40, longitude: -74 },
        parentAmenities: {
          strollerFriendly: true,
          restroomsAvailable: true,
          fencedPlayArea: true,
          snacksAllowedOrNearby: true,
        },
        isToddlerFriendly: true,
        isYoungKidFriendly: true,
      })
    ).toBe(false);
  });

  it('verifies cost, energy, and spot type constant collections', () => {
    expect(ENERGY_LEVELS).toEqual(['low', 'medium', 'high']);
    expect(COST_LEVELS).toEqual(['free', '$', '$$', '$$$', '$$$$']);
    expect(SPOT_TYPES).toEqual(['indoor', 'outdoor', 'covered_outdoor', 'hybrid']);
    expect(SPOT_CATEGORIES).toContain('playground');
    expect(SPOT_CATEGORIES).toContain('indoor_play');
  });
});

describe('Triage Data Contract', () => {
  it('validates triage filter, count options, and candidates', () => {
    const countOption: TriageCountOption = 5;
    const band: ProximityBand = 'short_drive';

    const filter: TriageFilter = {
      userLocation: { latitude: 40.7128, longitude: -74.006 },
      maxProximityBand: band,
      countOption,
      requireToddlerFriendly: true,
      energyLevels: ['high', 'medium'],
      costLevels: ['free', '$'],
    };

    const spot: Spot = {
      id: 'spot-102',
      name: 'Riverside Sensory Garden',
      category: 'park',
      spotType: 'outdoor',
      energyLevel: 'medium',
      costLevel: 'free',
      coordinates: { latitude: 40.72, longitude: -74.01 },
      parentAmenities: {
        strollerFriendly: true,
        restroomsAvailable: true,
        fencedPlayArea: false,
        snacksAllowedOrNearby: true,
      },
      isToddlerFriendly: true,
      isYoungKidFriendly: true,
    };

    const candidate: TriageCandidate = {
      spot,
      distanceMiles: 1.2,
      proximityBand: 'short_drive',
      weatherFitScore: 95,
      overallScore: 92,
      matchReasons: ['Sunny weather match', 'Toddler friendly'],
    };

    const output: TriageOutput = {
      candidates: [candidate],
      totalCandidates: 1,
      appliedFilter: filter,
      generatedAt: new Date().toISOString(),
    };

    expect(output.candidates).toHaveLength(1);
    expect(output.candidates[0].overallScore).toBe(92);
    expect(output.appliedFilter.countOption).toBe(5);
    expect(isTriageCandidate(candidate)).toBe(true);
    expect(isTriageOutput(output)).toBe(true);
  });

  it('allows all triage count options and proximity bands', () => {
    expect(TRIAGE_COUNT_OPTIONS).toEqual([3, 5, 10, 'all']);
    expect(PROXIMITY_BANDS).toEqual([
      'walking',
      'short_drive',
      'medium_drive',
      'day_trip',
      'any',
    ]);
  });
});
