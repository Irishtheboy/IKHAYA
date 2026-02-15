import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { paymentService } from '../../services/paymentService';
import { Invoice, Payment } from '../../types/firebase';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Invoice Display Component
 * Displays detailed invoice information with payment option
 *
 * Requirements: 8.3, 8.4 - Commission and Payment Tracking
 */
const InvoiceDisplay: React.FC = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  useEffect(() => {
    loadInvoiceData();
  }, [invoiceId]);

  const loadInvoiceData = async () => {
    if (!invoiceId) return;

    try {
      setLoading(true);
      setError(null);

      // Load invoice
      const invoiceData = await paymentService.getInvoice(invoiceId);

      if (!invoiceData) {
        setError('Invoice not found');
        return;
      }

      // Check if user is authorized to view this invoice
      if (currentUser && invoiceData.landlordId !== currentUser.uid) {
        setError('You are not authorized to view this invoice');
        return;
      }

      setInvoice(invoiceData);

      // Load payments for this invoice
      const allPayments = await paymentService.getPaymentHistory(invoiceData.landlordId);
      const invoicePayments = allPayments.filter((p) => p.invoiceId === invoiceId);
      setPayments(invoicePayments);
    } catch (err: any) {
      console.error('Error loading invoice:', err);
      setError(err.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const getTotalPaid = (): number => {
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  };

  const getRemainingBalance = (): number => {
    if (!invoice) return 0;
    return invoice.amount - getTotalPaid();
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'bg-yellow-200 text-yellow-800',
      paid: 'bg-green-200 text-green-800',
      overdue: 'bg-red-200 text-red-800',
    };

    return (
      <span
        className={`px-3 py-1 text-sm font-semibold rounded-full ${statusColors[status] || 'bg-gray-200 text-gray-800'}`}
      >
        {status.toUpperCase()}
      </span>
    );
  };

  const getDaysUntilDue = (): number => {
    if (!invoice) return 0;
    const dueDate = invoice.dueDate.toDate();
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading invoice...</div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || 'Invoice not found'}
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

  const daysUntilDue = getDaysUntilDue();
  const remainingBalance = getRemainingBalance();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/payments')}
          className="text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Back to Payment History
        </button>
      </div>

      {/* Invoice Header */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Invoice</h1>
            <p className="text-gray-600">Invoice ID: {invoice.id}</p>
          </div>
          {getStatusBadge(invoice.status)}
        </div>

        {/* Due Date Warning */}
        {invoice.status !== 'paid' && daysUntilDue < 0 && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <p className="text-red-800 font-semibold">
              ⚠️ This invoice is {Math.abs(daysUntilDue)} days overdue
            </p>
          </div>
        )}

        {invoice.status !== 'paid' && daysUntilDue >= 0 && daysUntilDue <= 7 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <p className="text-yellow-800 font-semibold">
              ⚠️ This invoice is due in {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Invoice Details */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-sm text-gray-600">Issue Date</p>
            <p className="font-semibold">{invoice.createdAt.toDate().toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Due Date</p>
            <p className="font-semibold">{invoice.dueDate.toDate().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-lg font-semibold mb-4">Invoice Items</h2>
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-sm font-medium text-gray-600">Description</th>
                <th className="text-right py-2 text-sm font-medium text-gray-600">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="py-3 text-sm">{item.description}</td>
                  <td className="py-3 text-sm text-right">
                    R
                    {item.amount.toLocaleString('en-ZA', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Invoice Total */}
        <div className="border-t-2 border-gray-300 mt-6 pt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg font-semibold">Total Amount:</span>
            <span className="text-2xl font-bold">
              R
              {invoice.amount.toLocaleString('en-ZA', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          {payments.length > 0 && (
            <>
              <div className="flex justify-between items-center mb-2 text-green-600">
                <span className="text-sm">Total Paid:</span>
                <span className="text-lg font-semibold">
                  -R
                  {getTotalPaid().toLocaleString('en-ZA', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center text-red-600">
                <span className="text-lg font-semibold">Remaining Balance:</span>
                <span className="text-2xl font-bold">
                  R
                  {remainingBalance.toLocaleString('en-ZA', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Payment Button */}
        {invoice.status !== 'paid' && remainingBalance > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setShowPaymentForm(true)}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            >
              Make Payment
            </button>
          </div>
        )}
      </div>

      {/* Payment History for this Invoice */}
      {payments.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Payment History</h2>
          <div className="space-y-3">
            {payments.map((payment) => (
              <div key={payment.id} className="flex justify-between items-center border-b pb-3">
                <div>
                  <p className="font-semibold">
                    R
                    {payment.amount.toLocaleString('en-ZA', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    {payment.paymentDate.toDate().toLocaleDateString()} - {payment.paymentMethod}
                  </p>
                  <p className="text-xs text-gray-500">Ref: {payment.reference}</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  PAID
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Record Payment</h2>
            <p className="text-gray-600 mb-4">
              Please record your payment details. This is for tracking purposes only.
            </p>
            <button
              onClick={() => {
                setShowPaymentForm(false);
                navigate(`/payments/record/${invoice.id}`);
              }}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 mb-2"
            >
              Go to Payment Form
            </button>
            <button
              onClick={() => setShowPaymentForm(false)}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDisplay;
