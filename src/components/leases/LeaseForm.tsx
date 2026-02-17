import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { leaseService, LeaseDTO } from '../../services/leaseService';
import { propertyService } from '../../services/propertyService';
import { Property } from '../../types/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface LeaseFormProps {
  propertyId?: string;
  tenantId?: string;
}

/**
 * Lease Creation Form Component
 * Allows landlords to create lease agreements for their properties
 *
 * Requirements: 5.1, 5.2 - Lease Agreement Management
 */
const LeaseForm: React.FC<LeaseFormProps> = ({
  propertyId: initialPropertyId,
  tenantId: initialTenantId,
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    propertyId: initialPropertyId || '',
    tenantId: initialTenantId || '',
    rentAmount: '',
    deposit: '',
    startDate: '',
    endDate: '',
    terms: '',
  });

  // Load landlord's properties
  useEffect(() => {
    const loadProperties = async () => {
      if (!currentUser?.uid) return;

      try {
        const landlordProperties = await propertyService.getLandlordProperties(currentUser.uid);
        setProperties(landlordProperties);
      } catch (err: any) {
        console.error('Error loading properties:', err);
        setError('Failed to load properties');
      }
    };

    loadProperties();
  }, [currentUser]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      // Validate form data
      if (!formData.propertyId) {
        throw new Error('Please select a property');
      }

      if (!formData.tenantId) {
        throw new Error('Please enter tenant ID');
      }

      if (!formData.rentAmount || parseFloat(formData.rentAmount) <= 0) {
        throw new Error('Please enter a valid rent amount');
      }

      if (!formData.deposit || parseFloat(formData.deposit) < 0) {
        throw new Error('Please enter a valid deposit amount');
      }

      if (parseFloat(formData.deposit) > 5000) {
        throw new Error('Deposit cannot exceed R5,000');
      }

      if (!formData.startDate) {
        throw new Error('Please select a start date');
      }

      if (!formData.endDate) {
        throw new Error('Please select an end date');
      }

      if (new Date(formData.endDate) <= new Date(formData.startDate)) {
        throw new Error('End date must be after start date');
      }

      if (!formData.terms || formData.terms.trim().length === 0) {
        throw new Error('Please enter lease terms');
      }

      // Create lease DTO
      const leaseData: LeaseDTO = {
        propertyId: formData.propertyId,
        landlordId: currentUser!.uid,
        tenantId: formData.tenantId,
        rentAmount: parseFloat(formData.rentAmount),
        deposit: parseFloat(formData.deposit),
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        terms: formData.terms,
      };

      // Create lease
      const lease = await leaseService.createLease(leaseData);

      setSuccess(true);
      setTimeout(() => {
        navigate(`/leases/${lease.id}`);
      }, 2000);
    } catch (err: any) {
      console.error('Error creating lease:', err);
      setError(err.message || 'Failed to create lease');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg mb-6 font-light">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-lg mb-6 font-light">
          Lease created successfully! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow-sm border border-slate-200 p-8">
        {/* Property Selection */}
        <div>
          <label htmlFor="propertyId" className="block text-sm font-light text-slate-700 mb-2">
            Property *
          </label>
          <select
            id="propertyId"
            name="propertyId"
            value={formData.propertyId}
            onChange={handleChange}
            disabled={!!initialPropertyId}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-light"
            required
          >
            <option value="">Select a property</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.address}, {property.city}
              </option>
            ))}
          </select>
        </div>

        {/* Tenant ID */}
        <div>
          <label htmlFor="tenantId" className="block text-sm font-light text-slate-700 mb-2">
            Tenant ID *
          </label>
          <input
            type="text"
            id="tenantId"
            name="tenantId"
            value={formData.tenantId}
            onChange={handleChange}
            disabled={!!initialTenantId}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-light"
            placeholder="Enter tenant user ID"
            required
          />
          <p className="text-sm text-slate-500 mt-2 font-light">
            The unique ID of the tenant from their user profile
          </p>
        </div>

        {/* Rent Amount */}
        <div>
          <label htmlFor="rentAmount" className="block text-sm font-light text-slate-700 mb-2">
            Monthly Rent Amount (R) *
          </label>
          <input
            type="number"
            id="rentAmount"
            name="rentAmount"
            value={formData.rentAmount}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-light"
            placeholder="5000"
            min="0"
            step="0.01"
            required
          />
        </div>

        {/* Deposit */}
        <div>
          <label htmlFor="deposit" className="block text-sm font-light text-slate-700 mb-2">
            Deposit Amount (R) * <span className="text-xs text-slate-500">(Maximum R5,000)</span>
          </label>
          <input
            type="number"
            id="deposit"
            name="deposit"
            min="0"
            max="5000"
            step="0.01"
            value={formData.deposit}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-light"
            placeholder="5000"
            required
          />
        </div>

        {/* Start Date */}
        <div>
          <label htmlFor="startDate" className="block text-sm font-light text-slate-700 mb-2">
            Start Date *
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-light"
            required
          />
        </div>

        {/* End Date */}
        <div>
          <label htmlFor="endDate" className="block text-sm font-light text-slate-700 mb-2">
            End Date *
          </label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-light"
            required
          />
        </div>

        {/* Terms */}
        <div>
          <label htmlFor="terms" className="block text-sm font-light text-slate-700 mb-2">
            Lease Terms and Conditions *
          </label>
          <textarea
            id="terms"
            name="terms"
            value={formData.terms}
            onChange={handleChange}
            rows={10}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-light"
            placeholder="Enter the complete lease terms and conditions..."
            required
          />
          <p className="text-sm text-slate-500 mt-2 font-light">
            Include all terms, conditions, rules, and responsibilities
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-slate-900 text-white py-3 px-6 rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-400 disabled:cursor-not-allowed font-light tracking-wide transition-colors"
          >
            {loading ? 'CREATING LEASE...' : 'CREATE LEASE'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 bg-slate-100 text-slate-700 py-3 px-6 rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 font-light tracking-wide transition-colors"
          >
            CANCEL
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeaseForm;
