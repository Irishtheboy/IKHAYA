import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import ProtectedRoute from '../components/auth/ProtectedRoute';

// Eager load critical pages (Home, Login, Register)
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';

// Lazy load all other pages
const ForgotPassword = lazy(() => import('../pages/ForgotPassword'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const PropertySearch = lazy(() => import('../pages/PropertySearch'));
const PropertyDetail = lazy(() => import('../pages/PropertyDetail'));
const PropertyCreate = lazy(() => import('../pages/PropertyCreate'));
const PropertiesManage = lazy(() => import('../pages/PropertiesManage'));
const LeadCreate = lazy(() => import('../pages/LeadCreate'));
const LeadDetail = lazy(() => import('../pages/LeadDetail'));
const Leads = lazy(() => import('../pages/Leads'));
const Leases = lazy(() => import('../pages/Leases'));
const Maintenance = lazy(() => import('../pages/Maintenance'));
const Payments = lazy(() => import('../pages/Payments'));
const InvoiceDetail = lazy(() => import('../pages/InvoiceDetail'));
const PaymentRecord = lazy(() => import('../pages/PaymentRecord'));
const AdminLandlords = lazy(() => import('../pages/AdminLandlords'));
const AdminUsers = lazy(() => import('../pages/AdminUsers'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      <p className="mt-4 text-gray-600 font-light">Loading...</p>
    </div>
  </div>
);

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
    element: (
      <Suspense fallback={<PageLoader />}>
        <ForgotPassword />
      </Suspense>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Suspense>
    ),
  },
  {
    path: '/search',
    element: (
      <Suspense fallback={<PageLoader />}>
        <PropertySearch />
      </Suspense>
    ),
  },
  {
    path: '/properties/create',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ProtectedRoute>
          <PropertyCreate />
        </ProtectedRoute>
      </Suspense>
    ),
  },
  {
    path: '/properties/manage',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ProtectedRoute>
          <PropertiesManage />
        </ProtectedRoute>
      </Suspense>
    ),
  },
  {
    path: '/properties/:propertyId',
    element: (
      <Suspense fallback={<PageLoader />}>
        <PropertyDetail />
      </Suspense>
    ),
  },
  {
    path: '/properties/:propertyId/:slug',
    element: (
      <Suspense fallback={<PageLoader />}>
        <PropertyDetail />
      </Suspense>
    ),
  },
  {
    path: '/leads',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ProtectedRoute>
          <Leads />
        </ProtectedRoute>
      </Suspense>
    ),
  },
  {
    path: '/leads/create',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ProtectedRoute>
          <LeadCreate />
        </ProtectedRoute>
      </Suspense>
    ),
  },
  {
    path: '/leads/:leadId',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ProtectedRoute>
          <LeadDetail />
        </ProtectedRoute>
      </Suspense>
    ),
  },
  {
    path: '/leases',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ProtectedRoute>
          <Leases />
        </ProtectedRoute>
      </Suspense>
    ),
  },
  {
    path: '/maintenance',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ProtectedRoute>
          <Maintenance />
        </ProtectedRoute>
      </Suspense>
    ),
  },
  {
    path: '/payments',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ProtectedRoute>
          <Payments />
        </ProtectedRoute>
      </Suspense>
    ),
  },
  {
    path: '/invoices/:invoiceId',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ProtectedRoute>
          <InvoiceDetail />
        </ProtectedRoute>
      </Suspense>
    ),
  },
  {
    path: '/payments/record/:invoiceId',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ProtectedRoute>
          <PaymentRecord />
        </ProtectedRoute>
      </Suspense>
    ),
  },
  {
    path: '/admin/landlords',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ProtectedRoute>
          <AdminLandlords />
        </ProtectedRoute>
      </Suspense>
    ),
  },
  {
    path: '/admin/users',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ProtectedRoute>
          <AdminUsers />
        </ProtectedRoute>
      </Suspense>
    ),
  },
]);

export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default router;
