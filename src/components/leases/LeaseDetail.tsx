import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { leaseService } from '../../services/leaseService';
import { propertyService } from '../../services/propertyService';
import { Lease, Property } from '../../types/firebase';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Lease Detail and Signing Component
 * Displays lease details and allows parties to review and sign
 *
 * Requirements: 5.2, 5.3 - Lease Agreement Management
 */
const LeaseDetail: React.FC = () => {
  const { leaseId } = useParams<{ leaseId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [lease, setLease] = useState<Lease | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [terminating, setTerminating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [signatureInput, setSignatureInput] = useState('');
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  useEffect(() => {
    loadLeaseData();
  }, [leaseId]);

  const loadLeaseData = async () => {
    if (!leaseId) return;

    try {
      setLoading(true);
      setError(null);

      const leaseData = await leaseService.getLease(leaseId);
      if (!leaseData) {
        setError('Lease not found');
        return;
      }

      setLease(leaseData);

      // Load property data
      const propertyData = await propertyService.getProperty(leaseData.propertyId);
      setProperty(propertyData);
    } catch (err: any) {
      console.error('Error loading lease:', err);
      setError(err.message || 'Failed to load lease');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!lease || !currentUser || !signatureInput.trim()) {
      setError('Please enter your signature');
      return;
    }

    try {
      setSigning(true);
      setError(null);
      setSuccess(null);

      await leaseService.signLease(leaseId!, currentUser.uid, signatureInput);

      setSuccess('Lease signed successfully!');
      setShowSignatureModal(false);
      setSignatureInput('');

      // Reload lease data
      await loadLeaseData();
    } catch (err: any) {
      console.error('Error signing lease:', err);
      setError(err.message || 'Failed to sign lease');
    } finally {
      setSigning(false);
    }
  };

  const handleTerminate = async () => {
    if (!lease || !currentUser) return;

    if (!window.confirm('Are you sure you want to terminate this lease? This action cannot be undone.')) {
      return;
    }

    try {
      setTerminating(true);
      setError(null);
      setSuccess(null);

      await leaseService.terminateLease(leaseId!);

      setSuccess('Lease terminated successfully');

      // Reload lease data
      await loadLeaseData();
    } catch (err: any) {
      console.error('Error terminating lease:', err);
      setError(err.message || 'Failed to terminate lease');
    } finally {
      setTerminating(false);
    }
  };

  const canSign = () => {
    if (!lease || !currentUser) return false;

    const isLandlord = currentUser.uid === lease.landlordId;
    const isTenant = currentUser.uid === lease.tenantId;

    if (!isLandlord && !isTenant) return false;

    if (lease.status !== 'draft' && lease.status !== 'pending_signatures') return false;

    if (isLandlord && lease.landlordSignature) return false;
    if (isTenant && lease.tenantSignature) return false;

    return true;
  };

  const canTerminate = () => {
    if (!lease || !currentUser) return false;
    return lease.status === 'active' && currentUser.uid === lease.landlordId;
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      draft: 'bg-gray-200 text-gray-800',
      pending_signatures: 'bg-yellow-200 text-yellow-800',
      active: 'bg-green-200 text-green-800',
      expired: 'bg-red-200 text-red-800',
      terminated: 'bg-red-200 text-red-800',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status] || 'bg-gray-200 text-gray-800'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading lease...</div>
      </div>
    );
  }

  if (error && !lease) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <button
          onClick={() => navigate('/leases')}
          className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
        >
          Back to Leases
        </button>
      </div>
    );
  }

  if (!lease) return null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/leases')}
          className="text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Back to Leases
        </button>
        <div className="flex justify-between items-start">
          <h1 className="text-3xl font-bold">Lease Agreement</h1>
          {getStatusBadge(lease.status)}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Property Information */}
      {property && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Property</h2>
          <div className="space-y-2">
            <p><span className="font-medium">Address:</span> {property.address}</p>
            <p><span className="font-medium">City:</span> {property.city}</p>
            <p><span className="font-medium">Type:</span> {property.propertyType}</p>
            <p><span className="font-medium">Bedrooms:</span> {property.bedrooms}</p>
            <p><span className="font-medium">Bathrooms:</span> {property.bathrooms}</p>
          </div>
        </div>
      )}

      {/* Lease Details */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Lease Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Monthly Rent</p>
            <p className="text-lg font-semibold">R{lease.rentAmount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Deposit</p>
            <p className="text-lg font-semibold">R{lease.deposit.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Start Date</p>
            <p className="text-lg font-semibold">{lease.startDate.toDate().toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">End Date</p>
            <p className="text-lg font-semibold">{lease.endDate.toDate().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Signatures</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
            <div>
              <p className="font-medium">Landlord</p>
              <p className="text-sm text-gray-600">ID: {lease.landlordId}</p>
            </div>
            <div>
              {lease.landlordSignature ? (
                <span className="text-green-600 font-medium">✓ Signed</span>
              ) : (
                <span className="text-gray-400">Not signed</span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
            <div>
              <p className="font-medium">Tenant</p>
              <p className="text-sm text-gray-600">ID: {lease.tenantId}</p>
            </div>
            <div>
              {lease.tenantSignature ? (
                <span className="text-green-600 font-medium">✓ Signed</span>
              ) : (
                <span className="text-gray-400">Not signed</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Terms and Conditions</h2>
        <div className="prose max-w-none">
          <pre className="whitespace-pre-wrap font-sans text-sm">{lease.terms}</pre>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        {canSign() && (
          <button
            onClick={() => setShowSignatureModal(true)}
            className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Sign Lease
          </button>
        )}

        {canTerminate() && (
          <button
            onClick={handleTerminate}
            disabled={terminating}
            className="bg-red-600 text-white py-2 px-6 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {terminating ? 'Terminating...' : 'Terminate Lease'}
          </button>
        )}
      </div>

      {/* Signature Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Sign Lease Agreement</h3>
            <p className="text-sm text-gray-600 mb-4">
              By signing this lease, you agree to all terms and conditions outlined above.
            </p>
            <div className="mb-4">
              <label htmlFor="signature" className="block text-sm font-medium text-gray-700 mb-2">
                Enter your full name as signature *
              </label>
              <input
                type="text"
                id="signature"
                value={signatureInput}
                onChange={(e) => setSignatureInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your full name"
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleSign}
                disabled={signing || !signatureInput.trim()}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {signing ? 'Signing...' : 'Confirm Signature'}
              </button>
              <button
                onClick={() => {
                  setShowSignatureModal(false);
                  setSignatureInput('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaseDetail;
