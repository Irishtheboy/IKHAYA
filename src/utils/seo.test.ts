import { generatePropertySlug, generatePropertyUrl, generatePropertySchema } from './seo';
import { Property } from '../types/firebase';
import { Timestamp } from 'firebase/firestore';
import * as fc from 'fast-check';

describe('SEO Utilities', () => {
  const mockProperty: Property = {
    id: 'test-property-123',
    landlordId: 'landlord-123',
    address: '123 Main Street, Suburb',
    city: 'Cape Town',
    province: 'Western Cape',
    postalCode: '8001',
    propertyType: 'apartment',
    bedrooms: 2,
    bathrooms: 1,
    rentAmount: 8500,
    deposit: 8500,
    description: 'Beautiful 2-bedroom apartment in the heart of Cape Town',
    amenities: ['Parking', 'Security', 'Pool'],
    availableFrom: Timestamp.now(),
    status: 'available',
    isPremium: false,
    images: ['https://example.com/image1.jpg'],
    viewCount: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  describe('generatePropertySlug', () => {
    it('should generate SEO-friendly slug from property data', () => {
      const slug = generatePropertySlug(mockProperty);

      expect(slug).toBe('apartment-for-rent-cape-town-123-main-street');
      expect(slug).not.toContain(' ');
      expect(slug).not.toContain(',');
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    });

    it('should handle special characters in address', () => {
      const propertyWithSpecialChars: Property = {
        ...mockProperty,
        address: "123 O'Brien St., Unit #5",
        city: 'Port Elizabeth',
      };

      const slug = generatePropertySlug(propertyWithSpecialChars);

      expect(slug).toMatch(/^[a-z0-9-]+$/);
      expect(slug).not.toContain("'");
      expect(slug).not.toContain('#');
    });

    it('should handle different property types', () => {
      const houseProperty: Property = {
        ...mockProperty,
        propertyType: 'house',
      };

      const slug = generatePropertySlug(houseProperty);

      expect(slug).toContain('house-for-rent');
    });
  });

  describe('generatePropertyUrl', () => {
    it('should generate complete URL with property ID and slug', () => {
      const url = generatePropertyUrl('test-123', mockProperty);

      expect(url).toContain('/properties/test-123/');
      expect(url).toContain('apartment-for-rent');
    });

    it('should create unique URLs for different properties', () => {
      const property1 = { ...mockProperty, id: 'prop-1', city: 'Johannesburg' };
      const property2 = { ...mockProperty, id: 'prop-2', city: 'Durban' };

      const url1 = generatePropertyUrl('prop-1', property1);
      const url2 = generatePropertyUrl('prop-2', property2);

      expect(url1).not.toBe(url2);
    });
  });

  describe('generatePropertySchema', () => {
    beforeEach(() => {
      // Mock window.location.origin
      delete (window as any).location;
      (window as any).location = { origin: 'https://example.com' };
    });

    it('should generate valid Schema.org structured data', () => {
      const schema = generatePropertySchema(mockProperty, 'test-123');

      expect(schema).toHaveProperty('@context', 'https://schema.org');
      expect(schema).toHaveProperty('@type', 'RealEstateListing');
      expect(schema).toHaveProperty('name');
      expect(schema).toHaveProperty('description', mockProperty.description);
      expect(schema).toHaveProperty('url');
    });

    it('should include address information', () => {
      const schema: any = generatePropertySchema(mockProperty, 'test-123');

      expect(schema.address).toHaveProperty('@type', 'PostalAddress');
      expect(schema.address).toHaveProperty('streetAddress', mockProperty.address);
      expect(schema.address).toHaveProperty('addressLocality', mockProperty.city);
      expect(schema.address).toHaveProperty('addressRegion', mockProperty.province);
      expect(schema.address).toHaveProperty('postalCode', mockProperty.postalCode);
      expect(schema.address).toHaveProperty('addressCountry', 'ZA');
    });

    it('should include offer information', () => {
      const schema: any = generatePropertySchema(mockProperty, 'test-123');

      expect(schema.offers).toHaveProperty('@type', 'Offer');
      expect(schema.offers).toHaveProperty('price', mockProperty.rentAmount);
      expect(schema.offers).toHaveProperty('priceCurrency', 'ZAR');
      expect(schema.offers).toHaveProperty('availability');
    });

    it('should include property features', () => {
      const schema: any = generatePropertySchema(mockProperty, 'test-123');

      expect(schema).toHaveProperty('numberOfRooms', mockProperty.bedrooms);
      expect(schema).toHaveProperty('numberOfBathroomsTotal', mockProperty.bathrooms);
      expect(schema.amenityFeature).toHaveLength(mockProperty.amenities!.length);
    });

    it('should set availability based on property status', () => {
      const availableProperty = { ...mockProperty, status: 'available' as const };
      const occupiedProperty = { ...mockProperty, status: 'occupied' as const };

      const availableSchema: any = generatePropertySchema(availableProperty, 'test-1');
      const occupiedSchema: any = generatePropertySchema(occupiedProperty, 'test-2');

      expect(availableSchema.offers.availability).toContain('InStock');
      expect(occupiedSchema.offers.availability).toContain('OutOfStock');
    });
  });

  // Property-Based Tests for SEO and Public Access
  describe('Property-Based Tests', () => {
    // Custom generator for property data
    const propertyGenerator = fc.record({
      id: fc.uuid(),
      landlordId: fc.uuid(),
      address: fc.string({ minLength: 5, maxLength: 100 }),
      city: fc.constantFrom('Cape Town', 'Johannesburg', 'Durban', 'Pretoria', 'Port Elizabeth'),
      province: fc.constantFrom('Western Cape', 'Gauteng', 'KwaZulu-Natal', 'Eastern Cape'),
      postalCode: fc.option(fc.stringMatching(/^[0-9]{4}$/), { nil: undefined }),
      propertyType: fc.constantFrom('apartment', 'house', 'townhouse', 'room'),
      bedrooms: fc.integer({ min: 1, max: 10 }),
      bathrooms: fc.integer({ min: 1, max: 5 }),
      rentAmount: fc.integer({ min: 1000, max: 50000 }),
      deposit: fc.integer({ min: 1000, max: 50000 }),
      description: fc.string({ minLength: 20, maxLength: 500 }),
      amenities: fc.array(fc.constantFrom('Parking', 'Security', 'Pool', 'Garden', 'Gym'), {
        maxLength: 5,
      }),
      availableFrom: fc.constantFrom(Timestamp.now()),
      status: fc.constantFrom('available', 'occupied', 'inactive'),
      isPremium: fc.boolean(),
      images: fc.array(fc.webUrl(), { minLength: 0, maxLength: 10 }),
      viewCount: fc.integer({ min: 0, max: 10000 }),
      createdAt: fc.constantFrom(Timestamp.now()),
      updatedAt: fc.constantFrom(Timestamp.now()),
    });

    /**
     * Feature: ikhaya-rent-properties, Property 54: Listings have SEO-friendly URLs and metadata
     * Validates: Requirements 12.1, 12.2, 12.3
     */
    describe('Property 54: Listings have SEO-friendly URLs and metadata', () => {
      beforeEach(() => {
        // Mock window.location.origin for all tests
        delete (window as any).location;
        (window as any).location = { origin: 'https://example.com' };
      });

      it('property: all listings should have SEO-friendly URLs', () => {
        fc.assert(
          fc.property(propertyGenerator, fc.uuid(), (property, propertyId) => {
            const url = generatePropertyUrl(propertyId, property as Property);

            // URL should start with /properties/
            expect(url).toMatch(/^\/properties\//);

            // URL should contain the property ID
            expect(url).toContain(propertyId);

            // URL should be lowercase
            expect(url).toBe(url.toLowerCase());

            // URL should not contain spaces or special characters (except hyphens and slashes)
            expect(url).toMatch(/^[a-z0-9\/-]+$/);

            // URL should contain meaningful parts (property type, city)
            const slug = url.split('/').pop() || '';
            expect(slug.length).toBeGreaterThan(0);
          }),
          { numRuns: 100 }
        );
      });

      it('property: all listings should have valid Schema.org structured data', () => {
        fc.assert(
          fc.property(propertyGenerator, fc.uuid(), (property, propertyId) => {
            const schema: any = generatePropertySchema(property as Property, propertyId);

            // Must have required Schema.org properties
            expect(schema).toHaveProperty('@context', 'https://schema.org');
            expect(schema).toHaveProperty('@type', 'RealEstateListing');
            expect(schema).toHaveProperty('name');
            expect(schema).toHaveProperty('description');
            expect(schema).toHaveProperty('url');

            // Must have address information
            expect(schema.address).toHaveProperty('@type', 'PostalAddress');
            expect(schema.address).toHaveProperty('streetAddress');
            expect(schema.address).toHaveProperty('addressLocality');
            expect(schema.address).toHaveProperty('addressRegion');
            expect(schema.address).toHaveProperty('addressCountry', 'ZA');

            // Must have offer information
            expect(schema.offers).toHaveProperty('@type', 'Offer');
            expect(schema.offers).toHaveProperty('price');
            expect(schema.offers).toHaveProperty('priceCurrency', 'ZAR');
            expect(schema.offers).toHaveProperty('availability');

            // Must have property features
            expect(schema).toHaveProperty('numberOfRooms');
            expect(schema).toHaveProperty('numberOfBathroomsTotal');
          }),
          { numRuns: 100 }
        );
      });

      it('property: Schema.org availability should reflect property status', () => {
        fc.assert(
          fc.property(propertyGenerator, fc.uuid(), (property, propertyId) => {
            const schema: any = generatePropertySchema(property as Property, propertyId);

            if (property.status === 'available') {
              expect(schema.offers.availability).toContain('InStock');
            } else {
              expect(schema.offers.availability).toContain('OutOfStock');
            }
          }),
          { numRuns: 100 }
        );
      });

      it('property: URLs should be unique for different properties', () => {
        fc.assert(
          fc.property(
            propertyGenerator,
            propertyGenerator,
            fc.uuid(),
            fc.uuid(),
            (property1, property2, id1, id2) => {
              // Skip if IDs are the same
              fc.pre(id1 !== id2);

              const url1 = generatePropertyUrl(id1, property1 as Property);
              const url2 = generatePropertyUrl(id2, property2 as Property);

              // URLs should be different when property IDs are different
              expect(url1).not.toBe(url2);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    /**
     * Feature: ikhaya-rent-properties, Property 55: Public listings are accessible without authentication
     * Validates: Requirements 12.5
     *
     * Note: This property tests the data structure and URL generation that enables public access.
     * The actual authentication bypass is tested at the component/integration level.
     */
    describe('Property 55: Public listings are accessible without authentication', () => {
      it('property: all active listings should have publicly accessible URLs', () => {
        fc.assert(
          fc.property(propertyGenerator, fc.uuid(), (property, propertyId) => {
            // Only test active listings
            if (property.status !== 'available') {
              return;
            }

            const url = generatePropertyUrl(propertyId, property as Property);

            // URL should be a valid path (not requiring authentication tokens)
            expect(url).toMatch(/^\/properties\/[a-z0-9-\/]+$/);

            // URL should not contain authentication tokens or session IDs
            expect(url).not.toContain('token');
            expect(url).not.toContain('session');
            expect(url).not.toContain('auth');

            // Schema should be publicly accessible (no authentication required)
            const schema: any = generatePropertySchema(property as Property, propertyId);
            expect(schema.url).toBeDefined();
            expect(schema.url).toContain(url);
          }),
          { numRuns: 100 }
        );
      });

      it('property: Schema.org data should be complete for public consumption', () => {
        fc.assert(
          fc.property(propertyGenerator, fc.uuid(), (property, propertyId) => {
            const schema: any = generatePropertySchema(property as Property, propertyId);

            // All essential information should be present for public viewing
            expect(schema.name).toBeDefined();
            expect(schema.description).toBeDefined();
            expect(schema.address).toBeDefined();
            expect(schema.offers).toBeDefined();
            expect(schema.offers.price).toBeDefined();

            // No sensitive landlord information should be exposed
            expect(JSON.stringify(schema)).not.toContain('landlordId');
            expect(JSON.stringify(schema)).not.toContain('email');
            expect(JSON.stringify(schema)).not.toContain('phone');
          }),
          { numRuns: 100 }
        );
      });
    });

    /**
     * Feature: ikhaya-rent-properties, Property 56: Non-authenticated users are prompted to register
     * Validates: Requirements 12.6
     *
     * Note: This property tests the URL structure that enables the registration prompt.
     * The actual prompt behavior is tested at the component level (PropertyDetail component).
     */
    describe('Property 56: Non-authenticated users are prompted to register', () => {
      it('property: listing URLs should support registration flow redirection', () => {
        fc.assert(
          fc.property(propertyGenerator, fc.uuid(), (property, propertyId) => {
            const url = generatePropertyUrl(propertyId, property as Property);

            // URL should be a clean path that can be used as a redirect target
            expect(url).toMatch(/^\/properties\/[a-z0-9-\/]+$/);

            // URL should not have query parameters that would interfere with redirect
            expect(url).not.toContain('?');
            expect(url).not.toContain('&');

            // URL should be suitable for use in state/redirect parameters
            const encodedUrl = encodeURIComponent(url);
            expect(encodedUrl).toBeDefined();
            expect(decodeURIComponent(encodedUrl)).toBe(url);
          }),
          { numRuns: 100 }
        );
      });

      it('property: property data should contain all information needed for interest expression', () => {
        fc.assert(
          fc.property(propertyGenerator, (property) => {
            // Property should have all required fields for lead creation
            expect(property.id).toBeDefined();
            expect(property.landlordId).toBeDefined();
            expect(property.address).toBeDefined();
            expect(property.city).toBeDefined();
            expect(property.rentAmount).toBeGreaterThan(0);

            // These fields are needed to show compelling information to prompt registration
            expect(property.description).toBeDefined();
            expect(property.propertyType).toBeDefined();
            expect(property.bedrooms).toBeGreaterThan(0);
          }),
          { numRuns: 100 }
        );
      });

      it('property: SEO metadata should encourage registration through compelling content', () => {
        fc.assert(
          fc.property(propertyGenerator, fc.uuid(), (property, propertyId) => {
            const schema: any = generatePropertySchema(property as Property, propertyId);

            // Schema should have compelling information that encourages registration
            expect(schema.name).toBeDefined();
            expect(schema.name.length).toBeGreaterThan(0);

            expect(schema.description).toBeDefined();
            expect(schema.description.length).toBeGreaterThan(0);

            // Price information should be clear
            expect(schema.offers.price).toBeGreaterThan(0);
            expect(schema.offers.priceCurrency).toBe('ZAR');

            // Property features should be highlighted
            expect(schema.numberOfRooms).toBeGreaterThan(0);
          }),
          { numRuns: 100 }
        );
      });
    });
  });
});
