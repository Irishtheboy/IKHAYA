import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Property, Lead, Lease, MaintenanceRequest } from '../types/firebase';
import { COLLECTIONS } from '../types/firestore-schema';
import { propertyService } from './propertyService';
import { leadService } from './leadService';
import { leaseService } from './leaseService';

/**
 * Time series data point for trend graphs
 */
export interface TimeSeriesData {
  date: Date;
  value: number;
}

/**
 * Property performance metrics
 */
export interface PropertyPerformance {
  propertyId: string;
  propertyAddress: string;
  views: number;
  leads: number;
  conversionRate: number;
}

/**
 * Landlord dashboard data
 */
export interface LandlordDashboard {
  activeListings: number;
  totalLeads: number;
  occupancyRate: number;
  monthlyRevenue: number;
  leadTrends: TimeSeriesData[];
  propertyPerformance: PropertyPerformance[];
}

/**
 * Tenant dashboard data
 */
export interface TenantDashboard {
  savedProperties: Property[];
  activeInquiries: Lead[];
  currentLease?: Lease;
  maintenanceRequests: MaintenanceRequest[];
}

/**
 * Analytics Service
 * Provides dashboard metrics and analytics data for landlords and tenants
 */
class AnalyticsService {
  /**
   * Get landlord dashboard with key metrics and analytics
   *
   * @param landlordId - ID of the landlord
   * @returns Promise resolving to landlord dashboard data
   */
  async getLandlordDashboard(landlordId: string): Promise<LandlordDashboard> {
    try {
      // Fetch all properties for the landlord
      const properties = await propertyService.getLandlordProperties(landlordId);

      // Calculate active listings
      const activeListings = properties.filter((p) => p.status === 'available').length;

      // Fetch all leads for the landlord
      const leads = await leadService.getLeadsForLandlord(landlordId);
      const totalLeads = leads.length;

      // Calculate occupancy rate
      const totalProperties = properties.length;
      const occupiedProperties = properties.filter((p) => p.status === 'occupied').length;
      const occupancyRate = totalProperties > 0 ? (occupiedProperties / totalProperties) * 100 : 0;

      // Calculate monthly revenue from active leases
      const activeLeases = await leaseService.getActiveLeasesForLandlord(landlordId);
      const monthlyRevenue = activeLeases.reduce((sum, lease) => sum + lease.rentAmount, 0);

      // Generate lead trends (last 30 days)
      const leadTrends = this.generateLeadTrends(leads, 30);

      // Calculate property performance
      const propertyPerformance = await this.calculatePropertyPerformance(properties, leads);

      return {
        activeListings,
        totalLeads,
        occupancyRate,
        monthlyRevenue,
        leadTrends,
        propertyPerformance,
      };
    } catch (error: any) {
      console.error('Error fetching landlord dashboard:', error);
      throw new Error(`Failed to fetch landlord dashboard: ${error.message}`);
    }
  }

  /**
   * Get tenant dashboard with saved properties and inquiries
   *
   * @param tenantId - ID of the tenant
   * @returns Promise resolving to tenant dashboard data
   */
  async getTenantDashboard(tenantId: string): Promise<TenantDashboard> {
    try {
      // Fetch saved properties (from user's savedProperties subcollection)
      const savedProperties = await this.getSavedProperties(tenantId);

      // Fetch active inquiries (leads)
      const activeInquiries = await leadService.getLeadsForTenant(tenantId);

      // Fetch current lease
      const activeLeases = await leaseService.getActiveLeasesForTenant(tenantId);
      const currentLease = activeLeases.length > 0 ? activeLeases[0] : undefined;

      // Fetch maintenance requests
      const maintenanceRequests = await this.getMaintenanceRequestsForTenant(tenantId);

      return {
        savedProperties,
        activeInquiries,
        currentLease,
        maintenanceRequests,
      };
    } catch (error: any) {
      console.error('Error fetching tenant dashboard:', error);
      throw new Error(`Failed to fetch tenant dashboard: ${error.message}`);
    }
  }

  /**
   * Generate lead trends over the specified number of days
   *
   * @param leads - Array of leads
   * @param days - Number of days to include in trends
   * @returns Array of time series data points
   */
  private generateLeadTrends(leads: Lead[], days: number): TimeSeriesData[] {
    const trends: TimeSeriesData[] = [];
    const now = new Date();

    // Initialize data points for each day
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      trends.push({
        date,
        value: 0,
      });
    }

    // Count leads for each day
    leads.forEach((lead) => {
      const leadDate =
        lead.createdAt instanceof Timestamp ? lead.createdAt.toDate() : new Date(lead.createdAt);
      leadDate.setHours(0, 0, 0, 0);

      const trendPoint = trends.find((t) => t.date.getTime() === leadDate.getTime());
      if (trendPoint) {
        trendPoint.value++;
      }
    });

    return trends;
  }

  /**
   * Calculate property performance metrics
   *
   * @param properties - Array of properties
   * @param leads - Array of leads
   * @returns Array of property performance data
   */
  private async calculatePropertyPerformance(
    properties: Property[],
    leads: Lead[]
  ): Promise<PropertyPerformance[]> {
    const performance: PropertyPerformance[] = [];

    for (const property of properties) {
      // Count leads for this property
      const propertyLeads = leads.filter((l) => l.propertyId === property.id);
      const leadCount = propertyLeads.length;

      // Calculate conversion rate (leads that were converted)
      const convertedLeads = propertyLeads.filter((l) => l.status === 'converted').length;
      const conversionRate = leadCount > 0 ? (convertedLeads / leadCount) * 100 : 0;

      performance.push({
        propertyId: property.id,
        propertyAddress: `${property.address}, ${property.city}`,
        views: property.viewCount || 0,
        leads: leadCount,
        conversionRate,
      });
    }

    // Sort by leads (descending)
    performance.sort((a, b) => b.leads - a.leads);

    return performance;
  }

  /**
   * Get saved properties for a tenant
   *
   * @param tenantId - ID of the tenant
   * @returns Promise resolving to array of saved properties
   */
  private async getSavedProperties(tenantId: string): Promise<Property[]> {
    try {
      // Query savedProperties subcollection
      const savedPropertiesPath = `users/${tenantId}/savedProperties`;
      const savedPropertiesQuery = query(collection(db, savedPropertiesPath));
      const querySnapshot = await getDocs(savedPropertiesQuery);

      // Fetch full property details for each saved property
      const properties: Property[] = [];
      for (const doc of querySnapshot.docs) {
        const propertyId = doc.id;
        const property = await propertyService.getProperty(propertyId);
        if (property) {
          properties.push(property);
        }
      }

      return properties;
    } catch (error: any) {
      console.error('Error fetching saved properties:', error);
      // Return empty array if subcollection doesn't exist
      return [];
    }
  }

  /**
   * Get maintenance requests for a tenant
   *
   * @param tenantId - ID of the tenant
   * @returns Promise resolving to array of maintenance requests
   */
  private async getMaintenanceRequestsForTenant(tenantId: string): Promise<MaintenanceRequest[]> {
    try {
      const maintenanceQuery = query(
        collection(db, COLLECTIONS.MAINTENANCE),
        where('tenantId', '==', tenantId)
      );

      const querySnapshot = await getDocs(maintenanceQuery);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data() as Omit<MaintenanceRequest, 'id'>;
        return {
          id: doc.id,
          ...data,
        };
      });
    } catch (error: any) {
      console.error('Error fetching maintenance requests for tenant:', error);
      return [];
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
export default analyticsService;
