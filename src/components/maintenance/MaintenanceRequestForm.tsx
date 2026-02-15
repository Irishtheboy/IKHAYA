import React, { useState, useEffect } from 'react';
import { maintenanceService, MaintenanceRequestDTO } from '../../services/maintenanceService';
import { leaseService } from '../../services/leaseService';
import { propertyService } from '../../services/propertyService';
import { MaintenanceCategory, MaintenancePriority, Lease, Property } from '../../types/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * Maintenance Request Form Component
 * Allows tenants to submit maintenance requests for their leased properties
 *
 * Requirements: 6.1, 6.2 - Maintenance Request Management
 */
export const MaintenanceRequestForm: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeLeases, setActiveLeases] = useState<Lease[]>([]);
  const [properties, setProperties] = useState<Map<string, Property>>(new Map());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    propertyId: '',
    category: 'general' as MaintenanceCategory,
    priority: 'medium' as MaintenancePriority,
    description: '',
  });

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    const fetchActiveLeasesAndProperties = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch active leases for tenant
        const leasesData = await leaseService.getActiveLeasesForTenant(currentUser.uid);
        setActiveLeases(leasesData);

        // Fetch property details for each lease
        const propertiesMap = new Map<string, Property>();
        await Promise.all(
          leasesData.map(async (lease) => {
            const property = await propertyService.getProperty(lease.propertyId);
            if (property) {
              propertiesMap.set(lease.propertyId, property);
            }
          })
        );

        setProperties(propertiesMap);

        // Auto-select property if only one active lease
        if (leasesData.length === 1) {
          setFormData((prev) => ({ ...prev, propertyId: leasesData[0].propertyId }));
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load properties');
      } finally {
        setLoading(false);
      }
    };

    fetchActiveLeasesAndProperties();
  }, [currentUser]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Limit to 3 images
    if (images.length + files.length > 3) {
      setError('Maximum 3 images allowed per request');
      return;
    }

    // Validate file types and sizes
    const validFiles: File[] = [];
    for (const file of files) {
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setError('Only JPEG and PNG images are allowed');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Each image must be less than 5MB');
        return;
      }
      validFiles.push(file);
    }

    // Create previews
    const newPreviews: string[] = [];
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === validFiles.length) {
          setImagePreviews((prev) => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setImages((prev) => [...prev, ...validFiles]);
    setError(null);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate form
      if (!formData.propertyId) {
        throw new Error('Please select a property');
      }
      if (!formData.description.trim()) {
        throw new Error('Please provide a description');
      }

      // Find the lease to get landlord ID
      const lease = activeLeases.find((l) => l.propertyId === formData.propertyId);
      if (!lease) {
        throw new Error('Lease not found for selected property');
      }

      // Create maintenance request
      const requestData: MaintenanceRequestDTO = {
        propertyId: formData.propertyId,
        tenantId: currentUser!.uid,
        landlordId: lease.landlordId,
        category: formData.category,
        priority: formData.priority,
        description: formData.description.trim(),
      };

      const maintenanceRequest = await maintenanceService.createMaintenanceRequest(requestData);

      // Upload images if any
      if (images.length > 0) {
        await maintenanceService.uploadMaintenanceImages(maintenanceRequest.id, images);
      }

      setSuccess(true);
      
      // Reset form
      setFormData({
        propertyId: activeLeases.length === 1 ? activeLeases[0].propertyId : '',
        category: 'general',
        priority: 'medium',
        description: '',
      });
      setImages([]);
      setImagePreviews([]);

      // Redirect after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit maintenance request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (activeLeases.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">
              No Active Leases
            </h2>
            <p className="text-yellow-700">
              You need an active lease to submit a maintenance request.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Submit Maintenance Request</h1>
          <p className="text-gray-600">Report an issue with your property</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            Maintenance request submitted successfully! Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          {/* Property Selection */}
          <div className="mb-4">
            <label htmlFor="propertyId" className="block text-sm font-medium text-gray-700 mb-2">
              Property *
            </label>
            <select
              id="propertyId"
              name="propertyId"
              value={formData.propertyId}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a property</option>
              {activeLeases.map((lease) => {
                const property = properties.get(lease.propertyId);
                return (
                  <option key={lease.id} value={lease.propertyId}>
                    {property?.address || 'Property'}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Category */}
          <div className="mb-4">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="plumbing">Plumbing</option>
              <option value="electrical">Electrical</option>
              <option value="general">General</option>
              <option value="appliance">Appliance</option>
              <option value="structural">Structural</option>
            </select>
          </div>

          {/* Priority */}
          <div className="mb-4">
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
              Priority *
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={5}
              maxLength={2000}
              placeholder="Please describe the issue in detail..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.description.length}/2000 characters
            </p>
          </div>

          {/* Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Images (Optional, max 3)
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png"
              multiple
              onChange={handleImageChange}
              disabled={images.length >= 3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              JPEG or PNG, max 5MB each. {images.length}/3 images selected.
            </p>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaintenanceRequestForm;
