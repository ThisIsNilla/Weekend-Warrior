import { describe, expect, it } from 'vitest';
import { isSpot } from '../../types';
import { SEED_SPOTS } from '../seedData';

describe('seedData', () => {
  it('contains at least 20 curated Capital District spots', () => {
    expect(SEED_SPOTS.length).toBeGreaterThanOrEqual(20);
  });

  it('validates every seed spot against the isSpot data contract', () => {
    for (const spot of SEED_SPOTS) {
      expect(isSpot(spot)).toBe(true);
    }
  });

  it('ensures each spot has unique IDs', () => {
    const ids = SEED_SPOTS.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('verifies realistic coordinates within Capital District and Saratoga bounds', () => {
    for (const spot of SEED_SPOTS) {
      // Capital District / Saratoga roughly latitude 42.4 to 43.3, longitude -74.3 to -73.3
      expect(spot.coordinates.latitude).toBeGreaterThan(42.0);
      expect(spot.coordinates.latitude).toBeLessThan(44.0);
      expect(spot.coordinates.longitude).toBeGreaterThan(-75.0);
      expect(spot.coordinates.longitude).toBeLessThan(-73.0);
    }
  });

  it('verifies essential parent amenities are explicitly defined boolean flags', () => {
    for (const spot of SEED_SPOTS) {
      expect(typeof spot.parentAmenities.strollerFriendly).toBe('boolean');
      expect(typeof spot.parentAmenities.restroomsAvailable).toBe('boolean');
      expect(typeof spot.parentAmenities.fencedPlayArea).toBe('boolean');
      expect(typeof spot.parentAmenities.snacksAllowedOrNearby).toBe('boolean');
    }
  });

  it('includes key expected family destinations', () => {
    const names = SEED_SPOTS.map((s) => s.name);
    expect(names).toContain('The Crossings of Colonie');
    expect(names).toContain('Saratoga Spa State Park');
    expect(names).toContain("Children's Museum at Saratoga");
    expect(names).toContain('June Farms');
    expect(names).toContain('Indian Ladder Farms');
    expect(names).toContain('Bowman Orchards');
    expect(names).toContain('miSci: Museum of Innovation and Science');
    expect(names).toContain('Congress Park & Carousel');
  });
});
