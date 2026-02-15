import { Property } from '../types/firebase';

/**
 * Generate SEO-friendly URL slug from property data
 */
export const generatePropertySlug = (property: Property): string => {
  const parts = [
    property.propertyType,
    'for-rent',
    property.city,
    property.address.split(',')[0], // First part of address
  ];

  return parts
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

/**
 * Generate property URL with SEO-friendly slug
 */
export const generatePropertyUrl = (propertyId: string, property: Property): string => {
  const slug = generatePropertySlug(property);
  return `/properties/${propertyId}/${slug}`;
};

/**
 * Generate Schema.org structured data for property listing
 */
export const generatePropertySchema = (property: Property, propertyId: string): object => {
  const baseUrl = window.location.origin;
  const propertyUrl = `${baseUrl}${generatePropertyUrl(propertyId, property)}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: `${property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1)} for Rent in ${property.city}`,
    description: property.description,
    url: propertyUrl,
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.address,
      addressLocality: property.city,
      addressRegion: property.province,
      postalCode: property.postalCode || '',
      addressCountry: 'ZA',
    },
    geo: {
      '@type': 'GeoCoordinates',
      // Note: Would need to add lat/lng to property data for full implementation
    },
    offers: {
      '@type': 'Offer',
      price: property.rentAmount,
      priceCurrency: 'ZAR',
      availability:
        property.status === 'available'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      validFrom: property.availableFrom,
    },
    numberOfRooms: property.bedrooms,
    numberOfBathroomsTotal: property.bathrooms,
    floorSize: {
      '@type': 'QuantitativeValue',
      // Note: Would need to add square footage to property data
    },
    amenityFeature:
      property.amenities?.map((amenity) => ({
        '@type': 'LocationFeatureSpecification',
        name: amenity,
      })) || [],
    image: property.images || [],
    datePosted: property.createdAt,
  };
};

/**
 * Update document meta tags for SEO
 */
export const updateMetaTags = (property: Property, propertyId: string): void => {
  const title = `${property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1)} for Rent in ${property.city} - R${property.rentAmount.toLocaleString()}/month`;
  const description =
    property.description.substring(0, 160) + (property.description.length > 160 ? '...' : '');
  const imageUrl = property.images?.[0] || '';
  const propertyUrl = `${window.location.origin}${generatePropertyUrl(propertyId, property)}`;

  // Update title
  document.title = title;

  // Update or create meta tags
  updateMetaTag('description', description);
  updateMetaTag(
    'keywords',
    `${property.propertyType}, rent, ${property.city}, ${property.province}, ${property.bedrooms} bedroom, property rental`
  );

  // Open Graph tags for social media
  updateMetaTag('og:title', title, 'property');
  updateMetaTag('og:description', description, 'property');
  updateMetaTag('og:image', imageUrl, 'property');
  updateMetaTag('og:url', propertyUrl, 'property');
  updateMetaTag('og:type', 'website', 'property');

  // Twitter Card tags
  updateMetaTag('twitter:card', 'summary_large_image', 'name');
  updateMetaTag('twitter:title', title, 'name');
  updateMetaTag('twitter:description', description, 'name');
  updateMetaTag('twitter:image', imageUrl, 'name');
};

/**
 * Helper function to update or create a meta tag
 */
const updateMetaTag = (
  name: string,
  content: string,
  attributeName: 'name' | 'property' = 'name'
): void => {
  let element = document.querySelector(`meta[${attributeName}="${name}"]`);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attributeName, name);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
};

/**
 * Add JSON-LD structured data to page
 */
export const addStructuredData = (schema: object): void => {
  // Remove existing structured data
  const existingScript = document.querySelector('script[type="application/ld+json"]');
  if (existingScript) {
    existingScript.remove();
  }

  // Add new structured data
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.text = JSON.stringify(schema);
  document.head.appendChild(script);
};

/**
 * Clean up SEO elements when component unmounts
 */
export const cleanupSEO = (): void => {
  // Remove structured data
  const structuredData = document.querySelector('script[type="application/ld+json"]');
  if (structuredData) {
    structuredData.remove();
  }

  // Reset title
  document.title = 'IKHAYA RENT PROPERTIES';
};
