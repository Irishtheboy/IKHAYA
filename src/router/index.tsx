import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import Dashboard from '../pages/Dashboard';
import PropertySearch from '../pages/PropertySearch';
import PropertyDetail from '../pages/PropertyDetail';
import PropertyCreate from '../pages/PropertyCreate';
import PropertiesManage from '../pages/PropertiesManage';
import LeadCreate from '../pages/LeadCreate';
import LeadDetail from '../pages/LeadDetail';
import Leads from '../pages/Leads';
import Leases from '../pages/Leases';
import Maintenance from '../pages/Maintenance';
import Payments from '../pages/Payments';
import InvoiceDetail from '../pages/InvoiceDetail';
import PaymentRecord from '../pages/PaymentRecord';
import AdminLandlords from '../pages/AdminLandlords';
import AdminUsers from '../pages/AdminUsers';
import ProtectedRoute from '../components/auth/ProtectedRoute';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/search',
    element: <PropertySearch />,
  },
  {
    path: '/properties/create',
    element: (
      <ProtectedRoute>
        <PropertyCreate />
      </ProtectedRoute>
    ),
  },
  {
    path: '/properties/manage',
    element: (
      <ProtectedRoute>
        <PropertiesManage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/properties/:propertyId',
    element: <PropertyDetail />,
  },
  {
    path: '/properties/:propertyId/:slug',
    element: <PropertyDetail />,
  },
  {
    path: '/leads',
    element: (
      <ProtectedRoute>
        <Leads />
      </ProtectedRoute>
    ),
  },
  {
    path: '/leads/create',
    element: (
      <ProtectedRoute>
        <LeadCreate />
      </ProtectedRoute>
    ),
  },
  {
    path: '/leads/:leadId',
    element: (
      <ProtectedRoute>
        <LeadDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: '/leases',
    element: (
      <ProtectedRoute>
        <Leases />
      </ProtectedRoute>
    ),
  },
  {
    path: '/maintenance',
    element: (
      <ProtectedRoute>
        <Maintenance />
      </ProtectedRoute>
    ),
  },
  {
    path: '/payments',
    element: (
      <ProtectedRoute>
        <Payments />
      </ProtectedRoute>
    ),
  },
  {
    path: '/invoices/:invoiceId',
    element: (
      <ProtectedRoute>
        <InvoiceDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: '/payments/record/:invoiceId',
    element: (
      <ProtectedRoute>
        <PaymentRecord />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/landlords',
    element: (
      <ProtectedRoute>
        <AdminLandlords />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/users',
    element: (
      <ProtectedRoute>
        <AdminUsers />
      </ProtectedRoute>
    ),
  },
]);

export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default router;
