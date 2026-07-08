import { Invoice, RevenueStats } from '../types';

export const billingService = {
  async createCheckoutSession(planId: string, userId: string, userEmail: string) {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId, userId, userEmail }),
    });
    return response.json();
  },

  async getBillingHistory(userId: string): Promise<Invoice[]> {
    const response = await fetch(`/api/billing-history?userId=${userId}`);
    return response.json();
  },

  async getAdminStats(): Promise<RevenueStats> {
    const response = await fetch('/api/admin/revenue');
    return response.json();
  },

  async verifyPayment(userId: string, planId: string, isTrial: boolean) {
    const response = await fetch('/api/admin/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, planId, isTrial }),
    });
    return response.json();
  },

  async checkExpirations(users: any[]) {
    try {
      const response = await fetch('/api/subscriptions/check-expiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users }),
      });
      
      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        const text = await response.text();
        console.error(`Subscription check failed with status ${response.status}:`, text);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (contentType && contentType.includes('application/json')) {
        return response.json();
      } else {
        const text = await response.text();
        console.error('Expected JSON but received:', text.substring(0, 500));
        // If we receive HTML, it's likely a 404 or a fall-through to Vite
        if (text.includes('<!doctype') || text.includes('<html')) {
          throw new Error('Server returned HTML instead of JSON. Ensure the dev server is fully booted and API routes are registered.');
        }
        throw new Error('Received non-JSON response from server');
      }
    } catch (error) {
      console.error('Fetch error in checkExpirations:', error);
      throw error;
    }
  },
  
  async processPayment(userId: string, planId: string, cardInfo: any) {
    const response = await fetch('/api/process-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, planId, cardInfo }),
    });
    return response.json();
  },

  async toggleAutoRenew(userId: string, autoRenew: boolean) {
    const response = await fetch('/api/subscriptions/toggle-auto-renew', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, autoRenew }),
    });
    return response.json();
  },

  async updateInvoiceStatus(invoiceId: string, status: 'paid' | 'unpaid' | 'void'): Promise<{ success: boolean; invoice?: Invoice }> {
    const response = await fetch('/api/admin/invoices/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId, status }),
    });
    return response.json();
  },

  async createPaymentIntent(invoiceId: string, amount: number, description?: string): Promise<{ clientSecret: string; isMock: boolean; publishableKey: string }> {
    const response = await fetch('/api/payment/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId, amount, description }),
    });
    return response.json();
  },

  async confirmStripePayment(invoiceId: string, paymentIntentId: string, isMock: boolean): Promise<{ success: boolean; invoice?: Invoice; referenceId: string }> {
    const response = await fetch('/api/payment/confirm-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId, paymentIntentId, isMock }),
    });
    return response.json();
  }
};

