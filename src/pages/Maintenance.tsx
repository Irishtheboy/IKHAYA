import React from 'react';
import { Layout } from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { MaintenanceManagement } from '../components/maintenance/MaintenanceManagement';

const Maintenance: React.FC = () => {
  const { userProfile } = useAuth();

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Maintenance Requests</h1>
          <p className="text-gray-600 mt-2">
            {userProfile?.role === 'landlord'
              ? 'Manage maintenance requests for your properties'
              : 'Submit and track your maintenance requests'}
          </p>
        </div>

        <MaintenanceManagement />
      </div>
    </Layout>
  );
};

export default Maintenance;
