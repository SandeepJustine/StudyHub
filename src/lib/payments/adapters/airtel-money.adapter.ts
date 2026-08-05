// services/payments/AirtelMoneyAdapter.ts

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

export class AirtelMoneyAdapter implements PaymentProvider {
  name = 'AIRTEL_MONEY';

  private payChangu: PayChanguAdapter;

  constructor() {
    this.payChangu = new PayChanguAdapter();
  }

  /**
   * Initiate an Airtel Money payment via PayChangu
   * This sends a USSD push notification to the customer's phone
   */
  async initiatePayment(request: PaymentRequest): Promise<PaymentResult> {
    logger.info('AirtelMoney: initiating payment', { 
      amount: request.amount,
      phone: request.metadata?.phone 
    });

    try {
      // Validate phone number
      const phone = request.metadata?.phone;
      if (!phone) {
        return {
          success: false,
          message: 'Phone number is required for Airtel Money payments',
        };
      }

      // Validate phone number format (Malawi Airtel: 099/098 + 7 digits)
      const phoneRegex = /^(099|098|\+26599|\+26598)\d{7}$/;
      if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
        return {
          success: false,
          message: 'Invalid Airtel Money phone number. Must be a valid Malawi Airtel number (099XXXXXXXX or 098XXXXXXXX).',
        };
      }

      // Build PayChangu request with Airtel Money operator
      const payChanguRequest: PaymentRequest = {
        amount: request.amount,
        currency: request.currency || 'MWK',
        method: 'AIRTEL_MONEY',
        metadata: {
          ...request.metadata,
          phone: phone.replace(/\s/g, ''),
          mobileMoneyOperatorRefId: this.payChangu.getOperatorRefId('AIRTEL_MONEY'),
          reference: request.metadata?.reference || `AIR-${Date.now()}`,
        },
      };

      const result = await this.payChangu.initiatePayment(payChanguRequest);
      
      if (result.success) {
        return {
          ...result,
          message: result.message || 
            'Payment initiated via Airtel Money. Please check your phone for USSD prompt and enter your PIN to complete payment.',
          metadata: {
            ...result.metadata,
            provider: 'AIRTEL_MONEY',
            phone: phone.replace(/\s/g, ''),
          },
        };
      }

      return {
        ...result,
        message: result.message || 'Airtel Money payment failed. Please try again.',
      };

    } catch (error: any) {
      logger.error('AirtelMoney payment initiation error', { 
        error: error.message,
        amount: request.amount 
      });
      
      return {
        success: false,
        message: error.message || 'Airtel Money payment failed due to an unexpected error.',
      };
    }
  }

  /**
   * Verify an Airtel Money payment status
   */
  async verifyPayment(reference: string): Promise<PaymentVerification> {
    logger.info('AirtelMoney: verifying payment', { reference });

    try {
      const verification = await this.payChangu.verifyPayment(reference);
      
      return {
        ...verification,
        metadata: {
          ...verification.metadata,
          provider: 'AIRTEL_MONEY',
        },
      };
    } catch (error: any) {
      logger.error('AirtelMoney payment verification error', { 
        reference, 
        error: error.message 
      });
      
      return {
        verified: false,
        status: 'FAILED' as TransactionStatus,
        providerReference: reference,
        metadata: {
          provider: 'AIRTEL_MONEY',
          error: error.message,
        },
      };
    }
  }

  /**
   * Refund an Airtel Money payment
   * Note: Airtel Money refunds go through PayChangu's refund process
   */
  async refundPayment(transactionId: string, amount?: number): Promise<RefundResult> {
    logger.info('AirtelMoney: processing refund', { transactionId, amount });

    try {
      // Get the operator ref ID for Airtel Money
      const operatorRefId = this.payChangu.getOperatorRefId('AIRTEL_MONEY');
      
      if (!operatorRefId) {
        return {
          success: false,
          amount: amount || 0,
          message: 'Airtel Money operator reference ID not found',
        };
      }

      // Delegate to PayChangu for refund processing
      const result = await this.payChangu.refundPayment(transactionId, amount);
      
      return {
        ...result,
        message: result.message || 'Airtel Money refund initiated. Please allow 3-5 business days for processing.',
      };
    } catch (error: any) {
      logger.error('AirtelMoney refund error', { 
        transactionId, 
        error: error.message 
      });
      
      return {
        success: false,
        amount: amount || 0,
        message: error.message || 'Airtel Money refund failed.',
      };
    }
  }

  /**
   * Handle PayChangu webhook callbacks for Airtel Money payments
   */
  async handleWebhook(payload: any): Promise<void> {
    logger.info('AirtelMoney: processing webhook', { 
      eventType: payload.event_type,
      chargeId: payload.data?.charge_id 
    });

    try {
      // Add Airtel Money specific processing if needed
      if (payload.data?.mobile_money?.name?.toLowerCase().includes('airtel')) {
        logger.info('AirtelMoney: confirmed Airtel Money webhook event');
        
        // You can add Airtel-specific processing here
        // e.g., updating Airtel-specific transaction logs, sending SMS notifications, etc.
      }

      // Delegate to PayChangu for core webhook processing
      await this.payChangu.handleWebhook(payload);
      
    } catch (error: any) {
      logger.error('AirtelMoney webhook processing error', { 
        error: error.message 
      });
      throw error; // Re-throw to let the caller handle it
    }
  }

  /**
   * Get Airtel Money transaction details
   */
  async getPaymentDetails(chargeId: string) {
    logger.info('AirtelMoney: getting payment details', { chargeId });

    try {
      const details = await this.payChangu.getPaymentDetails(chargeId, 'mobile_money');
      return details;
    } catch (error: any) {
      logger.error('AirtelMoney get payment details error', { 
        chargeId, 
        error: error.message 
      });
      return null;
    }
  }

  /**
   * Initiate a payout to an Airtel Money account
   * Used for instructor payouts, refunds, etc.
   */
  async initiatePayout(params: {
    mobile: string;
    amount: number;
    reference?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  }): Promise<PaymentResult> {
    logger.info('AirtelMoney: initiating payout', params);

    try {
      const operatorRefId = this.payChangu.getOperatorRefId('AIRTEL_MONEY');
      
      if (!operatorRefId) {
        return {
          success: false,
          message: 'Airtel Money operator reference ID not found',
        };
      }

      const result = await this.payChangu.initiateMobileMoneyPayout({
        mobile: params.mobile.replace(/\s/g, ''),
        operatorRefId,
        amount: params.amount.toString(),
        chargeId: params.reference || `AIR-PAYOUT-${Date.now()}`,
        email: params.email,
        firstName: params.firstName,
        lastName: params.lastName,
      });

      return {
        ...result,
        message: result.message || 'Airtel Money payout initiated. Funds should arrive within minutes.',
        metadata: {
          ...result.metadata,
          provider: 'AIRTEL_MONEY',
        },
      };
    } catch (error: any) {
      logger.error('AirtelMoney payout error', { 
        params, 
        error: error.message 
      });
      
      return {
        success: false,
        message: error.message || 'Airtel Money payout failed.',
      };
    }
  }

  /**
   * Validate Airtel Money phone number format
   */
  validatePhoneNumber(phone: string): boolean {
    const cleaned = phone.replace(/\s/g, '');
    const phoneRegex = /^(099|098|\+26599|\+26598)\d{7}$/;
    return phoneRegex.test(cleaned);
  }

  /**
   * Format phone number to standard Airtel Money format
   */
  formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    if (cleaned.startsWith('+265')) {
      return cleaned;
    }
    
    if (cleaned.startsWith('0')) {
      return `+265${cleaned.substring(1)}`;
    }
    
    if (cleaned.length === 9) {
      return `+265${cleaned}`;
    }
    
    return cleaned;
  }

  /**
   * Map Airtel Money status to our transaction status
   */
  private mapStatus(status: string): TransactionStatus {
    const normalized = status?.toLowerCase() || '';
    
    if (['success', 'completed', 'paid'].includes(normalized)) {
      return 'COMPLETED' as TransactionStatus;
    }
    if (['failed', 'cancelled', 'declined'].includes(normalized)) {
      return 'FAILED' as TransactionStatus;
    }
    if (['pending', 'processing', 'initiated'].includes(normalized)) {
      return 'PENDING' as TransactionStatus;
    }
    
    return 'PENDING' as TransactionStatus;
  }
}

// Export singleton instance
export const airtelMoneyAdapter = new AirtelMoneyAdapter();