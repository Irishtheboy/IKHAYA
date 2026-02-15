import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { propertyService, PropertyDTO, SearchCriteria } from './propertyService';
import { Property, PropertyType } from '../types/firebase';

// Mock Firebase Firestore
jest.mock('firebase/firestore');
jest.mock('../config/firebase', () => ({
  db: {},
}));

describe('PropertyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProperty', () => {
    it('should create a new property with valid data', async () => {
      const landlordId = 'landlord123';
      const propertyData: PropertyDTO = {
        address: '123 Main St',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '8001',
        propertyType: 'apartment',
        bedrooms: 2,
        bathrooms: 1,
        rentAmount: 10000,
        deposit: 10000,
        description: 'Beautiful apartment in the city center',
        amenities: ['parking', 'wifi'],
        availableFrom: new Date('2024-01-01'),
      };

      const mockPropertyRef = { id: 'property123' };
      (collection as jest.Mock).mockReturnValue({});
      (doc as jest.Mock).mockReturnValue(mockPropertyRef);
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await propertyService.createProperty(landlordId, propertyData);

      expect(result).toBeDefined();
      expect(result.id).toBe('property123');
      expect(result.landlordId).toBe(landlordId);
      expect(result.address).toBe(propertyData.address);
      expect(result.city).toBe(propertyData.city);
      expect(result.status).toBe('available');
      expect(result.isPremium).toBe(false);
      expect(result.viewCount).toBe(0);
      expect(setDoc).toHaveBeenCalled();
    });

    it('should throw error for missing required fields', async () => {
      const landlordId = 'landlord123';
      const invalidData = {
        address: '',
        city: 'Cape Town',
        province: 'Western Cape',
        propertyType: 'apartment' as PropertyType,
        bedrooms: 2,
        bathrooms: 1,
        rentAmount: 10000,
        deposit: 10000,
        description: 'Test',
        amenities: [],
        availableFrom: new Date(),
      };

      await expect(propertyService.createProperty(landlordId, invalidData)).rejects.toThrow(
        'Address is required'
      );
    });

    it('should throw error for negative rent amount', async () => {
      const landlordId = 'landlord123';
      const invalidData: PropertyDTO = {
        address: '123 Main St',
        city: 'Cape Town',
        province: 'Western Cape',
        propertyType: 'apartment',
        bedrooms: 2,
        bathrooms: 1,
        rentAmount: -1000,
        deposit: 10000,
        description: 'Test',
        amenities: [],
        availableFrom: new Date(),
      };

      await expect(propertyService.createProperty(landlordId, invalidData)).rejects.toThrow(
        'Rent amount must be greater than zero'
      );
    });

    it('should throw error for negative bedrooms', async () => {
      const landlordId = 'landlord123';
      const invalidData: PropertyDTO = {
        address: '123 Main St',
        city: 'Cape Town',
        province: 'Western Cape',
        propertyType: 'apartment',
        bedrooms: -1,
        bathrooms: 1,
        rentAmount: 10000,
        deposit: 10000,
        description: 'Test',
        amenities: [],
        availableFrom: new Date(),
      };

      await expect(propertyService.createProperty(landlordId, invalidData)).rejects.toThrow(
        'Bedrooms must be a non-negative number'
      );
    });
  });

  describe('updateProperty', () => {
    it('should update property with valid data', async () => {
      const propertyId = 'property123';
      const updates: Partial<PropertyDTO> = {
        rentAmount: 12000,
        description: 'Updated description',
      };

      const mockPropertyData = {
        id: propertyId,
        landlordId: 'landlord123',
        address: '123 Main St',
        city: 'Cape Town',
        province: 'Western Cape',
        propertyType: 'apartment',
        bedrooms: 2,
        bathrooms: 1,
        rentAmount: 12000,
        deposit: 10000,
        description: 'Updated description',
        amenities: [],
        availableFrom: Timestamp.now(),
        status: 'available',
        isPremium: false,
        images: [],
        viewCount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      (doc as jest.Mock).mockReturnValue({});
      (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => true }).mockResolvedValueOnce({
        exists: () => true,
        id: propertyId,
        data: () => mockPropertyData,
      });
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await propertyService.updateProperty(propertyId, updates);

      expect(result).toBeDefined();
      expect(result.rentAmount).toBe(12000);
      expect(result.description).toBe('Updated description');
      expect(updateDoc).toHaveBeenCalled();
    });

    it('should throw error if property not found', async () => {
      const propertyId = 'nonexistent';
      const updates: Partial<PropertyDTO> = {
        rentAmount: 12000,
      };

      (doc as jest.Mock).mockReturnValue({});
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });

      await expect(propertyService.updateProperty(propertyId, updates)).rejects.toThrow(
        'Property not found'
      );
    });
  });

  describe('deleteProperty', () => {
    it('should delete existing property', async () => {
      const propertyId = 'property123';

      (doc as jest.Mock).mockReturnValue({});
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true });
      (deleteDoc as jest.Mock).mockResolvedValue(undefined);

      await propertyService.deleteProperty(propertyId);

      expect(deleteDoc).toHaveBeenCalled();
    });

    it('should throw error if property not found', async () => {
      const propertyId = 'nonexistent';

      (doc as jest.Mock).mockReturnValue({});
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });

      await expect(propertyService.deleteProperty(propertyId)).rejects.toThrow(
        'Property not found'
      );
    });
  });

  describe('getProperty', () => {
    it('should return property if found', async () => {
      const propertyId = 'property123';
      const mockPropertyData = {
        landlordId: 'landlord123',
        address: '123 Main St',
        city: 'Cape Town',
        province: 'Western Cape',
        propertyType: 'apartment',
        bedrooms: 2,
        bathrooms: 1,
        rentAmount: 10000,
        deposit: 10000,
        description: 'Test property',
        amenities: [],
        availableFrom: Timestamp.now(),
        status: 'available',
        isPremium: false,
        images: [],
        viewCount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      (doc as jest.Mock).mockReturnValue({});
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        id: propertyId,
        data: () => mockPropertyData,
      });

      const result = await propertyService.getProperty(propertyId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(propertyId);
      expect(result?.address).toBe('123 Main St');
    });

    it('should return null if property not found', async () => {
      const propertyId = 'nonexistent';

      (doc as jest.Mock).mockReturnValue({});
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });

      const result = await propertyService.getProperty(propertyId);

      expect(result).toBeNull();
    });
  });

  describe('searchProperties', () => {
    it('should return properties matching search criteria', async () => {
      const criteria: SearchCriteria = {
        location: 'Cape Town',
        minPrice: 5000,
        maxPrice: 15000,
        bedrooms: 2,
      };

      const mockProperties = [
        {
          id: 'property1',
          landlordId: 'landlord123',
          address: '123 Main St',
          city: 'Cape Town',
          province: 'Western Cape',
          propertyType: 'apartment',
          bedrooms: 2,
          bathrooms: 1,
          rentAmount: 10000,
          deposit: 10000,
          description: 'Property 1',
          amenities: [],
          availableFrom: Timestamp.now(),
          status: 'available',
          isPremium: false,
          images: [],
          viewCount: 0,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        },
      ];

      (collection as jest.Mock).mockReturnValue({});
      (query as jest.Mock).mockReturnValue({});
      (where as jest.Mock).mockReturnValue({});
      (orderBy as jest.Mock).mockReturnValue({});
      (limit as jest.Mock).mockReturnValue({});
      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockProperties.map((prop) => ({
          id: prop.id,
          data: () => prop,
        })),
      });

      const result = await propertyService.searchProperties(criteria);

      expect(result).toBeDefined();
      expect(result.properties).toHaveLength(1);
      expect(result.properties[0].city).toBe('Cape Town');
    });

    it('should return empty array if no properties match', async () => {
      const criteria: SearchCriteria = {
        location: 'Nonexistent City',
      };

      (collection as jest.Mock).mockReturnValue({});
      (query as jest.Mock).mockReturnValue({});
      (where as jest.Mock).mockReturnValue({});
      (orderBy as jest.Mock).mockReturnValue({});
      (limit as jest.Mock).mockReturnValue({});
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [],
      });

      const result = await propertyService.searchProperties(criteria);

      expect(result.properties).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('updateStatus', () => {
    it('should update property status', async () => {
      const propertyId = 'property123';
      const newStatus = 'occupied';

      const mockPropertyData = {
        id: propertyId,
        landlordId: 'landlord123',
        address: '123 Main St',
        city: 'Cape Town',
        province: 'Western Cape',
        propertyType: 'apartment',
        bedrooms: 2,
        bathrooms: 1,
        rentAmount: 10000,
        deposit: 10000,
        description: 'Test',
        amenities: [],
        availableFrom: Timestamp.now(),
        status: newStatus,
        isPremium: false,
        images: [],
        viewCount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      (doc as jest.Mock).mockReturnValue({});
      (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => true }).mockResolvedValueOnce({
        exists: () => true,
        id: propertyId,
        data: () => mockPropertyData,
      });
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await propertyService.updateStatus(propertyId, newStatus);

      expect(result.status).toBe(newStatus);
      expect(updateDoc).toHaveBeenCalled();
    });
  });

  describe('getLandlordProperties', () => {
    it('should return all properties for a landlord', async () => {
      const landlordId = 'landlord123';
      const mockProperties = [
        {
          id: 'property1',
          landlordId,
          address: '123 Main St',
          city: 'Cape Town',
          province: 'Western Cape',
          propertyType: 'apartment',
          bedrooms: 2,
          bathrooms: 1,
          rentAmount: 10000,
          deposit: 10000,
          description: 'Property 1',
          amenities: [],
          availableFrom: Timestamp.now(),
          status: 'available',
          isPremium: false,
          images: [],
          viewCount: 0,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        },
        {
          id: 'property2',
          landlordId,
          address: '456 Oak Ave',
          city: 'Johannesburg',
          province: 'Gauteng',
          propertyType: 'house',
          bedrooms: 3,
          bathrooms: 2,
          rentAmount: 15000,
          deposit: 15000,
          description: 'Property 2',
          amenities: [],
          availableFrom: Timestamp.now(),
          status: 'occupied',
          isPremium: true,
          images: [],
          viewCount: 10,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        },
      ];

      (collection as jest.Mock).mockReturnValue({});
      (query as jest.Mock).mockReturnValue({});
      (where as jest.Mock).mockReturnValue({});
      (orderBy as jest.Mock).mockReturnValue({});
      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockProperties.map((prop) => ({
          id: prop.id,
          data: () => prop,
        })),
      });

      const result = await propertyService.getLandlordProperties(landlordId);

      expect(result).toHaveLength(2);
      expect(result[0].landlordId).toBe(landlordId);
      expect(result[1].landlordId).toBe(landlordId);
    });
  });
});
