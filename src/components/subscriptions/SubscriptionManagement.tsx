import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { subscriptionService } from '../../services/subscriptionService';
import { Subscription } from '../../types/firebase';

interface SubscriptionManagementProps {
  landlordId: string;
}

const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({ landlordId }) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubscriptions();
  }, [landlordId]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const subs = await subscriptionService.getLandlordSubscriptions(landlordId);
      setSubscriptions(subs);
    } catch (err: any) {
      console.error('Error loading subscriptions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    return timestamp?.toDate().toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierBadge = (tier: string) => {
    if (tier === 'premium') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Premium
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-800">
        Standard
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
    );
  }

  const activeSubscription = subscriptions.find((sub) => sub.status === 'active');

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Subscription</h2>
        {!activeSubscription && (
          <Link
            to="/premium"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Upgrade to Premium
          </Link>
        )}
      </div>

      {activeSubscription ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                {getTierBadge(activeSubscription.tier)}
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activeSubscription.status)}`}
                >
                  {activeSubscription.status}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Valid until {formatDate(activeSubscription.endDate)}
              </p>
            </div>
            <Link to="/premium" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              Manage
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Start Date</p>
              <p className="font-medium text-gray-900">
                {formatDate(activeSubscription.startDate)}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Auto Renew</p>
              <p className="font-medium text-gray-900">
                {activeSubscription.autoRenew ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No active subscription</h3>
          <p className="mt-1 text-sm text-gray-500">
            Upgrade to premium for enhanced features and visibility
          </p>
        </div>
      )}

      {subscriptions.length > 1 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Subscription History</h3>
          <div className="space-y-2">
            {subscriptions.slice(1).map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between text-sm p-2 hover:bg-gray-50 rounded"
              >
                <div className="flex items-center space-x-2">
                  {getTierBadge(sub.tier)}
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sub.status)}`}
                  >
                    {sub.status}
                  </span>
                </div>
                <span className="text-gray-500">
                  {formatDate(sub.startDate)} - {formatDate(sub.endDate)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;
