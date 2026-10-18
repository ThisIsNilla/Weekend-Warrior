export const WEATHER_CONDITIONS = [
  'clear',
  'sunny',
  'partly-cloudy',
  'partly_cloudy',
  'cloudy',
  'overcast',
  'fog',
  'drizzle',
  'rain',
  'heavy-rain',
  'heavy_rain',
  'thunderstorm',
  'snow',
  'sleet',
  'windy',
] as const;

export type WeatherCondition = (typeof WEATHER_CONDITIONS)[number];

export interface WeatherState {
  temperatureF: number;
  condition: WeatherCondition;
  isRaining: boolean;
  isSnowing: boolean;
  isExtremeCold: boolean;
  isExtremeHeat: boolean;
  feelsLikeF?: number;
  precipitationChance?: number;
  windSpeedMph?: number;
  humidityPercent?: number;
  description?: string;
  updatedAt?: string;
}

export function isWeatherState(value: unknown): value is WeatherState {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.temperatureF === 'number' &&
    typeof candidate.condition === 'string' &&
    WEATHER_CONDITIONS.includes(candidate.condition as WeatherCondition) &&
    typeof candidate.isRaining === 'boolean' &&
    typeof candidate.isSnowing === 'boolean' &&
    typeof candidate.isExtremeCold === 'boolean' &&
    typeof candidate.isExtremeHeat === 'boolean'
  );
}

