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
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 shadow-sm">
              <h2 className="text-2xl font-light text-amber-900 mb-3 tracking-tight">
                Account Pending Approval
              </h2>
              <p className="text-amber-800 font-light leading-relaxed">
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
      {/* Hero Header */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-light text-white tracking-tight">{getDashboardTitle()}</h1>
          <p className="text-slate-400 mt-3 font-light text-lg">{getDashboardDescription()}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{renderDashboard()}</div>
    </Layout>
  );
};

export default Dashboard;
