/**
 * SMS Provider configurations for different gateways
 */

export interface SMSProviderConfig {
  name: string;
  enabled: boolean;
  priority: number;
  apiEndpoint: string;
  apiKey: string;
  senderId: string;
  supportedCountries: string[];
  maxMessageLength: number;
  supportsUnicode: boolean;
  costPerSMS: number; // USD
  reliability: number; // 0-1
}

export const SMS_PROVIDERS: Record<string, SMSProviderConfig> = {
  africastalking: {
    name: 'Africa\'s Talking',
    enabled: false,
    priority: 1,
    apiEndpoint: 'https://api.africastalking.com/version1/messaging',
    apiKey: process.env.AT_API_KEY || '',
    senderId: 'StudyHub',
    supportedCountries: ['MW', 'KE', 'UG', 'TZ', 'NG', 'ZA'],
    maxMessageLength: 160,
    supportsUnicode: true,
    costPerSMS: 0.02,
    reliability: 0.95,
  },
  twilio: {
    name: 'Twilio',
    enabled: false,
    priority: 2,
    apiEndpoint: 'https://api.twilio.com/2010-04-01/Accounts',
    apiKey: process.env.TWILIO_API_KEY || '',
    senderId: 'StudyHub',
    supportedCountries: ['MW', 'KE', 'UG', 'TZ', 'NG', 'ZA'],
    maxMessageLength: 160,
    supportsUnicode: true,
    costPerSMS: 0.05,
    reliability: 0.99,
  },
  infobip: {
    name: 'Infobip',
    enabled: false,
    priority: 3,
    apiEndpoint: 'https://api.infobip.com/sms/2/text/advanced',
    apiKey: process.env.INFOBIP_API_KEY || '',
    senderId: 'StudyHub',
    supportedCountries: ['MW', 'KE', 'UG', 'TZ', 'NG', 'ZA'],
    maxMessageLength: 160,
    supportsUnicode: true,
    costPerSMS: 0.03,
    reliability: 0.97,
  },
  local_malawi: {
    name: 'Malawi Local Provider',
    enabled: true,
    priority: 0, // Highest priority for local
    apiEndpoint: process.env.SMS_GATEWAY_URL || '',
    apiKey: process.env.SMS_API_KEY || '',
    senderId: 'StudyHub',
    supportedCountries: ['MW'],
    maxMessageLength: 160,
    supportsUnicode: false,
    costPerSMS: 0.01,
    reliability: 0.90,
  },
};

/**
 * Get available SMS providers sorted by priority
 */
export function getAvailableProviders(country: string = 'MW'): SMSProviderConfig[] {
  return Object.values(SMS_PROVIDERS)
    .filter(p => p.enabled && p.supportedCountries.includes(country))
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Get fallback provider
 */
export function getFallbackProvider(primaryProvider: string): SMSProviderConfig | null {
  const providers = getAvailableProviders();
  const index = providers.findIndex(p => p.name === primaryProvider);
  
  if (index < providers.length - 1) {
    return providers[index + 1];
  }
  
  return null;
}

/**
 * Estimate SMS cost for a batch
 */
export function estimateSMSCost(
  messageCount: number,
  provider: string = 'local_malawi'
): number {
  const config = SMS_PROVIDERS[provider];
  if (!config) return 0;

  return Math.round(messageCount * config.costPerSMS * 100) / 100;
}