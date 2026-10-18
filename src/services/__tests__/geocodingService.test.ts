import { describe, expect, it, vi } from 'vitest';
import { searchPlaces } from '../geocodingService';

describe('geocodingService', () => {
  it('returns empty array when query is empty or only whitespace', async () => {
    const mockFetch = vi.fn();
    expect(await searchPlaces('', 5, mockFetch as unknown as typeof fetch)).toEqual([]);
    expect(await searchPlaces('   ', 5, mockFetch as unknown as typeof fetch)).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('correctly maps successful Open-Meteo geocoding results', async () => {
    const mockApiResponse = {
      results: [
        {
          id: 5112836,
          name: 'Clifton Park',
          latitude: 42.85175,
          longitude: -73.81984,
          country: 'United States',
          admin1: 'New York',
        },
        {
          id: 5136894,
          name: 'Saratoga Springs',
          latitude: 43.08313,
          longitude: -73.78457,
          country: 'United States',
          admin1: 'New York',
        },
      ],
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    });

    const results = await searchPlaces('Clifton', 5, mockFetch as unknown as typeof fetch);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      name: 'Clifton Park',
      admin1: 'New York',
      country: 'United States',
      latitude: 42.85175,
      longitude: -73.81984,
    });
    expect(results[1]?.name).toBe('Saratoga Springs');
  });

  it('returns empty array safely if API responds with non-ok status', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
    });

    const results = await searchPlaces('Albany', 5, mockFetch as unknown as typeof fetch);
    expect(results).toEqual([]);
  });

  it('returns empty array safely if network request throws', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network offline'));

    const results = await searchPlaces('Albany', 5, mockFetch as unknown as typeof fetch);
    expect(results).toEqual([]);
  });

  it('returns empty array if results property is absent or empty', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    });

    const results = await searchPlaces('NonexistentCity12345', 5, mockFetch as unknown as typeof fetch);
    expect(results).toEqual([]);
  });

  it('filters out malformed items with missing or NaN coordinates', async () => {
    const mockApiResponse = {
      results: [
        { name: 'Valid Place', latitude: 42.85, longitude: -73.82 },
        { name: 'Invalid Lat', latitude: NaN, longitude: -73.82 },
        { name: 'Missing Long', latitude: 42.85 },
        null,
      ],
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    });

    const results = await searchPlaces('Place', 5, mockFetch as unknown as typeof fetch);
    expect(results).toHaveLength(1);
    expect(results[0]?.name).toBe('Valid Place');
  });
});
