import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import PropertyList from '../components/properties/PropertyList';
import { propertyService } from '../services/propertyService';
import { Property, PropertyStatus } from '../types/firebase';
import { useAuth } from '../contexts/AuthContext';

const PropertiesManage: React.FC = () => {
  const { currentUser } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const loadProperties = async () => {
    if (!currentUser) {
      setError('You must be logged in to view properties');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await propertyService.getLandlordProperties(currentUser.uid);
      setProperties(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load properties');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (propertyId: string, status: PropertyStatus) => {
    try {
      await propertyService.updateStatus(propertyId, status);
      // Update local state
      setProperties((prev) => prev.map((p) => (p.id === propertyId ? { ...p, status } : p)));
    } catch (err: any) {
      alert(err.message || 'Failed to update property status');
    }
  };

  const handleDelete = async (propertyId: string) => {
    try {
      await propertyService.deleteProperty(propertyId);
      // Remove from local state
      setProperties((prev) => prev.filter((p) => p.id !== propertyId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete property');
    }
  };

  return (
    <Layout>
      {/* Hero Header */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-light text-white tracking-tight">My Properties</h1>
              <p className="mt-3 text-slate-400 font-light text-lg">
                Manage your property listings and track their status
              </p>
            </div>
            <Link
              to="/properties/create"
              className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-cyan-500 hover:bg-cyan-600 transition-colors"
            >
              <svg
                className="-ml-1 mr-2 h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              New Property
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg font-light">
            {error}
          </div>
        )}

        {/* Stats */}
        {!isLoading && properties.length > 0 && (
          <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-slate-200">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-slate-400"
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
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-light text-slate-500 truncate">
                        Total Properties
                      </dt>
                      <dd className="text-lg font-light text-slate-900">{properties.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-slate-200">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-green-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-light text-slate-500 truncate">Available</dt>
                      <dd className="text-lg font-light text-slate-900">
                        {properties.filter((p) => p.status === 'available').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-slate-200">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-cyan-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-light text-slate-500 truncate">Occupied</dt>
                      <dd className="text-lg font-light text-slate-900">
                        {properties.filter((p) => p.status === 'occupied').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Property List */}
        <PropertyList
          properties={properties}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          isLoading={isLoading}
        />
      </div>
    </Layout>
  );
};

export default PropertiesManage;
