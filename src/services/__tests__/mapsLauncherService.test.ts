import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  formatGeoUri,
  formatGoogleMapsUrl,
  isAndroidEnvironment,
  openMapsLocation,
} from '../mapsLauncherService';
import type { LocationCoords } from '../../types';

describe('mapsLauncherService', () => {
  const coords: LocationCoords = { latitude: 42.85, longitude: -73.82 };
  const originalWindow = globalThis.window;
  const originalNavigator = globalThis.navigator;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.window = originalWindow;
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  describe('formatGeoUri', () => {
    it('formats basic geo URI without label', () => {
      expect(formatGeoUri(coords)).toBe('geo:42.85,-73.82?q=42.85,-73.82');
    });

    it('formats geo URI with encoded label', () => {
      expect(formatGeoUri(coords, 'The Crossings of Colonie')).toBe(
        'geo:42.85,-73.82?q=42.85,-73.82(The%20Crossings%20of%20Colonie)',
      );
    });

    it('ignores empty or whitespace label', () => {
      expect(formatGeoUri(coords, '   ')).toBe('geo:42.85,-73.82?q=42.85,-73.82');
    });
  });

  describe('formatGoogleMapsUrl', () => {
    it('formats standard web Google Maps search query URL', () => {
      expect(formatGoogleMapsUrl(coords)).toBe(
        'https://www.google.com/maps/search/?api=1&query=42.85,-73.82',
      );
    });
  });

  describe('isAndroidEnvironment', () => {
    it('detects Android user agent', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (Linux; U; Android 14; en-us)' },
        writable: true,
        configurable: true,
      });
      expect(isAndroidEnvironment()).toBe(true);
    });

    it('returns false for non-Android user agent', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' },
        writable: true,
        configurable: true,
      });
      expect(isAndroidEnvironment()).toBe(false);
    });
  });

  describe('openMapsLocation', () => {
    it('sets window.location.href when isAndroid is true', () => {
      const mockLocation = { href: '' };
      const mockOpen = vi.fn();

      Object.defineProperty(globalThis, 'window', {
        value: {
          location: mockLocation,
          open: mockOpen,
        },
        writable: true,
        configurable: true,
      });

      const result = openMapsLocation(coords, 'Clifton Common', { isAndroid: true });

      expect(result).toBe(true);
      expect(mockLocation.href).toBe('geo:42.85,-73.82?q=42.85,-73.82(Clifton%20Common)');
      expect(mockOpen).not.toHaveBeenCalled();
    });

    it('calls window.open when isAndroid is false', () => {
      const mockLocation = { href: '' };
      const mockOpen = vi.fn();

      Object.defineProperty(globalThis, 'window', {
        value: {
          location: mockLocation,
          open: mockOpen,
        },
        writable: true,
        configurable: true,
      });

      const result = openMapsLocation(coords, 'Clifton Common', { isAndroid: false });

      expect(result).toBe(true);
      expect(mockOpen).toHaveBeenCalledWith(
        'https://www.google.com/maps/search/?api=1&query=42.85,-73.82',
        '_blank',
        'noopener,noreferrer',
      );
      expect(mockLocation.href).toBe('');
    });

    it('returns false when called with invalid coordinates', () => {
      const invalidCoords = { latitude: NaN, longitude: -73.82 } as unknown as LocationCoords;
      const result = openMapsLocation(invalidCoords, 'Invalid');
      expect(result).toBe(false);
    });
  });
});
