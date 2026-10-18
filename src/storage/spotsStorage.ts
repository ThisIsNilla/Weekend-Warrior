import type { Spot } from '../types';
import { isSpot } from '../types';
import { SEED_SPOTS } from './seedData';

export const SPOTS_STORAGE_KEY = 'weekend_warrior_spots_v1';

// In-memory fallback store for non-browser or restricted environments
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
  if (useMemoryStore) {
    delete memoryStore[key];
    return;
  }
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
      return;
    }
  } catch {
    useMemoryStore = true;
  }
  delete memoryStore[key];
}

/**
 * Completely clears stored spots from storage.
 */
export function clearAllStoredSpots(): void {
  removeStorageItem(SPOTS_STORAGE_KEY);
}

/**
 * Resets the in-memory fallback cache (used primarily in test suites).
 */
export function clearMemoryStorage(): void {
  memoryStore = {};
  useMemoryStore = false;
}

/**
 * Returns all saved spots from storage, initializing with seedData if empty or unparseable.
 */
export function getAllSpots(): Spot[] {
  const raw = getStorageItem(SPOTS_STORAGE_KEY);
  if (raw === null || raw === undefined || raw === '') {
    const defaultSeeds = JSON.parse(JSON.stringify(SEED_SPOTS)) as Spot[];
    setStorageItem(SPOTS_STORAGE_KEY, JSON.stringify(defaultSeeds));
    return defaultSeeds;
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every(isSpot)) {
      return parsed;
    }
  } catch {
    // Ignore JSON error and re-seed
  }

  const defaultSeeds = JSON.parse(JSON.stringify(SEED_SPOTS)) as Spot[];
  setStorageItem(SPOTS_STORAGE_KEY, JSON.stringify(defaultSeeds));
  return defaultSeeds;
}

/**
 * Retrieves a single spot by its unique id.
 */
export function getSpotById(id: string): Spot | undefined {
  const spots = getAllSpots();
  return spots.find((spot) => spot.id === id);
}

/**
 * Adds a new spot to storage. Throws if the spot is invalid or if an id already exists.
 */
export function addSpot(spot: Spot): Spot {
  if (!isSpot(spot) || !spot.id.trim() || !spot.name.trim()) {
    throw new Error('Invalid spot data provided to addSpot');
  }

  const spots = getAllSpots();
  const existing = spots.find((s) => s.id === spot.id);
  if (existing) {
    throw new Error(`Spot with id "${spot.id}" already exists`);
  }

  const timestamp = new Date().toISOString();
  const newSpot: Spot = {
    ...spot,
    createdAt: spot.createdAt || timestamp,
    updatedAt: timestamp,
  };

  const updatedSpots = [...spots, newSpot];
  setStorageItem(SPOTS_STORAGE_KEY, JSON.stringify(updatedSpots));
  return newSpot;
}

/**
 * Updates an existing spot in storage. Throws if the spot does not exist or is invalid.
 */
export function updateSpot(spot: Spot): Spot {
  if (!isSpot(spot) || !spot.id.trim() || !spot.name.trim()) {
    throw new Error('Invalid spot data provided to updateSpot');
  }

  const spots = getAllSpots();
  const index = spots.findIndex((s) => s.id === spot.id);
  if (index === -1) {
    throw new Error(`Spot with id "${spot.id}" not found`);
  }

  const existingSpot = spots[index];
  const updatedSpot: Spot = {
    ...spot,
    createdAt: spot.createdAt || existingSpot?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updatedSpots = [...spots];
  updatedSpots[index] = updatedSpot;
  setStorageItem(SPOTS_STORAGE_KEY, JSON.stringify(updatedSpots));
  return updatedSpot;
}

/**
 * Deletes a spot by id from storage. Returns true if removed, false if not found.
 */
export function deleteSpot(id: string): boolean {
  const spots = getAllSpots();
  const filtered = spots.filter((s) => s.id !== id);
  if (filtered.length === spots.length) {
    return false;
  }

  setStorageItem(SPOTS_STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

/**
 * Resets storage back to default SEED_SPOTS.
 */
export function resetToDefaultSeeds(): Spot[] {
  const defaultSeeds = JSON.parse(JSON.stringify(SEED_SPOTS)) as Spot[];
  setStorageItem(SPOTS_STORAGE_KEY, JSON.stringify(defaultSeeds));
  return defaultSeeds;
}
