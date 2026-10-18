import type { LocationCoords } from './location';
import { isLocationCoords } from './location';

export const ENERGY_LEVELS = ['low', 'medium', 'high'] as const;
export type EnergyLevel = (typeof ENERGY_LEVELS)[number];

export const COST_LEVELS = ['free', '$', '$$', '$$$', '$$$$'] as const;
export type CostLevel = (typeof COST_LEVELS)[number];

export const SPOT_TYPES = ['indoor', 'outdoor', 'covered_outdoor', 'hybrid'] as const;
export type SpotType = (typeof SPOT_TYPES)[number];

export const SPOT_CATEGORIES = [
  'playground',
  'park',
  'nature_trail',
  'museum',
  'library',
  'indoor_play',
  'splash_pad',
  'zoo',
  'aquarium',
  'farm',
  'cafe_play',
  'sports_center',
  'entertainment',
  'other',
] as const;
export type SpotCategory = (typeof SPOT_CATEGORIES)[number];

export interface ParentAmenities {
  strollerFriendly: boolean;
  restroomsAvailable: boolean;
  fencedPlayArea: boolean;
  snacksAllowedOrNearby: boolean;
  changingTablesAvailable?: boolean;
  parkingAvailable?: boolean;
  nursingAreaAvailable?: boolean;
  wheelchairAccessible?: boolean;
}

export interface Spot {
  id: string;
  name: string;
  description?: string;
  category: SpotCategory;
  spotType: SpotType;
  energyLevel: EnergyLevel;
  costLevel: CostLevel;
  coordinates: LocationCoords;
  address?: string;
  city?: string;
  parentAmenities: ParentAmenities;
  isToddlerFriendly: boolean;
  isYoungKidFriendly: boolean;
  recommendedAgeMin?: number;
  recommendedAgeMax?: number;
  sourceUrl?: string;
  sourceHandle?: string;
  instagramPostId?: string;
  imageUrl?: string;
  websiteUrl?: string;
  estimatedDurationMinutes?: number;
  createdAt?: string;
  updatedAt?: string;
}

export function isParentAmenities(value: unknown): value is ParentAmenities {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.strollerFriendly === 'boolean' &&
    typeof candidate.restroomsAvailable === 'boolean' &&
    typeof candidate.fencedPlayArea === 'boolean' &&
    typeof candidate.snacksAllowedOrNearby === 'boolean'
  );
}

export function isSpot(value: unknown): value is Spot {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.category === 'string' &&
    SPOT_CATEGORIES.includes(candidate.category as SpotCategory) &&
    typeof candidate.spotType === 'string' &&
    SPOT_TYPES.includes(candidate.spotType as SpotType) &&
    typeof candidate.energyLevel === 'string' &&
    ENERGY_LEVELS.includes(candidate.energyLevel as EnergyLevel) &&
    typeof candidate.costLevel === 'string' &&
    COST_LEVELS.includes(candidate.costLevel as CostLevel) &&
    isLocationCoords(candidate.coordinates) &&
    isParentAmenities(candidate.parentAmenities) &&
    typeof candidate.isToddlerFriendly === 'boolean' &&
    typeof candidate.isYoungKidFriendly === 'boolean'
  );
}

