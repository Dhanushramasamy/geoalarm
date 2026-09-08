import { GeocodingResult } from './types';

// Fallback search results when offline or network fails
const FALLBACK_STATIONS: GeocodingResult[] = [
  {
    placeId: 'fb-1',
    displayName: 'KSR Bengaluru City Railway Station, Majestic, Bengaluru, Karnataka',
    shortName: 'Bengaluru City Station',
    latitude: 12.9784,
    longitude: 77.5684,
    type: 'railway',
  },
  {
    placeId: 'fb-2',
    displayName: 'Yesvantpur Junction, Bengaluru, Karnataka',
    shortName: 'Yesvantpur Junction',
    latitude: 13.0238,
    longitude: 77.5504,
    type: 'railway',
  },
  {
    placeId: 'fb-3',
    displayName: 'Chennai Central Railway Station, Chennai, Tamil Nadu',
    shortName: 'Chennai Central Station',
    latitude: 13.0827,
    longitude: 80.2757,
    type: 'railway',
  },
  {
    placeId: 'fb-4',
    displayName: 'Coimbatore Junction, Coimbatore, Tamil Nadu',
    shortName: 'Coimbatore Junction',
    latitude: 11.0014,
    longitude: 76.9629,
    type: 'railway',
  },
  {
    placeId: 'fb-5',
    displayName: 'Chhatrapati Shivaji Maharaj Terminus (CSMT), Mumbai, Maharashtra',
    shortName: 'Mumbai CSMT Station',
    latitude: 18.9401,
    longitude: 72.8353,
    type: 'railway',
  },
];

export class GeocodingService {
  /**
   * Searches for railway stations or places using OpenStreetMap Nominatim API
   */
  public static async searchPlaces(query: string): Promise<GeocodingResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const trimmed = query.trim().toLowerCase();

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&limit=7&addressdetails=1`;

      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'GeoAlarm-App/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim HTTP error: ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any) => ({
          placeId: String(item.place_id),
          displayName: item.display_name,
          shortName: item.name || item.display_name.split(',')[0],
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          type: item.type || item.class,
        }));
      }
    } catch (err) {
      console.warn('Geocoding search failed, using fallback filter:', err);
    }

    // Filter fallback list if network fails or returns empty
    return FALLBACK_STATIONS.filter(
      (st) =>
        st.displayName.toLowerCase().includes(trimmed) ||
        st.shortName.toLowerCase().includes(trimmed)
    );
  }

  /**
   * Performs reverse geocoding to retrieve place name from lat/lng
   */
  public static async reverseGeocode(lat: number, lon: number): Promise<string> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'GeoAlarm-App/1.0',
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.display_name) {
          const parts = data.display_name.split(',');
          return parts.slice(0, 2).join(', ');
        }
      }
    } catch (err) {
      console.warn('Reverse geocode failed:', err);
    }

    return `Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
  }
}
