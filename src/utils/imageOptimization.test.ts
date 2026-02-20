import {
  generateSrcSet,
  generateSizes,
  isMobileDevice,
  getOptimizedImageUrl,
  optimizePropertyImages,
} from './imageOptimization';
import * as fc from 'fast-check';

describe('Image Optimization Utilities', () => {
  describe('generateSrcSet', () => {
    it('should generate srcset for Firebase Storage URLs', () => {
      const firebaseUrl =
        'https://firebasestorage.googleapis.com/v0/b/bucket/o/image.jpg?alt=media';
      const srcset = generateSrcSet(firebaseUrl);

      expect(srcset).toContain('400w');
      expect(srcset).toContain('800w');
      expect(srcset).toContain('1200w');
    });

    it('should return original URL for non-Firebase URLs', () => {
      const regularUrl = 'https://example.com/image.jpg';
      const srcset = generateSrcSet(regularUrl);

      expect(srcset).toBe(regularUrl);
    });

    it('should handle empty URLs', () => {
      expect(generateSrcSet('')).toBe('');
    });
  });

  describe('generateSizes', () => {
    it('should return responsive sizes string', () => {
      const sizes = generateSizes();

      expect(sizes).toContain('max-width: 640px');
      expect(sizes).toContain('max-width: 1024px');
      expect(sizes).toContain('400px');
      expect(sizes).toContain('800px');
      expect(sizes).toContain('1200px');
    });
  });

  describe('isMobileDevice', () => {
    it('should detect mobile devices based on window width', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      expect(isMobileDevice()).toBe(true);
    });

    it('should detect desktop devices', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      expect(isMobileDevice()).toBe(false);
    });
  });

  describe('getOptimizedImageUrl', () => {
    it('should add mobile size parameter for Firebase URLs on mobile', () => {
      const firebaseUrl =
        'https://firebasestorage.googleapis.com/v0/b/bucket/o/image.jpg?alt=media';
      const optimized = getOptimizedImageUrl(firebaseUrl, true);

      expect(optimized).toContain('w=800');
    });

    it('should add desktop size parameter for Firebase URLs on desktop', () => {
      const firebaseUrl =
        'https://firebasestorage.googleapis.com/v0/b/bucket/o/image.jpg?alt=media';
      const optimized = getOptimizedImageUrl(firebaseUrl, false);

      expect(optimized).toContain('w=1200');
    });

    it('should return original URL for non-Firebase URLs', () => {
      const regularUrl = 'https://example.com/image.jpg';
      const optimized = getOptimizedImageUrl(regularUrl, true);

      expect(optimized).toBe(regularUrl);
    });

    it('should handle empty URLs', () => {
      expect(getOptimizedImageUrl('')).toBe('');
    });
  });

  describe('optimizePropertyImages', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
    });

    it('should optimize all images in array', () => {
      const images = [
        'https://firebasestorage.googleapis.com/v0/b/bucket/o/image1.jpg?alt=media',
        'https://firebasestorage.googleapis.com/v0/b/bucket/o/image2.jpg?alt=media',
      ];

      const optimized = optimizePropertyImages(images);

      expect(optimized).toHaveLength(2);
      expect(optimized[0]).toContain('w=800');
      expect(optimized[1]).toContain('w=800');
    });

    it('should handle empty array', () => {
      const optimized = optimizePropertyImages([]);
      expect(optimized).toEqual([]);
    });

    it('should handle mixed URL types', () => {
      const images = [
        'https://firebasestorage.googleapis.com/v0/b/bucket/o/image1.jpg?alt=media',
        'https://example.com/image2.jpg',
      ];

      const optimized = optimizePropertyImages(images);

      expect(optimized).toHaveLength(2);
      expect(optimized[0]).toContain('w=800');
      expect(optimized[1]).toBe('https://example.com/image2.jpg');
    });
  });
});

// Property-Based Tests for Mobile Optimization
describe('Property-Based Tests', () => {
  /**
   * Feature: ikhaya-rent-properties, Property 61: Mobile image loading is optimized
   * Validates: Requirements 14.3
   */
  describe('Property 61: Mobile image loading is optimized', () => {
    // Custom generator for Firebase Storage URLs
    const firebaseUrlGenerator = fc
      .tuple(
        fc.stringMatching(/^[a-z0-9-]+$/),
        fc.stringMatching(/^[a-z0-9-]+$/),
        fc.stringMatching(/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/)
      )
      .map(([bucket, folder, filename]) => {
        return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${folder}%2F${filename}?alt=media`;
      });

    // Generator for regular URLs
    const regularUrlGenerator = fc
      .tuple(fc.webUrl(), fc.stringMatching(/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/))
      .map(([baseUrl, filename]) => `${baseUrl}/${filename}`);

    // Generator for mixed URL arrays
    const imageArrayGenerator = fc.array(fc.oneof(firebaseUrlGenerator, regularUrlGenerator), {
      minLength: 1,
      maxLength: 10,
    });

    it('property: Firebase Storage URLs should be optimized with size parameters', () => {
      fc.assert(
        fc.property(firebaseUrlGenerator, fc.boolean(), (url, isMobile) => {
          const optimized = getOptimizedImageUrl(url, isMobile);

          // Optimized URL should contain size parameter
          expect(optimized).toContain(isMobile ? 'w=800' : 'w=1200');

          // Original URL structure should be preserved
          expect(optimized).toContain('firebasestorage.googleapis.com');
          expect(optimized).toContain('alt=media');
        }),
        { numRuns: 100 }
      );
    });

    it('property: mobile devices should receive smaller images than desktop', () => {
      fc.assert(
        fc.property(firebaseUrlGenerator, (url) => {
          const mobileUrl = getOptimizedImageUrl(url, true);
          const desktopUrl = getOptimizedImageUrl(url, false);

          // Mobile should have smaller size parameter
          expect(mobileUrl).toContain('w=800');
          expect(desktopUrl).toContain('w=1200');

          // URLs should be different
          expect(mobileUrl).not.toBe(desktopUrl);
        }),
        { numRuns: 100 }
      );
    });

    it('property: non-Firebase URLs should pass through unchanged', () => {
      fc.assert(
        fc.property(regularUrlGenerator, fc.boolean(), (url, isMobile) => {
          const optimized = getOptimizedImageUrl(url, isMobile);

          // Non-Firebase URLs should not be modified
          expect(optimized).toBe(url);
          expect(optimized).not.toContain('w=');
        }),
        { numRuns: 100 }
      );
    });

    it('property: image arrays should be optimized consistently', () => {
      fc.assert(
        fc.property(imageArrayGenerator, (images) => {
          const optimized = optimizePropertyImages(images);

          // Array length should be preserved
          expect(optimized).toHaveLength(images.length);

          // Each Firebase URL should be optimized
          images.forEach((url, index) => {
            expect(
              url.includes('firebasestorage.googleapis.com')
                ? optimized[index].includes('w=')
                : optimized[index] === url
            ).toBe(true);
          });
        }),
        { numRuns: 100 }
      );
    });

    it('property: srcset should contain multiple sizes for responsive loading', () => {
      fc.assert(
        fc.property(firebaseUrlGenerator, (url) => {
          const srcset = generateSrcSet(url);

          // Should contain multiple width descriptors
          expect(srcset).toContain('400w');
          expect(srcset).toContain('800w');
          expect(srcset).toContain('1200w');

          // Should contain the base URL
          expect(srcset).toContain(url);
        }),
        { numRuns: 100 }
      );
    });

    it('property: mobile detection should be consistent with viewport width', () => {
      fc.assert(
        fc.property(fc.integer({ min: 320, max: 2560 }), (width) => {
          // Mock window.innerWidth
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: width,
          });

          const isMobile = isMobileDevice();

          // Mobile detection should match expected threshold
          expect(isMobile).toBe(width < 768);
        }),
        { numRuns: 100 }
      );
    });

    it('property: empty or invalid URLs should be handled gracefully', () => {
      fc.assert(
        fc.property(
          fc.oneof(fc.constantFrom(''), fc.constantFrom(null), fc.constantFrom(undefined)),
          fc.boolean(),
          (url, isMobile) => {
            const optimized = getOptimizedImageUrl(url as any, isMobile);

            // Should return empty string for invalid inputs
            expect(optimized).toBe('');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('property: optimization should preserve URL query parameters', () => {
      fc.assert(
        fc.property(
          firebaseUrlGenerator,
          fc.stringMatching(/^[a-z0-9]+$/),
          fc.stringMatching(/^[a-z0-9]+$/),
          (url, paramKey, paramValue) => {
            // Add a custom query parameter
            const urlWithParam = `${url}&${paramKey}=${paramValue}`;
            const optimized = getOptimizedImageUrl(urlWithParam, true);

            // Original parameters should be preserved
            expect(optimized).toContain(`${paramKey}=${paramValue}`);
            expect(optimized).toContain('alt=media');
            expect(optimized).toContain('w=800');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
