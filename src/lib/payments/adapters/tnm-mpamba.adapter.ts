import { PaymentProvider, PaymentResult, PaymentVerification } from '../types';
import { TransactionStatus } from '@/types/subscription';
import { PayChanguAdapter } from './paychangu.adapter';

export class TNMMpambaAdapter implements PaymentProvider {
  name = 'TNM_MPAMBA';

  private payChangu = new PayChanguAdapter();

  async initiatePayment(request: any): Promise<PaymentResult> {
    const method = 'TNM_MPAMBA';
    const payChanguRequest = {
      ...request,
      method,
      metadata: {
        ...request.metadata,
        mobileMoneyOperatorRefId: request.metadata?.mobileMoneyOperatorRefId,
      },
    };

    const result = await this.payChangu.initiatePayment(payChanguRequest);
    
    if (result.success) {
      return {
        ...result,
        message: result.message || 'Payment initiated via TNM Mpamba. Please confirm on your phone.',
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
