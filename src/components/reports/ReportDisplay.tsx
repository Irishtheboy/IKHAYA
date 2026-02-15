import React from 'react';
import {
  Report,
  PropertyPerformanceReport,
  FinancialReport,
} from '../../services/reportingService';

interface ReportDisplayProps {
  report: Report;
}

/**
 * Report Display Component
 * Displays generated report data in a formatted view
 *
 * Requirements: 15.1, 15.2, 15.3 - Reporting and Export
 */
const ReportDisplay: React.FC<ReportDisplayProps> = ({ report }) => {
  if (report.type === 'property_performance') {
    return <PropertyPerformanceDisplay report={report} />;
  } else if (report.type === 'financial') {
    return <FinancialReportDisplay report={report} />;
  }

  return null;
};

/**
 * Property Performance Report Display
 */
const PropertyPerformanceDisplay: React.FC<{
  report: PropertyPerformanceReport;
}> = ({ report }) => {
  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="border-b pb-4">
        <h3 className="text-lg font-semibold text-gray-900">Property Performance Report</h3>
        <p className="text-sm text-gray-600 mt-1">
          Period: {report.dateRange.startDate.toLocaleDateString()} -{' '}
          {report.dateRange.endDate.toLocaleDateString()}
        </p>
        <p className="text-sm text-gray-600">Generated: {report.generatedAt.toLocaleString()}</p>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-2xl font-bold text-blue-600">
            R {report.summary.totalRevenue.toFixed(2)}
          </p>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Maintenance Costs</p>
          <p className="text-2xl font-bold text-red-600">
            R {report.summary.totalMaintenanceCosts.toFixed(2)}
          </p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Net Income</p>
          <p className="text-2xl font-bold text-green-600">
            R {report.summary.netIncome.toFixed(2)}
          </p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Avg Occupancy Rate</p>
          <p className="text-2xl font-bold text-purple-600">
            {report.summary.averageOccupancyRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Property Details Table */}
      <div>
        <h4 className="text-md font-semibold text-gray-900 mb-3">Property Details</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Occupancy Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Maintenance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days Occupied
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days Vacant
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {report.properties.map((property) => (
                <tr key={property.propertyId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {property.address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {property.occupancyRate.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    R {property.revenue.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    R {property.maintenanceCosts.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {property.daysOccupied}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {property.daysVacant}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/**
 * Financial Report Display
 */
const FinancialReportDisplay: React.FC<{ report: FinancialReport }> = ({ report }) => {
  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="border-b pb-4">
        <h3 className="text-lg font-semibold text-gray-900">Financial Report</h3>
        <p className="text-sm text-gray-600 mt-1">
          Period: {report.dateRange.startDate.toLocaleDateString()} -{' '}
          {report.dateRange.endDate.toLocaleDateString()}
        </p>
        <p className="text-sm text-gray-600">Generated: {report.generatedAt.toLocaleString()}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Income</p>
          <p className="text-2xl font-bold text-green-600">
            R {report.income.totalIncome.toFixed(2)}
          </p>
          <div className="mt-2 text-xs text-gray-600">
            <p>Rent: R {report.income.rentIncome.toFixed(2)}</p>
            <p>Other: R {report.income.otherIncome.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Expenses</p>
          <p className="text-2xl font-bold text-red-600">
            R {report.expenses.totalExpenses.toFixed(2)}
          </p>
          <div className="mt-2 text-xs text-gray-600">
            <p>Commission: R {report.expenses.commissionPaid.toFixed(2)}</p>
            <p>Maintenance: R {report.expenses.maintenanceCosts.toFixed(2)}</p>
            <p>Other: R {report.expenses.otherExpenses.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Net Income</p>
          <p className="text-2xl font-bold text-blue-600">R {report.netIncome.toFixed(2)}</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div>
        <h4 className="text-md font-semibold text-gray-900 mb-3">Transactions</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {report.transactions.map((txn, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {txn.date.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{txn.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {txn.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        txn.type === 'income'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {txn.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                    <span className={txn.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                      {txn.type === 'income' ? '+' : '-'}R {txn.amount.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportDisplay;
