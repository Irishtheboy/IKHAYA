import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import PropertyForm from '../components/properties/PropertyForm';
import { propertyService, PropertyDTO } from '../services/propertyService';
import { useAuth } from '../contexts/AuthContext';
import { Property } from '../types/firebase';

const PropertyEdit: React.FC = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProperty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  const loadProperty = async () => {
    if (!propertyId) {
      setError('Property ID is required');
      setIsLoading(false);
      return;
    }

    if (!currentUser) {
      setError('You must be logged in to edit properties');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await propertyService.getProperty(propertyId);

      if (!data) {
        setError('Property not found');
      } else if (data.landlordId !== currentUser.uid) {
        setError('You do not have permission to edit this property');
      } else {
        setProperty(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load property');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: PropertyDTO, images: File[]) => {
    if (!propertyId || !currentUser) {
      throw new Error('Missing required information');
    }

    try {
      // Update property data
      await propertyService.updateProperty(propertyId, data);

      // Upload new images if provided
      if (images.length > 0) {
        await propertyService.uploadImages(propertyId, images);
      }

      // Navigate back to manage properties
      navigate('/properties/manage');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update property');
    }
  };

  const handleCancel = () => {
    navigate('/properties/manage');
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        </div>
      </Layout>
    );
  }

  if (error || !property) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg">
            {error || 'Property not found'}
          </div>
          <button
            onClick={() => navigate('/properties/manage')}
            className="mt-4 px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600"
          >
            Back to Properties
          </button>
        </div>
      </Layout>
    );
  }

  // Convert Property to PropertyDTO for the form
  const initialData: Partial<PropertyDTO> & { status?: any; id?: string } = {
    id: property.id,
    address: property.address,
    city: property.city,
    province: property.province,
    postalCode: property.postalCode,
    propertyType: property.propertyType,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    rentAmount: property.rentAmount,
    deposit: property.deposit,
    description: property.description,
    amenities: property.amenities,
    availableFrom: property.availableFrom.toDate(),
    status: property.status,
    ratesAndTaxes: property.ratesAndTaxes,
    garages: property.garages,
    parking: property.parking,
    hasGarden: property.hasGarden,
    nearbySchools: property.nearbySchools,
    nearbyRestaurants: property.nearbyRestaurants,
    nearbyTransport: property.nearbyTransport,
    latitude: property.latitude,
    longitude: property.longitude,
  };

  return (
    <Layout>
      {/* Hero Header */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-light text-white tracking-tight">Edit Property</h1>
          <p className="mt-3 text-slate-400 font-light text-lg">
            Update your property listing details
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PropertyForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isEdit={true}
        />
      </div>
    </Layout>
  );
};

export default PropertyEdit;
