import React, { useState } from 'react';
import { leadService } from '../../services/leadService';
import { useAuth } from '../../contexts/AuthContext';

interface LeadInquiryFormProps {
  propertyId: string;
  landlordId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Lead Inquiry Form Component
 * Allows tenants to express interest in a property and send an initial message
 *
 * Requirements: 4.1 - Lead Generation and Communication
 */
export const LeadInquiryForm: React.FC<LeadInquiryFormProps> = ({
  propertyId,
  landlordId,
  onSuccess,
  onCancel,
}) => {
  const { currentUser } = useAuth();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentUser) {
      setError('You must be logged in to send an inquiry');
      return;
    }

    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    setLoading(true);

    try {
      await leadService.createLead({
        tenantId: currentUser.uid,
        propertyId,
        landlordId,
        initialMessage: message.trim(),
      });

      setMessage('');
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send inquiry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Express Interest</h2>
      <p className="text-gray-600 mb-6">
        Send a message to the landlord to inquire about this property.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Your Message
          </label>
          <textarea
            id="message"
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Hi, I'm interested in this property. When can I schedule a viewing?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={1000}
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            {message.length}/1000 characters
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Sending...' : 'Send Inquiry'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default LeadInquiryForm;
