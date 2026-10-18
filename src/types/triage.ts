import type { CostLevel, EnergyLevel, ParentAmenities, Spot, SpotCategory, SpotType } from './spot';
import { isSpot } from './spot';
import type { LocationCoords } from './location';
import type { WeatherState } from './weather';

export const TRIAGE_COUNT_OPTIONS = [3, 5, 10, 'all'] as const;
export type TriageCountOption = (typeof TRIAGE_COUNT_OPTIONS)[number];

export const PROXIMITY_BANDS = [
  'walking',
  'short_drive',
  'medium_drive',
  'day_trip',
  'any',
] as const;
export type ProximityBand = (typeof PROXIMITY_BANDS)[number];

export interface TriageFilter {
  userLocation?: LocationCoords;
  maxProximityBand?: ProximityBand;
  maxDistanceMiles?: number;
  energyLevels?: EnergyLevel[];
  costLevels?: CostLevel[];
  spotTypes?: SpotType[];
  categories?: SpotCategory[];
  requireToddlerFriendly?: boolean;
  requireYoungKidFriendly?: boolean;
  requiredAmenities?: Partial<ParentAmenities>;
  countOption?: TriageCountOption;
  weatherOverride?: WeatherState;
  searchQuery?: string;
  openNow?: boolean;
}

export interface TriageCandidate {
  spot: Spot;
  distanceMiles?: number;
  proximityBand?: ProximityBand;
  weatherFitScore: number;
  overallScore: number;
  matchReasons: string[];
  cautions?: string[];
}

export interface TriageOutput {
  candidates: TriageCandidate[];
  totalCandidates: number;
  appliedFilter: TriageFilter;
  currentWeather?: WeatherState;
  generatedAt: string;
}

export function isTriageCandidate(value: unknown): value is TriageCandidate {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    isSpot(candidate.spot) &&
    typeof candidate.weatherFitScore === 'number' &&
    typeof candidate.overallScore === 'number' &&
    Array.isArray(candidate.matchReasons)
  );
}

export function isTriageOutput(value: unknown): value is TriageOutput {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    Array.isArray(candidate.candidates) &&
    candidate.candidates.every(isTriageCandidate) &&
    typeof candidate.totalCandidates === 'number' &&
    typeof candidate.generatedAt === 'string' &&
    candidate.appliedFilter !== undefined
  );
}

