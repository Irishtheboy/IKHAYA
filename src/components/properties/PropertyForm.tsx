import React, { useState } from 'react';
import { PropertyDTO } from '../../services/propertyService';
import { PropertyStatus, PropertyType } from '../../types/firebase';

interface PropertyFormProps {
  initialData?: Partial<PropertyDTO> & { status?: PropertyStatus; id?: string };
  onSubmit: (data: PropertyDTO, images: File[]) => Promise<void>;
  onCancel?: () => void;
  isEdit?: boolean;
}

interface FormErrors {
  [key: string]: string | undefined;
}

const PropertyForm: React.FC<PropertyFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false,
}) => {
  const [formData, setFormData] = useState<PropertyDTO>({
    address: initialData?.address || '',
    city: initialData?.city || '',
    province: initialData?.province || '',
    postalCode: initialData?.postalCode || '',
    propertyType: initialData?.propertyType || 'apartment',
    bedrooms: initialData?.bedrooms || 1,
    bathrooms: initialData?.bathrooms || 1,
    rentAmount: initialData?.rentAmount || 0,
    deposit: initialData?.deposit || 0,
    description: initialData?.description || '',
    amenities: initialData?.amenities || [],
    availableFrom: initialData?.availableFrom || new Date(),
  });

  const [images, setImages] = useState<File[]>([]);
  const [amenityInput, setAmenityInput] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const propertyTypes: PropertyType[] = ['apartment', 'house', 'townhouse', 'room'];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.province.trim()) newErrors.province = 'Province is required';
    if (formData.bedrooms < 0) newErrors.bedrooms = 'Bedrooms must be non-negative';
    if (formData.bathrooms < 0) newErrors.bathrooms = 'Bathrooms must be non-negative';
    if (formData.rentAmount <= 0) newErrors.rentAmount = 'Rent amount must be greater than zero';
    if (formData.deposit < 0) newErrors.deposit = 'Deposit must be non-negative';
    if (formData.deposit > 5000) newErrors.deposit = 'Deposit cannot exceed R5,000';
    if (!formData.description.trim()) newErrors.description = 'Description is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'bedrooms' || name === 'bathrooms' || name === 'rentAmount' || name === 'deposit'
          ? Number(value)
          : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      setImages(fileArray);
    }
  };

  const handleAddAmenity = () => {
    if (amenityInput.trim() && !formData.amenities.includes(amenityInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        amenities: [...prev.amenities, amenityInput.trim()],
      }));
      setAmenityInput('');
    }
  };

  const handleRemoveAmenity = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.filter((a) => a !== amenity),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await onSubmit(formData, images);
    } catch (error: any) {
      setErrors({
        general: error.message || 'Failed to save property. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {errors.general}
        </div>
      )}

      {/* Property Details Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Property Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Address */}
          <div className="md:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Address *
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className={`mt-1 block w-full px-3 py-2 border ${
                errors.address ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              disabled={isLoading}
            />
            {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
          </div>

          {/* City */}
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
              City *
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className={`mt-1 block w-full px-3 py-2 border ${
                errors.city ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              disabled={isLoading}
            />
            {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
          </div>

          {/* Province */}
          <div>
            <label htmlFor="province" className="block text-sm font-medium text-gray-700">
              Province *
            </label>
            <input
              type="text"
              id="province"
              name="province"
              value={formData.province}
              onChange={handleChange}
              className={`mt-1 block w-full px-3 py-2 border ${
                errors.province ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              disabled={isLoading}
            />
            {errors.province && <p className="mt-1 text-sm text-red-600">{errors.province}</p>}
          </div>

          {/* Postal Code */}
          <div>
            <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
              Postal Code
            </label>
            <input
              type="text"
              id="postalCode"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>

          {/* Property Type */}
          <div>
            <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700">
              Property Type *
            </label>
            <select
              id="propertyType"
              name="propertyType"
              value={formData.propertyType}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              {propertyTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Bedrooms */}
          <div>
            <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700">
              Bedrooms *
            </label>
            <input
              type="number"
              id="bedrooms"
              name="bedrooms"
              min="0"
              value={formData.bedrooms}
              onChange={handleChange}
              className={`mt-1 block w-full px-3 py-2 border ${
                errors.bedrooms ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              disabled={isLoading}
            />
            {errors.bedrooms && <p className="mt-1 text-sm text-red-600">{errors.bedrooms}</p>}
          </div>

          {/* Bathrooms */}
          <div>
            <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700">
              Bathrooms *
            </label>
            <input
              type="number"
              id="bathrooms"
              name="bathrooms"
              min="0"
              step="0.5"
              value={formData.bathrooms}
              onChange={handleChange}
              className={`mt-1 block w-full px-3 py-2 border ${
                errors.bathrooms ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              disabled={isLoading}
            />
            {errors.bathrooms && <p className="mt-1 text-sm text-red-600">{errors.bathrooms}</p>}
          </div>

          {/* Rent Amount */}
          <div>
            <label htmlFor="rentAmount" className="block text-sm font-medium text-gray-700">
              Monthly Rent (R) *
            </label>
            <input
              type="number"
              id="rentAmount"
              name="rentAmount"
              min="0"
              value={formData.rentAmount}
              onChange={handleChange}
              className={`mt-1 block w-full px-3 py-2 border ${
                errors.rentAmount ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              disabled={isLoading}
            />
            {errors.rentAmount && <p className="mt-1 text-sm text-red-600">{errors.rentAmount}</p>}
          </div>

          {/* Deposit */}
          <div>
            <label htmlFor="deposit" className="block text-sm font-medium text-gray-700">
              Deposit (R) * <span className="text-xs text-gray-500">(Maximum R5,000)</span>
            </label>
            <input
              type="number"
              id="deposit"
              name="deposit"
              min="0"
              max="5000"
              value={formData.deposit}
              onChange={handleChange}
              className={`mt-1 block w-full px-3 py-2 border ${
                errors.deposit ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              disabled={isLoading}
            />
            {errors.deposit && <p className="mt-1 text-sm text-red-600">{errors.deposit}</p>}
          </div>

          {/* Available From */}
          <div>
            <label htmlFor="availableFrom" className="block text-sm font-medium text-gray-700">
              Available From *
            </label>
            <input
              type="date"
              id="availableFrom"
              name="availableFrom"
              value={
                formData.availableFrom instanceof Date
                  ? formData.availableFrom.toISOString().split('T')[0]
                  : new Date(formData.availableFrom).toISOString().split('T')[0]
              }
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, availableFrom: new Date(e.target.value) }))
              }
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className={`mt-1 block w-full px-3 py-2 border ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              disabled={isLoading}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Amenities Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Amenities</h3>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={amenityInput}
            onChange={(e) => setAmenityInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAmenity())}
            placeholder="Add amenity (e.g., Parking, WiFi)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={handleAddAmenity}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            disabled={isLoading}
          >
            Add
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {formData.amenities.map((amenity) => (
            <span
              key={amenity}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
            >
              {amenity}
              <button
                type="button"
                onClick={() => handleRemoveAmenity(amenity)}
                className="ml-2 text-blue-600 hover:text-blue-800"
                disabled={isLoading}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Images Section */}
      {!isEdit && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Property Images</h3>

          <div>
            <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-2">
              Upload Images (JPEG/PNG, max 5MB each)
            </label>
            <input
              type="file"
              id="images"
              accept="image/jpeg,image/jpg,image/png"
              multiple
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              disabled={isLoading}
            />
            {images.length > 0 && (
              <p className="mt-2 text-sm text-gray-600">{images.length} file(s) selected</p>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={isLoading}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className={`px-6 py-2 border border-transparent rounded-md shadow-sm text-white ${
            isLoading
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          }`}
        >
          {isLoading ? 'Saving...' : isEdit ? 'Update Property' : 'Create Property'}
        </button>
      </div>
    </form>
  );
};

export default PropertyForm;
