import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import PropertyForm from '../components/properties/PropertyForm';
import { propertyService, PropertyDTO } from '../services/propertyService';
import { useAuth } from '../contexts/AuthContext';

const PropertyCreate: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleSubmit = async (data: PropertyDTO, images: File[]) => {
    if (!currentUser) {
      throw new Error('You must be logged in to create a property');
    }

    // Create property
    const property = await propertyService.createProperty(currentUser.uid, data);

    // Upload images if any
    if (images.length > 0) {
      await propertyService.uploadImages(property.id, images);
    }

    // Navigate to properties list
    navigate('/properties/manage');
  };

  const handleCancel = () => {
    navigate('/properties/manage');
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Property</h1>
          <p className="mt-2 text-sm text-gray-600">
            Fill in the details below to list your property
          </p>
        </div>

        <PropertyForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </Layout>
  );
};

export default PropertyCreate;
