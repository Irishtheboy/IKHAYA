import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { propertyService } from '../services/propertyService';
import { Property } from '../types/firebase';
import {
  updateMetaTags,
  generatePropertySchema,
  addStructuredData,
  cleanupSEO,
} from '../utils/seo';
import { useAuth } from '../contexts/AuthContext';

const PropertyDetail: React.FC = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  useEffect(() => {
    loadProperty();

    // Cleanup SEO elements when component unmounts
    return () => {
      cleanupSEO();
    };
  }, [propertyId]);

  useEffect(() => {
    // Update SEO meta tags and structured data when property loads
    if (property && propertyId) {
      updateMetaTags(property, propertyId);
      const schema = generatePropertySchema(property, propertyId);
      addStructuredData(schema);
    }
  }, [property, propertyId]);

  const loadProperty = async () => {
    if (!propertyId) {
      setError('Property ID is required');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await propertyService.getProperty(propertyId);

      if (!data) {
        setError('Property not found');
      } else {
        setProperty(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load property');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpressInterest = () => {
    if (!currentUser) {
      setShowAuthPrompt(true);
    } else {
      // Navigate to lead creation form
      navigate(`/leads/create?propertyId=${propertyId}`);
    }
  };

  const handleContactLandlord = () => {
    if (!currentUser) {
      setShowAuthPrompt(true);
    } else {
      // Navigate to lead creation form
      navigate(`/leads/create?propertyId=${propertyId}`);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: any): string => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  if (error || !property) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h2>
            <p className="text-gray-600 mb-4">
              {error || 'The property you are looking for does not exist.'}
            </p>
            <button
              onClick={() => navigate('/search')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Back to Search
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Image Gallery */}
          <div className="relative">
            {property.images && property.images.length > 0 ? (
              <>
                <div className="h-96 bg-gray-200">
                  <img
                    src={property.images[selectedImageIndex]}
                    alt={property.address}
                    className="w-full h-full object-cover"
                  />
                </div>
                {property.images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {property.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`w-3 h-3 rounded-full ${
                          index === selectedImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
                {property.images.length > 1 && (
                  <div className="absolute top-1/2 left-4 right-4 flex justify-between transform -translate-y-1/2">
                    <button
                      onClick={() =>
                        setSelectedImageIndex((prev) =>
                          prev === 0 ? property.images!.length - 1 : prev - 1
                        )
                      }
                      className="bg-white/80 hover:bg-white p-2 rounded-full"
                    >
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() =>
                        setSelectedImageIndex((prev) =>
                          prev === property.images!.length - 1 ? 0 : prev + 1
                        )
                      }
                      className="bg-white/80 hover:bg-white p-2 rounded-full"
                    >
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="h-96 bg-gray-200 flex items-center justify-center">
                <svg
                  className="h-24 w-24 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </div>
            )}
            {property.isPremium && (
              <span className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded text-sm font-semibold">
                Premium Listing
              </span>
            )}
          </div>

          {/* Property Details */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1)}{' '}
                  for Rent
                </h1>
                <p className="text-xl text-gray-600 mb-4">{property.address}</p>
                <p className="text-lg text-gray-500 mb-6">
                  {property.city}, {property.province}
                  {property.postalCode && `, ${property.postalCode}`}
                </p>

                {/* Key Features */}
                <div className="flex items-center gap-6 mb-8 pb-8 border-b">
                  <div className="flex items-center">
                    <svg
                      className="h-6 w-6 text-gray-400 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                    <span className="text-lg font-medium">{property.bedrooms} Bedrooms</span>
                  </div>
                  <div className="flex items-center">
                    <svg
                      className="h-6 w-6 text-gray-400 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-lg font-medium">{property.bathrooms} Bathrooms</span>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
                  <p className="text-gray-700 whitespace-pre-line">{property.description}</p>
                </div>

                {/* Amenities */}
                {property.amenities && property.amenities.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Amenities</h2>
                    <div className="grid grid-cols-2 gap-3">
                      {property.amenities.map((amenity) => (
                        <div key={amenity} className="flex items-center">
                          <svg
                            className="h-5 w-5 text-green-500 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="text-gray-700">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Info */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Additional Information</h2>
                  <dl className="grid grid-cols-1 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Available From</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {formatDate(property.availableFrom)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Deposit</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {formatCurrency(property.deposit)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-lg p-6 sticky top-4">
                  <div className="mb-6">
                    <p className="text-3xl font-bold text-blue-600 mb-2">
                      {formatCurrency(property.rentAmount)}
                    </p>
                    <p className="text-gray-600">per month</p>
                  </div>

                  <button
                    onClick={handleExpressInterest}
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium mb-3"
                  >
                    Express Interest
                  </button>

                  <button
                    onClick={handleContactLandlord}
                    className="w-full border border-blue-600 text-blue-600 px-6 py-3 rounded-md hover:bg-blue-50 font-medium"
                  >
                    Contact Landlord
                  </button>

                  {!currentUser && (
                    <div className="mt-6 pt-6 border-t">
                      <p className="text-sm text-gray-500 text-center">
                        Sign in or create an account to contact the landlord
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Authentication Prompt Modal */}
        {showAuthPrompt && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Sign In Required</h3>
                  <button
                    onClick={() => setShowAuthPrompt(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <p className="text-gray-600 mb-6">
                  To express interest in this property or contact the landlord, you need to sign in
                  or create an account.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() =>
                      navigate('/login', { state: { from: window.location.pathname } })
                    }
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium"
                  >
                    Sign In
                  </button>

                  <button
                    onClick={() =>
                      navigate('/register', { state: { from: window.location.pathname } })
                    }
                    className="w-full border border-blue-600 text-blue-600 px-6 py-3 rounded-md hover:bg-blue-50 font-medium"
                  >
                    Create Account
                  </button>

                  <button
                    onClick={() => setShowAuthPrompt(false)}
                    className="w-full text-gray-600 px-6 py-3 rounded-md hover:bg-gray-100 font-medium"
                  >
                    Continue Browsing
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PropertyDetail;
