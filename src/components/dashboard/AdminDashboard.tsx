import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { User } from '../../types/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Badge,
  Alert,
  UsersIcon,
  UserProfileIcon,
  AnalyticsIcon,
  CheckmarkIcon,
  CloseIcon,
  WarningIcon,
} from '../common';

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
    // eslint-disable-next-line no-restricted-globals
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
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <WarningIcon className="text-orange-600" size="lg" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingLandlords}</p>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-16 h-16 bg-orange-50 rounded-bl-full"></div>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckmarkIcon className="text-green-600" size="lg" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved Landlords</p>
                <p className="text-2xl font-bold text-green-600">{stats.approvedLandlords}</p>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-16 h-16 bg-green-50 rounded-bl-full"></div>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <UserProfileIcon className="text-blue-600" size="lg" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tenants</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalTenants}</p>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full"></div>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <UsersIcon className="text-purple-600" size="lg" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalUsers}</p>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-50 rounded-bl-full"></div>
          </Card>
        </div>
      )}

      {/* Pending Landlord Approvals */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Pending Landlord Registrations</h2>
            {pendingLandlords.length > 0 && (
              <Badge variant="warning" size="sm">
                {pendingLandlords.length} pending
              </Badge>
            )}
          </div>
        </div>
        <div className="p-6">
          {pendingLandlords.length === 0 ? (
            <div className="text-center py-12">
              <CheckmarkIcon size="xl" className="mx-auto text-green-500 mb-4" />
              <p className="text-gray-500 text-lg">No pending landlord registrations</p>
              <p className="text-gray-400 text-sm mt-2">All registrations have been processed</p>
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
                      Registered
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingLandlords.map((landlord) => (
                    <tr key={landlord.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                            <UserProfileIcon size="sm" className="text-gray-500" />
                          </div>
                          <div className="text-sm font-medium text-gray-900">{landlord.name}</div>
                        </div>
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <Button
                            variant="success"
                            size="sm"
                            leftIcon={CheckmarkIcon}
                            onClick={() => handleApproveLandlord(landlord.id)}
                            disabled={processingId === landlord.id}
                            loading={processingId === landlord.id}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            leftIcon={CloseIcon}
                            onClick={() => handleRejectLandlord(landlord.id)}
                            disabled={processingId === landlord.id}
                          >
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          className="group cursor-pointer hover:shadow-lg transition-all duration-200"
          onClick={() => navigate('/admin/landlords')}
        >
          <div className="flex items-center p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <UsersIcon className="text-blue-600" size="lg" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                Manage Landlords
              </h3>
              <p className="text-gray-600 text-sm mt-1">View and manage all landlord accounts</p>
            </div>
          </div>
        </Card>

        <Card
          className="group cursor-pointer hover:shadow-lg transition-all duration-200"
          onClick={() => navigate('/admin/users')}
        >
          <div className="flex items-center p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <UserProfileIcon className="text-green-600" size="lg" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                Manage Users
              </h3>
              <p className="text-gray-600 text-sm mt-1">View and manage all user accounts</p>
            </div>
          </div>
        </Card>

        <Card
          className="group cursor-pointer hover:shadow-lg transition-all duration-200"
          onClick={() => navigate('/reports')}
        >
          <div className="flex items-center p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <AnalyticsIcon className="text-purple-600" size="lg" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                View Reports
              </h3>
              <p className="text-gray-600 text-sm mt-1">Access system reports and analytics</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
