import { PaymentProvider, PaymentResult, PaymentVerification } from '../types';
import { TransactionStatus } from '@/types/subscription';
import { PayChanguAdapter } from './paychangu.adapter';

export class BankTransferAdapter implements PaymentProvider {
  name = 'BANK_TRANSFER';

  private payChangu = new PayChanguAdapter();

  async initiatePayment(request: any): Promise<PaymentResult> {
    const result = await this.payChangu.initiatePayment({
      ...request,
      method: 'BANK_TRANSFER',
      metadata: {
        ...request.metadata,
        payment_method: 'mobile_bank_transfer',
      },
    });

    if (result.success && result.metadata?.accountDetails) {
      const accountDetails = result.metadata.accountDetails as any;
      return {
        ...result,
        message: `Please transfer MWK ${request.amount.toLocaleString()} to:\nBank: ${accountDetails.bank_name}\nAccount: ${accountDetails.account_number}\nName: ${accountDetails.account_name}\nReference: ${request.metadata?.reference || result.providerReference}`,
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
