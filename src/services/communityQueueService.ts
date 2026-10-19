export const COMMUNITY_QUEUE_STORAGE_KEY = 'weekend_warrior_community_requests_v1';
export const SUPABASE_COMMUNITY_REQUESTS_TABLE = 'community_coverage_requests';

export type CoverageRequestStatus = 'pending' | 'queued' | 'active';

export interface CommunityCoverageRequest {
  id: string;
  cityName: string;
  stateOrZip: string;
  suggestedInstagramHandles: string[];
  parentNotes?: string;
  status: CoverageRequestStatus;
  createdAt: string;
}

export interface SubmitCoverageRequestInput {
  cityName: string;
  stateOrZip: string;
  suggestedInstagramHandles?: string[] | string;
  parentNotes?: string;
}

let useMemoryStore = false;
let memoryStore: Record<string, string> = {};

function getStorageItem(key: string): string | null {
  if (useMemoryStore) {
    return memoryStore[key] ?? null;
  }
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    useMemoryStore = true;
  }
  return memoryStore[key] ?? null;
}

function setStorageItem(key: string, value: string): void {
  if (useMemoryStore) {
    memoryStore[key] = value;
    return;
  }
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
      return;
    }
  } catch {
    useMemoryStore = true;
  }
  memoryStore[key] = value;
}

function removeStorageItem(key: string): void {
  delete memoryStore[key];
  if (useMemoryStore) {
    return;
  }
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch {
    useMemoryStore = true;
  }
}

/**
 * Extracts a clean Instagram username from a raw token (@handle or instagram.com profile URL).
 */
export function extractCleanInstagramHandle(rawToken: string): string {
  let token = rawToken.trim();
  if (!token) {
    return '';
  }

  // If the user pasted a full or partial Instagram URL, extract the path segment
  const igUrlMatch = token.match(
    /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/([^/?#]+)/i,
  );
  if (igUrlMatch && igUrlMatch[1]) {
    const segment = igUrlMatch[1].toLowerCase();
    if (segment === 'p' || segment === 'reel' || segment === 'reels' || segment === 'tv' || segment === 'stories') {
      return '';
    }
    token = igUrlMatch[1];
  }

  const cleaned = token
    .replace(/^@+/, '')
    .replace(/[^a-zA-Z0-9._]/g, '')
    .replace(/^\.+|\.+$/g, '');

  return cleaned;
}

/**
 * Normalizes a string or array of Instagram handle inputs into deduplicated @handle strings.
 */
export function normalizeInstagramHandles(
  rawHandles?: string[] | string,
): string[] {
  if (!rawHandles) {
    return [];
  }

  const rawList = Array.isArray(rawHandles)
    ? rawHandles.flatMap((item) =>
        typeof item === 'string' ? item.split(/[,;\s\n]+/) : [],
      )
    : typeof rawHandles === 'string'
      ? rawHandles.split(/[,;\s\n]+/)
      : [];

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const token of rawList) {
    const cleaned = extractCleanInstagramHandle(token);
    if (!cleaned) {
      continue;
    }
    const lowerKey = cleaned.toLowerCase();
    if (!seen.has(lowerKey)) {
      seen.add(lowerKey);
      normalized.push(`@${cleaned}`);
    }
  }

  return normalized;
}

const VALID_COVERAGE_STATUSES: ReadonlyArray<CoverageRequestStatus> = [
  'pending',
  'queued',
  'active',
];

/**
 * Type guard verifying a stored object matches CommunityCoverageRequest.
 */
export function isCommunityCoverageRequest(
  value: unknown,
): value is CommunityCoverageRequest {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  const validStatus =
    candidate.status === undefined ||
    (typeof candidate.status === 'string' &&
      VALID_COVERAGE_STATUSES.includes(candidate.status as CoverageRequestStatus));
  const validNotes =
    candidate.parentNotes === undefined ||
    typeof candidate.parentNotes === 'string';

  return (
    typeof candidate.id === 'string' &&
    candidate.id.trim().length > 0 &&
    typeof candidate.cityName === 'string' &&
    candidate.cityName.trim().length > 0 &&
    typeof candidate.stateOrZip === 'string' &&
    candidate.stateOrZip.trim().length > 0 &&
    Array.isArray(candidate.suggestedInstagramHandles) &&
    candidate.suggestedInstagramHandles.every((h) => typeof h === 'string') &&
    typeof candidate.createdAt === 'string' &&
    candidate.createdAt.trim().length > 0 &&
    validStatus &&
    validNotes
  );
}

/**
 * Retrieves all saved community city coverage requests from local storage.
 */
export function getCoverageRequests(): CommunityCoverageRequest[] {
  const raw = getStorageItem(COMMUNITY_QUEUE_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(isCommunityCoverageRequest);
    }
  } catch {
    // Ignore corrupted storage and return empty list
  }

  return [];
}

/**
 * Validates and persists a new community city coverage request.
 */
export function submitCoverageRequest(
  input: SubmitCoverageRequestInput,
): CommunityCoverageRequest {
  if (!input || typeof input !== 'object') {
    throw new Error('Coverage request input is required');
  }

  const cityName = typeof input.cityName === 'string' ? input.cityName.trim() : '';
  const stateOrZip =
    typeof input.stateOrZip === 'string' ? input.stateOrZip.trim() : '';

  if (!cityName) {
    throw new Error('City or town name is required');
  }

  if (!stateOrZip) {
    throw new Error('State or ZIP code is required');
  }

  const suggestedInstagramHandles = normalizeInstagramHandles(
    input.suggestedInstagramHandles,
  );
  const parentNotes =
    typeof input.parentNotes === 'string' && input.parentNotes.trim()
      ? input.parentNotes.trim()
      : undefined;

  const createdRequest: CommunityCoverageRequest = {
    id: `cov-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    cityName,
    stateOrZip,
    suggestedInstagramHandles,
    ...(parentNotes ? { parentNotes } : {}),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  const existing = getCoverageRequests();
  const updated = [...existing, createdRequest];
  setStorageItem(COMMUNITY_QUEUE_STORAGE_KEY, JSON.stringify(updated));

  return createdRequest;
}

/**
 * Clears all stored community city coverage requests.
 */
export function clearCoverageRequests(): void {
  removeStorageItem(COMMUNITY_QUEUE_STORAGE_KEY);
}
