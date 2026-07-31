import { PaymentProvider, PaymentResult, PaymentVerification, RefundResult } from '../types';
import { TransactionStatus } from '@/types/subscription';

interface PayChanguMobileMoneyResponse {
  status: string;
  message: string;
  data: {
    amount: number;
    charge_id: string;
    ref_id: string;
    trans_id: string;
    first_name: string;
    last_name: string;
    email: string;
    status: string;
    mobile: string;
    attempts: number;
    currency: string;
    mode: string;
    created_at: string;
    completed_at: string | null;
    mobile_money: {
      name: string;
      ref_id: string;
      country: string;
    };
  };
}

interface PayChanguDirectChargeResponse {
  status: string;
  message: string;
  data: {
    payment_account_details: {
      bank_name: string;
      account_number: string;
      account_name: string;
      account_expiration_timestamp: number;
    };
    transaction: {
      charge_id: string;
      ref_id: string;
      trans_id: string | null;
      currency: string;
      amount: number;
      first_name: string | null;
      last_name: string | null;
      email: string | null;
      type: string;
      trace_id: string;
      status: string;
      mobile: string;
      attempts: number;
      mode: string;
      created_at: string;
      completed_at: string | null;
      event_type: string;
      transaction_charges: {
        currency: string;
        amount: string;
      };
      authorization: {
        channel: string;
        card_number: string | null;
        expiry: string | null;
        brand: string | null;
        provider: string | null;
        mobile_number: string | null;
        payer_bank: string | null;
        payer_account_number: string | null;
        payer_account_name: string | null;
        completed_at: string | null;
      };
      logs: Array<{
        type: string;
        message: string;
        created_at: string;
      }>;
    };
  };
}

interface PayChanguCardResponse {
  status: string;
  message: string;
  data: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
    customer: {
      email: string;
      first_name: string;
      last_name: string;
    };
    card: {
      brand: string;
      last4: string;
      exp_month: string;
      exp_year: string;
    };
  };
}

export class PayChanguAdapter implements PaymentProvider {
  name = 'PAYCHANGU';

  private config = {
    publicKey: process.env.PAYCHANGU_PUBLIC_KEY || '',
    secretKey: process.env.PAYCHANGU_SECRET_KEY || '',
    baseUrl: process.env.PAYCHANGU_BASE_URL || 'https://api.paychangu.com',
    webhookSecret: process.env.PAYCHANGU_WEBHOOK_SECRET || '',
  };

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.config.baseUrl}${path}`, {
      ...options,
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Authorization: `Bearer ${this.config.secretKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `PayChangu API error: ${response.status}`);
    }

    return response.json();
  }

  async getMobileMoneyOperators() {
    return this.request<{ data: Array<{ name: string; ref_id: string; country: string }> }>('/mobile-money');
  }

  async initiatePayment(request: any): Promise<PaymentResult> {
    try {
      const { amount, method, metadata } = request;
      const reference = metadata?.reference || `SH-${Date.now()}`;

      // Mobile Money (Airtel Money / Mpamba)
      if (['AIRTEL_MONEY', 'TNM_MPAMBA', 'MOBILE_MONEY'].includes(method)) {
        const operatorRefId = metadata?.mobileMoneyOperatorRefId || metadata?.operatorRefId;

        if (!operatorRefId) {
          // Auto-fetch operators and use first available
          const operators = await this.getMobileMoneyOperators();
          const operator = operators.data?.[0];
          if (!operator) {
            return {
              success: false,
              message: 'No mobile money operators available',
            };
          }
        }

        const payload: any = {
          mobile_money_operator_ref_id: operatorRefId || '',
          amount,
        };

        if (metadata?.phone) {
          payload.mobile = metadata.phone;
        }
        if (metadata?.email) {
          payload.email = metadata.email;
        }
        if (metadata?.name) {
          const names = metadata.name.split(' ');
          payload.first_name = names[0];
          payload.last_name = names.slice(1).join(' ') || '';
        }

        const response = await this.request<PayChanguMobileMoneyResponse>('/mobile-money/payments/initialize', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        if (response.status === 'success') {
          return {
            success: true,
            transactionId: response.data.trans_id,
            providerReference: response.data.charge_id,
            message: response.message,
            metadata: {
              refId: response.data.ref_id,
              mobileMoney: response.data.mobile_money,
              status: response.data.status,
              attempts: response.data.attempts,
              created_at: response.data.created_at,
            },
          };
        }

        return {
          success: false,
          message: response.message || 'Mobile money payment failed',
        };
      }

      // Direct Charge - Bank Transfer
      if (method === 'BANK_TRANSFER' || method === 'DIRECT_CHARGE') {
        const response = await this.request<PayChanguDirectChargeResponse>('/direct-charge/payments/initialize', {
          method: 'POST',
          body: JSON.stringify({
            currency: 'MWK',
            payment_method: 'mobile_bank_transfer',
            amount,
            ...(metadata?.email && { email: metadata.email }),
            ...(metadata?.name && {
              first_name: metadata.name.split(' ')[0],
              last_name: metadata.name.split(' ').slice(1).join(' ') || '',
            }),
          }),
        });

        if (response.status === 'success') {
          return {
            success: true,
            transactionId: response.data.transaction.charge_id,
            providerReference: response.data.transaction.trace_id,
            message: response.message,
            metadata: {
              accountDetails: response.data.payment_account_details,
              transaction: response.data.transaction,
            },
          };
        }

        return {
          success: false,
          message: response.message || 'Bank transfer initialization failed',
        };
      }

      // Card Payment
      if (['PAYCHANGU', 'VISA', 'MASTERCARD', 'CARD'].includes(method)) {
        const response = await this.request<PayChanguCardResponse>('/charge-card/payments', {
          method: 'POST',
          body: JSON.stringify({
            card_number: metadata?.cardNumber,
            expiry: metadata?.cardExpiry,
            cvv: metadata?.cardCvv,
            cardholder_name: metadata?.name || metadata?.cardholderName,
            amount: amount.toString(),
            currency: 'MWK',
            email: metadata?.email,
            charge_id: reference,
            redirect_url: `${process.env.NEXT_PUBLIC_URL}/payment/checkout?ref=${reference}`,
          }),
        });

        if (response.status === 'success') {
          return {
            success: true,
            transactionId: response.data.id,
            providerReference: response.data.id,
            redirectUrl: response.data.id,
            message: response.message,
            metadata: {
              card: response.data.card,
              customer: response.data.customer,
            },
          };
        }

        return {
          success: false,
          message: response.message || 'Card payment failed',
        };
      }

      return {
        success: false,
        message: `Unsupported payment method: ${method}`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Payment initialization failed',
      };
    }
  }

  async verifyPayment(reference: string): Promise<PaymentVerification> {
    try {
      // Try mobile money verify first
      try {
        const response = await this.request<PayChanguMobileMoneyResponse>(`/mobile-money/payments/${reference}/verify`);
        if (response.status === 'success') {
          return {
            verified: response.data.status === 'success' || response.data.status === 'completed',
            status: this.mapStatus(response.data.status),
            providerReference: response.data.charge_id,
            metadata: response.data,
          };
        }
      } catch {
        // Not a mobile money payment, try direct charge
      }

      // Try direct charge details
      try {
        const response = await this.request<PayChanguDirectChargeResponse>(`/direct-charge/transactions/${encodeURIComponent(reference)}/details`);
        if (response.status === 'success') {
          return {
            verified: response.data.transaction.status === 'completed' || response.data.transaction.status === 'success',
            status: this.mapStatus(response.data.transaction.status),
            providerReference: response.data.transaction.charge_id,
            metadata: response.data.transaction,
          };
        }
      } catch {
        // Not a direct charge payment
      }

      return {
        verified: false,
        status: 'PENDING',
      };
    } catch (error) {
      return {
        verified: false,
        status: 'FAILED',
      };
    }
  }

  async getPaymentDetails(chargeId: string, method: 'mobile_money' | 'direct_charge' | 'card') {
    try {
      if (method === 'mobile_money') {
        return this.request<PayChanguMobileMoneyResponse>(`/mobile-money/payments/${chargeId}/details`);
      }
      if (method === 'direct_charge') {
        return this.request<PayChanguDirectChargeResponse>(`/direct-charge/transactions/${encodeURIComponent(chargeId)}/details`);
      }
      throw new Error(`Unsupported method: ${method}`);
    } catch (error) {
      return null;
    }
  }

  async initiateMobileMoneyPayout(params: {
    mobile: string;
    operatorRefId: string;
    amount: string;
    chargeId: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  }): Promise<PaymentResult> {
    try {
      const response = await this.request<PayChanguMobileMoneyResponse>('/mobile-money/payouts/initialize', {
        method: 'POST',
        body: JSON.stringify({
          mobile: params.mobile,
          mobile_money_operator_ref_id: params.operatorRefId,
          amount: params.amount,
          charge_id: params.chargeId,
          ...(params.email && { email: params.email }),
          ...(params.firstName && { first_name: params.firstName }),
          ...(params.lastName && { last_name: params.lastName }),
        }),
      });

      if (response.status === 'success') {
        return {
          success: true,
          transactionId: response.data.trans_id,
          providerReference: response.data.charge_id,
          message: response.message,
          metadata: {
            refId: response.data.ref_id,
            mobileMoney: response.data.mobile_money,
            status: response.data.status,
            attempts: response.data.attempts,
            created_at: response.data.created_at,
          },
        };
      }

      return {
        success: false,
        message: response.message || 'Mobile money payout failed',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Mobile money payout initialization failed',
      };
    }
  }

  async initiateBankPayout(params: {
    bankUuid: string;
    amount: string;
    chargeId: string;
    bankAccountName: string;
    bankAccountNumber: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  }): Promise<PaymentResult> {
    try {
      const response = await this.request<PayChanguDirectChargeResponse>('/direct-charge/payouts/initialize', {
        method: 'POST',
        body: JSON.stringify({
          payout_method: 'bank_transfer',
          bank_uuid: params.bankUuid,
          amount: params.amount,
          charge_id: params.chargeId,
          bank_account_name: params.bankAccountName,
          bank_account_number: params.bankAccountNumber,
          ...(params.email && { email: params.email }),
          ...(params.firstName && { first_name: params.firstName }),
          ...(params.lastName && { last_name: params.lastName }),
        }),
      });

      if (response.status === 'success') {
        return {
          success: true,
          transactionId: response.data.transaction.charge_id,
          providerReference: response.data.transaction.trace_id,
          message: response.message,
          metadata: {
            transaction: response.data.transaction,
            accountDetails: response.data.payment_account_details,
          },
        };
      }

      return {
        success: false,
        message: response.message || 'Bank payout failed',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Bank payout initialization failed',
      };
    }
  }

  async getPayoutDetails(payoutId: string, method: 'mobile_money' | 'bank_transfer') {
    try {
      if (method === 'mobile_money') {
        return this.request<PayChanguMobileMoneyResponse>(`/mobile-money/payments/${payoutId}/details`);
      }
      if (method === 'bank_transfer') {
        return this.request<PayChanguDirectChargeResponse>(`/direct-charge/payouts/${encodeURIComponent(payoutId)}/details`);
      }
      throw new Error(`Unsupported payout method: ${method}`);
    } catch (error) {
      return null;
    }
  }

  async refundPayment(transactionId: string, amount?: number): Promise<RefundResult> {
    try {
      // PayChangu doesn't have a direct refund endpoint in the docs provided
      // This would need to be implemented based on PayChangu's actual refund API
      return {
        success: false,
        amount: amount || 0,
        message: 'Refunds must be processed through PayChangu dashboard or support',
      };
    } catch (error) {
      return {
        success: false,
        amount: amount || 0,
        message: 'Refund failed',
      };
    }
  }

  async handleWebhook(payload: any): Promise<void> {
    // Verify webhook signature if available
    if (payload.signature && this.config.webhookSecret) {
      // Implement signature verification based on PayChangu's webhook signing
      // This is a placeholder - actual implementation depends on PayChangu's webhook format
    }

    // Process webhook based on event type
    const eventType = payload.event_type || payload.type;
    const chargeId = payload.data?.charge_id || payload.charge_id;
    const status = payload.data?.status || payload.status;

    if (!chargeId || !status) {
      return;
    }

    // Update transaction status based on webhook
    // The payment service will handle the actual database update
    return;
  }

  private mapStatus(status: string): TransactionStatus {
    const normalized = status.toLowerCase();
    if (['success', 'completed', 'paid'].includes(normalized)) {
      return 'COMPLETED';
    }
    if (['failed', 'cancelled', 'declined'].includes(normalized)) {
      return 'FAILED';
    }
    if (['pending', 'processing', 'initiated'].includes(normalized)) {
      return 'PENDING';
    }
    return 'PENDING';
  }
}
