import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/layout/Layout';
import { LandlordDashboard, TenantDashboard, AdminDashboard } from '../components/dashboard';

const Dashboard: React.FC = () => {
  const { userProfile } = useAuth();

  const getDashboardTitle = () => {
    switch (userProfile?.role) {
      case 'admin':
        return 'Admin Dashboard';
      case 'landlord':
        return 'Landlord Dashboard';
      case 'tenant':
        return 'Tenant Dashboard';
      default:
        return 'Dashboard';
    }
  };

  const getDashboardDescription = () => {
    switch (userProfile?.role) {
      case 'admin':
        return 'Manage users, approve landlords, and oversee platform operations';
      case 'landlord':
        return 'Manage your properties and track performance';
      case 'tenant':
        return 'View your saved properties and inquiries';
      default:
        return '';
    }
  };

  const renderDashboard = () => {
    switch (userProfile?.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'landlord':
        // Check if landlord is approved
        if (userProfile.approved === false) {
          return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-yellow-800 mb-2">
                Account Pending Approval
              </h2>
              <p className="text-yellow-700">
                Your landlord account is currently pending admin approval. You will be able to post
                properties and use the platform once your account has been approved. You will
                receive an email notification when this happens.
              </p>
            </div>
          );
        }
        return <LandlordDashboard />;
      case 'tenant':
        return <TenantDashboard />;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{getDashboardTitle()}</h1>
          <p className="text-gray-600 mt-2">{getDashboardDescription()}</p>
        </div>

        {renderDashboard()}
      </div>
    </Layout>
  );
};

export default Dashboard;
