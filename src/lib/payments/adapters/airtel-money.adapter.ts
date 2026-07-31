import { PaymentProvider, PaymentResult, PaymentVerification } from '../types';
import { TransactionStatus } from '@/types/subscription';
import { PayChanguAdapter } from './paychangu.adapter';

export class AirtelMoneyAdapter implements PaymentProvider {
  name = 'AIRTEL_MONEY';

  private payChangu = new PayChanguAdapter();

  async initiatePayment(request: any): Promise<PaymentResult> {
    const method = 'AIRTEL_MONEY';
    const payChanguRequest = {
      ...request,
      method,
      metadata: {
        ...request.metadata,
        mobileMoneyOperatorRefId: request.metadata?.mobileMoneyOperatorRefId,
      },
    };

    const result = await this.payChangu.initiatePayment(payChanguRequest);
    
    if (result.success && result.metadata) {
      return {
        ...result,
        message: result.message || 'Payment initiated via Airtel Money. Please check your phone for USSD prompt.',
      };
    }

    return result;
  }

  async verifyPayment(reference: string): Promise<PaymentVerification> {
    return this.payChangu.verifyPayment(reference);
  }

  async handleWebhook(payload: any): Promise<void> {
    return this.payChangu.handleWebhook(payload);
  }
}
