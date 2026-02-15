import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { leadService } from '../services/leadService';
import { propertyService } from '../services/propertyService';
import { Property } from '../types/firebase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Lead Creation Page
 * Allows tenants to express interest in a property
 *
 * Requirements: 4.1, 4.2 - Lead Generation and Communication
 */
const LeadCreate: React.FC = () => {
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get('propertyId');
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [property, setProperty] = useState<Property | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [propertyLoading, setPropertyLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { state: { from: window.location.pathname + window.location.search } });
      return;
    }

    if (!propertyId) {
      setError('Property ID is required');
      setPropertyLoading(false);
      return;
    }

    loadProperty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId, currentUser]);

  const loadProperty = async () => {
    if (!propertyId) return;

    try {
      setPropertyLoading(true);
      const data = await propertyService.getProperty(propertyId);

      if (!data) {
        setError('Property not found');
      } else {
        setProperty(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load property');
    } finally {
      setPropertyLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser || !propertyId || !property) return;

    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const lead = await leadService.createLead({
        tenantId: currentUser.uid,
        propertyId: propertyId,
        landlordId: property.landlordId,
        initialMessage: message.trim(),
      });

      // Navigate to the lead detail page
      navigate(`/leads/${lead.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create inquiry');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (propertyLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error && !property) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Create Inquiry</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/search')}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Express Interest in Property</h1>

            {/* Property Summary */}
            {property && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-4">
                  {property.images && property.images.length > 0 ? (
                    <img
                      src={property.images[0]}
                      alt={property.address}
                      className="w-24 h-24 object-cover rounded"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-200 rounded flex items-center justify-center">
                      <svg
                        className="h-12 w-12 text-gray-400"
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
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {property.propertyType.charAt(0).toUpperCase() +
                        property.propertyType.slice(1)}
                    </h3>
                    <p className="text-sm text-gray-600">{property.address}</p>
                    <p className="text-sm text-gray-500">
                      {property.city}, {property.province}
                    </p>
                    <p className="text-lg font-bold text-blue-600 mt-2">
                      {formatCurrency(property.rentAmount)}/mo
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Inquiry Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Message to the Landlord
                </label>
                <textarea
                  id="message"
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Introduce yourself and explain why you're interested in this property. Include any questions you may have about the property, lease terms, or move-in dates."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="mt-2 text-sm text-gray-500">
                  The landlord will receive your message and contact information.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Inquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LeadCreate;
