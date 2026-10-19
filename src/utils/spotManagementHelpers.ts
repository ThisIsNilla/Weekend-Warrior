import type {
  CostLevel,
  EnergyLevel,
  LocationCoords,
  ParentAmenities,
  ProximityBand,
  Spot,
  SpotCategory,
  SpotType,
  TriageCandidate,
  TriageFilter,
} from '../types';
import type { GeocodingResult } from '../services/geocodingService';
import { DEFAULT_CLIFTON_PARK_COORDS } from '../services/geolocationService';
import { extractCleanInstagramHandle } from '../services/communityQueueService';
import { SEED_SPOTS } from '../storage/seedData';
import {
  isWithinProximityBand,
  matchesRequiredAmenities,
  matchesSearchQuery,
} from './triageAlgorithm';
import { resolveInstagramUrl } from './triageFormatters';

export type FeedProximityBand = Exclude<ProximityBand, 'any'>;

export interface ProximityBandSectionMeta {
  band: FeedProximityBand;
  title: string;
  rangeLabel: string;
  subtitle: string;
}

export const PROXIMITY_BAND_SECTIONS: ReadonlyArray<ProximityBandSectionMeta> = [
  {
    band: 'walking',
    title: 'Walking & Close By',
    rangeLabel: '< 5 miles',
    subtitle: 'Immediate neighborhood parks, libraries, and quick outings',
  },
  {
    band: 'short_drive',
    title: 'Short Drive',
    rangeLabel: '5 to 15 miles',
    subtitle: 'Easy 10 to 20 minute family drives',
  },
  {
    band: 'medium_drive',
    title: 'Medium Drive',
    rangeLabel: '15 to 30 miles',
    subtitle: 'Regional museums, farms, and state parks',
  },
  {
    band: 'day_trip',
    title: 'Day Trip',
    rangeLabel: '30+ miles',
    subtitle: 'Half-day or full-day family adventures',
  },
];

export interface GroupedProximitySection extends ProximityBandSectionMeta {
  candidates: TriageCandidate[];
}

/**
 * Classifies a candidate into one of the four proximity feed bands based on live distance:
 * - walking: < 5 miles
 * - short_drive: 5 to 15 miles
 * - medium_drive: 15 to 30 miles
 * - day_trip: 30+ miles
 */
export function resolveFeedProximityBand(
  candidate: TriageCandidate,
): FeedProximityBand {
  const miles = candidate.distanceMiles;
  if (typeof miles === 'number' && !Number.isNaN(miles) && miles >= 0) {
    if (miles < 5) {
      return 'walking';
    }
    if (miles < 15) {
      return 'short_drive';
    }
    if (miles <= 30) {
      return 'medium_drive';
    }
    return 'day_trip';
  }

  if (candidate.proximityBand && candidate.proximityBand !== 'any') {
    return candidate.proximityBand;
  }

  return 'day_trip';
}

/**
 * Filters feed candidates against a TriageFilter using the feed proximity band thresholds.
 */
export function filterFeedCandidates(
  candidates: TriageCandidate[],
  filter?: TriageFilter,
): TriageCandidate[] {
  if (!filter) {
    return candidates;
  }

  return candidates.filter((candidate) => {
    const { spot, distanceMiles } = candidate;
    const feedBand = resolveFeedProximityBand(candidate);

    if (filter.requireToddlerFriendly === true && !spot.isToddlerFriendly) {
      return false;
    }
    if (filter.requireYoungKidFriendly === true && !spot.isYoungKidFriendly) {
      return false;
    }
    if (filter.costLevels && filter.costLevels.length > 0) {
      if (!filter.costLevels.includes(spot.costLevel)) {
        return false;
      }
    }
    if (filter.energyLevels && filter.energyLevels.length > 0) {
      if (!filter.energyLevels.includes(spot.energyLevel)) {
        return false;
      }
    }
    if (filter.categories && filter.categories.length > 0) {
      if (!filter.categories.includes(spot.category)) {
        return false;
      }
    }
    if (filter.spotTypes && filter.spotTypes.length > 0) {
      if (!filter.spotTypes.includes(spot.spotType)) {
        return false;
      }
    }
    if (!matchesRequiredAmenities(spot.parentAmenities, filter.requiredAmenities)) {
      return false;
    }
    if (!matchesSearchQuery(spot, filter.searchQuery)) {
      return false;
    }
    if (
      typeof filter.maxDistanceMiles === 'number' &&
      !Number.isNaN(filter.maxDistanceMiles) &&
      typeof distanceMiles === 'number' &&
      !Number.isNaN(distanceMiles) &&
      distanceMiles > filter.maxDistanceMiles
    ) {
      return false;
    }
    if (
      filter.maxProximityBand &&
      filter.maxProximityBand !== 'any' &&
      !isWithinProximityBand(feedBand, filter.maxProximityBand)
    ) {
      return false;
    }

    return true;
  });
}

/**
 * Sorts candidates by live distance ascending and groups them into proximity band sections.
 */
export function groupCandidatesByProximityBand(
  candidates: TriageCandidate[],
  filter?: TriageFilter,
): GroupedProximitySection[] {
  const filtered = filterFeedCandidates(candidates, filter);
  const sorted = [...filtered].sort((a, b) => {
    const aHasDist =
      typeof a.distanceMiles === 'number' && !Number.isNaN(a.distanceMiles);
    const bHasDist =
      typeof b.distanceMiles === 'number' && !Number.isNaN(b.distanceMiles);

    if (aHasDist && bHasDist && a.distanceMiles !== b.distanceMiles) {
      return (a.distanceMiles as number) - (b.distanceMiles as number);
    }
    if (aHasDist && !bHasDist) {
      return -1;
    }
    if (!aHasDist && bHasDist) {
      return 1;
    }
    if (b.overallScore !== a.overallScore) {
      return b.overallScore - a.overallScore;
    }
    return a.spot.name.localeCompare(b.spot.name);
  });

  const buckets: Record<FeedProximityBand, TriageCandidate[]> = {
    walking: [],
    short_drive: [],
    medium_drive: [],
    day_trip: [],
  };

  for (const candidate of sorted) {
    const band = resolveFeedProximityBand(candidate);
    buckets[band].push({
      ...candidate,
      proximityBand: band,
    });
  }

  return PROXIMITY_BAND_SECTIONS.map((meta) => ({
    ...meta,
    candidates: buckets[meta.band],
  })).filter((section) => section.candidates.length > 0);
}

export interface SpotFormDraft {
  name: string;
  category: SpotCategory;
  spotType: SpotType;
  energyLevel: EnergyLevel;
  costLevel: CostLevel;
  description: string;
  address: string;
  city: string;
  isToddlerFriendly: boolean;
  isYoungKidFriendly: boolean;
  parentAmenities: ParentAmenities;
  sourceUrl: string;
  sourceHandle: string;
  latitude: string;
  longitude: string;
}

export type SpotValidationResult =
  | { valid: true; spot: Spot }
  | { valid: false; error: string };

/**
 * Creates an initial form draft from an existing Spot (edit mode) or defaults (add mode).
 */
export function createInitialSpotDraft(
  initialSpot?: Spot | null,
  defaultCoords: LocationCoords = DEFAULT_CLIFTON_PARK_COORDS,
): SpotFormDraft {
  if (initialSpot) {
    return {
      name: initialSpot.name,
      category: initialSpot.category,
      spotType: initialSpot.spotType,
      energyLevel: initialSpot.energyLevel,
      costLevel: initialSpot.costLevel,
      description: initialSpot.description ?? '',
      address: initialSpot.address ?? '',
      city: initialSpot.city ?? '',
      isToddlerFriendly: initialSpot.isToddlerFriendly,
      isYoungKidFriendly: initialSpot.isYoungKidFriendly,
      parentAmenities: {
        strollerFriendly: initialSpot.parentAmenities.strollerFriendly,
        restroomsAvailable: initialSpot.parentAmenities.restroomsAvailable,
        fencedPlayArea: initialSpot.parentAmenities.fencedPlayArea,
        snacksAllowedOrNearby: initialSpot.parentAmenities.snacksAllowedOrNearby,
        changingTablesAvailable: Boolean(
          initialSpot.parentAmenities.changingTablesAvailable,
        ),
        parkingAvailable: Boolean(initialSpot.parentAmenities.parkingAvailable),
        nursingAreaAvailable: Boolean(
          initialSpot.parentAmenities.nursingAreaAvailable,
        ),
        wheelchairAccessible: Boolean(
          initialSpot.parentAmenities.wheelchairAccessible,
        ),
      },
      sourceUrl: initialSpot.sourceUrl ?? '',
      sourceHandle: initialSpot.sourceHandle ?? '',
      latitude: String(initialSpot.coordinates.latitude),
      longitude: String(initialSpot.coordinates.longitude),
    };
  }

  return {
    name: '',
    category: 'park',
    spotType: 'outdoor',
    energyLevel: 'medium',
    costLevel: 'free',
    description: '',
    address: '',
    city: 'Clifton Park',
    isToddlerFriendly: true,
    isYoungKidFriendly: true,
    parentAmenities: {
      strollerFriendly: true,
      restroomsAvailable: true,
      fencedPlayArea: false,
      snacksAllowedOrNearby: true,
      changingTablesAvailable: false,
      parkingAvailable: true,
      nursingAreaAvailable: false,
      wheelchairAccessible: false,
    },
    sourceUrl: '',
    sourceHandle: '',
    latitude: String(defaultCoords.latitude),
    longitude: String(defaultCoords.longitude),
  };
}

/**
 * Applies live GPS coordinates to a SpotFormDraft.
 */
export function applyLocationCoordsToDraft(
  draft: SpotFormDraft,
  coords: LocationCoords,
): SpotFormDraft {
  return {
    ...draft,
    latitude: String(coords.latitude),
    longitude: String(coords.longitude),
  };
}

/**
 * Applies an Open-Meteo geocoding lookup result to a SpotFormDraft, auto-filling coordinates and city.
 */
export function applyGeocodeResultToDraft(
  draft: SpotFormDraft,
  result: GeocodingResult,
): SpotFormDraft {
  return {
    ...draft,
    latitude: String(result.latitude),
    longitude: String(result.longitude),
    city: result.name,
    name: draft.name.trim() ? draft.name : result.name,
  };
}

/**
 * Validates SpotFormDraft inputs (non-empty name, latitude -90 to 90, longitude -180 to 180,
 * and optional Instagram URL/handle format) and builds a valid Spot object.
 */
export function validateAndBuildSpot(
  draft: SpotFormDraft,
  existingSpot?: Spot | null,
): SpotValidationResult {
  const trimmedName = draft.name.trim();
  if (!trimmedName) {
    return {
      valid: false,
      error: 'Spot name is required.',
    };
  }

  const latStr = String(draft.latitude).trim();
  const lonStr = String(draft.longitude).trim();

  if (!latStr || !lonStr) {
    return {
      valid: false,
      error: 'Latitude and longitude coordinates are required.',
    };
  }

  const lat = Number(latStr);
  const lon = Number(lonStr);

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return {
      valid: false,
      error: 'Latitude must be a valid number between -90 and 90.',
    };
  }

  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    return {
      valid: false,
      error: 'Longitude must be a valid number between -180 and 180.',
    };
  }

  let normalizedHandle: string | undefined;
  const rawHandleInput = draft.sourceHandle.trim();
  if (rawHandleInput) {
    const cleanHandle = extractCleanInstagramHandle(rawHandleInput);
    if (!cleanHandle) {
      return {
        valid: false,
        error: 'Instagram creator handle must contain valid username characters.',
      };
    }
    normalizedHandle = `@${cleanHandle}`;
  }

  let normalizedSourceUrl: string | undefined;
  const rawSourceUrl = draft.sourceUrl.trim();
  if (rawSourceUrl) {
    if (/^https?:\/\/\S+$/i.test(rawSourceUrl)) {
      normalizedSourceUrl = rawSourceUrl;
    } else if (/^(?:www\.)?instagram\.com\/\S+$/i.test(rawSourceUrl)) {
      normalizedSourceUrl = `https://${rawSourceUrl}`;
    } else {
      return {
        valid: false,
        error:
          'Instagram post URL must be a valid http(s) or instagram.com link.',
      };
    }
  }

  const trimmedDescription = draft.description.trim() || undefined;
  const trimmedAddress = draft.address.trim() || undefined;
  const trimmedCity = draft.city.trim() || undefined;

  const nowIso = new Date().toISOString();
  const id =
    existingSpot?.id ??
    `custom-spot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const builtSpot: Spot = {
    ...(existingSpot ?? {}),
    id,
    name: trimmedName,
    category: draft.category,
    spotType: draft.spotType,
    energyLevel: draft.energyLevel,
    costLevel: draft.costLevel,
    description: trimmedDescription,
    address: trimmedAddress,
    city: trimmedCity,
    coordinates: {
      latitude: Math.round(lat * 1000000) / 1000000,
      longitude: Math.round(lon * 1000000) / 1000000,
    },
    parentAmenities: {
      strollerFriendly: Boolean(draft.parentAmenities.strollerFriendly),
      restroomsAvailable: Boolean(draft.parentAmenities.restroomsAvailable),
      fencedPlayArea: Boolean(draft.parentAmenities.fencedPlayArea),
      snacksAllowedOrNearby: Boolean(draft.parentAmenities.snacksAllowedOrNearby),
      changingTablesAvailable: Boolean(
        draft.parentAmenities.changingTablesAvailable,
      ),
      parkingAvailable: Boolean(draft.parentAmenities.parkingAvailable),
      nursingAreaAvailable: Boolean(draft.parentAmenities.nursingAreaAvailable),
      wheelchairAccessible: Boolean(draft.parentAmenities.wheelchairAccessible),
    },
    isToddlerFriendly: Boolean(draft.isToddlerFriendly),
    isYoungKidFriendly: Boolean(draft.isYoungKidFriendly),
    sourceUrl: normalizedSourceUrl,
    sourceHandle: normalizedHandle,
    createdAt: existingSpot?.createdAt ?? nowIso,
    updatedAt: nowIso,
  };

  return {
    valid: true,
    spot: builtSpot,
  };
}

const SEED_SPOT_ID_SET = new Set<string>(SEED_SPOTS.map((spot) => spot.id));

/**
 * Returns true if the spot was added by the user rather than part of the default seed catalog.
 */
export function isCustomSpot(spot: Spot): boolean {
  return !SEED_SPOT_ID_SET.has(spot.id);
}

/**
 * Returns true if the spot has a valid, resolvable Instagram post URL or creator handle attached.
 */
export function hasInstagramSource(spot: Spot): boolean {
  return Boolean(resolveInstagramUrl(spot.sourceUrl, spot.sourceHandle));
}

export interface SpotManagementFilterOptions {
  searchQuery?: string;
  category?: SpotCategory | 'all';
  instagramOnly?: boolean;
  customOnly?: boolean;
}

/**
 * Filters managed spots by search query, category, Instagram Finds Only, and Custom Spots Only.
 */
export function filterManagedSpots(
  spots: Spot[],
  options: SpotManagementFilterOptions = {},
): Spot[] {
  const {
    searchQuery = '',
    category = 'all',
    instagramOnly = false,
    customOnly = false,
  } = options;

  return spots.filter((spot) => {
    if (category !== 'all' && spot.category !== category) {
      return false;
    }
    if (instagramOnly && !hasInstagramSource(spot)) {
      return false;
    }
    if (customOnly && !isCustomSpot(spot)) {
      return false;
    }
    if (!matchesSearchQuery(spot, searchQuery)) {
      return false;
    }
    return true;
  });
}
