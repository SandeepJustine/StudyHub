// services/payments/MpambaAdapter.ts

import { 
  PaymentProvider, 
  PaymentResult, 
  PaymentVerification, 
  RefundResult,
  PaymentRequest 
} from '@/types/payment';
import { TransactionStatus } from '@/types/subscription';
import { PayChanguAdapter } from './paychangu.adapter';
import { logger } from '@/lib/utils/logger';

export class MpambaAdapter implements PaymentProvider {
  name = 'TNM_MPAMBA';

  private payChangu: PayChanguAdapter;

  constructor() {
    this.payChangu = new PayChanguAdapter();
  }

  /**
   * Initiate a TNM Mpamba payment via PayChangu
   */
  async initiatePayment(request: PaymentRequest): Promise<PaymentResult> {
    logger.info('Mpamba: initiating payment', { 
      amount: request.amount,
      phone: request.metadata?.phone 
    });

    try {
      // Validate phone number
      const phone = request.metadata?.phone;
      if (!phone) {
        return {
          success: false,
          message: 'Phone number is required for TNM Mpamba payments',
        };
      }

      // Validate phone number format (Malawi TNM: 088 + 7 digits)
      const phoneRegex = /^(088|\+26588)\d{7}$/;
      if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
        return {
          success: false,
          message: 'Invalid TNM Mpamba phone number. Must be a valid Malawi TNM number (088XXXXXXXX).',
        };
      }

      // Build PayChangu request with TNM Mpamba operator
      const payChanguRequest: PaymentRequest = {
        amount: request.amount,
        currency: request.currency || 'MWK',
        method: 'TNM_MPAMBA',
        metadata: {
          ...request.metadata,
          phone: phone.replace(/\s/g, ''),
          mobileMoneyOperatorRefId: this.payChangu.getOperatorRefId('TNM_MPAMBA'),
          reference: request.metadata?.reference || `MPA-${Date.now()}`,
        },
      };

      const result = await this.payChangu.initiatePayment(payChanguRequest);
      
      if (result.success) {
        return {
          ...result,
          message: result.message || 
            'Payment initiated via TNM Mpamba. Please check your phone for confirmation prompt.',
          metadata: {
            ...result.metadata,
            provider: 'TNM_MPAMBA',
            phone: phone.replace(/\s/g, ''),
          },
        };
      }

      return {
        ...result,
        message: result.message || 'TNM Mpamba payment failed. Please try again.',
      };

    } catch (error: any) {
      logger.error('Mpamba payment initiation error', { 
        error: error.message,
        amount: request.amount 
      } as any);
      
      return {
        success: false,
        message: error.message || 'TNM Mpamba payment failed due to an unexpected error.',
      };
    }
  }

  /**
   * Verify a TNM Mpamba payment status
   */
  async verifyPayment(reference: string): Promise<PaymentVerification> {
    logger.info('Mpamba: verifying payment', { reference });

    try {
      const verification = await this.payChangu.verifyPayment(reference);
      
      return {
        ...verification,
        metadata: {
          ...verification.metadata,
          provider: 'TNM_MPAMBA',
        },
      };
    } catch (error: any) {
      logger.error('Mpamba payment verification error', { 
        reference, 
        error: error.message 
      } as any);
      
      return {
        verified: false,
        status: 'FAILED' as TransactionStatus,
        providerReference: reference,
        metadata: {
          provider: 'TNM_MPAMBA',
          error: error.message,
        },
      };
    }
  }

  /**
   * Refund a TNM Mpamba payment
   */
  async refundPayment(transactionId: string, amount?: number): Promise<RefundResult> {
    logger.info('Mpamba: processing refund', { transactionId, amount });

    try {
      const result = await this.payChangu.refundPayment(transactionId, amount);
      
      return {
        ...result,
        message: result.message || 'TNM Mpamba refund initiated. Please allow 3-5 business days.',
      };
    } catch (error: any) {
      logger.error('Mpamba refund error', { 
        transactionId, 
        error: error.message 
      } as any);
      
      return {
        success: false,
        amount: amount || 0,
        message: error.message || 'TNM Mpamba refund failed.',
      };
    }
  }

  /**
   * Handle PayChangu webhook callbacks
   */
  async handleWebhook(payload: any): Promise<void> {
    logger.info('Mpamba: processing webhook', { 
      eventType: payload.event_type 
    });

    try {
      if (payload.data?.mobile_money?.name?.toLowerCase().includes('tnm')) {
        logger.info('Mpamba: confirmed TNM Mpamba webhook event');
      }

      await this.payChangu.handleWebhook(payload);
    } catch (error: any) {
      logger.error('Mpamba webhook processing error', { 
        error: error.message 
      } as any);
      throw error;
    }
  }

  /**
   * Initiate a payout to a TNM Mpamba account
   */
  async initiatePayout(params: {
    mobile: string;
    amount: number;
    reference?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  }): Promise<PaymentResult> {
    logger.info('Mpamba: initiating payout', params);

    try {
      const operatorRefId = this.payChangu.getOperatorRefId('TNM_MPAMBA');
      
      if (!operatorRefId) {
        return {
          success: false,
          message: 'TNM Mpamba operator reference ID not found',
        };
      }

      const result = await this.payChangu.initiateMobileMoneyPayout({
        mobile: params.mobile.replace(/\s/g, ''),
        operatorRefId,
        amount: params.amount.toString(),
        chargeId: params.reference || `MPA-PAYOUT-${Date.now()}`,
        email: params.email,
        firstName: params.firstName,
        lastName: params.lastName,
      });

      return {
        ...result,
        message: result.message || 'TNM Mpamba payout initiated.',
        metadata: {
          ...result.metadata,
          provider: 'TNM_MPAMBA',
        },
      };
    } catch (error: any) {
      logger.error('Mpamba payout error', { params, error: error.message } as any);
      
      return {
        success: false,
        message: error.message || 'TNM Mpamba payout failed.',
      };
    }
  }
}

// Export singleton instance
export const mpambaAdapter = new MpambaAdapter();