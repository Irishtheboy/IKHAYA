import React, { useState, useEffect } from 'react';
import { paymentService } from '../../services/paymentService';
import { Payment, Invoice } from '../../types/firebase';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Payment History Component
 * Displays payment history for landlords
 *
 * Requirements: 8.3, 8.4 - Commission and Payment Tracking
 */
const PaymentHistory: React.FC = () => {
  const { currentUser } = useAuth();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [outstandingBalance, setOutstandingBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPaymentData();
  }, [currentUser]);

  const loadPaymentData = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);

      // Load payment history, invoices, and outstanding balance
      const [paymentsData, invoicesData, balance] = await Promise.all([
        paymentService.getPaymentHistory(currentUser.uid),
        paymentService.getInvoicesForLandlord(currentUser.uid),
        paymentService.getOutstandingBalance(currentUser.uid),
      ]);

      setPayments(paymentsData);
      setInvoices(invoicesData);
      setOutstandingBalance(balance);
    } catch (err: any) {
      console.error('Error loading payment data:', err);
      setError(err.message || 'Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodLabel = (method: string): string => {
    const labels: Record<string, string> = {
      bank_transfer: 'Bank Transfer',
      card: 'Card',
      cash: 'Cash',
    };
    return labels[method] || method;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading payment history...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Payment History</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Outstanding Balance Card */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-700">Outstanding Balance</h2>
            <p className="text-3xl font-bold text-red-600 mt-2">
              R
              {outstandingBalance.toLocaleString('en-ZA', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          {outstandingBalance > 0 && (
            <button
              onClick={() => {
                // Navigate to payment form or show payment modal
                const pendingInvoice = invoices.find(
                  (inv) => inv.status === 'pending' || inv.status === 'overdue'
                );
                if (pendingInvoice) {
                  window.location.href = `/invoices/${pendingInvoice.id}`;
                }
              }}
              className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Make Payment
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-600">Total Paid</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">
            R
            {payments
              .reduce((sum, p) => sum + p.amount, 0)
              .toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-600">Total Invoices</h3>
          <p className="text-2xl font-bold text-gray-800 mt-2">{invoices.length}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-600">Payments Made</h3>
          <p className="text-2xl font-bold text-gray-800 mt-2">{payments.length}</p>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Recent Payments</h2>
        </div>
        {payments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No payments recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.paymentDate.toDate().toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      R
                      {payment.amount.toLocaleString('en-ZA', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getPaymentMethodLabel(payment.paymentMethod)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {payment.reference}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <a
                        href={`/invoices/${payment.invoiceId}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        View Invoice
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;
