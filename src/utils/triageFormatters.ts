import type {
  EnergyLevel,
  ProximityBand,
  SpotCategory,
  SpotType,
  TriageCountOption,
  TriageFilter,
} from '../types';

export const TRIAGE_MODE_TABS: ReadonlyArray<{
  value: TriageCountOption;
  label: string;
  sublabel: string;
}> = [
  { value: 3, label: 'Quick 3', sublabel: 'Fast picks' },
  { value: 5, label: 'Top 5', sublabel: 'Balanced' },
  { value: 10, label: 'Top 10', sublabel: 'Deep list' },
  { value: 'all', label: 'All Nearby', sublabel: 'By distance' },
];

export const DISTANCE_RADIUS_OPTIONS: ReadonlyArray<{
  label: string;
  value: number | undefined;
}> = [
  { label: 'Any', value: undefined },
  { label: '5 mi', value: 5 },
  { label: '10 mi', value: 10 },
  { label: '20 mi', value: 20 },
  { label: '35 mi', value: 35 },
];

export const ENERGY_FILTER_OPTIONS: ReadonlyArray<{
  value: EnergyLevel;
  label: string;
  sublabel: string;
}> = [
  { value: 'low', label: 'Low Energy', sublabel: 'Stroller / Ice Cream' },
  { value: 'medium', label: 'Medium Energy', sublabel: 'Museum / Park' },
  { value: 'high', label: 'High Energy', sublabel: 'Burn Kids Energy' },
];

export function formatCategoryLabel(category: SpotCategory): string {
  return category
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatSpotTypeLabel(spotType: SpotType): string {
  switch (spotType) {
    case 'indoor':
      return 'Indoor';
    case 'outdoor':
      return 'Outdoor';
    case 'covered_outdoor':
      return 'Covered Outdoor';
    case 'hybrid':
      return 'Indoor / Outdoor';
  }
}

export function formatEnergyContextLabel(energyLevel: EnergyLevel): string {
  switch (energyLevel) {
    case 'low':
      return 'Low: Stroller / Ice Cream';
    case 'medium':
      return 'Medium: Museum / Park';
    case 'high':
      return 'High: Burn Kids Energy';
  }
}

export function formatProximityBandLabel(band?: ProximityBand): string {
  switch (band) {
    case 'walking':
      return 'Walking';
    case 'short_drive':
      return 'Short Drive';
    case 'medium_drive':
      return 'Medium Drive';
    case 'day_trip':
      return 'Day Trip';
    default:
      return 'Nearby';
  }
}

export function resolveInstagramUrl(sourceUrl?: string, sourceHandle?: string): string | null {
  if (sourceUrl && sourceUrl.trim()) {
    const trimmed = sourceUrl.trim();
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    if (/^(www\.)?instagram\.com\//i.test(trimmed)) {
      return `https://${trimmed}`;
    }
  }
  if (sourceHandle && sourceHandle.trim()) {
    const cleanHandle = sourceHandle.trim().replace(/^@+/, '');
    if (cleanHandle && /^[a-zA-Z0-9._]+$/.test(cleanHandle)) {
      return `https://www.instagram.com/${cleanHandle}/`;
    }
  }
  return null;
}

export function formatInstagramLinkLabel(
  sourceUrl?: string,
  sourceHandle?: string,
): string {
  const cleanHandle = sourceHandle ? sourceHandle.trim().replace(/^@+/, '') : '';
  const formattedHandle = cleanHandle ? `@${cleanHandle}` : '';
  const hasValidPostUrl = Boolean(
    sourceUrl &&
      sourceUrl.trim() &&
      (/^https?:\/\//i.test(sourceUrl.trim()) ||
        /^(www\.)?instagram\.com\//i.test(sourceUrl.trim())),
  );

  if (hasValidPostUrl && formattedHandle) {
    return `View Post (${formattedHandle})`;
  }
  if (formattedHandle) {
    return formattedHandle;
  }
  return 'View Post';
}

export function isFreeOnlyActive(filter: TriageFilter): boolean {
  return Boolean(
    filter.costLevels &&
      filter.costLevels.length === 1 &&
      filter.costLevels[0] === 'free',
  );
}

export function countActiveFilters(filter: TriageFilter): number {
  let count = 0;
  if (filter.requireToddlerFriendly) count += 1;
  if (filter.requireYoungKidFriendly) count += 1;
  if (filter.costLevels && filter.costLevels.length > 0) count += 1;
  if (typeof filter.maxDistanceMiles === 'number' && !Number.isNaN(filter.maxDistanceMiles)) {
    count += 1;
  }
  if (filter.maxProximityBand && filter.maxProximityBand !== 'any') count += 1;
  if (filter.energyLevels && filter.energyLevels.length > 0) count += 1;
  if (filter.categories && filter.categories.length > 0) count += 1;
  if (filter.spotTypes && filter.spotTypes.length > 0) count += 1;
  if (
    filter.requiredAmenities &&
    Object.values(filter.requiredAmenities).some((val) => val === true)
  ) {
    count += 1;
  }
  if (filter.searchQuery && filter.searchQuery.trim()) count += 1;
  return count;
}
