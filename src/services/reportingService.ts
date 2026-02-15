import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Property, Lease, MaintenanceRequest, Payment, Invoice } from '../types/firebase';
import { COLLECTIONS } from '../types/firestore-schema';
import { propertyService } from './propertyService';
import { leaseService } from './leaseService';

/**
 * Report type enumeration
 */
export type ReportType = 'property_performance' | 'financial';

/**
 * Report filters for customizing report data
 */
export interface ReportFilters {
  landlordId?: string;
  propertyIds?: string[];
  startDate: Date;
  endDate: Date;
}

/**
 * Property performance report data
 */
export interface PropertyPerformanceReport {
  reportId: string;
  type: 'property_performance';
  landlordId: string;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  properties: Array<{
    propertyId: string;
    address: string;
    occupancyRate: number;
    revenue: number;
    maintenanceCosts: number;
    daysOccupied: number;
    daysVacant: number;
  }>;
  summary: {
    totalRevenue: number;
    totalMaintenanceCosts: number;
    averageOccupancyRate: number;
    netIncome: number;
  };
  generatedAt: Date;
}

/**
 * Financial report data
 */
export interface FinancialReport {
  reportId: string;
  type: 'financial';
  landlordId: string;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  income: {
    rentIncome: number;
    otherIncome: number;
    totalIncome: number;
  };
  expenses: {
    maintenanceCosts: number;
    commissionPaid: number;
    otherExpenses: number;
    totalExpenses: number;
  };
  netIncome: number;
  transactions: Array<{
    date: Date;
    description: string;
    type: 'income' | 'expense';
    amount: number;
    category: string;
  }>;
  generatedAt: Date;
}

/**
 * Union type for all report types
 */
export type Report = PropertyPerformanceReport | FinancialReport;

/**
 * Export format options
 */
export type ExportFormat = 'pdf' | 'csv' | 'excel';

/**
 * Reporting Service
 * Generates various reports for landlords including property performance and financial reports
 */
class ReportingService {
  /**
   * Generate a report based on type and filters
   *
   * @param reportType - Type of report to generate
   * @param filters - Filters to apply to the report
   * @returns Promise resolving to the generated report
   */
  async generateReport(reportType: ReportType, filters: ReportFilters): Promise<Report> {
    if (!filters.landlordId) {
      throw new Error('Landlord ID is required for report generation');
    }

    switch (reportType) {
      case 'property_performance':
        return this.generatePropertyPerformanceReport(filters);
      case 'financial':
        return this.generateFinancialReport(filters);
      default:
        throw new Error(`Unsupported report type: ${reportType}`);
    }
  }

  /**
   * Generate property performance report
   *
   * @param filters - Report filters
   * @returns Promise resolving to property performance report
   */
  private async generatePropertyPerformanceReport(
    filters: ReportFilters
  ): Promise<PropertyPerformanceReport> {
    const { landlordId, propertyIds, startDate, endDate } = filters;

    // Fetch properties
    let properties = await propertyService.getLandlordProperties(landlordId!);

    // Filter by specific property IDs if provided
    if (propertyIds && propertyIds.length > 0) {
      properties = properties.filter((p) => propertyIds.includes(p.id));
    }

    // Calculate metrics for each property
    const propertyMetrics = await Promise.all(
      properties.map((property) => this.calculatePropertyMetrics(property, startDate, endDate))
    );

    // Calculate summary
    const totalRevenue = propertyMetrics.reduce((sum, p) => sum + p.revenue, 0);
    const totalMaintenanceCosts = propertyMetrics.reduce((sum, p) => sum + p.maintenanceCosts, 0);
    const averageOccupancyRate =
      propertyMetrics.length > 0
        ? propertyMetrics.reduce((sum, p) => sum + p.occupancyRate, 0) / propertyMetrics.length
        : 0;
    const netIncome = totalRevenue - totalMaintenanceCosts;

    return {
      reportId: this.generateReportId(),
      type: 'property_performance',
      landlordId: landlordId!,
      dateRange: { startDate, endDate },
      properties: propertyMetrics,
      summary: {
        totalRevenue,
        totalMaintenanceCosts,
        averageOccupancyRate,
        netIncome,
      },
      generatedAt: new Date(),
    };
  }

  /**
   * Calculate metrics for a single property
   *
   * @param property - Property to calculate metrics for
   * @param startDate - Start date of the period
   * @param endDate - End date of the period
   * @returns Property metrics
   */
  private async calculatePropertyMetrics(
    property: Property,
    startDate: Date,
    endDate: Date
  ): Promise<PropertyPerformanceReport['properties'][0]> {
    // Fetch leases for this property in the date range
    const leasesQuery = query(
      collection(db, COLLECTIONS.LEASES),
      where('propertyId', '==', property.id),
      where('status', 'in', ['active', 'expired'])
    );
    const leasesSnapshot = await getDocs(leasesQuery);
    const leases = leasesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Lease[];

    // Calculate revenue from leases in the date range
    let revenue = 0;
    let daysOccupied = 0;

    for (const lease of leases) {
      const leaseStart =
        lease.startDate instanceof Timestamp ? lease.startDate.toDate() : new Date(lease.startDate);
      const leaseEnd =
        lease.endDate instanceof Timestamp ? lease.endDate.toDate() : new Date(lease.endDate);

      // Calculate overlap with report period
      const overlapStart = new Date(Math.max(leaseStart.getTime(), startDate.getTime()));
      const overlapEnd = new Date(Math.min(leaseEnd.getTime(), endDate.getTime()));

      if (overlapStart <= overlapEnd) {
        const overlapDays = Math.ceil(
          (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)
        );
        daysOccupied += overlapDays;

        // Calculate revenue (rent amount per month * months)
        const overlapMonths = overlapDays / 30;
        revenue += lease.rentAmount * overlapMonths;
      }
    }

    // Fetch maintenance costs for this property in the date range
    const maintenanceQuery = query(
      collection(db, COLLECTIONS.MAINTENANCE),
      where('propertyId', '==', property.id),
      where('status', '==', 'completed')
    );
    const maintenanceSnapshot = await getDocs(maintenanceQuery);
    const maintenanceRequests = maintenanceSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as MaintenanceRequest[];

    // Filter maintenance requests by date range
    const maintenanceCosts = maintenanceRequests
      .filter((req) => {
        const reqDate =
          req.createdAt instanceof Timestamp ? req.createdAt.toDate() : new Date(req.createdAt);
        return reqDate >= startDate && reqDate <= endDate;
      })
      .reduce((sum) => sum + 0, 0); // Note: Maintenance costs not tracked in current schema

    // Calculate days in period
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysVacant = totalDays - daysOccupied;
    const occupancyRate = totalDays > 0 ? (daysOccupied / totalDays) * 100 : 0;

    return {
      propertyId: property.id,
      address: `${property.address}, ${property.city}`,
      occupancyRate,
      revenue,
      maintenanceCosts,
      daysOccupied,
      daysVacant,
    };
  }

  /**
   * Generate financial report
   *
   * @param filters - Report filters
   * @returns Promise resolving to financial report
   */
  private async generateFinancialReport(filters: ReportFilters): Promise<FinancialReport> {
    const { landlordId, startDate, endDate } = filters;

    // Fetch all leases for the landlord
    const leasesQuery = query(
      collection(db, COLLECTIONS.LEASES),
      where('landlordId', '==', landlordId),
      where('status', 'in', ['active', 'expired'])
    );
    const leasesSnapshot = await getDocs(leasesQuery);
    const leases = leasesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Lease[];

    // Calculate rent income
    let rentIncome = 0;
    const transactions: FinancialReport['transactions'] = [];

    for (const lease of leases) {
      const leaseStart =
        lease.startDate instanceof Timestamp ? lease.startDate.toDate() : new Date(lease.startDate);
      const leaseEnd =
        lease.endDate instanceof Timestamp ? lease.endDate.toDate() : new Date(lease.endDate);

      // Calculate overlap with report period
      const overlapStart = new Date(Math.max(leaseStart.getTime(), startDate.getTime()));
      const overlapEnd = new Date(Math.min(leaseEnd.getTime(), endDate.getTime()));

      if (overlapStart <= overlapEnd) {
        const overlapDays = Math.ceil(
          (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)
        );
        const overlapMonths = overlapDays / 30;
        const income = lease.rentAmount * overlapMonths;
        rentIncome += income;

        transactions.push({
          date: overlapStart,
          description: `Rent income - Lease ${lease.id}`,
          type: 'income',
          amount: income,
          category: 'Rent',
        });
      }
    }

    // Fetch payments (commission paid)
    const paymentsQuery = query(
      collection(db, COLLECTIONS.PAYMENTS),
      where('landlordId', '==', landlordId)
    );
    const paymentsSnapshot = await getDocs(paymentsQuery);
    const payments = paymentsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Payment[];

    // Filter payments by date range
    const commissionPaid = payments
      .filter((payment) => {
        const paymentDate =
          payment.paymentDate instanceof Timestamp
            ? payment.paymentDate.toDate()
            : new Date(payment.paymentDate);
        return paymentDate >= startDate && paymentDate <= endDate;
      })
      .reduce((sum, payment) => sum + payment.amount, 0);

    // Add payment transactions
    payments
      .filter((payment) => {
        const paymentDate =
          payment.paymentDate instanceof Timestamp
            ? payment.paymentDate.toDate()
            : new Date(payment.paymentDate);
        return paymentDate >= startDate && paymentDate <= endDate;
      })
      .forEach((payment) => {
        const paymentDate =
          payment.paymentDate instanceof Timestamp
            ? payment.paymentDate.toDate()
            : new Date(payment.paymentDate);
        transactions.push({
          date: paymentDate,
          description: `Commission payment - ${payment.reference}`,
          type: 'expense',
          amount: payment.amount,
          category: 'Commission',
        });
      });

    // Fetch maintenance costs
    const properties = await propertyService.getLandlordProperties(landlordId!);
    let maintenanceCosts = 0;

    for (const property of properties) {
      const maintenanceQuery = query(
        collection(db, COLLECTIONS.MAINTENANCE),
        where('propertyId', '==', property.id),
        where('status', '==', 'completed')
      );
      const maintenanceSnapshot = await getDocs(maintenanceQuery);
      const maintenanceRequests = maintenanceSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as MaintenanceRequest[];

      // Filter by date range
      maintenanceRequests
        .filter((req) => {
          const reqDate =
            req.createdAt instanceof Timestamp ? req.createdAt.toDate() : new Date(req.createdAt);
          return reqDate >= startDate && reqDate <= endDate;
        })
        .forEach((req) => {
          const reqDate =
            req.createdAt instanceof Timestamp ? req.createdAt.toDate() : new Date(req.createdAt);
          // Note: Maintenance costs not tracked in current schema, using placeholder
          const cost = 0;
          maintenanceCosts += cost;

          if (cost > 0) {
            transactions.push({
              date: reqDate,
              description: `Maintenance - ${req.category}`,
              type: 'expense',
              amount: cost,
              category: 'Maintenance',
            });
          }
        });
    }

    // Sort transactions by date
    transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

    const totalIncome = rentIncome;
    const totalExpenses = commissionPaid + maintenanceCosts;
    const netIncome = totalIncome - totalExpenses;

    return {
      reportId: this.generateReportId(),
      type: 'financial',
      landlordId: landlordId!,
      dateRange: { startDate, endDate },
      income: {
        rentIncome,
        otherIncome: 0,
        totalIncome,
      },
      expenses: {
        maintenanceCosts,
        commissionPaid,
        otherExpenses: 0,
        totalExpenses,
      },
      netIncome,
      transactions,
      generatedAt: new Date(),
    };
  }

  /**
   * Export report to specified format
   *
   * @param report - Report to export
   * @param format - Export format (pdf, csv, excel)
   * @returns Promise resolving to exported data as string
   */
  async exportReport(report: Report, format: ExportFormat): Promise<string> {
    switch (format) {
      case 'csv':
        return this.exportToCSV(report);
      case 'pdf':
        return this.exportToPDF(report);
      case 'excel':
        return this.exportToExcel(report);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export report to CSV format
   *
   * @param report - Report to export
   * @returns CSV string
   */
  private exportToCSV(report: Report): string {
    if (report.type === 'property_performance') {
      return this.exportPropertyPerformanceToCSV(report);
    } else {
      return this.exportFinancialToCSV(report);
    }
  }

  /**
   * Export property performance report to CSV
   *
   * @param report - Property performance report
   * @returns CSV string
   */
  private exportPropertyPerformanceToCSV(report: PropertyPerformanceReport): string {
    const lines: string[] = [];

    // Header
    lines.push('Property Performance Report');
    lines.push(`Generated: ${report.generatedAt.toISOString()}`);
    lines.push(
      `Period: ${report.dateRange.startDate.toISOString()} to ${report.dateRange.endDate.toISOString()}`
    );
    lines.push('');

    // Property data
    lines.push(
      'Property ID,Address,Occupancy Rate (%),Revenue,Maintenance Costs,Days Occupied,Days Vacant'
    );
    report.properties.forEach((prop) => {
      lines.push(
        `${prop.propertyId},"${prop.address}",${prop.occupancyRate.toFixed(2)},${prop.revenue.toFixed(2)},${prop.maintenanceCosts.toFixed(2)},${prop.daysOccupied},${prop.daysVacant}`
      );
    });

    // Summary
    lines.push('');
    lines.push('Summary');
    lines.push(`Total Revenue,${report.summary.totalRevenue.toFixed(2)}`);
    lines.push(`Total Maintenance Costs,${report.summary.totalMaintenanceCosts.toFixed(2)}`);
    lines.push(`Average Occupancy Rate,${report.summary.averageOccupancyRate.toFixed(2)}%`);
    lines.push(`Net Income,${report.summary.netIncome.toFixed(2)}`);

    return lines.join('\n');
  }

  /**
   * Export financial report to CSV
   *
   * @param report - Financial report
   * @returns CSV string
   */
  private exportFinancialToCSV(report: FinancialReport): string {
    const lines: string[] = [];

    // Header
    lines.push('Financial Report');
    lines.push(`Generated: ${report.generatedAt.toISOString()}`);
    lines.push(
      `Period: ${report.dateRange.startDate.toISOString()} to ${report.dateRange.endDate.toISOString()}`
    );
    lines.push('');

    // Income
    lines.push('Income');
    lines.push(`Rent Income,${report.income.rentIncome.toFixed(2)}`);
    lines.push(`Other Income,${report.income.otherIncome.toFixed(2)}`);
    lines.push(`Total Income,${report.income.totalIncome.toFixed(2)}`);
    lines.push('');

    // Expenses
    lines.push('Expenses');
    lines.push(`Maintenance Costs,${report.expenses.maintenanceCosts.toFixed(2)}`);
    lines.push(`Commission Paid,${report.expenses.commissionPaid.toFixed(2)}`);
    lines.push(`Other Expenses,${report.expenses.otherExpenses.toFixed(2)}`);
    lines.push(`Total Expenses,${report.expenses.totalExpenses.toFixed(2)}`);
    lines.push('');

    // Net Income
    lines.push(`Net Income,${report.netIncome.toFixed(2)}`);
    lines.push('');

    // Transactions
    lines.push('Transactions');
    lines.push('Date,Description,Type,Amount,Category');
    report.transactions.forEach((txn) => {
      lines.push(
        `${txn.date.toISOString()},"${txn.description}",${txn.type},${txn.amount.toFixed(2)},${txn.category}`
      );
    });

    return lines.join('\n');
  }

  /**
   * Export report to PDF format (placeholder)
   *
   * @param report - Report to export
   * @returns PDF data as string (placeholder)
   */
  private exportToPDF(report: Report): string {
    // Note: PDF generation would typically use a library like jsPDF or pdfmake
    // This is a placeholder implementation
    return `PDF export not yet implemented. Report ID: ${report.reportId}`;
  }

  /**
   * Export report to Excel format (placeholder)
   *
   * @param report - Report to export
   * @returns Excel data as string (placeholder)
   */
  private exportToExcel(report: Report): string {
    // Note: Excel generation would typically use a library like xlsx or exceljs
    // This is a placeholder implementation
    return `Excel export not yet implemented. Report ID: ${report.reportId}`;
  }

  /**
   * Generate a unique report ID
   *
   * @returns Unique report ID
   */
  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const reportingService = new ReportingService();
export default reportingService;
