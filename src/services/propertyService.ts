import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  Timestamp,
  QueryConstraint,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Property, PropertyStatus, PropertyType } from '../types/firebase';
import { COLLECTIONS } from '../types/firestore-schema';
import { cloudinaryService } from './cloudinaryService';

/**
 * Data Transfer Object for property creation
 */
export interface PropertyDTO {
  address: string;
  city: string;
  province: string;
  postalCode?: string;
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  rentAmount: number;
  deposit: number;
  description: string;
  amenities: string[];
  availableFrom: Date;
  // Additional property details
  ratesAndTaxes?: number;
  garages?: number;
  parking?: number;
  hasGarden?: boolean;
  nearbySchools?: Array<{ name: string; distance: string }>;
  nearbyRestaurants?: Array<{ name: string; distance: string }>;
  nearbyTransport?: Array<{ name: string; distance: string }>;
  latitude?: number;
  longitude?: number;
}

/**
 * Search criteria for property queries
 */
export interface SearchCriteria {
  location?: string; // City or province
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: PropertyType;
  sortBy?: 'price' | 'date' | 'relevance';
  page?: number;
  limit?: number;
}

/**
 * Property search result with pagination
 */
export interface PropertySearchResult {
  properties: Property[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Property Service
 * Handles property listing management including CRUD operations and search
 */
class PropertyService {
  /**
   * Create a new property listing
   *
   * @param landlordId - ID of the landlord creating the listing
   * @param propertyData - Property details
   * @returns Promise resolving to the created property
   * @throws Error if creation fails
   */
  async createProperty(landlordId: string, propertyData: PropertyDTO): Promise<Property> {
    try {
      // Validate property data
      this.validatePropertyData(propertyData);

      // Create new document reference with auto-generated ID
      const propertyRef = doc(collection(db, COLLECTIONS.PROPERTIES));

      // Prepare property document
      const propertyDoc: Omit<Property, 'id'> = {
        landlordId,
        address: propertyData.address,
        city: propertyData.city,
        province: propertyData.province,
        postalCode: propertyData.postalCode,
        propertyType: propertyData.propertyType,
        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        rentAmount: propertyData.rentAmount,
        deposit: propertyData.deposit,
        description: propertyData.description,
        amenities: propertyData.amenities,
        availableFrom: Timestamp.fromDate(propertyData.availableFrom),
        status: 'available',
        isPremium: false,
        images: [],
        viewCount: 0,
        // Additional property details
        ratesAndTaxes: propertyData.ratesAndTaxes,
        garages: propertyData.garages,
        parking: propertyData.parking,
        hasGarden: propertyData.hasGarden,
        nearbySchools: propertyData.nearbySchools,
        nearbyRestaurants: propertyData.nearbyRestaurants,
        nearbyTransport: propertyData.nearbyTransport,
        latitude: propertyData.latitude,
        longitude: propertyData.longitude,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };

      // Save to Firestore
      await setDoc(propertyRef, propertyDoc);

      // Return property with ID
      const property: Property = {
        id: propertyRef.id,
        ...propertyDoc,
        createdAt: propertyDoc.createdAt,
        updatedAt: propertyDoc.updatedAt,
      };

      return property;
    } catch (error: any) {
      console.error('Error creating property:', error);
      throw new Error(`Failed to create property: ${error.message}`);
    }
  }

  /**
   * Update an existing property listing
   *
   * @param propertyId - ID of the property to update
   * @param updates - Partial property data to update
   * @returns Promise resolving to the updated property
   * @throws Error if update fails or property not found
   */
  async updateProperty(propertyId: string, updates: Partial<PropertyDTO>): Promise<Property> {
    try {
      const propertyRef = doc(db, COLLECTIONS.PROPERTIES, propertyId);

      // Check if property exists
      const propertySnap = await getDoc(propertyRef);
      if (!propertySnap.exists()) {
        throw new Error('Property not found');
      }

      // Prepare update data
      const updateData: Partial<DocumentData> = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      // Convert availableFrom Date to Timestamp if provided
      if (updates.availableFrom) {
        updateData.availableFrom = Timestamp.fromDate(updates.availableFrom);
      }

      // Update document
      await updateDoc(propertyRef, updateData);

      // Fetch and return updated property
      const updatedSnap = await getDoc(propertyRef);
      const propertyData = updatedSnap.data() as Omit<Property, 'id'>;

      return {
        id: updatedSnap.id,
        ...propertyData,
      };
    } catch (error: any) {
      console.error('Error updating property:', error);
      throw new Error(`Failed to update property: ${error.message}`);
    }
  }

  /**
   * Delete a property listing
   *
   * @param propertyId - ID of the property to delete
   * @returns Promise that resolves when deletion is complete
   * @throws Error if deletion fails or property not found
   */
  async deleteProperty(propertyId: string): Promise<void> {
    try {
      const propertyRef = doc(db, COLLECTIONS.PROPERTIES, propertyId);

      // Check if property exists
      const propertySnap = await getDoc(propertyRef);
      if (!propertySnap.exists()) {
        throw new Error('Property not found');
      }

      // Delete document
      await deleteDoc(propertyRef);
    } catch (error: any) {
      console.error('Error deleting property:', error);
      throw new Error(`Failed to delete property: ${error.message}`);
    }
  }

  /**
   * Get a single property by ID
   *
   * @param propertyId - ID of the property to retrieve
   * @returns Promise resolving to the property or null if not found
   */
  async getProperty(propertyId: string): Promise<Property | null> {
    try {
      const propertyRef = doc(db, COLLECTIONS.PROPERTIES, propertyId);
      const propertySnap = await getDoc(propertyRef);

      if (!propertySnap.exists()) {
        return null;
      }

      const propertyData = propertySnap.data() as Omit<Property, 'id'>;
      return {
        id: propertySnap.id,
        ...propertyData,
      };
    } catch (error: any) {
      console.error('Error fetching property:', error);
      throw new Error(`Failed to fetch property: ${error.message}`);
    }
  }

  /**
   * Search properties with filters and pagination
   *
   * @param criteria - Search criteria and filters
   * @returns Promise resolving to search results with pagination
   */
  async searchProperties(criteria: SearchCriteria = {}): Promise<PropertySearchResult> {
    try {
      const {
        location,
        minPrice,
        maxPrice,
        bedrooms,
        bathrooms,
        propertyType,
        sortBy = 'date',
        page = 1,
        limit: pageLimit = 20,
      } = criteria;

      // Build query constraints
      const constraints: QueryConstraint[] = [];

      // Only show available properties in search
      constraints.push(where('status', '==', 'available'));

      // Property type filter
      if (propertyType) {
        constraints.push(where('propertyType', '==', propertyType));
      }

      // Bedrooms filter
      if (bedrooms !== undefined) {
        constraints.push(where('bedrooms', '>=', bedrooms));
      }

      // Bathrooms filter
      if (bathrooms !== undefined) {
        constraints.push(where('bathrooms', '>=', bathrooms));
      }

      // Price range filters
      if (minPrice !== undefined) {
        constraints.push(where('rentAmount', '>=', minPrice));
      }
      if (maxPrice !== undefined) {
        constraints.push(where('rentAmount', '<=', maxPrice));
      }

      // Sorting
      // Premium listings should appear first
      constraints.push(orderBy('isPremium', 'desc'));

      if (sortBy === 'price') {
        constraints.push(orderBy('rentAmount', 'asc'));
      } else if (sortBy === 'date') {
        constraints.push(orderBy('createdAt', 'desc'));
      }

      // Create query
      const propertiesQuery = query(
        collection(db, COLLECTIONS.PROPERTIES),
        ...constraints,
        limit(pageLimit * 2) // Fetch more to allow for client-side filtering
      );

      // Execute query
      const querySnapshot = await getDocs(propertiesQuery);

      // Map results to Property objects
      let properties: Property[] = querySnapshot.docs.map((doc) => {
        const data = doc.data() as Omit<Property, 'id'>;
        return {
          id: doc.id,
          ...data,
        };
      });

      // Client-side location filtering (case-insensitive partial match)
      if (location) {
        const searchTerm = location.toLowerCase().trim();
        properties = properties.filter((property) => {
          const cityMatch = property.city?.toLowerCase().includes(searchTerm);
          const provinceMatch = property.province?.toLowerCase().includes(searchTerm);
          const addressMatch = property.address?.toLowerCase().includes(searchTerm);
          return cityMatch || provinceMatch || addressMatch;
        });
      }

      // Limit results to page size
      properties = properties.slice(0, pageLimit);

      // Calculate pagination info
      const total = properties.length;
      const totalPages = Math.ceil(total / pageLimit);

      return {
        properties,
        total,
        page,
        totalPages,
      };
    } catch (error: any) {
      console.error('Error searching properties:', error);
      throw new Error(`Failed to search properties: ${error.message}`);
    }
  }

  /**
   * Update property status
   *
   * @param propertyId - ID of the property
   * @param status - New status
   * @returns Promise resolving to updated property
   */
  async updateStatus(propertyId: string, status: PropertyStatus): Promise<Property> {
    try {
      const propertyRef = doc(db, COLLECTIONS.PROPERTIES, propertyId);

      // Check if property exists
      const propertySnap = await getDoc(propertyRef);
      if (!propertySnap.exists()) {
        throw new Error('Property not found');
      }

      // Update status
      await updateDoc(propertyRef, {
        status,
        updatedAt: serverTimestamp(),
      });

      // Fetch and return updated property
      const updatedSnap = await getDoc(propertyRef);
      const propertyData = updatedSnap.data() as Omit<Property, 'id'>;

      return {
        id: updatedSnap.id,
        ...propertyData,
      };
    } catch (error: any) {
      console.error('Error updating property status:', error);
      throw new Error(`Failed to update property status: ${error.message}`);
    }
  }

  /**
   * Get all properties for a specific landlord
   *
   * @param landlordId - ID of the landlord
   * @returns Promise resolving to array of properties
   */
  async getLandlordProperties(landlordId: string): Promise<Property[]> {
    try {
      const propertiesQuery = query(
        collection(db, COLLECTIONS.PROPERTIES),
        where('landlordId', '==', landlordId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(propertiesQuery);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data() as Omit<Property, 'id'>;
        return {
          id: doc.id,
          ...data,
        };
      });
    } catch (error: any) {
      console.error('Error fetching landlord properties:', error);
      throw new Error(`Failed to fetch landlord properties: ${error.message}`);
    }
  }

  /**
   * Upload images for a property
   *
   * @param propertyId - ID of the property
   * @param images - Array of image files to upload
   * @returns Promise resolving to array of download URLs
   * @throws Error if upload fails or property not found
   */
  async uploadImages(propertyId: string, images: File[]): Promise<string[]> {
    try {
      // Check if property exists
      const propertyRef = doc(db, COLLECTIONS.PROPERTIES, propertyId);
      const propertySnap = await getDoc(propertyRef);

      if (!propertySnap.exists()) {
        throw new Error('Property not found');
      }

      const property = propertySnap.data() as Property;

      // Determine max images based on premium status
      const maxImages = property.isPremium ? Infinity : 5;
      const currentImageCount = property.images?.length || 0;
      const remainingSlots = maxImages === Infinity ? images.length : maxImages - currentImageCount;

      if (images.length > remainingSlots) {
        throw new Error(
          `Cannot upload ${images.length} images. Only ${remainingSlots} slots available. ${
            property.isPremium ? '' : 'Upgrade to premium for unlimited images.'
          }`
        );
      }

      // Upload images to Cloudinary
      const folder = `ikhaya/properties/${propertyId}`;
      const downloadURLs = await cloudinaryService.uploadImages(images, folder, images.length);

      // Update property with new image URLs
      const updatedImages = [...(property.images || []), ...downloadURLs];
      await updateDoc(propertyRef, {
        images: updatedImages,
        updatedAt: serverTimestamp(),
      });

      return downloadURLs;
    } catch (error: any) {
      console.error('Error uploading property images:', error);
      throw new Error(`Failed to upload property images: ${error.message}`);
    }
  }

  /**
   * Delete an image from a property
   *
   * @param propertyId - ID of the property
   * @param imageUrl - URL of the image to delete
   * @returns Promise that resolves when deletion is complete
   * @throws Error if deletion fails or property not found
   */
  async deleteImage(propertyId: string, imageUrl: string): Promise<void> {
    try {
      // Check if property exists
      const propertyRef = doc(db, COLLECTIONS.PROPERTIES, propertyId);
      const propertySnap = await getDoc(propertyRef);

      if (!propertySnap.exists()) {
        throw new Error('Property not found');
      }

      const property = propertySnap.data() as Property;

      // Remove image URL from property
      const updatedImages = (property.images || []).filter((url) => url !== imageUrl);

      // Delete image from storage
      await cloudinaryService.deleteImage(imageUrl);

      // Update property
      await updateDoc(propertyRef, {
        images: updatedImages,
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error('Error deleting property image:', error);
      throw new Error(`Failed to delete property image: ${error.message}`);
    }
  }

  /**
   * Validate property data
   *
   * @param propertyData - Property data to validate
   * @throws Error if validation fails
   */
  private validatePropertyData(propertyData: PropertyDTO): void {
    if (!propertyData.address || propertyData.address.trim().length === 0) {
      throw new Error('Address is required');
    }

    if (!propertyData.city || propertyData.city.trim().length === 0) {
      throw new Error('City is required');
    }

    if (!propertyData.province || propertyData.province.trim().length === 0) {
      throw new Error('Province is required');
    }

    if (propertyData.bedrooms < 0) {
      throw new Error('Bedrooms must be a non-negative number');
    }

    if (propertyData.bathrooms < 0) {
      throw new Error('Bathrooms must be a non-negative number');
    }

    if (propertyData.rentAmount <= 0) {
      throw new Error('Rent amount must be greater than zero');
    }

    if (propertyData.deposit < 0) {
      throw new Error('Deposit must be a non-negative number');
    }

    if (!propertyData.description || propertyData.description.trim().length === 0) {
      throw new Error('Description is required');
    }

    if (!propertyData.availableFrom) {
      throw new Error('Available from date is required');
    }

    // Validate property type
    const validTypes: PropertyType[] = ['apartment', 'house', 'townhouse', 'room'];
    if (!validTypes.includes(propertyData.propertyType)) {
      throw new Error('Invalid property type');
    }
  }
}

// Export singleton instance
export const propertyService = new PropertyService();
export default propertyService;
