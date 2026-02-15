import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { adminService } from '../services/adminService';
import { User } from '../types/firebase';

export const AdminLandlords: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [allLandlords, setAllLandlords] = useState<User[]>([]);
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile && userProfile.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    loadLandlords();
  }, [userProfile, navigate]);

  const loadLandlords = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all users and filter landlords in memory
      const allUsers = await adminService.getAllUsers();
      const landlordUsers = allUsers.filter((user) => user.role === 'landlord');

      setAllLandlords(landlordUsers);
    } catch (err: any) {
      setError(err.message || 'Failed to load landlords');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLandlord = async (landlordId: string) => {
    if (!userProfile) return;

    try {
      setProcessingId(landlordId);
      await adminService.approveLandlord(landlordId, userProfile.id);
      await loadLandlords();
    } catch (err: any) {
      setError(err.message || 'Failed to approve landlord');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRevokeLandlord = async (landlordId: string) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm("Are you sure you want to revoke this landlord's approval?")) {
      return;
    }

    try {
      setProcessingId(landlordId);
      await adminService.rejectLandlord(landlordId);
      await loadLandlords();
    } catch (err: any) {
      setError(err.message || 'Failed to revoke landlord approval');
    } finally {
      setProcessingId(null);
    }
  };

  // Filter landlords based on selected filter
  const filteredLandlords = allLandlords.filter((landlord) => {
    if (filter === 'approved') return landlord.approved === true;
    if (filter === 'pending') return landlord.approved === false;
    return true; // 'all'
  });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Landlords</h1>
          <p className="text-gray-600 mt-2">View and manage all landlord accounts</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setFilter('all')}
              className={`${
                filter === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              All Landlords
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`${
                filter === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Pending Approval
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`${
                filter === 'approved'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Approved
            </button>
          </nav>
        </div>

        {/* Landlords Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading landlords...</p>
            </div>
          ) : filteredLandlords.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No landlords found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registered
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLandlords.map((landlord) => (
                    <tr key={landlord.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{landlord.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{landlord.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{landlord.phone || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {landlord.approved ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Approved
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {landlord.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {landlord.approved ? (
                          <button
                            onClick={() => handleRevokeLandlord(landlord.id)}
                            disabled={processingId === landlord.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            {processingId === landlord.id ? 'Processing...' : 'Revoke'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleApproveLandlord(landlord.id)}
                            disabled={processingId === landlord.id}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            {processingId === landlord.id ? 'Processing...' : 'Approve'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminLandlords;
