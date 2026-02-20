/**
 * Geocoding Service
 * Uses Nominatim (OpenStreetMap) free geocoding API
 * No API key required
 */

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    municipality?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

interface NearbyPlace {
  name: string;
  distance: string;
  type: string;
}

interface LocationData {
  address: string;
  city: string;
  province: string;
  postalCode: string;
  latitude: number;
  longitude: number;
}

class GeocodingService {
  private readonly nominatimBaseUrl = 'https://nominatim.openstreetmap.org';
  private readonly overpassBaseUrl = 'https://overpass-api.de/api/interpreter';

  /**
   * Search for an address and get location details
   * @param query - Address search query
   * @returns Location data including coordinates
   */
  async searchAddress(query: string): Promise<LocationData | null> {
    try {
      const response = await fetch(
        `${this.nominatimBaseUrl}/search?` +
          new URLSearchParams({
            q: query,
            format: 'json',
            addressdetails: '1',
            limit: '1',
            countrycodes: 'za', // Limit to South Africa
          }),
        {
          headers: {
            'User-Agent': 'IKHAYA-Properties-App',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch location data');
      }

      const results: NominatimResult[] = await response.json();

      if (results.length === 0) {
        return null;
      }

      const result = results[0];
      const address = result.address;

      return {
        address: result.display_name.split(',')[0] || query,
        city: address.city || address.town || address.municipality || address.suburb || '',
        province: address.state || '',
        postalCode: address.postcode || '',
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
      };
    } catch (error) {
      console.error('Error searching address:', error);
      return null;
    }
  }

  /**
   * Get nearby schools using Overpass API
   * @param latitude - Latitude coordinate
   * @param longitude - Longitude coordinate
   * @param radius - Search radius in meters (default 5000m = 5km)
   * @returns Array of nearby schools
   */
  async getNearbySchools(
    latitude: number,
    longitude: number,
    radius: number = 5000
  ): Promise<NearbyPlace[]> {
    try {
      const query = `
        [out:json];
        (
          node["amenity"="school"](around:${radius},${latitude},${longitude});
          way["amenity"="school"](around:${radius},${latitude},${longitude});
          node["amenity"="kindergarten"](around:${radius},${latitude},${longitude});
          way["amenity"="kindergarten"](around:${radius},${latitude},${longitude});
          node["amenity"="university"](around:${radius},${latitude},${longitude});
          way["amenity"="university"](around:${radius},${latitude},${longitude});
        );
        out center 10;
      `;

      const response = await fetch(this.overpassBaseUrl, {
        method: 'POST',
        body: query,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch nearby schools');
      }

      const data = await response.json();
      const places: NearbyPlace[] = [];

      for (const element of data.elements.slice(0, 5)) {
        const lat = element.lat || element.center?.lat;
        const lon = element.lon || element.center?.lon;

        if (lat && lon && element.tags?.name) {
          const distance = this.calculateDistance(latitude, longitude, lat, lon);
          places.push({
            name: element.tags.name,
            distance: `${distance.toFixed(2)}km`,
            type: element.tags.amenity || 'school',
          });
        }
      }

      return places.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    } catch (error) {
      console.error('Error fetching nearby schools:', error);
      return [];
    }
  }

  /**
   * Get nearby restaurants and entertainment venues
   * @param latitude - Latitude coordinate
   * @param longitude - Longitude coordinate
   * @param radius - Search radius in meters (default 5000m = 5km)
   * @returns Array of nearby restaurants and entertainment
   */
  async getNearbyRestaurants(
    latitude: number,
    longitude: number,
    radius: number = 5000
  ): Promise<NearbyPlace[]> {
    try {
      const query = `
        [out:json];
        (
          node["amenity"="restaurant"](around:${radius},${latitude},${longitude});
          way["amenity"="restaurant"](around:${radius},${latitude},${longitude});
          node["amenity"="fast_food"](around:${radius},${latitude},${longitude});
          way["amenity"="fast_food"](around:${radius},${latitude},${longitude});
          node["amenity"="cafe"](around:${radius},${latitude},${longitude});
          way["amenity"="cafe"](around:${radius},${latitude},${longitude});
          node["amenity"="bar"](around:${radius},${latitude},${longitude});
          way["amenity"="bar"](around:${radius},${latitude},${longitude});
          node["amenity"="cinema"](around:${radius},${latitude},${longitude});
          way["amenity"="cinema"](around:${radius},${latitude},${longitude});
        );
        out center 10;
      `;

      const response = await fetch(this.overpassBaseUrl, {
        method: 'POST',
        body: query,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch nearby restaurants');
      }

      const data = await response.json();
      const places: NearbyPlace[] = [];

      for (const element of data.elements.slice(0, 5)) {
        const lat = element.lat || element.center?.lat;
        const lon = element.lon || element.center?.lon;

        if (lat && lon && element.tags?.name) {
          const distance = this.calculateDistance(latitude, longitude, lat, lon);
          places.push({
            name: element.tags.name,
            distance: `${distance.toFixed(2)}km`,
            type: element.tags.amenity || 'restaurant',
          });
        }
      }

      return places.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    } catch (error) {
      console.error('Error fetching nearby restaurants:', error);
      return [];
    }
  }

  /**
   * Get nearby transport and public services
   * @param latitude - Latitude coordinate
   * @param longitude - Longitude coordinate
   * @param radius - Search radius in meters (default 5000m = 5km)
   * @returns Array of nearby transport and services
   */
  async getNearbyTransport(
    latitude: number,
    longitude: number,
    radius: number = 5000
  ): Promise<NearbyPlace[]> {
    try {
      const query = `
        [out:json];
        (
          node["amenity"="bus_station"](around:${radius},${latitude},${longitude});
          way["amenity"="bus_station"](around:${radius},${latitude},${longitude});
          node["railway"="station"](around:${radius},${latitude},${longitude});
          way["railway"="station"](around:${radius},${latitude},${longitude});
          node["amenity"="taxi"](around:${radius},${latitude},${longitude});
          way["amenity"="taxi"](around:${radius},${latitude},${longitude});
          node["natural"="beach"](around:${radius},${latitude},${longitude});
          way["natural"="beach"](around:${radius},${latitude},${longitude});
          node["leisure"="park"](around:${radius},${latitude},${longitude});
          way["leisure"="park"](around:${radius},${latitude},${longitude});
        );
        out center 10;
      `;

      const response = await fetch(this.overpassBaseUrl, {
        method: 'POST',
        body: query,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch nearby transport');
      }

      const data = await response.json();
      const places: NearbyPlace[] = [];

      for (const element of data.elements.slice(0, 5)) {
        const lat = element.lat || element.center?.lat;
        const lon = element.lon || element.center?.lon;

        if (lat && lon && element.tags?.name) {
          const distance = this.calculateDistance(latitude, longitude, lat, lon);
          places.push({
            name: element.tags.name,
            distance: `${distance.toFixed(2)}km`,
            type:
              element.tags.amenity || element.tags.natural || element.tags.leisure || 'location',
          });
        }
      }

      return places.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    } catch (error) {
      console.error('Error fetching nearby transport:', error);
      return [];
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * @param lat1 - Latitude of first point
   * @param lon1 - Longitude of first point
   * @param lat2 - Latitude of second point
   * @param lon2 - Longitude of second point
   * @returns Distance in kilometers
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get all nearby places at once
   * @param latitude - Latitude coordinate
   * @param longitude - Longitude coordinate
   * @returns Object containing all nearby places
   */
  async getAllNearbyPlaces(latitude: number, longitude: number) {
    try {
      const [schools, restaurants, transport] = await Promise.all([
        this.getNearbySchools(latitude, longitude),
        this.getNearbyRestaurants(latitude, longitude),
        this.getNearbyTransport(latitude, longitude),
      ]);

      return {
        schools,
        restaurants,
        transport,
      };
    } catch (error) {
      console.error('Error fetching all nearby places:', error);
      return {
        schools: [],
        restaurants: [],
        transport: [],
      };
    }
  }
}

export const geocodingService = new GeocodingService();
export default geocodingService;
