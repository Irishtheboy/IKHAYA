import React, { useState, useEffect } from 'react';
import { maintenanceService } from '../../services/maintenanceService';
import { propertyService } from '../../services/propertyService';
import { MaintenanceRequest, Property } from '../../types/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useParams } from 'react-router-dom';

/**
 * Maintenance History Component
 * Displays maintenance request history for a specific property
 *
 * Requirements: 6.6 - Maintenance Request Management
 */
export const MaintenanceHistory: React.FC = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!propertyId) return;

    const fetchMaintenanceHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch property details
        const propertyData = await propertyService.getProperty(propertyId);
        setProperty(propertyData);

        // Fetch maintenance requests for property
        const requestsData = await maintenanceService.getRequestsForProperty(propertyId);
        setRequests(requestsData);
      } catch (err: any) {
        setError(err.message || 'Failed to load maintenance history');
      } finally {
        setLoading(false);
      }
    };

    fetchMaintenanceHistory();
  }, [propertyId]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatistics = () => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === 'pending').length;
    const inProgress = requests.filter((r) => r.status === 'in_progress').length;
    const completed = requests.filter((r) => r.status === 'completed').length;
    const cancelled = requests.filter((r) => r.status === 'cancelled').length;

    return { total, pending, inProgress, completed, cancelled };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading maintenance history...</div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 rounded p-4">
          Property not found
        </div>
      </div>
    );
  }

  const stats = getStatistics();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Maintenance History</h1>
        <p className="text-gray-600">{property.address}</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-4">
          <p className="text-sm text-yellow-800 mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-800">{stats.pending}</p>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4">
          <p className="text-sm text-blue-800 mb-1">In Progress</p>
          <p className="text-2xl font-bold text-blue-800">{stats.inProgress}</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4">
          <p className="text-sm text-green-800 mb-1">Completed</p>
          <p className="text-2xl font-bold text-green-800">{stats.completed}</p>
        </div>
        <div className="bg-gray-50 rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Cancelled</p>
          <p className="text-2xl font-bold text-gray-600">{stats.cancelled}</p>
        </div>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg">No maintenance requests for this property.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold capitalize">{request.category}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${getPriorityBadgeColor(
                        request.priority
                      )}`}
                    >
                      {request.priority}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Submitted: {formatDate(request.createdAt)}
                  </p>
                  {request.updatedAt && request.createdAt !== request.updatedAt && (
                    <p className="text-gray-600 text-sm">
                      Updated: {formatDate(request.updatedAt)}
                    </p>
                  )}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusBadgeColor(
                    request.status
                  )}`}
                >
                  {request.status.replace('_', ' ')}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-gray-700">{request.description}</p>
              </div>

              {/* Images */}
              {request.images && request.images.length > 0 && (
                <div className="mb-4 grid grid-cols-3 gap-2">
                  {request.images.map((imageUrl, index) => (
                    <img
                      key={index}
                      src={imageUrl}
                      alt={`Issue ${index + 1}`}
                      className="w-full h-32 object-cover rounded-md cursor-pointer hover:opacity-80"
                      onClick={() => window.open(imageUrl, '_blank')}
                    />
                  ))}
                </div>
              )}

              {/* Notes */}
              {request.notes && request.notes.length > 0 && (
                <div className="bg-gray-50 rounded-md p-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Notes:</p>
                  <div className="space-y-2">
                    {request.notes.map((note, index) => (
                      <div key={index} className="text-sm text-gray-600">
                        <p>{note.note}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(note.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MaintenanceHistory;
