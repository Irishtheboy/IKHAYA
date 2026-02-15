import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Invoice, Payment, InvoiceItem, InvoiceStatus, PaymentMethod } from '../types/firebase';
import { COLLECTIONS } from '../types/firestore-schema';

/**
 * Data Transfer Object for payment recording
 */
export interface PaymentDTO {
  amount: number;
  paymentMethod: PaymentMethod;
  reference: string;
  paymentDate: Date;
}

/**
 * Payment Service
 * Handles commission calculations, invoice generation, payment recording, and balance tracking
 */
class PaymentService {
  // Default commission rate (10%)
  private readonly DEFAULT_COMMISSION_RATE = 0.1;

  /**
   * Calculate commission for a lease
   *
   * @param leaseId - ID of the lease
   * @returns Promise resolving to the commission amount
   * @throws Error if calculation fails or lease not found
   */
  async calculateCommission(leaseId: string): Promise<number> {
    try {
      // Fetch lease to get rent amount
      const leaseRef = doc(db, COLLECTIONS.LEASES, leaseId);
      const leaseSnap = await getDoc(leaseRef);

      if (!leaseSnap.exists()) {
        throw new Error('Lease not found');
      }

      const lease = leaseSnap.data();
      const rentAmount = lease.rentAmount;

      if (!rentAmount || rentAmount <= 0) {
        throw new Error('Invalid rent amount in lease');
      }

      // Calculate commission (rent amount * commission rate)
      const commission = rentAmount * this.DEFAULT_COMMISSION_RATE;

      return commission;
    } catch (error: any) {
      console.error('Error calculating commission:', error);
      throw new Error(`Failed to calculate commission: ${error.message}`);
    }
  }

  /**
   * Generate invoice for a landlord for a specific month
   *
   * @param landlordId - ID of the landlord
   * @param month - Date representing the month (any date within the month)
   * @returns Promise resolving to the generated invoice
   * @throws Error if generation fails
   */
  async generateInvoice(landlordId: string, month: Date): Promise<Invoice> {
    try {
      // Validate inputs
      if (!landlordId || landlordId.trim().length === 0) {
        throw new Error('Landlord ID is required');
      }

      if (!month) {
        throw new Error('Month is required');
      }

      // Get all active leases for the landlord
      const leasesQuery = query(
        collection(db, COLLECTIONS.LEASES),
        where('landlordId', '==', landlordId),
        where('status', '==', 'active')
      );

      const leasesSnapshot = await getDocs(leasesQuery);

      if (leasesSnapshot.empty) {
        throw new Error('No active leases found for landlord');
      }

      // Calculate commission for each lease and build invoice items
      const items: InvoiceItem[] = [];
      let totalAmount = 0;

      for (const leaseDoc of leasesSnapshot.docs) {
        const lease = leaseDoc.data();
        const commission = await this.calculateCommission(leaseDoc.id);

        items.push({
          leaseId: leaseDoc.id,
          description: `Commission for property ${lease.propertyId}`,
          amount: commission,
        });

        totalAmount += commission;
      }

      // Calculate due date (15 days from invoice creation)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 15);

      // Create invoice document
      const invoiceRef = doc(collection(db, COLLECTIONS.INVOICES));

      const invoiceDoc: Omit<Invoice, 'id'> = {
        landlordId,
        amount: totalAmount,
        dueDate: Timestamp.fromDate(dueDate),
        status: 'pending',
        leaseIds: leasesSnapshot.docs.map((doc) => doc.id),
        items,
        createdAt: serverTimestamp() as any,
      };

      // Save to Firestore
      await setDoc(invoiceRef, invoiceDoc);

      // Return invoice with ID
      const invoice: Invoice = {
        id: invoiceRef.id,
        ...invoiceDoc,
        createdAt: invoiceDoc.createdAt,
      };

      return invoice;
    } catch (error: any) {
      console.error('Error generating invoice:', error);
      throw new Error(`Failed to generate invoice: ${error.message}`);
    }
  }

  /**
   * Record a payment for an invoice
   *
   * @param invoiceId - ID of the invoice
   * @param paymentData - Payment data
   * @returns Promise resolving to the created payment record
   * @throws Error if recording fails or invoice not found
   */
  async recordPayment(invoiceId: string, paymentData: PaymentDTO): Promise<Payment> {
    try {
      // Validate payment data
      this.validatePaymentData(paymentData);

      // Check if invoice exists
      const invoiceRef = doc(db, COLLECTIONS.INVOICES, invoiceId);
      const invoiceSnap = await getDoc(invoiceRef);

      if (!invoiceSnap.exists()) {
        throw new Error('Invoice not found');
      }

      const invoice = invoiceSnap.data() as Invoice;

      // Validate payment amount doesn't exceed invoice amount
      if (paymentData.amount > invoice.amount) {
        throw new Error('Payment amount cannot exceed invoice amount');
      }

      // Create payment document
      const paymentRef = doc(collection(db, COLLECTIONS.PAYMENTS));

      const paymentDoc: Omit<Payment, 'id'> = {
        invoiceId,
        landlordId: invoice.landlordId,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        reference: paymentData.reference,
        paymentDate: Timestamp.fromDate(paymentData.paymentDate),
        createdAt: serverTimestamp() as any,
      };

      // Save payment to Firestore
      await setDoc(paymentRef, paymentDoc);

      // Update invoice status to paid if full payment
      if (paymentData.amount >= invoice.amount) {
        await updateDoc(invoiceRef, {
          status: 'paid' as InvoiceStatus,
        });
      }

      // Return payment with ID
      const payment: Payment = {
        id: paymentRef.id,
        ...paymentDoc,
        createdAt: paymentDoc.createdAt,
      };

      return payment;
    } catch (error: any) {
      console.error('Error recording payment:', error);
      throw new Error(`Failed to record payment: ${error.message}`);
    }
  }

  /**
   * Get payment history for a landlord
   *
   * @param landlordId - ID of the landlord
   * @returns Promise resolving to array of payments
   */
  async getPaymentHistory(landlordId: string): Promise<Payment[]> {
    try {
      const paymentsQuery = query(
        collection(db, COLLECTIONS.PAYMENTS),
        where('landlordId', '==', landlordId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(paymentsQuery);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data() as Omit<Payment, 'id'>;
        return {
          id: doc.id,
          ...data,
        };
      });
    } catch (error: any) {
      console.error('Error fetching payment history:', error);
      throw new Error(`Failed to fetch payment history: ${error.message}`);
    }
  }

  /**
   * Get outstanding balance for a landlord
   *
   * @param landlordId - ID of the landlord
   * @returns Promise resolving to the outstanding balance amount
   */
  async getOutstandingBalance(landlordId: string): Promise<number> {
    try {
      // Get all pending and overdue invoices for the landlord
      const invoicesQuery = query(
        collection(db, COLLECTIONS.INVOICES),
        where('landlordId', '==', landlordId),
        where('status', 'in', ['pending', 'overdue'])
      );

      const invoicesSnapshot = await getDocs(invoicesQuery);

      // Sum up all unpaid invoice amounts
      let totalOutstanding = 0;

      for (const invoiceDoc of invoicesSnapshot.docs) {
        const invoice = invoiceDoc.data() as Invoice;

        // Get all payments for this invoice
        const paymentsQuery = query(
          collection(db, COLLECTIONS.PAYMENTS),
          where('invoiceId', '==', invoiceDoc.id)
        );

        const paymentsSnapshot = await getDocs(paymentsQuery);

        // Calculate total paid for this invoice
        let totalPaid = 0;
        paymentsSnapshot.docs.forEach((paymentDoc) => {
          const payment = paymentDoc.data() as Payment;
          totalPaid += payment.amount;
        });

        // Add remaining balance to outstanding total
        const remainingBalance = invoice.amount - totalPaid;
        if (remainingBalance > 0) {
          totalOutstanding += remainingBalance;
        }
      }

      return totalOutstanding;
    } catch (error: any) {
      console.error('Error calculating outstanding balance:', error);
      throw new Error(`Failed to calculate outstanding balance: ${error.message}`);
    }
  }

  /**
   * Get all invoices for a landlord
   *
   * @param landlordId - ID of the landlord
   * @returns Promise resolving to array of invoices
   */
  async getInvoicesForLandlord(landlordId: string): Promise<Invoice[]> {
    try {
      const invoicesQuery = query(
        collection(db, COLLECTIONS.INVOICES),
        where('landlordId', '==', landlordId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(invoicesQuery);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data() as Omit<Invoice, 'id'>;
        return {
          id: doc.id,
          ...data,
        };
      });
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      throw new Error(`Failed to fetch invoices: ${error.message}`);
    }
  }

  /**
   * Get a single invoice by ID
   *
   * @param invoiceId - ID of the invoice
   * @returns Promise resolving to the invoice or null if not found
   */
  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    try {
      const invoiceRef = doc(db, COLLECTIONS.INVOICES, invoiceId);
      const invoiceSnap = await getDoc(invoiceRef);

      if (!invoiceSnap.exists()) {
        return null;
      }

      const invoiceData = invoiceSnap.data() as Omit<Invoice, 'id'>;
      return {
        id: invoiceSnap.id,
        ...invoiceData,
      };
    } catch (error: any) {
      console.error('Error fetching invoice:', error);
      throw new Error(`Failed to fetch invoice: ${error.message}`);
    }
  }

  /**
   * Validate payment data
   *
   * @param paymentData - Payment data to validate
   * @throws Error if validation fails
   */
  private validatePaymentData(paymentData: PaymentDTO): void {
    if (!paymentData.amount || paymentData.amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    if (!paymentData.paymentMethod) {
      throw new Error('Payment method is required');
    }

    if (!paymentData.reference || paymentData.reference.trim().length === 0) {
      throw new Error('Payment reference is required');
    }

    if (!paymentData.paymentDate) {
      throw new Error('Payment date is required');
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
export default paymentService;
