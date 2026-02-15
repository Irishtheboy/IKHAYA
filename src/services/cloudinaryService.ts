import axios from 'axios';

/**
 * Allowed image formats
 */
const ALLOWED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png'];

/**
 * Maximum file size in bytes (5MB)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Cloudinary Upload Service
 * Handles image uploads to Cloudinary with validation
 */
class CloudinaryService {
  private cloudName: string;
  private uploadPreset: string;
  private uploadUrl: string;

  constructor() {
    this.cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || '';
    this.uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || '';
    this.uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

    if (!this.cloudName || !this.uploadPreset) {
      console.warn('Cloudinary credentials not configured');
    }
  }

  /**
   * Upload a single image to Cloudinary
   *
   * @param file - Image file to upload
   * @param folder - Cloudinary folder path (e.g., 'properties/property123')
   * @returns Promise resolving to the Cloudinary URL
   * @throws Error if validation fails or upload fails
   */
  async uploadImage(file: File, folder: string = 'ikhaya'): Promise<string> {
    try {
      // Validate image
      this.validateImage(file);

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', this.uploadPreset);
      formData.append('folder', folder);

      // Upload to Cloudinary
      const response = await axios.post(this.uploadUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Return secure URL
      return response.data.secure_url;
    } catch (error: any) {
      console.error('Error uploading image to Cloudinary:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  /**
   * Upload multiple images to Cloudinary
   *
   * @param files - Array of image files to upload
   * @param folder - Cloudinary folder path (e.g., 'properties/property123')
   * @param maxImages - Maximum number of images allowed (default: 5)
   * @returns Promise resolving to array of Cloudinary URLs
   * @throws Error if validation fails or upload fails
   */
  async uploadImages(
    files: File[],
    folder: string = 'ikhaya',
    maxImages: number = 5
  ): Promise<string[]> {
    try {
      // Validate number of images
      if (files.length > maxImages) {
        throw new Error(`Maximum ${maxImages} images allowed`);
      }

      // Validate all images first
      files.forEach((file) => this.validateImage(file));

      // Upload all images
      const uploadPromises = files.map((file) => this.uploadImage(file, folder));
      const imageUrls = await Promise.all(uploadPromises);

      return imageUrls;
    } catch (error: any) {
      console.error('Error uploading images to Cloudinary:', error);
      throw new Error(`Failed to upload images: ${error.message}`);
    }
  }

  /**
   * Delete an image from Cloudinary
   * Note: This requires server-side implementation with API secret
   *
   * @param imageUrl - Cloudinary URL of the image to delete
   * @returns Promise that resolves when deletion is complete
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extract public_id from URL
      const publicId = this.extractPublicId(imageUrl);
      if (!publicId) {
        throw new Error('Invalid Cloudinary URL');
      }

      // Note: Deletion requires API secret and should be done server-side
      // For now, we'll just log a warning
      console.warn(
        'Image deletion should be handled server-side with Cloud Functions'
      );
      console.log('Public ID to delete:', publicId);

      // TODO: Implement server-side deletion via Cloud Function
    } catch (error: any) {
      console.error('Error deleting image from Cloudinary:', error);
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }

  /**
   * Delete multiple images from Cloudinary
   *
   * @param imageUrls - Array of Cloudinary URLs to delete
   * @returns Promise that resolves when all deletions are complete
   */
  async deleteImages(imageUrls: string[]): Promise<void> {
    try {
      const deletePromises = imageUrls.map((url) => this.deleteImage(url));
      await Promise.all(deletePromises);
    } catch (error: any) {
      console.error('Error deleting images from Cloudinary:', error);
      throw new Error(`Failed to delete images: ${error.message}`);
    }
  }

  /**
   * Validate image file
   *
   * @param file - File to validate
   * @throws Error if validation fails
   */
  private validateImage(file: File): void {
    // Check if file exists
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file format
    if (!ALLOWED_FORMATS.includes(file.type)) {
      throw new Error('Invalid file format. Only JPEG and PNG images are allowed');
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      );
    }
  }

  /**
   * Extract public_id from Cloudinary URL
   *
   * @param url - Cloudinary URL
   * @returns Public ID or null if invalid
   */
  private extractPublicId(url: string): string | null {
    try {
      // Cloudinary URLs format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
      if (match && match[1]) {
        return match[1];
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get optimized image URL with transformations
   *
   * @param url - Original Cloudinary URL
   * @param width - Desired width
   * @param height - Desired height
   * @param quality - Image quality (1-100)
   * @returns Optimized image URL
   */
  getOptimizedUrl(
    url: string,
    width?: number,
    height?: number,
    quality: number = 80
  ): string {
    try {
      // Extract parts from URL
      const parts = url.split('/upload/');
      if (parts.length !== 2) {
        return url;
      }

      // Build transformation string
      const transformations: string[] = [];
      if (width) transformations.push(`w_${width}`);
      if (height) transformations.push(`h_${height}`);
      transformations.push(`q_${quality}`);
      transformations.push('f_auto'); // Auto format

      const transformString = transformations.join(',');

      // Reconstruct URL with transformations
      return `${parts[0]}/upload/${transformString}/${parts[1]}`;
    } catch (error) {
      console.error('Error creating optimized URL:', error);
      return url;
    }
  }

  /**
   * Get file size in MB
   *
   * @param bytes - File size in bytes
   * @returns File size in MB
   */
  getFileSizeInMB(bytes: number): number {
    return bytes / (1024 * 1024);
  }

  /**
   * Check if file format is valid
   *
   * @param file - File to check
   * @returns True if format is valid
   */
  isValidFormat(file: File): boolean {
    return ALLOWED_FORMATS.includes(file.type);
  }

  /**
   * Check if file size is valid
   *
   * @param file - File to check
   * @returns True if size is valid
   */
  isValidSize(file: File): boolean {
    return file.size <= MAX_FILE_SIZE;
  }
}

// Export singleton instance
export const cloudinaryService = new CloudinaryService();
export default cloudinaryService;
