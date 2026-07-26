import crypto from 'crypto';

export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;

  constructor() {
    this.key = crypto.scryptSync(
      process.env.ENCRYPTION_KEY || 'studyhub-encryption-key',
      'studyhub-salt',
      32
    );
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag().toString('hex');

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag,
    };
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData: { encrypted: string; iv: string; tag: string }): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(encryptedData.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Hash sensitive data for storage
   */
  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Encrypt payment information
   */
  encryptPaymentInfo(paymentData: {
    cardNumber?: string;
    phone?: string;
    accountNumber?: string;
  }): any {
    const encrypted: any = {};

    if (paymentData.cardNumber) {
      encrypted.cardNumber = this.encrypt(paymentData.cardNumber);
      encrypted.lastFour = paymentData.cardNumber.slice(-4);
    }

    if (paymentData.phone) {
      encrypted.phone = this.encrypt(paymentData.phone);
    }

    if (paymentData.accountNumber) {
      encrypted.accountNumber = this.encrypt(paymentData.accountNumber);
    }

    return encrypted;
  }

  /**
   * Mask sensitive data for display
   */
  maskData(data: string, type: 'email' | 'phone' | 'card' | 'account'): string {
    switch (type) {
      case 'email':
        const [name, domain] = data.split('@');
        return `${name.charAt(0)}***${name.charAt(name.length - 1)}@${domain}`;
      case 'phone':
        return data.slice(0, 6) + '****' + data.slice(-2);
      case 'card':
        return '****-****-****-' + data.slice(-4);
      case 'account':
        return '****' + data.slice(-4);
      default:
        return data;
    }
  }
}