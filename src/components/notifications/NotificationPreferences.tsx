import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { notificationService } from '../../services/notificationService';
import { NotificationPreferences as NotificationPreferencesType, NotificationType } from '../../types/firebase';

/**
 * Notification Preferences Component
 * Allows users to configure their notification preferences
 * 
 * Requirements: 11.2, 11.5 - Notification System
 */
export const NotificationPreferences: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferencesType>({
    email: true,
    sms: false,
    inApp: true,
    types: {
      new_lead: true,
      new_message: true,
      maintenance_request: true,
      lease_expiring: true,
      payment_due: true,
      payment_received: true,
      listing_approved: true,
    },
  });

  useEffect(() => {
    loadPreferences();
  }, [currentUser]);

  const loadPreferences = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const userPrefs = await notificationService.getPreferences(currentUser.uid);
      setPreferences(userPrefs.notifications);
    } catch (error) {
      console.error('Error loading preferences:', error);
      setMessage({ type: 'error', text: 'Failed to load preferences' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;

    try {
      setSaving(true);
      setMessage(null);
      await notificationService.updatePreferences(currentUser.uid, preferences);
      setMessage({ type: 'success', text: 'Preferences saved successfully' });
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage({ type: 'error', text: 'Failed to save preferences' });
    } finally {
      setSaving(false);
    }
  };

  const handleChannelChange = (channel: 'email' | 'sms' | 'inApp', value: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      [channel]: value,
    }));
  };

  const handleTypeChange = (type: NotificationType, value: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      types: {
        ...prev.types,
        [type]: value,
      },
    }));
  };

  const notificationTypeLabels: Record<NotificationType, { label: string; description: string }> = {
    new_lead: {
      label: 'New Leads',
      description: 'When a tenant expresses interest in your property',
    },
    new_message: {
      label: 'New Messages',
      description: 'When you receive a message from a landlord or tenant',
    },
    maintenance_request: {
      label: 'Maintenance Requests',
      description: 'When a maintenance request is submitted or updated',
    },
    lease_expiring: {
      label: 'Lease Expiring',
      description: 'When a lease is approaching its expiration date',
    },
    payment_due: {
      label: 'Payment Due',
      description: 'When a commission payment is due',
    },
    payment_received: {
      label: 'Payment Received',
      description: 'When a payment is received and processed',
    },
    listing_approved: {
      label: 'Listing Approved',
      description: 'When your property listing is approved',
    },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Notification Preferences</h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage how you receive notifications from IKHAYA RENT PROPERTIES
          </p>
        </div>

        <div className="px-6 py-6 space-y-8">
          {/* Message */}
          {message && (
            <div
              className={`p-4 rounded-md ${
                message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  {message.type === 'success' ? (
                    <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{message.text}</p>
                </div>
              </div>
            </div>
          )}

          {/* Notification Channels */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Channels</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Notifications
                  </label>
                  <p className="text-sm text-gray-500">Receive notifications via email</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleChannelChange('email', !preferences.email)}
                  className={`${
                    preferences.email ? 'bg-indigo-600' : 'bg-gray-200'
                  } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                >
                  <span
                    className={`${
                      preferences.email ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="sms" className="text-sm font-medium text-gray-700">
                    SMS Notifications
                  </label>
                  <p className="text-sm text-gray-500">Receive notifications via SMS (coming soon)</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleChannelChange('sms', !preferences.sms)}
                  disabled
                  className="bg-gray-200 relative inline-flex h-6 w-11 flex-shrink-0 cursor-not-allowed rounded-full border-2 border-transparent opacity-50"
                >
                  <span className="translate-x-0 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="inApp" className="text-sm font-medium text-gray-700">
                    In-App Notifications
                  </label>
                  <p className="text-sm text-gray-500">Receive notifications in the application</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleChannelChange('inApp', !preferences.inApp)}
                  className={`${
                    preferences.inApp ? 'bg-indigo-600' : 'bg-gray-200'
                  } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                >
                  <span
                    className={`${
                      preferences.inApp ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Notification Types */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Types</h3>
            <div className="space-y-4">
              {(Object.keys(notificationTypeLabels) as NotificationType[]).map((type) => (
                <div key={type} className="flex items-center justify-between">
                  <div>
                    <label htmlFor={type} className="text-sm font-medium text-gray-700">
                      {notificationTypeLabels[type].label}
                    </label>
                    <p className="text-sm text-gray-500">{notificationTypeLabels[type].description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTypeChange(type, !preferences.types[type])}
                    className={`${
                      preferences.types[type] ? 'bg-indigo-600' : 'bg-gray-200'
                    } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                  >
                    <span
                      className={`${
                        preferences.types[type] ? 'translate-x-5' : 'translate-x-0'
                      } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Save Preferences'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
