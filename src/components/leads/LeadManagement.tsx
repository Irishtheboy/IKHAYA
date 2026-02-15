import React, { useState, useEffect } from 'react';
import { leadService } from '../../services/leadService';
import { propertyService } from '../../services/propertyService';
import { Lead, LeadStatus, Property } from '../../types/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * Lead Management Component
 * Displays all leads for a landlord with filtering and status management
 *
 * Requirements: 4.2, 4.3, 4.5, 4.6 - Lead Generation and Communication
 */
export const LeadManagement: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [properties, setProperties] = useState<Map<string, Property>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<LeadStatus | 'all'>('all');

  useEffect(() => {
    if (!currentUser || !userProfile) return;

    const fetchLeadsAndProperties = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch leads based on user role
        let leadsData: Lead[];
        if (userProfile.role === 'landlord') {
          leadsData = await leadService.getLeadsForLandlord(currentUser.uid);
        } else {
          leadsData = await leadService.getLeadsForTenant(currentUser.uid);
        }

        setLeads(leadsData);

        // Fetch property details for each lead
        const propertyIds = Array.from(new Set(leadsData.map((lead) => lead.propertyId)));
        const propertiesMap = new Map<string, Property>();

        await Promise.all(
          propertyIds.map(async (propertyId) => {
            const property = await propertyService.getProperty(propertyId);
            if (property) {
              propertiesMap.set(propertyId, property);
            }
          })
        );

        setProperties(propertiesMap);
      } catch (err: any) {
        setError(err.message || 'Failed to load leads');
      } finally {
        setLoading(false);
      }
    };

    fetchLeadsAndProperties();
  }, [currentUser, userProfile]);

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    try {
      await leadService.updateLeadStatus(leadId, newStatus);

      // Update local state
      setLeads((prevLeads) =>
        prevLeads.map((lead) => (lead.id === leadId ? { ...lead, status: newStatus } : lead))
      );
    } catch (err: any) {
      setError(err.message || 'Failed to update lead status');
    }
  };

  const handleViewLead = (leadId: string) => {
    navigate(`/leads/${leadId}`);
  };

  const filteredLeads =
    filterStatus === 'all' ? leads : leads.filter((lead) => lead.status === filterStatus);

  const getStatusBadgeColor = (status: LeadStatus) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800';
      case 'scheduled':
        return 'bg-purple-100 text-purple-800';
      case 'converted':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading leads...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Lead Management</h1>
        <p className="text-gray-600">Manage inquiries for your properties</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-md transition-colors ${
            filterStatus === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All ({leads.length})
        </button>
        {(['new', 'contacted', 'scheduled', 'converted', 'closed'] as LeadStatus[]).map(
          (status) => {
            const count = leads.filter((lead) => lead.status === status).length;
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-md transition-colors capitalize ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {status} ({count})
              </button>
            );
          }
        )}
      </div>

      {/* Leads List */}
      {filteredLeads.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg">
            {filterStatus === 'all'
              ? 'No leads yet. Your property inquiries will appear here.'
              : `No ${filterStatus} leads.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLeads.map((lead) => {
            const property = properties.get(lead.propertyId);
            return (
              <div
                key={lead.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-1">
                      {property?.address || 'Property'}
                    </h3>
                    <p className="text-gray-600 text-sm">{formatDate(lead.createdAt)}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusBadgeColor(
                      lead.status
                    )}`}
                  >
                    {lead.status}
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-gray-700 line-clamp-2">{lead.initialMessage}</p>
                </div>

                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => handleViewLead(lead.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    View & Reply
                  </button>

                  <select
                    value={lead.status}
                    onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="converted">Converted</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LeadManagement;
