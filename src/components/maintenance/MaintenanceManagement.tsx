import React, { useState, useEffect } from 'react';
import { maintenanceService } from '../../services/maintenanceService';
import { propertyService } from '../../services/propertyService';
import { MaintenanceRequest, MaintenanceStatus, Property } from '../../types/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * Maintenance Management Component
 * Displays all maintenance requests for a landlord with filtering and status management
 *
 * Requirements: 6.3, 6.4, 6.5 - Maintenance Request Management
 */
export const MaintenanceManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [properties, setProperties] = useState<Map<string, Property>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<MaintenanceStatus | 'all'>('all');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    const fetchRequestsAndProperties = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch maintenance requests for landlord
        const requestsData = await maintenanceService.getRequestsForLandlord(currentUser.uid);
        setRequests(requestsData);

        // Fetch property details for each request
        const propertyIds = Array.from(new Set(requestsData.map((req) => req.propertyId)));
        const propertiesMap = new Map<string, Property>();

        await Promise.all(
          propertyIds.map(async (propertyId) => {
            const property = await propertyService.getProperty(propertyId);
            if (property) {
              propertiesMap.set(propertyId, property);
            }
          })
        );

        setProperties(propertiesMap);
      } catch (err: any) {
        setError(err.message || 'Failed to load maintenance requests');
      } finally {
        setLoading(false);
      }
    };

    fetchRequestsAndProperties();
  }, [currentUser]);

  const handleStatusChange = async (requestId: string, newStatus: MaintenanceStatus) => {
    setUpdatingStatus(requestId);
    setError(null);

    try {
      await maintenanceService.updateRequestStatus(requestId, newStatus);

      // Update local state
      setRequests((prevRequests) =>
        prevRequests.map((req) => (req.id === requestId ? { ...req, status: newStatus } : req))
      );
    } catch (err: any) {
      setError(err.message || 'Failed to update request status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const filteredRequests =
    filterStatus === 'all' ? requests : requests.filter((req) => req.status === filterStatus);

  const getStatusBadgeColor = (status: MaintenanceStatus) => {
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading maintenance requests...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Maintenance Management</h1>
        <p className="text-gray-600">Manage maintenance requests for your properties</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-md transition-colors ${
            filterStatus === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All ({requests.length})
        </button>
        {(['pending', 'in_progress', 'completed', 'cancelled'] as MaintenanceStatus[]).map(
          (status) => {
            const count = requests.filter((req) => req.status === status).length;
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-md transition-colors capitalize ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {status.replace('_', ' ')} ({count})
              </button>
            );
          }
        )}
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg">
            {filterStatus === 'all'
              ? 'No maintenance requests yet.'
              : `No ${filterStatus.replace('_', ' ')} requests.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => {
            const property = properties.get(request.propertyId);
            return (
              <div
                key={request.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold">{property?.address || 'Property'}</h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${getPriorityBadgeColor(
                          request.priority
                        )}`}
                      >
                        {request.priority}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-1">
                      Category: <span className="capitalize">{request.category}</span>
                    </p>
                    <p className="text-gray-600 text-sm">{formatDate(request.createdAt)}</p>
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
                  <div className="mb-4 bg-gray-50 rounded-md p-3">
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

                <div className="flex gap-3">
                  <select
                    value={request.status}
                    onChange={(e) =>
                      handleStatusChange(request.id, e.target.value as MaintenanceStatus)
                    }
                    disabled={updatingStatus === request.id}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MaintenanceManagement;
