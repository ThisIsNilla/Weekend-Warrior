import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_FALLBACK_WEATHER,
  clearWeatherCache,
  fetchWeatherFromApi,
  getCacheKey,
  getWeatherForLocation,
  mapWmoCodeToCondition,
  mapWmoCodeToDescription,
} from '../weatherService';
import type { LocationCoords } from '../../types';

describe('weatherService', () => {
  const coords: LocationCoords = { latitude: 42.85, longitude: -73.82 };

  beforeEach(() => {
    clearWeatherCache();
    vi.restoreAllMocks();
  });

  describe('mapWmoCodeToCondition', () => {
    it('maps clear and sunny codes correctly', () => {
      expect(mapWmoCodeToCondition(0)).toBe('clear');
    });

    it('maps cloudy and overcast codes correctly', () => {
      expect(mapWmoCodeToCondition(1)).toBe('partly-cloudy');
      expect(mapWmoCodeToCondition(2)).toBe('partly-cloudy');
      expect(mapWmoCodeToCondition(3)).toBe('overcast');
    });

    it('maps fog codes correctly', () => {
      expect(mapWmoCodeToCondition(45)).toBe('fog');
      expect(mapWmoCodeToCondition(48)).toBe('fog');
    });

    it('maps drizzle and rain codes correctly', () => {
      expect(mapWmoCodeToCondition(51)).toBe('drizzle');
      expect(mapWmoCodeToCondition(53)).toBe('drizzle');
      expect(mapWmoCodeToCondition(55)).toBe('drizzle');
      expect(mapWmoCodeToCondition(61)).toBe('rain');
      expect(mapWmoCodeToCondition(63)).toBe('rain');
      expect(mapWmoCodeToCondition(65)).toBe('heavy-rain');
      expect(mapWmoCodeToCondition(80)).toBe('rain');
      expect(mapWmoCodeToCondition(81)).toBe('rain');
      expect(mapWmoCodeToCondition(82)).toBe('heavy-rain');
    });

    it('maps snow and sleet codes correctly', () => {
      expect(mapWmoCodeToCondition(56)).toBe('sleet');
      expect(mapWmoCodeToCondition(57)).toBe('sleet');
      expect(mapWmoCodeToCondition(66)).toBe('sleet');
      expect(mapWmoCodeToCondition(67)).toBe('sleet');
      expect(mapWmoCodeToCondition(71)).toBe('snow');
      expect(mapWmoCodeToCondition(73)).toBe('snow');
      expect(mapWmoCodeToCondition(75)).toBe('snow');
      expect(mapWmoCodeToCondition(77)).toBe('snow');
      expect(mapWmoCodeToCondition(85)).toBe('snow');
      expect(mapWmoCodeToCondition(86)).toBe('snow');
    });

    it('maps thunderstorm codes correctly', () => {
      expect(mapWmoCodeToCondition(95)).toBe('thunderstorm');
      expect(mapWmoCodeToCondition(96)).toBe('thunderstorm');
      expect(mapWmoCodeToCondition(99)).toBe('thunderstorm');
    });

    it('defaults unknown codes to cloudy', () => {
      expect(mapWmoCodeToCondition(999)).toBe('cloudy');
    });
  });

  describe('mapWmoCodeToDescription', () => {
    it('returns human readable strings', () => {
      expect(mapWmoCodeToDescription(0)).toBe('Clear sky');
      expect(mapWmoCodeToDescription(3)).toBe('Overcast');
      expect(mapWmoCodeToDescription(61)).toBe('Slight rain');
      expect(mapWmoCodeToDescription(71)).toBe('Slight snow fall');
      expect(mapWmoCodeToDescription(95)).toBe('Thunderstorm');
      expect(mapWmoCodeToDescription(999)).toBe('Cloudy');
    });
  });

  describe('fetchWeatherFromApi', () => {
    it('parses successful Open-Meteo payload into WeatherState', async () => {
      const mockResponse = {
        latitude: 42.85,
        longitude: -73.82,
        current: {
          time: '2026-10-18T14:00',
          temperature_2m: 72.4,
          apparent_temperature: 71.1,
          precipitation: 0.0,
          rain: 0.0,
          weather_code: 1,
          wind_speed_10m: 7.5,
          relative_humidity_2m: 45,
        },
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const weather = await fetchWeatherFromApi(coords, mockFetch as unknown as typeof fetch);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(weather.temperatureF).toBe(72);
      expect(weather.feelsLikeF).toBe(71);
      expect(weather.condition).toBe('partly-cloudy');
      expect(weather.isRaining).toBe(false);
      expect(weather.isSnowing).toBe(false);
      expect(weather.isExtremeCold).toBe(false);
      expect(weather.isExtremeHeat).toBe(false);
      expect(weather.windSpeedMph).toBe(8);
      expect(weather.humidityPercent).toBe(45);
    });

    it('flags rainy conditions accurately', async () => {
      const mockResponse = {
        current: {
          temperature_2m: 55,
          apparent_temperature: 54,
          precipitation: 0.2,
          rain: 0.2,
          weather_code: 61,
        },
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const weather = await fetchWeatherFromApi(coords, mockFetch as unknown as typeof fetch);
      expect(weather.isRaining).toBe(true);
      expect(weather.condition).toBe('rain');
    });

    it('flags snowy and extreme cold conditions accurately', async () => {
      const mockResponse = {
        current: {
          temperature_2m: 22,
          apparent_temperature: 15,
          precipitation: 0.1,
          rain: 0.0,
          weather_code: 71,
        },
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const weather = await fetchWeatherFromApi(coords, mockFetch as unknown as typeof fetch);
      expect(weather.isSnowing).toBe(true);
      expect(weather.isRaining).toBe(false);
      expect(weather.isExtremeCold).toBe(true);
      expect(weather.isExtremeHeat).toBe(false);
    });

    it('flags extreme heat accurately', async () => {
      const mockResponse = {
        current: {
          temperature_2m: 93,
          apparent_temperature: 98,
          precipitation: 0,
          weather_code: 0,
        },
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const weather = await fetchWeatherFromApi(coords, mockFetch as unknown as typeof fetch);
      expect(weather.isExtremeHeat).toBe(true);
      expect(weather.isExtremeCold).toBe(false);
    });

    it('throws error when response is not ok', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(
        fetchWeatherFromApi(coords, mockFetch as unknown as typeof fetch),
      ).rejects.toThrow('Open-Meteo API returned status 500');
    });
  });

  describe('getWeatherForLocation caching and fallback', () => {
    it('caches responses within TTL', async () => {
      const mockResponse = {
        current: {
          temperature_2m: 65,
          apparent_temperature: 65,
          weather_code: 0,
        },
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const first = await getWeatherForLocation(coords, {
        fetchFn: mockFetch as unknown as typeof fetch,
      });
      const second = await getWeatherForLocation(coords, {
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(first.temperatureF).toBe(65);
      expect(second.temperatureF).toBe(65);
    });

    it('bypasses cache when forceRefresh is true', async () => {
      const mockResponse = {
        current: {
          temperature_2m: 65,
          apparent_temperature: 65,
          weather_code: 0,
        },
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await getWeatherForLocation(coords, {
        fetchFn: mockFetch as unknown as typeof fetch,
      });
      await getWeatherForLocation(coords, {
        fetchFn: mockFetch as unknown as typeof fetch,
        forceRefresh: true,
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('returns default fallback when network fails and cache is empty', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const weather = await getWeatherForLocation(coords, {
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      expect(weather.temperatureF).toBe(DEFAULT_FALLBACK_WEATHER.temperatureF);
      expect(weather.condition).toBe('partly-cloudy');
      expect(weather.isRaining).toBe(false);
    });

    it('generates consistent cache keys for coordinates', () => {
      expect(getCacheKey({ latitude: 42.8512, longitude: -73.8201 })).toBe('42.85,-73.82');
    });

    it('rejects invalid coordinates in fetchWeatherFromApi and returns fallback in getWeatherForLocation', async () => {
      const invalidCoords = { latitude: NaN, longitude: -73.82 } as unknown as LocationCoords;
      const mockFetch = vi.fn();

      await expect(
        fetchWeatherFromApi(invalidCoords, mockFetch as unknown as typeof fetch),
      ).rejects.toThrow('Invalid coordinates');
      expect(mockFetch).not.toHaveBeenCalled();

      const fallback = await getWeatherForLocation(invalidCoords, {
        fetchFn: mockFetch as unknown as typeof fetch,
      });
      expect(fallback.temperatureF).toBe(DEFAULT_FALLBACK_WEATHER.temperatureF);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
