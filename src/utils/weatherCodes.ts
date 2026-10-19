import type { SpotType, WeatherCondition, WeatherState } from '../types';
import { mapWmoCodeToCondition, mapWmoCodeToDescription } from '../services/weatherService';

export { mapWmoCodeToCondition, mapWmoCodeToDescription };

export const PRECIPITATION_CONDITIONS: readonly WeatherCondition[] = [
  'drizzle',
  'rain',
  'heavy-rain',
  'heavy_rain',
  'thunderstorm',
  'snow',
  'sleet',
] as const;

/**
 * Returns true if the weather indicates active rain, storm, sleet, or snow.
 */
export function isPrecipitationWeather(weather?: WeatherState): boolean {
  if (!weather) {
    return false;
  }
  return (
    weather.isRaining ||
    weather.isSnowing ||
    PRECIPITATION_CONDITIONS.includes(weather.condition)
  );
}

/**
 * Alias for precipitation/storm/snow check used by the triage filter and weather banner.
 */
export function isInclementWeather(weather?: WeatherState): boolean {
  return isPrecipitationWeather(weather);
}

/**
 * Returns true if weather has precipitation or extreme temperatures.
 */
export function hasWeatherAdvisory(weather?: WeatherState): boolean {
  if (!weather) {
    return false;
  }
  return (
    isPrecipitationWeather(weather) ||
    weather.isExtremeCold ||
    weather.isExtremeHeat
  );
}

/**
 * Formats a WeatherCondition slug into a clean UI badge label.
 */
export function formatWeatherConditionLabel(condition: WeatherCondition): string {
  switch (condition) {
    case 'clear':
      return 'Clear';
    case 'sunny':
      return 'Sunny';
    case 'partly-cloudy':
    case 'partly_cloudy':
      return 'Partly Cloudy';
    case 'cloudy':
      return 'Cloudy';
    case 'overcast':
      return 'Overcast';
    case 'fog':
      return 'Foggy';
    case 'drizzle':
      return 'Drizzle';
    case 'rain':
      return 'Rain';
    case 'heavy-rain':
    case 'heavy_rain':
      return 'Heavy Rain';
    case 'thunderstorm':
      return 'Thunderstorm';
    case 'snow':
      return 'Snow';
    case 'sleet':
      return 'Sleet';
    case 'windy':
      return 'Windy';
    default:
      return 'Fair';
  }
}

/**
 * Generates a parent-focused weather alert banner message when precipitation is active.
 */
export function getWeatherBannerMessage(weather?: WeatherState): string | null {
  if (!weather || !isPrecipitationWeather(weather)) {
    return null;
  }

  if (weather.condition === 'thunderstorm') {
    return 'Thunderstorms detected nearby. Prioritizing indoor and covered spots for safety.';
  }
  if (weather.isSnowing || weather.condition === 'snow' || weather.condition === 'sleet') {
    return 'Snow or wintry mix in the area. Filtering out uncovered outdoor spots by default.';
  }
  return 'Rain detected in the area. Filtering out uncovered outdoor spots by default.';
}

/**
 * Calculates a 0 to 100 weather suitability score for a given spotType and WeatherState.
 */
export function calculateWeatherFitScore(
  spotType: SpotType,
  weather?: WeatherState,
): number {
  if (!weather) {
    return 85;
  }

  const precip = isPrecipitationWeather(weather);
  const extremeTemp = weather.isExtremeCold || weather.isExtremeHeat;

  if (precip) {
    switch (spotType) {
      case 'indoor':
        return 100;
      case 'covered_outdoor':
        return 78;
      case 'hybrid':
        return 72;
      case 'outdoor':
        return 20;
    }
  }

  if (extremeTemp) {
    switch (spotType) {
      case 'indoor':
        return 95;
      case 'hybrid':
        return 80;
      case 'covered_outdoor':
        return 70;
      case 'outdoor':
        return 45;
    }
  }

  // Pleasant / dry weather
  switch (spotType) {
    case 'outdoor':
      return 100;
    case 'hybrid':
      return 95;
    case 'covered_outdoor':
      return 90;
    case 'indoor':
      return 80;
  }
}
