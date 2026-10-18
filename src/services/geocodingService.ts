export interface GeocodingResult {
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
}

interface OpenMeteoGeocodingApiResponse {
  results?: Array<{
    id?: number;
    name: string;
    latitude: number;
    longitude: number;
    admin1?: string;
    country?: string;
  }>;
}

/**
 * Searches for geographic locations using the Open-Meteo Geocoding REST API.
 * Zero API keys required.
 */
export async function searchPlaces(
  query: string,
  count = 5,
  fetchFn: typeof fetch = fetch,
): Promise<GeocodingResult[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const params = new URLSearchParams({
    name: trimmed,
    count: Math.max(1, Math.min(count, 20)).toString(),
    language: 'en',
    format: 'json',
  });

  const url = `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`;

  try {
    const response = await fetchFn(url);
    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as OpenMeteoGeocodingApiResponse;
    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results
      .filter(
        (item) =>
          item &&
          typeof item.name === 'string' &&
          typeof item.latitude === 'number' &&
          !Number.isNaN(item.latitude) &&
          typeof item.longitude === 'number' &&
          !Number.isNaN(item.longitude),
      )
      .map((item) => ({
        name: item.name,
        admin1: item.admin1,
        country: item.country,
        latitude: item.latitude,
        longitude: item.longitude,
      }));
  } catch {
    return [];
  }
}
