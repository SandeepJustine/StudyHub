// services/payments/paychangu.adapter.ts

import { 
  PaymentProvider, 
  PaymentResult, 
  PaymentVerification, 
  RefundResult,
  PaymentRequest 
} from '@/types/payment';
import { TransactionStatus } from '@/types/subscription';
import { logger } from '@/lib/utils/logger';

// ─── Response Types ───────────────────────────────────────────

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

interface PayChanguOperator {
  id: number;
  name: string;
  ref_id: string;
  short_code: string;
  logo: string | null;
  supports_withdrawals: boolean;
  supported_country: {
    name: string;
    currency: string;
  };
}

interface PayChanguOperatorsResponse {
  status: string;
  message: string;
  data: PayChanguOperator[];
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

// ─── Constants ─────────────────────────────────────────────────

const OPERATOR_REF_ID_MAP: Record<string, string> = {
  AIRTEL_MONEY: '20be6c20-adeb-4b5b-a7ba-0769820df4fb',
  TNM_MPAMBA: '27494cb5-ba9e-437f-a114-4e7a7686bcca',
};

// ─── Main Adapter Class ────────────────────────────────────────

export class PayChanguAdapter implements PaymentProvider {
  name = 'PAYCHANGU';

  private config = {
    publicKey: process.env.PAYCHANGU_PUBLIC_KEY || '',
    secretKey: process.env.PAYCHANGU_SECRET_KEY || '',
    baseUrl: process.env.PAYCHANGU_BASE_URL || 'https://api.paychangu.com',
    webhookSecret: process.env.PAYCHANGU_WEBHOOK_SECRET || '',
  };

  private get isDevMode(): boolean {
    return (
      process.env.NODE_ENV === 'development' && 
      process.env.PAYMENT_SIMULATION_ENABLED !== 'false'
    );
  }

  private validateConfig(): void {
    if (!this.isDevMode) {
      if (!this.config.secretKey) {
        throw new Error('PAYCHANGU_SECRET_KEY is not configured');
      }
    }
  }

  // ─── HTTP Request Helper ─────────────────────────────────────

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    
    logger.info('PayChangu API request', { 
      url, 
      method: options.method || 'GET',
      isDevMode: this.isDevMode,
      hasSecretKey: !!this.config.secretKey,
    });

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.secretKey}`,
          ...options.headers,
        },
      });

      const responseText = await response.text();
      
      let responseData: any;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      // Log response
      logger.info('PayChangu API response', {
        httpStatus: response.status,
        ok: response.ok,
        bodyPreview: typeof responseData === 'object' 
          ? JSON.stringify(responseData).substring(0, 300) 
          : String(responseData).substring(0, 300),
      });

      if (!response.ok) {
        const errorMsg = this.extractErrorMessage(responseData, response.status);
      logger.error('PayChangu API error', { httpStatus: response.status, errorMsg } as any);
      const err = new Error(errorMsg);
      (err as any).httpStatus = response.status;
      throw err;
      }

      return responseData as T;
      
    } catch (error: any) {
      if (!error.message?.includes('PayChangu API error')) {
        logger.error('PayChangu request failed', { 
          path,
          errorMessage: error.message,
        } as any);
        const err = error instanceof Error ? error : new Error(String(error));
        (err as any).path = path;
        throw err;
      }
      throw error;
    }
  }

  private extractErrorMessage(responseData: any, httpStatus: number): string {
    if (typeof responseData === 'string') return responseData;
    if (!responseData) return `PayChangu API error (HTTP ${httpStatus})`;
    
    const message = responseData?.message || 'Unknown error';
    return `${message} (HTTP ${httpStatus})`;
  }

  // ─── Operator Management ─────────────────────────────────────

  async getMobileMoneyOperators(): Promise<PayChanguOperatorsResponse> {
    return this.request<PayChanguOperatorsResponse>('/mobile-money');
  }

  getOperatorRefId(method: string): string | undefined {
    return OPERATOR_REF_ID_MAP[method];
  }

  async resolveOperatorRefId(method: string): Promise<string> {
    const hardcoded = OPERATOR_REF_ID_MAP[method];
    if (hardcoded) return hardcoded;

    const operators = await this.getMobileMoneyOperators();
    const operator = operators.data?.find(
      (op) => 
        op.short_code?.toLowerCase() === method.toLowerCase() ||
        op.name?.toLowerCase().includes(method.toLowerCase())
    );

    if (!operator) {
      throw new Error(`No mobile money operator found for method: ${method}`);
    }
    
    return operator.ref_id;
  }

  // ─── Payment Initiation ──────────────────────────────────────

  async initiatePayment(request: PaymentRequest): Promise<PaymentResult> {
    this.validateConfig();

    const { amount, method, currency = 'MWK', metadata = {} } = request;
    const reference = metadata.reference || `SH-${Date.now()}`;

    // ── Development mode: simulate ─────────────────────────────
    if (this.isDevMode) {
      logger.info('PayChangu [DEV]: simulating payment', { amount, method, reference });
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        success: true,
        transactionId: `dev-txn-${Date.now()}`,
        providerReference: reference,
        message: `[DEV] Simulated ${method} payment of MWK ${amount}. Check phone for USSD prompt.`,
        metadata: {
          refId: reference,
          status: 'success',
          mode: 'test',
          simulated: true,
          amount,
          currency,
          method,
        },
      };
    }

    // ── Production: route to correct handler ───────────────────
    try {
      if (method === 'AIRTEL_MONEY' || method === 'TNM_MPAMBA' || method === 'MOBILE_MONEY') {
        return this.initiateMobileMoneyPayment(amount, method, currency, metadata);
      }

      if (method === 'BANK_TRANSFER' || method === 'DIRECT_CHARGE') {
        return this.initiateBankTransferPayment(amount, currency, metadata);
      }

      return {
        success: false,
        message: `Unsupported payment method: ${method}`,
      };

    } catch (error: any) {
      logger.error('Payment initiation failed', { method, amount, errorMessage: error.message } as any);
      return {
        success: false,
        message: error.message || 'Payment initialization failed',
      };
    }
  }

  /**
   * Mobile Money Payment (Airtel Money / TNM Mpamba)
   * Uses: POST /mobile-money/payments/initialize
   */
  // services/payments/paychangu.adapter.ts

  // Update the initiateMobileMoneyPayment method to handle the actual response:

  private async initiateMobileMoneyPayment(
    amount: number, 
    method: string, 
    currency: string,
    metadata: Record<string, any>
  ): Promise<PaymentResult> {
    let operatorRefId = metadata?.mobileMoneyOperatorRefId || metadata?.operatorRefId;

    if (!operatorRefId) {
      operatorRefId = await this.resolveOperatorRefId(method);
    }

    const mobile = (metadata?.phone || '').replace(/[\s\-\(\)\+]/g, '');
    const chargeId = metadata?.reference || `SH-${Date.now()}`;

    // Correct payload for mobile money
    const payload: Record<string, any> = {
      mobile_money_operator_ref_id: operatorRefId,
      amount: amount.toString(),
      charge_id: chargeId,
      mobile: mobile,
      currency: currency || 'MWK',
    };

    if (metadata?.email) payload.email = metadata.email;
    if (metadata?.name) {
      const names = metadata.name.trim().split(' ');
      payload.first_name = names[0] || 'Customer';
      payload.last_name = names.slice(1).join(' ') || 'User';
    }

    logger.info('PayChangu mobile money request', { 
      amount, 
      method, 
      mobile, 
      chargeId 
    });

    const response = await this.request<any>(
      '/mobile-money/payments/initialize',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );

    if (response.status === 'success' && response.data) {
      const data = response.data;
      
      return {
        success: true,
        transactionId: data.trans_id || data.charge_id,
        providerReference: data.ref_id || data.charge_id,
        message: `Payment initiated via ${method}. ` +
                `Please check your phone (${data.mobile}) for a USSD prompt and enter your PIN to complete payment. ` +
                `Reference: ${data.ref_id}`,
        metadata: {
          chargeId: data.charge_id,
          refId: data.ref_id,
          transId: data.trans_id,
          status: data.status,
          mobile: data.mobile,
          currency: data.currency,
          amount: data.amount,
          mobileMoney: data.mobile_money,
          attempts: data.attempts,
          createdAt: data.created_at,
          customer: data.customer,
          transactionCharges: data.transaction_charges,
          gatewayResponse: response.gateway_response,
        },
      };
    }

    return {
      success: false,
      message: response.message || 'Mobile money payment failed',
    };
  }

  /**
   * Bank Transfer Payment
   * Uses: POST /direct-charge/payments/initialize
   */
  private async initiateBankTransferPayment(
    amount: number,
    currency: string,
    metadata: Record<string, any>
  ): Promise<PaymentResult> {
    const payload: Record<string, any> = {
      currency: currency || 'MWK',
      payment_method: 'mobile_bank_transfer',
      amount: amount.toString(),
    };

    if (metadata?.email) payload.email = metadata.email;
    if (metadata?.name) {
      const names = metadata.name.trim().split(' ');
      payload.first_name = names[0] || 'Customer';
      payload.last_name = names.slice(1).join(' ') || 'User';
    }

    const response = await this.request<PayChanguDirectChargeResponse>(
      '/mobile-money/payments/initialize',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );

    if (response.status === 'success') {
      const accountDetails = response.data.payment_account_details;
      return {
        success: true,
        transactionId: response.data.transaction.charge_id,
        providerReference: response.data.transaction.trace_id,
        message: [
          `Bank transfer initiated. Please transfer MWK ${amount.toLocaleString()} to:`,
          `Bank: ${accountDetails.bank_name}`,
          `Account: ${accountDetails.account_number}`,
          `Name: ${accountDetails.account_name}`,
        ].join('\n'),
        metadata: {
          accountDetails,
          transaction: response.data.transaction,
        },
      };
    }

    return {
      success: false,
      message: response.message || 'Bank transfer initialization failed',
    };
  }

  // ─── Payment Verification ────────────────────────────────────

  async verifyPayment(reference: string): Promise<PaymentVerification> {
    if (this.isDevMode) {
      logger.info('PayChangu [DEV]: simulating verification', { reference });
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return {
        verified: true,
        status: 'COMPLETED' as TransactionStatus,
        providerReference: reference,
        metadata: {
          mode: 'test',
          simulated: true,
          status: 'success',
        },
      };
    }

    try {
      // Try mobile money verification endpoint
      const response = await this.request<PayChanguMobileMoneyResponse>(
        `/mobile-money/payments/${reference}/verify`
      );
      
      if (response.status === 'success') {
        return {
          verified: ['success', 'completed'].includes(response.data.status?.toLowerCase()),
          status: this.mapStatus(response.data.status),
          providerReference: response.data.charge_id,
          metadata: response.data,
        };
      }
    } catch (err) {
      logger.info('Mobile money verify failed, trying direct charge', { reference });
    }

    return {
      verified: false,
      status: 'PENDING' as TransactionStatus,
      providerReference: reference,
    };
  }

  // ─── Refunds ─────────────────────────────────────────────────

  async refundPayment(transactionId: string, amount?: number): Promise<RefundResult> {
    if (this.isDevMode) {
      logger.info('PayChangu [DEV]: simulating refund', { transactionId, amount });
      return {
        success: true,
        amount: amount || 0,
        transactionId: `dev-refund-${Date.now()}`,
        message: `[DEV] Simulated refund of MWK ${amount || 'full amount'}`,
      };
    }

    return {
      success: false,
      amount: amount || 0,
      message: 'Refunds must be processed through PayChangu dashboard.',
    };
  }

  // ─── Webhook ─────────────────────────────────────────────────

  async handleWebhook(payload: any): Promise<void> {
    logger.info('PayChangu webhook received', { 
      eventType: payload.event_type || payload.type,
      chargeId: payload.data?.charge_id || payload.charge_id,
    });

    if (this.isDevMode) {
      logger.info('PayChangu [DEV]: webhook processed (simulated)');
      return;
    }

    const chargeId = payload.data?.charge_id || payload.charge_id;
    const status = payload.data?.status || payload.status;

    if (chargeId && status) {
      logger.info('Webhook processed', { chargeId, status });
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
    return {
      success: true,
      transactionId: params.chargeId,
      providerReference: params.chargeId,
      message: `[DEV] Mobile money payout of MWK ${params.amount} initiated.`,
      metadata: {
        mobile: params.mobile,
        operatorRefId: params.operatorRefId,
        amount: params.amount,
        simulated: true,
      },
    };
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
    return {
      success: true,
      transactionId: params.chargeId,
      providerReference: params.chargeId,
      message: `[DEV] Bank payout of MWK ${params.amount} initiated.`,
      metadata: {
        bankUuid: params.bankUuid,
        accountName: params.bankAccountName,
        accountNumber: params.bankAccountNumber,
        simulated: true,
      },
    };
  }

  async getPaymentDetails(chargeId: string, _type?: string): Promise<any> {
    return {
      chargeId,
      status: 'success',
      simulated: true,
    };
  }

  // ─── Status Mapping ──────────────────────────────────────────

  private mapStatus(status: string): TransactionStatus {
    const normalized = status?.toLowerCase() || '';
    
    if (['success', 'completed', 'paid', 'settled'].includes(normalized)) return 'COMPLETED';
    if (['failed', 'cancelled', 'declined', 'expired'].includes(normalized)) return 'FAILED';
    if (['pending', 'processing', 'initiated', 'in_progress'].includes(normalized)) return 'PENDING';
    if (['refunded', 'reversed'].includes(normalized)) return 'REFUNDED';
    
    return 'PENDING';
  }
}

// Export singleton
export const payChanguAdapter = new PayChanguAdapter();