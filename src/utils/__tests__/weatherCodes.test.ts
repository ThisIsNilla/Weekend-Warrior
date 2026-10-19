import { describe, expect, it } from 'vitest';
import type { WeatherState } from '../../types';
import {
  calculateWeatherFitScore,
  formatWeatherConditionLabel,
  getWeatherBannerMessage,
  hasWeatherAdvisory,
  isInclementWeather,
  isPrecipitationWeather,
} from '../weatherCodes';

describe('weatherCodes utilities', () => {
  const clearWeather: WeatherState = {
    temperatureF: 72,
    condition: 'clear',
    isRaining: false,
    isSnowing: false,
    isExtremeCold: false,
    isExtremeHeat: false,
  };

  const rainyWeather: WeatherState = {
    temperatureF: 58,
    condition: 'rain',
    isRaining: true,
    isSnowing: false,
    isExtremeCold: false,
    isExtremeHeat: false,
  };

  const snowyWeather: WeatherState = {
    temperatureF: 28,
    condition: 'snow',
    isRaining: false,
    isSnowing: true,
    isExtremeCold: true,
    isExtremeHeat: false,
  };

  const stormWeather: WeatherState = {
    temperatureF: 75,
    condition: 'thunderstorm',
    isRaining: true,
    isSnowing: false,
    isExtremeCold: false,
    isExtremeHeat: false,
  };

  describe('isPrecipitationWeather and isInclementWeather', () => {
    it('returns false for undefined or clear weather', () => {
      expect(isPrecipitationWeather(undefined)).toBe(false);
      expect(isPrecipitationWeather(clearWeather)).toBe(false);
      expect(isInclementWeather(clearWeather)).toBe(false);
    });

    it('returns true for rain, snow, sleet, drizzle, and thunderstorm', () => {
      expect(isPrecipitationWeather(rainyWeather)).toBe(true);
      expect(isPrecipitationWeather(snowyWeather)).toBe(true);
      expect(isInclementWeather(stormWeather)).toBe(true);
    });
  });

  describe('hasWeatherAdvisory', () => {
    it('detects extreme heat or cold even when dry', () => {
      expect(hasWeatherAdvisory(clearWeather)).toBe(false);
      expect(
        hasWeatherAdvisory({
          ...clearWeather,
          temperatureF: 95,
          isExtremeHeat: true,
        }),
      ).toBe(true);
    });
  });

  describe('formatWeatherConditionLabel', () => {
    it('formats condition slugs into clean display strings', () => {
      expect(formatWeatherConditionLabel('clear')).toBe('Clear');
      expect(formatWeatherConditionLabel('partly-cloudy')).toBe('Partly Cloudy');
      expect(formatWeatherConditionLabel('heavy-rain')).toBe('Heavy Rain');
      expect(formatWeatherConditionLabel('thunderstorm')).toBe('Thunderstorm');
      expect(formatWeatherConditionLabel('snow')).toBe('Snow');
    });
  });

  describe('getWeatherBannerMessage', () => {
    it('returns null when weather is dry and clear', () => {
      expect(getWeatherBannerMessage(clearWeather)).toBeNull();
      expect(getWeatherBannerMessage(undefined)).toBeNull();
    });

    it('returns tailored alert messages for rain, snow, and thunderstorms', () => {
      expect(getWeatherBannerMessage(rainyWeather)).toContain('Rain detected');
      expect(getWeatherBannerMessage(snowyWeather)).toContain('Snow or wintry mix');
      expect(getWeatherBannerMessage(stormWeather)).toContain('Thunderstorms detected');
    });
  });

  describe('calculateWeatherFitScore', () => {
    it('prioritizes outdoor spots during pleasant weather', () => {
      const outdoorScore = calculateWeatherFitScore('outdoor', clearWeather);
      const indoorScore = calculateWeatherFitScore('indoor', clearWeather);
      expect(outdoorScore).toBeGreaterThan(indoorScore);
    });

    it('prioritizes indoor spots over outdoor spots during rain or snow', () => {
      const indoorScore = calculateWeatherFitScore('indoor', rainyWeather);
      const coveredScore = calculateWeatherFitScore('covered_outdoor', rainyWeather);
      const outdoorScore = calculateWeatherFitScore('outdoor', rainyWeather);
      expect(indoorScore).toBe(100);
      expect(coveredScore).toBeGreaterThan(outdoorScore);
    });
  });
});
