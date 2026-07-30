// src/emails/subscription-receipt.tsx
import React from 'react';
import { 
  Body, 
  Container, 
  Head, 
  Heading, 
  Html, 
  Preview, 
  Section, 
  Text, 
  Tailwind,
  Hr,
} from '@react-email/components';

interface SubscriptionReceiptEmailProps {
  userName?: string;
  planName?: string;
  amount?: string;
  billingPeriod?: string;
  transactionId?: string;
  paymentDate?: string;
  nextBillingDate?: string;
  appName?: string;
}

export const SubscriptionReceiptEmail: React.FC<SubscriptionReceiptEmailProps> = ({
  userName = 'User',
  planName = 'Plan',
  amount = '$0.00',
  billingPeriod = 'Monthly',
  transactionId = 'TXN-XXXXX',
  paymentDate = new Date().toLocaleDateString(),
  nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
  appName = 'StudyHub Malawi',
}) => {
  return (
    <Html>
      <Head />
      <Preview>Receipt for your {planName} subscription</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto max-w-xl py-5 px-4">
            <Section className="bg-white rounded-lg shadow-md p-8">
              <Heading className="text-2xl font-bold text-gray-800 mb-4">
                Subscription Receipt
              </Heading>
              <Text className="text-gray-600 mb-6">
                Hi {userName},
              </Text>
              <Text className="text-gray-600 mb-6">
                Thank you for your payment! Here's your receipt for your {planName} subscription.
              </Text>
              <Hr className="border-gray-200 my-6" />
              <Section className="mb-6">
                <Text className="text-gray-600 mb-2">
                  <strong>Plan:</strong> {planName}
                </Text>
                <Text className="text-gray-600 mb-2">
                  <strong>Amount:</strong> {amount}
                </Text>
                <Text className="text-gray-600 mb-2">
                  <strong>Billing Period:</strong> {billingPeriod}
                </Text>
                <Text className="text-gray-600 mb-2">
                  <strong>Transaction ID:</strong> {transactionId}
                </Text>
                <Text className="text-gray-600 mb-2">
                  <strong>Payment Date:</strong> {paymentDate}
                </Text>
                <Text className="text-gray-600 mb-2">
                  <strong>Next Billing Date:</strong> {nextBillingDate}
                </Text>
              </Section>
              <Hr className="border-gray-200 my-6" />
              <Text className="text-gray-600 mb-6">
                This receipt confirms your payment for the {billingPeriod.toLowerCase()} billing period. Your subscription will automatically renew on {nextBillingDate} unless you cancel before then.
              </Text>
              <Text className="text-gray-500 text-sm">
                A detailed invoice has been attached to this email for your records.
              </Text>
            </Section>
            <Text className="text-center text-gray-500 text-sm mt-4">
              © {new Date().getFullYear()} {appName}. All rights reserved.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default SubscriptionReceiptEmail;
