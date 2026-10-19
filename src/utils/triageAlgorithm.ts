import type {
  ParentAmenities,
  ProximityBand,
  Spot,
  SpotCategory,
  TriageCandidate,
  TriageCountOption,
  TriageFilter,
  TriageOutput,
  WeatherState,
} from '../types';
import { isLocationCoords } from '../types';
import { calculateDistance } from '../services/distanceService';
import { calculateWeatherFitScore, isInclementWeather } from './weatherCodes';

export interface TriageExecutionOptions {
  /**
   * When true, outdoor spots are kept even during rain, storm, or snow (with a caution message).
   */
  includeOutdoorAnyway?: boolean;
  /**
   * When true, applies randomized score jitter to shuffle candidate selection on reroll.
   */
  shuffle?: boolean;
  /**
   * Optional custom random generator (0 to 1) for deterministic testing of shuffle behavior.
   */
  randomFn?: () => number;
}

export type ExtendedTriageFilter = TriageFilter & {
  includeOutdoorAnyway?: boolean;
};

const PROXIMITY_BAND_RANK: Record<ProximityBand, number> = {
  walking: 1,
  short_drive: 2,
  medium_drive: 3,
  day_trip: 4,
  any: 5,
};

export function isWithinProximityBand(
  candidateBand: ProximityBand,
  maxBand: ProximityBand,
): boolean {
  if (maxBand === 'any') {
    return true;
  }
  return PROXIMITY_BAND_RANK[candidateBand] <= PROXIMITY_BAND_RANK[maxBand];
}

/**
 * Calculates a 0 to 100 proximity score from distance in miles.
 */
export function calculateProximityScore(distanceMiles?: number): number {
  if (typeof distanceMiles !== 'number' || Number.isNaN(distanceMiles)) {
    return 75;
  }
  if (distanceMiles <= 1.5) {
    return 100;
  }
  const score = Math.round(100 - distanceMiles * 2.2);
  return Math.max(5, Math.min(100, score));
}

/**
 * Calculates a 0 to 100 family amenity score based on ParentAmenities and kid suitability.
 */
export function calculateAmenityScore(spot: Spot): number {
  let score = 30;
  const amenities = spot.parentAmenities;

  if (amenities.strollerFriendly) score += 15;
  if (amenities.restroomsAvailable) score += 15;
  if (amenities.fencedPlayArea) score += 15;
  if (amenities.snacksAllowedOrNearby) score += 10;
  if (amenities.changingTablesAvailable) score += 5;
  if (amenities.parkingAvailable) score += 5;
  if (spot.costLevel === 'free') score += 5;

  return Math.min(100, score);
}

/**
 * Checks if a spot satisfies all required amenities specified in the filter.
 */
export function matchesRequiredAmenities(
  spotAmenities: ParentAmenities,
  required?: Partial<ParentAmenities>,
): boolean {
  if (!required) {
    return true;
  }
  const keys = Object.keys(required) as (keyof ParentAmenities)[];
  for (const key of keys) {
    if (required[key] === true && spotAmenities[key] !== true) {
      return false;
    }
  }
  return true;
}

/**
 * Checks if a spot matches a text search query across name, description, city, address, category, or handle.
 */
export function matchesSearchQuery(spot: Spot, query?: string): boolean {
  if (!query || !query.trim()) {
    return true;
  }
  const normalized = query.trim().toLowerCase();
  const haystacks = [
    spot.name,
    spot.description ?? '',
    spot.city ?? '',
    spot.address ?? '',
    spot.category.replace(/_/g, ' '),
    spot.sourceHandle ?? '',
  ];
  return haystacks.some((text) => text.toLowerCase().includes(normalized));
}

/**
 * Builds human-readable match reasons and weather cautions for a spot.
 */
export function buildCandidateInsights(
  spot: Spot,
  distanceMiles?: number,
  weather?: WeatherState,
): { matchReasons: string[]; cautions: string[] } {
  const matchReasons: string[] = [];
  const cautions: string[] = [];
  const inclement = isInclementWeather(weather);

  if (typeof distanceMiles === 'number' && !Number.isNaN(distanceMiles)) {
    if (distanceMiles <= 1.5) {
      matchReasons.push(`Walking distance (${distanceMiles} mi)`);
    } else if (distanceMiles <= 10) {
      matchReasons.push(`Quick drive (${distanceMiles} mi)`);
    }
  }

  if (inclement) {
    if (spot.spotType === 'indoor') {
      matchReasons.push('Indoor shelter from active weather');
    } else if (spot.spotType === 'covered_outdoor') {
      matchReasons.push('Covered outdoor protection');
      cautions.push('Partially exposed to weather elements');
    } else if (spot.spotType === 'hybrid') {
      matchReasons.push('Indoor and outdoor options available');
      cautions.push('Stick to indoor areas during active precipitation');
    } else if (spot.spotType === 'outdoor') {
      cautions.push('Precipitation detected: outdoor area may be wet or closed');
    }
  } else if (weather) {
    if (spot.spotType === 'outdoor' && !weather.isExtremeCold && !weather.isExtremeHeat) {
      matchReasons.push('Great weather for outdoor play');
    }
  }

  if (weather?.isExtremeHeat && spot.spotType !== 'indoor') {
    cautions.push('High heat advisory: bring water and sun protection');
  }
  if (weather?.isExtremeCold && spot.spotType !== 'indoor') {
    cautions.push('Cold weather advisory: dress warmly in layers');
  }

  if (spot.costLevel === 'free') {
    matchReasons.push('Free outing');
  }
  if (spot.isToddlerFriendly) {
    matchReasons.push('Toddler friendly (0-3)');
  }
  if (spot.isYoungKidFriendly) {
    matchReasons.push('Young kids (4-7)');
  }
  if (spot.parentAmenities.fencedPlayArea) {
    matchReasons.push('Fenced play area');
  }
  if (spot.parentAmenities.strollerFriendly) {
    matchReasons.push('Stroller friendly');
  }

  return { matchReasons, cautions };
}

/**
 * Stratifies candidates across distinct SpotCategory buckets first to maximize variety,
 * then picks top-scoring candidates round-robin up to count.
 */
export function stratifyAndSelectCandidates(
  candidates: TriageCandidate[],
  count: number,
  options?: TriageExecutionOptions,
): TriageCandidate[] {
  if (count <= 0 || candidates.length === 0) {
    return [];
  }

  const randomFn = options?.randomFn ?? Math.random;
  const shouldShuffle = Boolean(options?.shuffle);

  // Assign working score (with optional reroll jitter when shuffle is enabled)
  const scoredPool = candidates.map((candidate) => {
    const jitter = shouldShuffle ? Math.round((randomFn() - 0.5) * 35) : 0;
    return {
      candidate,
      workingScore: candidate.overallScore + jitter,
    };
  });

  // Group by category
  const categoryBuckets = new Map<SpotCategory, typeof scoredPool>();
  for (const item of scoredPool) {
    const category = item.candidate.spot.category;
    const bucket = categoryBuckets.get(category) ?? [];
    bucket.push(item);
    categoryBuckets.set(category, bucket);
  }

  // Sort items within each category bucket by workingScore desc, then distanceMiles asc
  for (const bucket of categoryBuckets.values()) {
    bucket.sort((a, b) => {
      if (b.workingScore !== a.workingScore) {
        return b.workingScore - a.workingScore;
      }
      return (a.candidate.distanceMiles ?? 999) - (b.candidate.distanceMiles ?? 999);
    });
  }

  // Order categories by the top item's workingScore in each bucket
  const orderedCategories = Array.from(categoryBuckets.entries())
    .sort((a, b) => {
      const topA = a[1][0]?.workingScore ?? 0;
      const topB = b[1][0]?.workingScore ?? 0;
      if (topB !== topA) {
        return topB - topA;
      }
      const distA = a[1][0]?.candidate.distanceMiles ?? 999;
      const distB = b[1][0]?.candidate.distanceMiles ?? 999;
      return distA - distB;
    })
    .map(([category]) => category);

  const selected: TriageCandidate[] = [];
  const selectedIds = new Set<string>();
  let roundIndex = 0;

  while (selected.length < count) {
    let addedInRound = false;

    for (const category of orderedCategories) {
      if (selected.length >= count) {
        break;
      }
      const bucket = categoryBuckets.get(category);
      if (bucket && roundIndex < bucket.length) {
        const chosen = bucket[roundIndex].candidate;
        if (!selectedIds.has(chosen.spot.id)) {
          selected.push(chosen);
          selectedIds.add(chosen.spot.id);
          addedInRound = true;
        }
      }
    }

    if (!addedInRound) {
      break;
    }
    roundIndex += 1;
  }

  return selected;
}

/**
 * Main Multi-Option Triage & Proximity Engine.
 *
 * Step 1: Weather Filter (excludes uncovered outdoor spots in rain/storm/snow unless overridden)
 * Step 2: Distance Calculation via Haversine distanceService & proximity band classification
 * Step 3: Attribute & Strict Kid Filtering (toddler 0-3, young kids 4-7, free only, energy, distance, amenities, search)
 * Step 4 & 5: Sort by ascending distance for 'all', or stratify across categories and rank for 3, 5, or 10.
 */
export function runTriage(
  spots: Spot[],
  filter: ExtendedTriageFilter = {},
  currentWeather?: WeatherState,
  options?: TriageExecutionOptions,
): TriageOutput {
  const effectiveWeather = filter.weatherOverride ?? currentWeather;
  const countOption: TriageCountOption = filter.countOption ?? 5;
  const hasValidUserLocation = Boolean(
    filter.userLocation && isLocationCoords(filter.userLocation),
  );

  const explicitOutdoorFilter = Boolean(
    filter.spotTypes && filter.spotTypes.includes('outdoor'),
  );
  const includeOutdoorAnyway = Boolean(
    options?.includeOutdoorAnyway || filter.includeOutdoorAnyway || explicitOutdoorFilter,
  );
  const inclement = isInclementWeather(effectiveWeather);

  const validCandidates: TriageCandidate[] = [];

  for (const spot of spots) {
    // Step 1: Weather Filter
    if (inclement && !includeOutdoorAnyway && spot.spotType === 'outdoor') {
      continue;
    }

    if (filter.spotTypes && filter.spotTypes.length > 0) {
      if (!filter.spotTypes.includes(spot.spotType)) {
        continue;
      }
    }

    // Step 2: Distance Calculation & Proximity Band Classification
    let distanceMiles: number | undefined;
    let proximityBand: ProximityBand | undefined;

    if (hasValidUserLocation && filter.userLocation) {
      const distResult = calculateDistance(filter.userLocation, spot.coordinates);
      if (!Number.isNaN(distResult.miles)) {
        distanceMiles = distResult.miles;
        proximityBand = distResult.proximityBand;
      }
    }

    if (
      typeof filter.maxDistanceMiles === 'number' &&
      !Number.isNaN(filter.maxDistanceMiles) &&
      hasValidUserLocation &&
      (distanceMiles === undefined || distanceMiles > filter.maxDistanceMiles)
    ) {
      continue;
    }

    if (
      filter.maxProximityBand &&
      filter.maxProximityBand !== 'any' &&
      hasValidUserLocation &&
      (proximityBand === undefined ||
        !isWithinProximityBand(proximityBand, filter.maxProximityBand))
    ) {
      continue;
    }

    // Step 3: Attribute & Strict Kid Filtering
    if (filter.requireToddlerFriendly === true && !spot.isToddlerFriendly) {
      continue;
    }

    if (filter.requireYoungKidFriendly === true && !spot.isYoungKidFriendly) {
      continue;
    }

    if (filter.costLevels && filter.costLevels.length > 0) {
      if (!filter.costLevels.includes(spot.costLevel)) {
        continue;
      }
    }

    if (filter.energyLevels && filter.energyLevels.length > 0) {
      if (!filter.energyLevels.includes(spot.energyLevel)) {
        continue;
      }
    }

    if (filter.categories && filter.categories.length > 0) {
      if (!filter.categories.includes(spot.category)) {
        continue;
      }
    }

    if (!matchesRequiredAmenities(spot.parentAmenities, filter.requiredAmenities)) {
      continue;
    }

    if (!matchesSearchQuery(spot, filter.searchQuery)) {
      continue;
    }

    // Step 4: Weighted Scoring
    const weatherFitScore = calculateWeatherFitScore(spot.spotType, effectiveWeather);
    const proximityScore = calculateProximityScore(distanceMiles);
    const amenityScore = calculateAmenityScore(spot);

    const overallScore = Math.round(
      proximityScore * 0.45 + weatherFitScore * 0.35 + amenityScore * 0.2,
    );

    const { matchReasons, cautions } = buildCandidateInsights(
      spot,
      distanceMiles,
      effectiveWeather,
    );

    validCandidates.push({
      spot,
      distanceMiles,
      proximityBand,
      weatherFitScore,
      overallScore,
      matchReasons,
      cautions: cautions.length > 0 ? cautions : undefined,
    });
  }

  const totalCandidates = validCandidates.length;

  // Step 5: Selection & Ordering
  let finalCandidates: TriageCandidate[];

  if (countOption === 'all') {
    finalCandidates = [...validCandidates].sort((a, b) => {
      if (a.distanceMiles !== undefined && b.distanceMiles !== undefined) {
        if (a.distanceMiles !== b.distanceMiles) {
          return a.distanceMiles - b.distanceMiles;
        }
      } else if (a.distanceMiles !== undefined) {
        return -1;
      } else if (b.distanceMiles !== undefined) {
        return 1;
      }
      if (b.overallScore !== a.overallScore) {
        return b.overallScore - a.overallScore;
      }
      return a.spot.name.localeCompare(b.spot.name);
    });
  } else {
    finalCandidates = stratifyAndSelectCandidates(validCandidates, countOption, options);
  }

  return {
    candidates: finalCandidates,
    totalCandidates,
    appliedFilter: {
      ...filter,
      countOption,
    },
    currentWeather: effectiveWeather,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Alias for runTriage to support callers importing triageSpots.
 */
export const triageSpots = runTriage;
