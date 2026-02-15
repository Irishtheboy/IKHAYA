import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsService, TenantDashboard as TenantDashboardData } from '../../services/analyticsService';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Tenant Dashboard Component
 * Displays saved properties, active inquiries, current lease, and maintenance requests
 */
const TenantDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<TenantDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        setError(null);
        const data = await analyticsService.getTenantDashboard(currentUser.uid);
        setDashboardData(data);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-gray-600">No dashboard data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Lease */}
      {dashboardData.currentLease && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Lease</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Rent Amount</p>
              <p className="text-xl font-semibold text-gray-900">
                R{dashboardData.currentLease.rentAmount.toLocaleString()}/month
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Lease End Date</p>
              <p className="text-xl font-semibold text-gray-900">
                {dashboardData.currentLease.endDate instanceof Date
                  ? dashboardData.currentLease.endDate.toLocaleDateString()
                  : new Date(dashboardData.currentLease.endDate.seconds * 1000).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                {dashboardData.currentLease.status}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Saved Properties */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Saved Properties</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {dashboardData.savedProperties.length}
              </p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Active Inquiries */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Inquiries</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {dashboardData.activeInquiries.length}
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Maintenance Requests */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Maintenance Requests</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {dashboardData.maintenanceRequests.length}
              </p>
            </div>
            <div className="bg-yellow-100 rounded-full p-3">
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Properties */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Saved Properties</h3>
        {dashboardData.savedProperties.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">You haven't saved any properties yet</p>
            <button
              onClick={() => navigate('/properties')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Browse Properties
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.savedProperties.map((property) => (
              <div
                key={property.id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer"
                onClick={() => navigate(`/properties/${property.id}`)}
              >
                {property.images && property.images.length > 0 ? (
                  <img
                    src={property.images[0]}
                    alt={property.address}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
                <div className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">{property.address}</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {property.city}, {property.province}
                  </p>
                  <p className="text-lg font-bold text-blue-600">
                    R{property.rentAmount.toLocaleString()}/month
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <span>{property.bedrooms} bed</span>
                    <span>{property.bathrooms} bath</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Inquiries */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Inquiries</h3>
        {dashboardData.activeInquiries.length === 0 ? (
          <p className="text-gray-600">No active inquiries</p>
        ) : (
          <div className="space-y-4">
            {dashboardData.activeInquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer"
                onClick={() => navigate(`/leads/${inquiry.id}`)}
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="font-medium text-gray-900">Property Inquiry</p>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      inquiry.status === 'new'
                        ? 'bg-blue-100 text-blue-800'
                        : inquiry.status === 'contacted'
                        ? 'bg-yellow-100 text-yellow-800'
                        : inquiry.status === 'scheduled'
                        ? 'bg-purple-100 text-purple-800'
                        : inquiry.status === 'converted'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {inquiry.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{inquiry.initialMessage}</p>
                <p className="text-xs text-gray-500">
                  {inquiry.createdAt instanceof Date
                    ? inquiry.createdAt.toLocaleDateString()
                    : new Date(inquiry.createdAt.seconds * 1000).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Maintenance Requests */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Requests</h3>
        {dashboardData.maintenanceRequests.length === 0 ? (
          <p className="text-gray-600">No maintenance requests</p>
        ) : (
          <div className="space-y-4">
            {dashboardData.maintenanceRequests.map((request) => (
              <div
                key={request.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-900 capitalize">{request.category}</p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                        request.priority === 'urgent'
                          ? 'bg-red-100 text-red-800'
                          : request.priority === 'high'
                          ? 'bg-orange-100 text-orange-800'
                          : request.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {request.priority}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      request.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : request.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : request.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {request.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                <p className="text-xs text-gray-500">
                  {request.createdAt instanceof Date
                    ? request.createdAt.toLocaleDateString()
                    : new Date(request.createdAt.seconds * 1000).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantDashboard;
