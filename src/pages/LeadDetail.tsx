import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { leadService } from '../services/leadService';
import { propertyService } from '../services/propertyService';
import { authService } from '../services/authService';
import { Lead, Property, User } from '../types/firebase';
import { useAuth } from '../contexts/AuthContext';
import MessagingInterface from '../components/leads/MessagingInterface';

export const LeadDetail: React.FC = () => {
  const { leadId } = useParams<{ leadId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!leadId || !currentUser) return;

    const fetchLeadDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const leadData = await leadService.getLead(leadId);
        if (!leadData) {
          setError('Lead not found');
          return;
        }

        if (leadData.tenantId !== currentUser.uid && leadData.landlordId !== currentUser.uid) {
          setError('You are not authorized to view this lead');
          return;
        }

        setLead(leadData);

        const propertyData = await propertyService.getProperty(leadData.propertyId);
        setProperty(propertyData);

        const otherUserId =
          leadData.tenantId === currentUser.uid ? leadData.landlordId : leadData.tenantId;
        const otherUserData = await authService.getUserProfile(otherUserId);
        setOtherUser(otherUserData);
      } catch (err: any) {
        setError(err.message || 'Failed to load lead details');
      } finally {
        setLoading(false);
      }
    };

    fetchLeadDetails();
  }, [leadId, currentUser]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  if (error || !lead || !property || !otherUser) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error || 'Failed to load lead details'}
          </div>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
          >
            ← Go Back
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 text-indigo-600 hover:text-indigo-800 flex items-center gap-2 font-medium"
        >
          <span>←</span> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4">Lead Information</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Property</h3>
                  <p className="font-semibold">{property.address}</p>
                  <p className="text-sm text-gray-600">
                    {property.city}, {property.province}
                  </p>
                  <p className="text-lg font-bold text-indigo-600 mt-2">
                    R{property.rentAmount.toLocaleString()}/month
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    {currentUser?.uid === lead.landlordId ? 'Tenant' : 'Landlord'}
                  </h3>
                  <p className="font-semibold">{otherUser.name}</p>
                  <p className="text-sm text-gray-600">{otherUser.email}</p>
                  {otherUser.phone && <p className="text-sm text-gray-600">{otherUser.phone}</p>}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                  <span className="inline-block px-3 py-1 rounded-full text-sm font-medium capitalize bg-indigo-100 text-indigo-800">
                    {lead.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Initial Message</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.initialMessage}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Created</h3>
                  <p className="text-sm text-gray-700">
                    {lead.createdAt &&
                      (lead.createdAt.toDate
                        ? lead.createdAt.toDate()
                        : new Date(lead.createdAt.seconds * 1000)
                      ).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="h-[600px]">
              <MessagingInterface leadId={lead.id} recipientName={otherUser.name} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LeadDetail;
