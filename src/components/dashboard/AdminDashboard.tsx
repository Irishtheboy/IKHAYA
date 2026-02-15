import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { User } from '../../types/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  pendingLandlords: number;
  approvedLandlords: number;
  totalTenants: number;
  totalUsers: number;
}

export const AdminDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingLandlords, setPendingLandlords] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not admin
    if (userProfile && userProfile.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    loadDashboardData();
  }, [userProfile, navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, pendingData] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getPendingLandlords(),
      ]);

      setStats(statsData);
      setPendingLandlords(pendingData);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLandlord = async (landlordId: string) => {
    if (!userProfile) return;

    try {
      setProcessingId(landlordId);
      await adminService.approveLandlord(landlordId, userProfile.id);
      
      // Refresh data
      await loadDashboardData();
    } catch (err: any) {
      setError(err.message || 'Failed to approve landlord');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectLandlord = async (landlordId: string) => {
    if (!confirm('Are you sure you want to reject this landlord registration?')) {
      return;
    }

    try {
      setProcessingId(landlordId);
      await adminService.rejectLandlord(landlordId);
      
      // Refresh data
      await loadDashboardData();
    } catch (err: any) {
      setError(err.message || 'Failed to reject landlord');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Pending Approvals</h3>
            <p className="text-3xl font-bold text-orange-600 mt-2">{stats.pendingLandlords}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Approved Landlords</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.approvedLandlords}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Total Tenants</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalTenants}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">{stats.totalUsers}</p>
          </div>
        </div>
      )}

      {/* Pending Landlord Approvals */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Pending Landlord Registrations</h2>
        </div>
        <div className="p-6">
          {pendingLandlords.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No pending landlord registrations</p>
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
                      Registered
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingLandlords.map((landlord) => (
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
                        <div className="text-sm text-gray-500">
                          {landlord.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleApproveLandlord(landlord.id)}
                          disabled={processingId === landlord.id}
                          className="text-green-600 hover:text-green-900 mr-4 disabled:opacity-50"
                        >
                          {processingId === landlord.id ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleRejectLandlord(landlord.id)}
                          disabled={processingId === landlord.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => navigate('/admin/landlords')}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left"
        >
          <h3 className="text-lg font-semibold mb-2">Manage Landlords</h3>
          <p className="text-gray-600 text-sm">View and manage all landlord accounts</p>
        </button>
        <button
          onClick={() => navigate('/admin/users')}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left"
        >
          <h3 className="text-lg font-semibold mb-2">Manage Users</h3>
          <p className="text-gray-600 text-sm">View and manage all user accounts</p>
        </button>
        <button
          onClick={() => navigate('/reports')}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left"
        >
          <h3 className="text-lg font-semibold mb-2">View Reports</h3>
          <p className="text-gray-600 text-sm">Access system reports and analytics</p>
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
