import { PaymentProvider, PaymentResult, PaymentVerification } from '../types';
import { TransactionStatus } from '@/types/subscription';

export class BankTransferAdapter implements PaymentProvider {
  name = 'BANK_TRANSFER';
  
  private bankAccounts = {
    national_bank: {
      bankName: 'National Bank of Malawi',
      accountNumber: process.env.BANK_ACCOUNT_NATIONAL || '1234567890',
      accountName: 'StudyHub Malawi Ltd',
      branch: 'Lilongwe Main Branch',
      swiftCode: 'NBMWMWMW',
    },
    standard_bank: {
      bankName: 'Standard Bank Malawi',
      accountNumber: process.env.BANK_ACCOUNT_STANDARD || '0987654321',
      accountName: 'StudyHub Malawi Ltd',
      branch: 'Blantyre Branch',
      swiftCode: 'SBICMWMX',
    },
    nbs: {
      bankName: 'NBS Bank',
      accountNumber: process.env.BANK_ACCOUNT_NBS || '5678901234',
      accountName: 'StudyHub Malawi Ltd',
      branch: 'Mzuzu Branch',
      swiftCode: 'NBSWMWMW',
    },
    fdh: {
      bankName: 'FDH Bank',
      accountNumber: process.env.BANK_ACCOUNT_FDH || '3456789012',
      accountName: 'StudyHub Malawi Ltd',
      branch: 'Lilongwe City Branch',
      swiftCode: 'FDHMMWMW',
    },
  };

  async initiatePayment(request: any): Promise<PaymentResult> {
    try {
      const selectedBank = request.metadata?.bank || 'national_bank';
      const bankInfo = this.bankAccounts[selectedBank as keyof typeof this.bankAccounts];

      if (!bankInfo) {
        return {
          success: false,
          message: 'Invalid bank selected',
        };
      }

      // Generate invoice reference
      const reference = request.metadata?.reference || `INV-${Date.now()}`;

      // In production, generate PDF invoice with bank details
      const paymentInstructions = `
        Bank: ${bankInfo.bankName}
        Account Number: ${bankInfo.accountNumber}
        Account Name: ${bankInfo.accountName}
        Branch: ${bankInfo.branch}
        SWIFT Code: ${bankInfo.swiftCode}
        Amount: MWK ${request.amount.toLocaleString()}
        Reference: ${reference}
      `.trim();

      return {
        success: true,
        transactionId: reference,
        providerReference: `BANK-${reference}`,
        message: `Please transfer to:\n${paymentInstructions}`,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Bank transfer service unavailable',
      };
    }
  }

  async verifyPayment(reference: string): Promise<PaymentVerification> {
    // Bank transfers require manual verification by admin
    return {
      verified: false,
      status: 'PENDING' as TransactionStatus,
      metadata: {
        requiresReconciliation: true,
        message: 'Bank transfer verification pending - please check bank statement',
      },
    };
  }

  async handleWebhook(payload: any): Promise<void> {
    // Bank transfers don't have webhooks - manual reconciliation
    console.log('Bank transfer reconciliation needed:', payload);
  }
}