import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Geolocation } from '@capacitor/geolocation';
import {
  DEFAULT_CLIFTON_PARK_COORDS,
  getCurrentUserLocation,
} from '../geolocationService';

vi.mock('@capacitor/geolocation', () => ({
  Geolocation: {
    checkPermissions: vi.fn(),
    requestPermissions: vi.fn(),
    getCurrentPosition: vi.fn(),
  },
}));

describe('geolocationService', () => {
  const originalNavigator = globalThis.navigator;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  it('uses Capacitor Geolocation when permissions and location succeed', async () => {
    vi.mocked(Geolocation.checkPermissions).mockResolvedValue({
      location: 'granted',
      coarseLocation: 'granted',
    });
    vi.mocked(Geolocation.getCurrentPosition).mockResolvedValue({
      timestamp: Date.now(),
      coords: {
        latitude: 42.6526,
        longitude: -73.7562,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
    } as any);

    const result = await getCurrentUserLocation();

    expect(result.source).toBe('capacitor');
    expect(result.isFallback).toBe(false);
    expect(result.coords.latitude).toBe(42.6526);
    expect(result.coords.longitude).toBe(-73.7562);
  });

  it('requests permissions when not yet granted in Capacitor', async () => {
    vi.mocked(Geolocation.checkPermissions).mockResolvedValue({
      location: 'prompt',
      coarseLocation: 'prompt',
    });
    vi.mocked(Geolocation.requestPermissions).mockResolvedValue({
      location: 'granted',
      coarseLocation: 'granted',
    });
    vi.mocked(Geolocation.getCurrentPosition).mockResolvedValue({
      timestamp: Date.now(),
      coords: {
        latitude: 43.0831,
        longitude: -73.7846,
        accuracy: 5,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
    } as any);

    const result = await getCurrentUserLocation();

    expect(Geolocation.requestPermissions).toHaveBeenCalled();
    expect(result.source).toBe('capacitor');
    expect(result.isFallback).toBe(false);
    expect(result.coords.latitude).toBe(43.0831);
  });

  it('falls back to browser navigator.geolocation when Capacitor fails', async () => {
    vi.mocked(Geolocation.checkPermissions).mockRejectedValue(new Error('Capacitor unavailable'));
    vi.mocked(Geolocation.getCurrentPosition).mockRejectedValue(new Error('Capacitor unavailable'));

    const mockBrowserCoords = {
      latitude: 42.7238,
      longitude: -73.7997,
      accuracy: 15,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    };

    const mockGetCurrentPosition = vi.fn().mockImplementation((success) => {
      success({ coords: mockBrowserCoords });
    });

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        geolocation: {
          getCurrentPosition: mockGetCurrentPosition,
        },
      },
      writable: true,
      configurable: true,
    });

    const result = await getCurrentUserLocation();

    expect(result.source).toBe('browser');
    expect(result.isFallback).toBe(false);
    expect(result.coords.latitude).toBe(42.7238);
  });

  it('falls back to default Clifton Park coordinates when all geolocation attempts fail', async () => {
    vi.mocked(Geolocation.checkPermissions).mockRejectedValue(new Error('Plugin error'));
    vi.mocked(Geolocation.getCurrentPosition).mockRejectedValue(new Error('Plugin error'));

    const mockGetCurrentPosition = vi.fn().mockImplementation((_success, error) => {
      error(new Error('User denied Geolocation'));
    });

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        geolocation: {
          getCurrentPosition: mockGetCurrentPosition,
        },
      },
      writable: true,
      configurable: true,
    });

    const result = await getCurrentUserLocation();

    expect(result.source).toBe('default');
    expect(result.isFallback).toBe(true);
    expect(result.coords.latitude).toBe(DEFAULT_CLIFTON_PARK_COORDS.latitude);
    expect(result.coords.longitude).toBe(DEFAULT_CLIFTON_PARK_COORDS.longitude);
    expect(result.errorMessage).toBeDefined();
  });

  it('rejects invalid or NaN coordinates from Capacitor and falls back safely', async () => {
    vi.mocked(Geolocation.checkPermissions).mockResolvedValue({
      location: 'granted',
      coarseLocation: 'granted',
    });
    vi.mocked(Geolocation.getCurrentPosition).mockResolvedValue({
      timestamp: Date.now(),
      coords: {
        latitude: NaN,
        longitude: -73.7562,
      },
    } as any);

    Object.defineProperty(globalThis, 'navigator', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const result = await getCurrentUserLocation();
    expect(result.isFallback).toBe(true);
    expect(result.source).toBe('default');
    expect(result.coords.latitude).toBe(DEFAULT_CLIFTON_PARK_COORDS.latitude);
  });
});
