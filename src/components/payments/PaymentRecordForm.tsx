import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { paymentService, PaymentDTO } from '../../services/paymentService';
import { Invoice, PaymentMethod } from '../../types/firebase';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Payment Record Form Component
 * Form for recording commission payments
 *
 * Requirements: 8.3 - Commission and Payment Tracking
 */
const PaymentRecordForm: React.FC = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [reference, setReference] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadInvoice();
  }, [invoiceId]);

  const loadInvoice = async () => {
    if (!invoiceId) return;

    try {
      setLoading(true);
      setError(null);

      const invoiceData = await paymentService.getInvoice(invoiceId);

      if (!invoiceData) {
        setError('Invoice not found');
        return;
      }

      // Check if user is authorized
      if (currentUser && invoiceData.landlordId !== currentUser.uid) {
        setError('You are not authorized to make payments for this invoice');
        return;
      }

      setInvoice(invoiceData);

      // Get remaining balance and set as default amount
      const payments = await paymentService.getPaymentHistory(invoiceData.landlordId);
      const invoicePayments = payments.filter((p) => p.invoiceId === invoiceId);
      const totalPaid = invoicePayments.reduce((sum, p) => sum + p.amount, 0);
      const remainingBalance = invoiceData.amount - totalPaid;

      setAmount(remainingBalance.toFixed(2));
    } catch (err: any) {
      console.error('Error loading invoice:', err);
      setError(err.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invoiceId || !invoice) {
      setError('Invoice not found');
      return;
    }

    // Validate form
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }

    if (amountNum > invoice.amount) {
      setError('Payment amount cannot exceed invoice amount');
      return;
    }

    if (!reference.trim()) {
      setError('Please enter a payment reference');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const paymentData: PaymentDTO = {
        amount: amountNum,
        paymentMethod,
        reference: reference.trim(),
        paymentDate: new Date(paymentDate),
      };

      await paymentService.recordPayment(invoiceId, paymentData);

      setSuccess(true);

      // Redirect to invoice page after 2 seconds
      setTimeout(() => {
        navigate(`/invoices/${invoiceId}`);
      }, 2000);
    } catch (err: any) {
      console.error('Error recording payment:', err);
      setError(err.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <button
          onClick={() => navigate('/payments')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          ← Back to Payment History
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <p className="font-semibold">Payment recorded successfully!</p>
          <p className="text-sm mt-1">Redirecting to invoice...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/invoices/${invoiceId}`)}
          className="text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Back to Invoice
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Record Payment</h1>

        {invoice && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Invoice Amount:</span>
              <span className="font-semibold">
                R
                {invoice.amount.toLocaleString('en-ZA', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Due Date:</span>
              <span className="font-semibold">{invoice.dueDate.toDate().toLocaleDateString()}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Payment Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">R</span>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="0.01"
                max={invoice?.amount}
                required
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Maximum: R
              {invoice?.amount.toLocaleString('en-ZA', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          {/* Payment Method */}
          <div>
            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <select
              id="paymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="card">Card</option>
              <option value="cash">Cash</option>
            </select>
          </div>

          {/* Payment Reference */}
          <div>
            <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-2">
              Payment Reference <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Transaction ID, Check number"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter your transaction reference or confirmation number
            </p>
          </div>

          {/* Payment Date */}
          <div>
            <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-2">
              Payment Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="paymentDate"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? 'Recording Payment...' : 'Record Payment'}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/invoices/${invoiceId}`)}
              className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This form is for recording payments that have already been made.
            Please ensure you have completed the actual payment transaction before recording it
            here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentRecordForm;
