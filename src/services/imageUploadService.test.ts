import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { imageUploadService } from './imageUploadService';

// Mock Firebase Storage
jest.mock('firebase/storage');
jest.mock('../config/firebase', () => ({
  storage: {},
}));

describe('ImageUploadService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadImage', () => {
    it('should upload valid image and return download URL', async () => {
      const mockFile = new File(['image content'], 'test.jpg', {
        type: 'image/jpeg',
      });
      Object.defineProperty(mockFile, 'size', { value: 1024 * 1024 }); // 1MB

      const mockDownloadURL = 'https://storage.googleapis.com/test/image.jpg';

      (ref as jest.Mock).mockReturnValue({});
      (uploadBytes as jest.Mock).mockResolvedValue({});
      (getDownloadURL as jest.Mock).mockResolvedValue(mockDownloadURL);

      const result = await imageUploadService.uploadImage(mockFile, 'properties/test');

      expect(result).toBe(mockDownloadURL);
      expect(ref).toHaveBeenCalled();
      expect(uploadBytes).toHaveBeenCalled();
      expect(getDownloadURL).toHaveBeenCalled();
    });

    it('should throw error for invalid file format', async () => {
      const mockFile = new File(['content'], 'test.pdf', {
        type: 'application/pdf',
      });

      await expect(imageUploadService.uploadImage(mockFile, 'properties/test')).rejects.toThrow(
        'Invalid file format'
      );
    });

    it('should throw error for file size exceeding limit', async () => {
      const mockFile = new File(['content'], 'test.jpg', {
        type: 'image/jpeg',
      });
      Object.defineProperty(mockFile, 'size', { value: 6 * 1024 * 1024 }); // 6MB

      await expect(imageUploadService.uploadImage(mockFile, 'properties/test')).rejects.toThrow(
        'File size exceeds maximum limit'
      );
    });

    it('should accept PNG format', async () => {
      const mockFile = new File(['image content'], 'test.png', {
        type: 'image/png',
      });
      Object.defineProperty(mockFile, 'size', { value: 1024 * 1024 }); // 1MB

      const mockDownloadURL = 'https://storage.googleapis.com/test/image.png';

      (ref as jest.Mock).mockReturnValue({});
      (uploadBytes as jest.Mock).mockResolvedValue({});
      (getDownloadURL as jest.Mock).mockResolvedValue(mockDownloadURL);

      const result = await imageUploadService.uploadImage(mockFile, 'properties/test');

      expect(result).toBe(mockDownloadURL);
    });

    it('should accept file at exactly 5MB limit', async () => {
      const mockFile = new File(['image content'], 'test.jpg', {
        type: 'image/jpeg',
      });
      Object.defineProperty(mockFile, 'size', { value: 5 * 1024 * 1024 }); // Exactly 5MB

      const mockDownloadURL = 'https://storage.googleapis.com/test/image.jpg';

      (ref as jest.Mock).mockReturnValue({});
      (uploadBytes as jest.Mock).mockResolvedValue({});
      (getDownloadURL as jest.Mock).mockResolvedValue(mockDownloadURL);

      const result = await imageUploadService.uploadImage(mockFile, 'properties/test');

      expect(result).toBe(mockDownloadURL);
    });
  });

  describe('uploadImages', () => {
    it('should upload multiple valid images', async () => {
      const mockFiles = [
        new File(['content1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['content2'], 'test2.jpg', { type: 'image/jpeg' }),
      ];

      mockFiles.forEach((file) => {
        Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB
      });

      const mockURLs = [
        'https://storage.googleapis.com/test/image1.jpg',
        'https://storage.googleapis.com/test/image2.jpg',
      ];

      (ref as jest.Mock).mockReturnValue({});
      (uploadBytes as jest.Mock).mockResolvedValue({});
      (getDownloadURL as jest.Mock)
        .mockResolvedValueOnce(mockURLs[0])
        .mockResolvedValueOnce(mockURLs[1]);

      const result = await imageUploadService.uploadImages(mockFiles, 'properties/test');

      expect(result).toEqual(mockURLs);
      expect(uploadBytes).toHaveBeenCalledTimes(2);
    });

    it('should throw error if exceeding max images limit', async () => {
      const mockFiles = Array(6)
        .fill(null)
        .map((_, i) => new File(['content'], `test${i}.jpg`, { type: 'image/jpeg' }));

      mockFiles.forEach((file) => {
        Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB
      });

      await expect(
        imageUploadService.uploadImages(mockFiles, 'properties/test', 5)
      ).rejects.toThrow('Maximum 5 images allowed');
    });

    it('should validate all images before uploading', async () => {
      const mockFiles = [
        new File(['content1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['content2'], 'test2.pdf', { type: 'application/pdf' }), // Invalid
      ];

      mockFiles.forEach((file) => {
        Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB
      });

      await expect(imageUploadService.uploadImages(mockFiles, 'properties/test')).rejects.toThrow(
        'Invalid file format'
      );

      // Should not have called upload functions
      expect(uploadBytes).not.toHaveBeenCalled();
    });
  });

  describe('deleteImage', () => {
    it('should delete image from storage', async () => {
      const mockUrl =
        'https://firebasestorage.googleapis.com/v0/b/bucket/o/properties%2Ftest%2Fimage.jpg?alt=media';

      (ref as jest.Mock).mockReturnValue({});
      (deleteObject as jest.Mock).mockResolvedValue(undefined);

      await imageUploadService.deleteImage(mockUrl);

      expect(ref).toHaveBeenCalled();
      expect(deleteObject).toHaveBeenCalled();
    });
  });

  describe('deleteImages', () => {
    it('should delete multiple images', async () => {
      const mockUrls = [
        'https://firebasestorage.googleapis.com/v0/b/bucket/o/properties%2Ftest%2Fimage1.jpg?alt=media',
        'https://firebasestorage.googleapis.com/v0/b/bucket/o/properties%2Ftest%2Fimage2.jpg?alt=media',
      ];

      (ref as jest.Mock).mockReturnValue({});
      (deleteObject as jest.Mock).mockResolvedValue(undefined);

      await imageUploadService.deleteImages(mockUrls);

      expect(deleteObject).toHaveBeenCalledTimes(2);
    });
  });

  describe('validation helpers', () => {
    it('should correctly identify valid format', () => {
      const validFile = new File(['content'], 'test.jpg', {
        type: 'image/jpeg',
      });
      expect(imageUploadService.isValidFormat(validFile)).toBe(true);
    });

    it('should correctly identify invalid format', () => {
      const invalidFile = new File(['content'], 'test.pdf', {
        type: 'application/pdf',
      });
      expect(imageUploadService.isValidFormat(invalidFile)).toBe(false);
    });

    it('should correctly identify valid size', () => {
      const validFile = new File(['content'], 'test.jpg', {
        type: 'image/jpeg',
      });
      Object.defineProperty(validFile, 'size', { value: 1024 * 1024 }); // 1MB
      expect(imageUploadService.isValidSize(validFile)).toBe(true);
    });

    it('should correctly identify invalid size', () => {
      const invalidFile = new File(['content'], 'test.jpg', {
        type: 'image/jpeg',
      });
      Object.defineProperty(invalidFile, 'size', { value: 6 * 1024 * 1024 }); // 6MB
      expect(imageUploadService.isValidSize(invalidFile)).toBe(false);
    });

    it('should calculate file size in MB correctly', () => {
      const sizeInBytes = 2 * 1024 * 1024; // 2MB
      const sizeInMB = imageUploadService.getFileSizeInMB(sizeInBytes);
      expect(sizeInMB).toBe(2);
    });
  });
});
