import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  reportingService,
  ReportType,
  ReportFilters,
  Report,
  ExportFormat,
} from '../../services/reportingService';
import ReportDisplay from './ReportDisplay';

/**
 * Report Generation Component
 * Provides form for generating reports with filters and export options
 *
 * Requirements: 15.1, 15.2, 15.3 - Reporting and Export
 */
const ReportGeneration: React.FC = () => {
  const { currentUser } = useAuth();
  const [reportType, setReportType] = useState<ReportType>('property_performance');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [exportLoading, setExportLoading] = useState(false);

  /**
   * Handle report generation
   */
  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!currentUser) {
        throw new Error('You must be logged in to generate reports');
      }

      if (!startDate || !endDate) {
        throw new Error('Please select both start and end dates');
      }

      const filters: ReportFilters = {
        landlordId: currentUser.uid,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      };

      const generatedReport = await reportingService.generateReport(reportType, filters);

      setReport(generatedReport);
    } catch (err: any) {
      console.error('Error generating report:', err);
      setError(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle report export
   */
  const handleExportReport = async () => {
    if (!report) return;

    setExportLoading(true);
    setError(null);

    try {
      const exportedData = await reportingService.exportReport(report, exportFormat);

      // Create download link
      const blob = new Blob([exportedData], {
        type: exportFormat === 'csv' ? 'text/csv' : 'application/octet-stream',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.type}_${report.reportId}.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error exporting report:', err);
      setError(err.message || 'Failed to export report');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Reports</h1>

      {/* Report Generation Form */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate Report</h2>

        <form onSubmit={handleGenerateReport} className="space-y-4">
          {/* Report Type */}
          <div>
            <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-1">
              Report Type
            </label>
            <select
              id="reportType"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="property_performance">Property Performance</option>
              <option value="financial">Financial Report</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </form>
      </div>

      {/* Report Display */}
      {report && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Report Results</h2>

            {/* Export Options */}
            <div className="flex items-center space-x-4">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
              </select>

              <button
                onClick={handleExportReport}
                disabled={exportLoading}
                className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {exportLoading ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>

          <ReportDisplay report={report} />
        </div>
      )}
    </div>
  );
};

export default ReportGeneration;
