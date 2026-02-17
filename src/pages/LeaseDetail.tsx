import React from 'react';
import { Layout } from '../components/layout/Layout';
import LeaseDetailComponent from '../components/leases/LeaseDetail';

const LeaseDetail: React.FC = () => {
  return (
    <Layout>
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-light text-white tracking-tight">LEASE AGREEMENT</h1>
          <p className="text-slate-400 mt-3 font-light text-lg">
            Review and manage lease agreement details
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LeaseDetailComponent />
      </div>
    </Layout>
  );
};

export default LeaseDetail;
