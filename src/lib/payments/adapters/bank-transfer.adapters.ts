// services/payments/BankTransferAdapter.ts

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

// ─── Bank Transfer Specific Types ──────────────────────────────

interface BankAccountDetails {
  bank_name: string;
  account_number: string;
  account_name: string;
  account_expiration_timestamp: number;
}

interface BankTransferMetadata {
  accountDetails?: BankAccountDetails;
  reference?: string;
  email?: string;
  name?: string;
  phone?: string;
  expiryTimestamp?: number;
  [key: string]: any;
}

// ─── Supported Malawi Banks ────────────────────────────────────

const MALAWI_BANKS = [
  { name: 'National Bank of Malawi', shortCode: 'NBM' },
  { name: 'Standard Bank Malawi', shortCode: 'STANDARD' },
  { name: 'NBS Bank', shortCode: 'NBS' },
  { name: 'FDH Bank', shortCode: 'FDH' },
  { name: 'First Capital Bank', shortCode: 'FCB' },
  { name: 'Ecobank Malawi', shortCode: 'ECOBANK' },
  { name: 'CDH Investment Bank', shortCode: 'CDH' },
  { name: 'MyBucks Banking Corporation', shortCode: 'MYBUCKS' },
];

// ─── Main Adapter Class ────────────────────────────────────────

export class BankTransferAdapter implements PaymentProvider {
  name = 'BANK_TRANSFER';

  private payChangu: PayChanguAdapter;

  constructor() {
    this.payChangu = new PayChanguAdapter();
  }

  /**
   * Initiate a bank transfer payment
   * Returns bank account details for the customer to transfer to
   */
  async initiatePayment(request: PaymentRequest): Promise<PaymentResult> {
    logger.info('BankTransfer: initiating payment', { 
      amount: request.amount,
      reference: request.metadata?.reference 
    });

    try {
      // Validate amount (minimum transfer amount)
      if (request.amount < 1000) {
        return {
          success: false,
          message: 'Minimum bank transfer amount is MWK 1,000',
        };
      }

      // Build PayChangu request for bank transfer
      const payChanguRequest: PaymentRequest = {
        amount: request.amount,
        currency: request.currency || 'MWK',
        method: 'BANK_TRANSFER',
        metadata: {
          ...request.metadata,
          payment_method: 'mobile_bank_transfer',
          reference: request.metadata?.reference || `BNK-${Date.now()}`,
          email: request.metadata?.email,
          name: request.metadata?.name,
          phone: request.metadata?.phone,
        },
      };

      const result = await this.payChangu.initiatePayment(payChanguRequest);

      // If successful and we have account details, format the response
      if (result.success && result.metadata?.accountDetails) {
        const accountDetails = result.metadata.accountDetails as BankAccountDetails;
        
        // Calculate expiry time
        const expiryDate = accountDetails.account_expiration_timestamp 
          ? new Date(accountDetails.account_expiration_timestamp * 1000)
          : null;

        const formattedMessage = this.formatBankTransferInstructions(
          request.amount,
          accountDetails,
          request.metadata?.reference || result.providerReference || '',
          expiryDate
        );

        return {
          ...result,
          message: formattedMessage,
          metadata: {
            ...result.metadata,
            provider: 'BANK_TRANSFER',
            accountDetails,
            reference: request.metadata?.reference || result.providerReference,
            expiryTimestamp: accountDetails.account_expiration_timestamp,
            instructions: {
              step1: 'Copy the bank account details below',
              step2: 'Make the transfer using your bank app, USSD, or visit a branch',
              step3: 'Use the reference number in the transfer description',
              step4: 'Payment will be confirmed automatically within 5-30 minutes',
            },
          },
        };
      }

      // If PayChangu failed, try direct bank transfer instructions
      if (!result.success) {
        return {
          ...result,
          message: result.message || 'Bank transfer initiation failed. Please try again or use mobile money.',
          metadata: {
            ...result.metadata,
            provider: 'BANK_TRANSFER',
            supportedBanks: MALAWI_BANKS.map(b => b.name),
          },
        };
      }

      return {
        ...result,
        metadata: {
          ...result.metadata,
          provider: 'BANK_TRANSFER',
        },
      };

    } catch (error: any) {
      logger.error('BankTransfer payment initiation error', { 
        error: error.message,
        amount: request.amount 
      });
      
      return {
        success: false,
        message: error.message || 'Bank transfer payment failed due to an unexpected error.',
      };
    }
  }

  /**
   * Verify a bank transfer payment status
   */
  async verifyPayment(reference: string): Promise<PaymentVerification> {
    logger.info('BankTransfer: verifying payment', { reference });

    try {
      const verification = await this.payChangu.verifyPayment(reference);
      
      return {
        ...verification,
        metadata: {
          ...verification.metadata,
          provider: 'BANK_TRANSFER',
        },
      };
    } catch (error: any) {
      logger.error('BankTransfer payment verification error', { 
        reference, 
        error: error.message 
      });
      
      return {
        verified: false,
        status: 'FAILED' as TransactionStatus,
        providerReference: reference,
        metadata: {
          provider: 'BANK_TRANSFER',
          error: error.message,
        },
      };
    }
  }

  /**
   * Refund a bank transfer payment
   * This requires manual processing through PayChangu
   */
  async refundPayment(transactionId: string, amount?: number): Promise<RefundResult> {
    logger.info('BankTransfer: processing refund', { transactionId, amount });

    try {
      // For bank transfers, we need the customer's bank details for refund
      const result = await this.payChangu.refundPayment(transactionId, amount);
      
      return {
        ...result,
        message: result.message || 
          'Bank transfer refund initiated. Please provide your bank account details for the refund to be processed. ' +
          'Refunds typically take 3-7 business days.',
      };
    } catch (error: any) {
      logger.error('BankTransfer refund error', { 
        transactionId, 
        error: error.message 
      });
      
      return {
        success: false,
        amount: amount || 0,
        message: error.message || 'Bank transfer refund failed.',
      };
    }
  }

  /**
   * Handle PayChangu webhook callbacks for bank transfers
   */
  async handleWebhook(payload: any): Promise<void> {
    logger.info('BankTransfer: processing webhook', { 
      eventType: payload.event_type,
      chargeId: payload.data?.charge_id 
    });

    try {
      // Check if this is a bank transfer webhook
      const isBankTransfer = 
        payload.data?.transaction?.type === 'bank_transfer' ||
        payload.data?.mode === 'mobile_bank_transfer' ||
        payload.event_type?.includes('bank');

      if (isBankTransfer) {
        logger.info('BankTransfer: confirmed bank transfer webhook event');
        
        // Log bank-specific details
        if (payload.data?.transaction?.authorization?.payer_bank) {
          logger.info('BankTransfer: payer bank details', {
            bank: payload.data.transaction.authorization.payer_bank,
            account: payload.data.transaction.authorization.payer_account_number,
          });
        }
      }

      // Delegate to PayChangu for core webhook processing
      await this.payChangu.handleWebhook(payload);
      
    } catch (error: any) {
      logger.error('BankTransfer webhook processing error', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get bank transfer transaction details
   */
  async getPaymentDetails(chargeId: string) {
    logger.info('BankTransfer: getting payment details', { chargeId });

    try {
      const details = await this.payChangu.getPaymentDetails(chargeId, 'direct_charge');
      return details;
    } catch (error: any) {
      logger.error('BankTransfer get payment details error', { 
        chargeId, 
        error: error.message 
      });
      return null;
    }
  }

  /**
   * Get list of supported banks in Malawi
   */
  getSupportedBanks() {
    return MALAWI_BANKS;
  }

  /**
   * Initiate a payout to a bank account
   * Used for instructor payouts, refunds, etc.
   */
  async initiatePayout(params: {
    bankName: string;
    bankAccountName: string;
    bankAccountNumber: string;
    amount: number;
    reference?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  }): Promise<PaymentResult> {
    logger.info('BankTransfer: initiating payout', { 
      bankName: params.bankName,
      amount: params.amount 
    });

    try {
      // Validate bank
      const bank = MALAWI_BANKS.find(
        b => b.name.toLowerCase() === params.bankName.toLowerCase() ||
             b.shortCode.toLowerCase() === params.bankName.toLowerCase()
      );

      if (!bank) {
        return {
          success: false,
          message: `Unsupported bank: ${params.bankName}. Supported banks: ${MALAWI_BANKS.map(b => b.name).join(', ')}`,
        };
      }

      // Validate minimum payout amount
      if (params.amount < 500) {
        return {
          success: false,
          message: 'Minimum bank payout amount is MWK 500',
        };
      }

      const result = await this.payChangu.initiateBankPayout({
        bankUuid: bank.shortCode,
        amount: params.amount.toString(),
        chargeId: params.reference || `BNK-PAYOUT-${Date.now()}`,
        bankAccountName: params.bankAccountName,
        bankAccountNumber: params.bankAccountNumber,
        email: params.email,
        firstName: params.firstName,
        lastName: params.lastName,
      });

      return {
        ...result,
        message: result.message || 'Bank payout initiated. Funds should arrive within 1-3 business days.',
        metadata: {
          ...result.metadata,
          provider: 'BANK_TRANSFER',
          bankName: bank.name,
        },
      };
    } catch (error: any) {
      logger.error('BankTransfer payout error', { 
        params, 
        error: error.message 
      });
      
      return {
        success: false,
        message: error.message || 'Bank payout failed.',
      };
    }
  }

  /**
   * Validate bank account number format
   */
  validateAccountNumber(bankName: string, accountNumber: string): boolean {
    const cleaned = accountNumber.replace(/\s/g, '');
    
    // Most Malawi bank accounts are 8-13 digits
    const accountRegex = /^\d{8,13}$/;
    
    if (!accountRegex.test(cleaned)) {
      return false;
    }

    // Bank-specific validation can be added here
    const bank = MALAWI_BANKS.find(
      b => b.name.toLowerCase() === bankName.toLowerCase()
    );

    if (!bank) {
      return false;
    }

    // National Bank accounts typically start with specific digits
    if (bank.shortCode === 'NBM' && !cleaned.startsWith('10')) {
      // Warning: NBM accounts usually start with 10, but not always
      logger.warn('BankTransfer: NBM account doesn\'t start with 10', { accountNumber });
    }

    return true;
  }

  /**
   * Get the expiry time for a bank transfer payment
   */
  getPaymentExpiry(createdAt: string, hoursValid: number = 24): Date {
    const created = new Date(createdAt);
    return new Date(created.getTime() + hoursValid * 60 * 60 * 1000);
  }

  /**
   * Check if a bank transfer payment has expired
   */
  isPaymentExpired(createdAt: string, hoursValid: number = 24): boolean {
    const expiry = this.getPaymentExpiry(createdAt, hoursValid);
    return new Date() > expiry;
  }

  // ─── Private Helper Methods ──────────────────────────────────

  /**
   * Format bank transfer instructions for the customer
   */
  private formatBankTransferInstructions(
    amount: number,
    accountDetails: BankAccountDetails,
    reference: string,
    expiryDate: Date | null
  ): string {
    const lines: string[] = [];
    
    lines.push(`📋 BANK TRANSFER INSTRUCTIONS`);
    lines.push(``);
    lines.push(`Amount: MWK ${amount.toLocaleString()}`);
    lines.push(`Reference: ${reference}`);
    lines.push(``);
    lines.push(`🏦 Bank Details:`);
    lines.push(`Bank: ${accountDetails.bank_name}`);
    lines.push(`Account Number: ${accountDetails.account_number}`);
    lines.push(`Account Name: ${accountDetails.account_name}`);
    
    if (expiryDate) {
      const now = new Date();
      const hoursRemaining = Math.round((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60));
      
      lines.push(``);
      lines.push(`⏰ Payment expires in ${hoursRemaining} hours`);
      lines.push(`Expiry: ${expiryDate.toLocaleString()}`);
    }
    
    lines.push(``);
    lines.push(`📱 How to pay:`);
    lines.push(`1. Open your bank app or dial USSD code`);
    lines.push(`2. Select "Send Money" or "Transfer"`);
    lines.push(`3. Enter the account details above`);
    lines.push(`4. Use the reference number in the description`);
    lines.push(`5. Confirm the transfer`);
    lines.push(``);
    lines.push(`✅ Payment will be confirmed within 5-30 minutes`);
    lines.push(`📧 A receipt will be sent to your email`);

    return lines.join('\n');
  }

  /**
   * Map bank transfer status to our transaction status
   */
  private mapStatus(status: string): TransactionStatus {
    const normalized = status?.toLowerCase() || '';
    
    if (['success', 'completed', 'paid', 'settled'].includes(normalized)) {
      return 'COMPLETED' as TransactionStatus;
    }
    if (['failed', 'cancelled', 'declined', 'expired'].includes(normalized)) {
      return 'FAILED' as TransactionStatus;
    }
    if (['pending', 'processing', 'initiated'].includes(normalized)) {
      return 'PENDING' as TransactionStatus;
    }
    
    return 'PENDING' as TransactionStatus;
  }
}

// Export singleton instance
export const bankTransferAdapter = new BankTransferAdapter();