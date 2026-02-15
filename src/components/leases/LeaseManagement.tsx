import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { leaseService } from '../../services/leaseService';
import { Lease } from '../../types/firebase';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Lease Management Component
 * Displays all leases for landlords or tenants with expiration warnings
 *
 * Requirements: 5.4, 5.6 - Lease Agreement Management
 */
const LeaseManagement: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();

  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'expiring'>('all');

  const loadLeases = useCallback(async () => {
    if (!currentUser || !userProfile) return;

    try {
      setLoading(true);
      setError(null);

      let leasesData: Lease[];

      // Load leases based on user role
      if (userProfile.role === 'landlord') {
        leasesData = await leaseService.getLeasesForLandlord(currentUser.uid);
      } else if (userProfile.role === 'tenant') {
        leasesData = await leaseService.getLeasesForTenant(currentUser.uid);
      } else {
        leasesData = [];
      }

      setLeases(leasesData);
    } catch (err: any) {
      console.error('Error loading leases:', err);
      setError(err.message || 'Failed to load leases');
    } finally {
      setLoading(false);
    }
  }, [currentUser, userProfile]);

  useEffect(() => {
    loadLeases();
  }, [loadLeases]);

  const getDaysUntilExpiration = (endDate: any): number => {
    const end = endDate.toDate();
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isExpiringSoon = (lease: Lease): boolean => {
    if (lease.status !== 'active') return false;
    const daysUntilExpiration = getDaysUntilExpiration(lease.endDate);
    return daysUntilExpiration <= 30 && daysUntilExpiration > 0;
  };

  const isExpired = (lease: Lease): boolean => {
    const daysUntilExpiration = getDaysUntilExpiration(lease.endDate);
    return daysUntilExpiration < 0;
  };

  const getFilteredLeases = () => {
    switch (filter) {
      case 'active':
        return leases.filter((lease) => lease.status === 'active');
      case 'expiring':
        return leases.filter((lease) => isExpiringSoon(lease));
      default:
        return leases;
    }
  };

  const getStatusBadge = (lease: Lease) => {
    if (isExpired(lease)) {
      return (
        <span className="px-2 py-1 bg-red-200 text-red-800 text-xs rounded-full">EXPIRED</span>
      );
    }

    if (isExpiringSoon(lease)) {
      const days = getDaysUntilExpiration(lease.endDate);
      return (
        <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded-full">
          EXPIRES IN {days} DAYS
        </span>
      );
    }

    const statusColors: Record<string, string> = {
      draft: 'bg-gray-200 text-gray-800',
      pending_signatures: 'bg-yellow-200 text-yellow-800',
      active: 'bg-green-200 text-green-800',
      expired: 'bg-red-200 text-red-800',
      terminated: 'bg-red-200 text-red-800',
    };

    return (
      <span
        className={`px-2 py-1 text-xs rounded-full ${statusColors[lease.status] || 'bg-gray-200 text-gray-800'}`}
      >
        {lease.status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const filteredLeases = getFilteredLeases();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading leases...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Lease Management</h1>
        {userProfile?.role === 'landlord' && (
          <button
            onClick={() => navigate('/leases/create')}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Create New Lease
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Expiring Leases Warning */}
      {leases.filter(isExpiringSoon).length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You have {leases.filter(isExpiringSoon).length} lease(s) expiring within 30 days.
                Please review and take action.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setFilter('all')}
          className={`pb-2 px-4 ${
            filter === 'all'
              ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          All Leases ({leases.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`pb-2 px-4 ${
            filter === 'active'
              ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Active ({leases.filter((l) => l.status === 'active').length})
        </button>
        <button
          onClick={() => setFilter('expiring')}
          className={`pb-2 px-4 ${
            filter === 'expiring'
              ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Expiring Soon ({leases.filter(isExpiringSoon).length})
        </button>
      </div>

      {/* Leases List */}
      {filteredLeases.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No leases found</p>
          {userProfile?.role === 'landlord' && (
            <button
              onClick={() => navigate('/leases/create')}
              className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Create Your First Lease
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLeases.map((lease) => (
            <div
              key={lease.id}
              className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/leases/${lease.id}`)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Lease #{lease.id.substring(0, 8)}</h3>
                  <p className="text-sm text-gray-600">Property ID: {lease.propertyId}</p>
                </div>
                {getStatusBadge(lease)}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Monthly Rent</p>
                  <p className="font-semibold">R{lease.rentAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Start Date</p>
                  <p className="font-semibold">{lease.startDate.toDate().toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">End Date</p>
                  <p className="font-semibold">{lease.endDate.toDate().toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Signatures</p>
                  <p className="font-semibold">
                    {(lease.landlordSignature ? 1 : 0) + (lease.tenantSignature ? 1 : 0)} / 2
                  </p>
                </div>
              </div>

              {isExpiringSoon(lease) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p className="text-sm text-yellow-800">
                    ⚠️ This lease expires in {getDaysUntilExpiration(lease.endDate)} days. Please
                    take action.
                  </p>
                </div>
              )}

              {isExpired(lease) && lease.status === 'active' && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-sm text-red-800">
                    ⚠️ This lease has expired. Please update the status.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeaseManagement;
