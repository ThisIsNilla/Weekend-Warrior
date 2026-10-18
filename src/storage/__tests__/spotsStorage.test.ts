import { beforeEach, describe, expect, it } from 'vitest';
import type { Spot } from '../../types';
import { SEED_SPOTS } from '../seedData';
import {
  SPOTS_STORAGE_KEY,
  addSpot,
  clearMemoryStorage,
  deleteSpot,
  getAllSpots,
  getSpotById,
  resetToDefaultSeeds,
  updateSpot,
} from '../spotsStorage';

describe('spotsStorage', () => {
  beforeEach(() => {
    clearMemoryStorage();
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(SPOTS_STORAGE_KEY);
    }
  });

  const testSpot: Spot = {
    id: 'spot-test-custom-park',
    name: 'Custom Test Park',
    description: 'A test park description',
    category: 'playground',
    spotType: 'outdoor',
    energyLevel: 'high',
    costLevel: 'free',
    coordinates: {
      latitude: 42.85,
      longitude: -73.82,
    },
    city: 'Clifton Park',
    parentAmenities: {
      strollerFriendly: true,
      restroomsAvailable: true,
      fencedPlayArea: true,
      snacksAllowedOrNearby: true,
    },
    isToddlerFriendly: true,
    isYoungKidFriendly: true,
  };

  it('initializes with seed spots when storage is empty', () => {
    const spots = getAllSpots();
    expect(spots.length).toBe(SEED_SPOTS.length);
    expect(spots[0]?.id).toBe(SEED_SPOTS[0]?.id);
  });

  it('retrieves an existing spot by id', () => {
    const firstSeed = SEED_SPOTS[0]!;
    const found = getSpotById(firstSeed.id);
    expect(found).toBeDefined();
    expect(found?.name).toBe(firstSeed.name);
  });

  it('returns undefined when spot is not found by id', () => {
    expect(getSpotById('nonexistent-id')).toBeUndefined();
  });

  it('adds a new spot to storage', () => {
    const added = addSpot(testSpot);
    expect(added.id).toBe(testSpot.id);
    expect(added.createdAt).toBeDefined();
    expect(added.updatedAt).toBeDefined();

    const retrieved = getSpotById(testSpot.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Custom Test Park');
  });

  it('throws error when adding a duplicate spot id', () => {
    addSpot(testSpot);
    expect(() => addSpot(testSpot)).toThrow('already exists');
  });

  it('throws error when adding invalid spot shape', () => {
    // Missing required fields
    const invalid = { id: 'invalid', name: 'Incomplete' } as unknown as Spot;
    expect(() => addSpot(invalid)).toThrow('Invalid spot data');
  });

  it('updates an existing spot', () => {
    addSpot(testSpot);
    const updated = updateSpot({
      ...testSpot,
      name: 'Updated Park Name',
      energyLevel: 'medium',
    });

    expect(updated.name).toBe('Updated Park Name');
    expect(updated.energyLevel).toBe('medium');

    const retrieved = getSpotById(testSpot.id);
    expect(retrieved?.name).toBe('Updated Park Name');
  });

  it('throws error when updating nonexistent spot', () => {
    expect(() => updateSpot(testSpot)).toThrow('not found');
  });

  it('deletes an existing spot', () => {
    addSpot(testSpot);
    expect(getSpotById(testSpot.id)).toBeDefined();

    const deleted = deleteSpot(testSpot.id);
    expect(deleted).toBe(true);
    expect(getSpotById(testSpot.id)).toBeUndefined();
  });

  it('returns false when deleting a nonexistent spot', () => {
    expect(deleteSpot('nonexistent-id')).toBe(false);
  });

  it('resets storage back to default seeds', () => {
    addSpot(testSpot);
    expect(getSpotById(testSpot.id)).toBeDefined();

    const reset = resetToDefaultSeeds();
    expect(reset.length).toBe(SEED_SPOTS.length);
    expect(getSpotById(testSpot.id)).toBeUndefined();
  });

  it('allows deleting all spots and returns empty array without re-seeding', () => {
    const all = getAllSpots();
    for (const spot of all) {
      deleteSpot(spot.id);
    }
    const remaining = getAllSpots();
    expect(remaining).toEqual([]);
  });

  it('preserves existing createdAt when updated spot omits createdAt', () => {
    const added = addSpot(testSpot);
    const originalCreatedAt = added.createdAt;
    expect(originalCreatedAt).toBeDefined();

    const { createdAt: _createdAt, ...withoutCreatedAt } = testSpot;
    const updated = updateSpot({
      ...withoutCreatedAt,
      name: 'Updated Name Without CreatedAt',
    });

    expect(updated.createdAt).toBe(originalCreatedAt);
  });

  it('rejects adding or updating spot with empty or whitespace ID or name', () => {
    expect(() => addSpot({ ...testSpot, id: '   ' })).toThrow('Invalid spot data');
    expect(() => addSpot({ ...testSpot, name: '' })).toThrow('Invalid spot data');

    addSpot(testSpot);
    expect(() => updateSpot({ ...testSpot, name: '  ' })).toThrow('Invalid spot data');
  });
});
