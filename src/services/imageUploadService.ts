import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  StorageReference,
} from 'firebase/storage';
import { storage } from '../config/firebase';

/**
 * Allowed image formats
 */
const ALLOWED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png'];

/**
 * Maximum file size in bytes (5MB)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Image Upload Service
 * Handles image uploads to Firebase Storage with validation
 */
class ImageUploadService {
  /**
   * Upload a single image to Firebase Storage
   *
   * @param file - Image file to upload
   * @param path - Storage path (e.g., 'properties/property123')
   * @returns Promise resolving to the download URL
   * @throws Error if validation fails or upload fails
   */
  async uploadImage(file: File, path: string): Promise<string> {
    try {
      // Validate image
      this.validateImage(file);

      // Generate unique filename
      const filename = this.generateUniqueFilename(file.name);
      const fullPath = `${path}/${filename}`;

      // Create storage reference
      const storageRef: StorageReference = ref(storage, fullPath);

      // Upload file
      await uploadBytes(storageRef, file);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);

      return downloadURL;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  /**
   * Upload multiple images to Firebase Storage
   *
   * @param files - Array of image files to upload
   * @param path - Storage path (e.g., 'properties/property123')
   * @param maxImages - Maximum number of images allowed (default: 5)
   * @returns Promise resolving to array of download URLs
   * @throws Error if validation fails or upload fails
   */
  async uploadImages(
    files: File[],
    path: string,
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
      const uploadPromises = files.map((file) => this.uploadImage(file, path));
      const downloadURLs = await Promise.all(uploadPromises);

      return downloadURLs;
    } catch (error: any) {
      console.error('Error uploading images:', error);
      throw new Error(`Failed to upload images: ${error.message}`);
    }
  }

  /**
   * Delete an image from Firebase Storage
   *
   * @param imageUrl - Full download URL of the image to delete
   * @returns Promise that resolves when deletion is complete
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extract path from URL
      const path = this.extractPathFromUrl(imageUrl);
      if (!path) {
        throw new Error('Invalid image URL');
      }

      // Create storage reference
      const storageRef: StorageReference = ref(storage, path);

      // Delete file
      await deleteObject(storageRef);
    } catch (error: any) {
      console.error('Error deleting image:', error);
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }

  /**
   * Delete multiple images from Firebase Storage
   *
   * @param imageUrls - Array of download URLs to delete
   * @returns Promise that resolves when all deletions are complete
   */
  async deleteImages(imageUrls: string[]): Promise<void> {
    try {
      const deletePromises = imageUrls.map((url) => this.deleteImage(url));
      await Promise.all(deletePromises);
    } catch (error: any) {
      console.error('Error deleting images:', error);
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
      throw new Error(
        'Invalid file format. Only JPEG and PNG images are allowed'
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      );
    }
  }

  /**
   * Generate unique filename with timestamp
   *
   * @param originalFilename - Original filename
   * @returns Unique filename
   */
  private generateUniqueFilename(originalFilename: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalFilename.split('.').pop();
    return `${timestamp}_${randomString}.${extension}`;
  }

  /**
   * Extract storage path from download URL
   *
   * @param url - Download URL
   * @returns Storage path or null if invalid
   */
  private extractPathFromUrl(url: string): string | null {
    try {
      // Firebase Storage URLs contain the path after '/o/' and before '?'
      const match = url.match(/\/o\/(.+?)\?/);
      if (match && match[1]) {
        // Decode the path (Firebase encodes it)
        return decodeURIComponent(match[1]);
      }
      return null;
    } catch (error) {
      return null;
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
export const imageUploadService = new ImageUploadService();
export default imageUploadService;
