// src/emails/renewal-reminder.tsx
import React from 'react';
import { 
  Body, 
  Button, 
  Container, 
  Head, 
  Heading, 
  Html, 
  Preview, 
  Section, 
  Text, 
  Tailwind,
} from '@react-email/components';

interface RenewalReminderEmailProps {
  userName?: string;
  planName?: string;
  expiryDate?: string;
  renewalLink?: string;
  appName?: string;
}

export const RenewalReminderEmail: React.FC<RenewalReminderEmailProps> = ({
  userName = 'User',
  planName = 'Plan',
  expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
  renewalLink = '#',
  appName = 'StudyHub Malawi',
}) => {
  return (
    <Html>
      <Head />
      <Preview>Your {planName} subscription is expiring soon</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto max-w-xl py-5 px-4">
            <Section className="bg-white rounded-lg shadow-md p-8">
              <Heading className="text-2xl font-bold text-gray-800 mb-4">
                Your Subscription is Expiring Soon
              </Heading>
              <Text className="text-gray-600 mb-6">
                Hi {userName},
              </Text>
              <Text className="text-gray-600 mb-6">
                This is a friendly reminder that your {planName} subscription will expire on {expiryDate}. To continue enjoying uninterrupted access to all features, please renew your subscription before the expiry date.
              </Text>
              <Section className="text-center mb-6">
                <Button 
                  className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-md"
                  href={renewalLink}
                >
                  Renew Subscription
                </Button>
              </Section>
              <Text className="text-gray-600 mb-6">
                If you have any questions about your subscription or need assistance with the renewal process, please don't hesitate to contact our support team.
              </Text>
              <Text className="text-gray-500 text-sm">
                We value your continued support and look forward to serving you.
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

export default RenewalReminderEmail;
