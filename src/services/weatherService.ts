import type { LocationCoords, WeatherCondition, WeatherState } from '../types';
import { isLocationCoords } from '../types';

export const WEATHER_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export const DEFAULT_FALLBACK_WEATHER: WeatherState = {
  temperatureF: 68,
  condition: 'partly-cloudy',
  isRaining: false,
  isSnowing: false,
  isExtremeCold: false,
  isExtremeHeat: false,
  feelsLikeF: 68,
  precipitationChance: 0,
  windSpeedMph: 5,
  humidityPercent: 50,
  description: 'Default fair weather',
  updatedAt: new Date(0).toISOString(),
};

interface CacheEntry {
  state: WeatherState;
  timestamp: number;
}

const weatherCache = new Map<string, CacheEntry>();
export const MAX_WEATHER_CACHE_SIZE = 100;

function pruneCacheIfNeeded(now: number): void {
  for (const [key, entry] of weatherCache.entries()) {
    if (now - entry.timestamp > WEATHER_CACHE_TTL_MS * 2) {
      weatherCache.delete(key);
    }
  }
  if (weatherCache.size >= MAX_WEATHER_CACHE_SIZE) {
    const oldestKey = weatherCache.keys().next().value;
    if (oldestKey) {
      weatherCache.delete(oldestKey);
    }
  }
}

export function getCacheKey(coords: LocationCoords): string {
  return `${coords.latitude.toFixed(2)},${coords.longitude.toFixed(2)}`;
}

export function clearWeatherCache(): void {
  weatherCache.clear();
}

/**
 * Maps WMO weather interpretation codes to application WeatherCondition.
 */
export function mapWmoCodeToCondition(code: number): WeatherCondition {
  switch (code) {
    case 0:
      return 'clear';
    case 1:
    case 2:
      return 'partly-cloudy';
    case 3:
      return 'overcast';
    case 45:
    case 48:
      return 'fog';
    case 51:
    case 53:
    case 55:
      return 'drizzle';
    case 56:
    case 57:
      return 'sleet';
    case 61:
    case 63:
      return 'rain';
    case 65:
      return 'heavy-rain';
    case 66:
    case 67:
      return 'sleet';
    case 71:
    case 73:
    case 75:
    case 77:
      return 'snow';
    case 80:
    case 81:
      return 'rain';
    case 82:
      return 'heavy-rain';
    case 85:
    case 86:
      return 'snow';
    case 95:
    case 96:
    case 99:
      return 'thunderstorm';
    default:
      return 'cloudy';
  }
}

/**
 * Maps WMO weather codes to human friendly descriptions.
 */
export function mapWmoCodeToDescription(code: number): string {
  switch (code) {
    case 0:
      return 'Clear sky';
    case 1:
      return 'Mainly clear';
    case 2:
      return 'Partly cloudy';
    case 3:
      return 'Overcast';
    case 45:
      return 'Foggy';
    case 48:
      return 'Depositing rime fog';
    case 51:
      return 'Light drizzle';
    case 53:
      return 'Moderate drizzle';
    case 55:
      return 'Dense drizzle';
    case 56:
      return 'Light freezing drizzle';
    case 57:
      return 'Dense freezing drizzle';
    case 61:
      return 'Slight rain';
    case 63:
      return 'Moderate rain';
    case 65:
      return 'Heavy rain';
    case 66:
      return 'Light freezing rain';
    case 67:
      return 'Heavy freezing rain';
    case 71:
      return 'Slight snow fall';
    case 73:
      return 'Moderate snow fall';
    case 75:
      return 'Heavy snow fall';
    case 77:
      return 'Snow grains';
    case 80:
      return 'Slight rain showers';
    case 81:
      return 'Moderate rain showers';
    case 82:
      return 'Violent rain showers';
    case 85:
      return 'Slight snow showers';
    case 86:
      return 'Heavy snow showers';
    case 95:
      return 'Thunderstorm';
    case 96:
      return 'Thunderstorm with slight hail';
    case 99:
      return 'Thunderstorm with heavy hail';
    default:
      return 'Cloudy';
  }
}

interface OpenMeteoCurrentResponse {
  latitude: number;
  longitude: number;
  current?: {
    time?: string;
    temperature_2m?: number;
    apparent_temperature?: number;
    precipitation?: number;
    rain?: number;
    weather_code?: number;
    wind_speed_10m?: number;
    relative_humidity_2m?: number;
  };
}

export interface WeatherFetchOptions {
  forceRefresh?: boolean;
  ttlMs?: number;
  fetchFn?: typeof fetch;
}

/**
 * Direct call to Open-Meteo REST API for current weather data.
 */
export async function fetchWeatherFromApi(
  coords: LocationCoords,
  fetchFn: typeof fetch = fetch,
): Promise<WeatherState> {
  if (!isLocationCoords(coords)) {
    throw new Error('Invalid coordinates provided to fetchWeatherFromApi');
  }

  const params = new URLSearchParams({
    latitude: coords.latitude.toString(),
    longitude: coords.longitude.toString(),
    current:
      'temperature_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m,relative_humidity_2m',
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    precipitation_unit: 'inch',
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  const response = await fetchFn(url);

  if (!response.ok) {
    throw new Error(`Open-Meteo API returned status ${response.status}`);
  }

  const data = (await response.json()) as OpenMeteoCurrentResponse;
  const current = data.current;

  if (!current) {
    throw new Error('Open-Meteo response missing current weather block');
  }

  const weatherCode = typeof current.weather_code === 'number' ? current.weather_code : -1;
  const condition = mapWmoCodeToCondition(weatherCode);
  const description = mapWmoCodeToDescription(weatherCode);

  const temperatureF = typeof current.temperature_2m === 'number' ? Math.round(current.temperature_2m) : 68;
  const feelsLikeF =
    typeof current.apparent_temperature === 'number'
      ? Math.round(current.apparent_temperature)
      : temperatureF;

  const rainAmount = typeof current.rain === 'number' ? current.rain : 0;
  const precipAmount = typeof current.precipitation === 'number' ? current.precipitation : 0;

  const rainCodes = [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99];
  const snowCodes = [56, 57, 66, 67, 71, 73, 75, 77, 85, 86];

  const hasSnowCode = snowCodes.includes(weatherCode);
  const hasRainCode = rainCodes.includes(weatherCode);

  const isSnowing =
    hasSnowCode || condition === 'snow' || condition === 'sleet';

  const isRaining =
    rainAmount > 0 ||
    hasRainCode ||
    condition === 'rain' ||
    condition === 'heavy-rain' ||
    condition === 'drizzle' ||
    condition === 'thunderstorm' ||
    (precipAmount > 0 && !isSnowing);

  const isExtremeCold = temperatureF <= 32 || feelsLikeF <= 32;
  const isExtremeHeat = temperatureF >= 90 || feelsLikeF >= 90;

  return {
    temperatureF,
    condition,
    isRaining,
    isSnowing,
    isExtremeCold,
    isExtremeHeat,
    feelsLikeF,
    precipitationChance: precipAmount > 0 ? 100 : 0,
    windSpeedMph:
      typeof current.wind_speed_10m === 'number'
        ? Math.round(current.wind_speed_10m)
        : undefined,
    humidityPercent:
      typeof current.relative_humidity_2m === 'number'
        ? Math.round(current.relative_humidity_2m)
        : undefined,
    description,
    updatedAt: current.time || new Date().toISOString(),
  };
}

/**
 * Retrieves weather for coordinates with 15-minute in-memory caching and safe offline fallback.
 */
export async function getWeatherForLocation(
  coords: LocationCoords,
  options?: WeatherFetchOptions,
): Promise<WeatherState> {
  if (!isLocationCoords(coords)) {
    return {
      ...DEFAULT_FALLBACK_WEATHER,
      updatedAt: new Date().toISOString(),
    };
  }

  const cacheKey = getCacheKey(coords);
  const now = Date.now();
  const ttl = options?.ttlMs ?? WEATHER_CACHE_TTL_MS;
  const cached = weatherCache.get(cacheKey);

  if (!options?.forceRefresh && cached && now - cached.timestamp < ttl) {
    return cached.state;
  }

  try {
    const fetchFn = options?.fetchFn ?? fetch;
    const freshState = await fetchWeatherFromApi(coords, fetchFn);
    pruneCacheIfNeeded(now);
    weatherCache.set(cacheKey, { state: freshState, timestamp: now });
    return freshState;
  } catch {
    // If request fails but we have stale cache, return stale cache
    if (cached) {
      return cached.state;
    }

    // Otherwise return safe default fallback
    return {
      ...DEFAULT_FALLBACK_WEATHER,
      updatedAt: new Date().toISOString(),
    };
  }
}
