/**
 * Image optimization utilities for mobile devices
 * Provides lazy loading and responsive image sizing
 */

/**
 * Generate srcset for responsive images
 * Firebase Storage URLs can be modified with query parameters for resizing
 */
export const generateSrcSet = (imageUrl: string): string => {
  if (!imageUrl) return '';

  // For Firebase Storage URLs, we can add size parameters
  // For other URLs, return as-is
  if (imageUrl.includes('firebasestorage.googleapis.com')) {
    return `
      ${imageUrl}&w=400 400w,
      ${imageUrl}&w=800 800w,
      ${imageUrl}&w=1200 1200w
    `.trim();
  }

  return imageUrl;
};

/**
 * Generate sizes attribute for responsive images
 */
export const generateSizes = (): string => {
  return '(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px';
};

/**
 * Check if device is mobile based on screen width
 */
export const isMobileDevice = (): boolean => {
  return window.innerWidth < 768;
};

/**
 * Get optimized image URL based on device type
 */
export const getOptimizedImageUrl = (
  imageUrl: string,
  isMobile: boolean = isMobileDevice()
): string => {
  if (!imageUrl) return '';

  // For Firebase Storage URLs, add size parameter
  if (imageUrl.includes('firebasestorage.googleapis.com')) {
    const size = isMobile ? 'w=800' : 'w=1200';
    const separator = imageUrl.includes('?') ? '&' : '?';
    return `${imageUrl}${separator}${size}`;
  }

  return imageUrl;
};

/**
 * Preload critical images for better performance
 */
export const preloadImage = (imageUrl: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = imageUrl;
  });
};

/**
 * Lazy load images using Intersection Observer
 */
export const setupLazyLoading = (): void => {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;

          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        }
      });
    });

    // Observe all images with data-src attribute
    document.querySelectorAll('img[data-src]').forEach((img) => {
      imageObserver.observe(img);
    });
  }
};

/**
 * Optimize image loading for property galleries
 */
export const optimizePropertyImages = (images: string[]): string[] => {
  const isMobile = isMobileDevice();
  return images.map((url) => getOptimizedImageUrl(url, isMobile));
};
