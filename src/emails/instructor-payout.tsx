// src/emails/instructor-payout.tsx
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

interface InstructorPayoutEmailProps {
  instructorName?: string;
  amount?: string;
  period?: string;
  transactionId?: string;
  payoutDate?: string;
  appName?: string;
}

export const InstructorPayoutEmail: React.FC<InstructorPayoutEmailProps> = ({
  instructorName = 'Instructor',
  amount = '$0.00',
  period = 'Period',
  transactionId = 'TXN-XXXXX',
  payoutDate = new Date().toLocaleDateString(),
  appName = 'StudyHub Malawi',
}) => {
  return (
    <Html>
      <Head />
      <Preview>Your instructor payout for {period}</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto max-w-xl py-5 px-4">
            <Section className="bg-white rounded-lg shadow-md p-8">
              <Heading className="text-2xl font-bold text-gray-800 mb-4">
                Instructor Payout
              </Heading>
              <Text className="text-gray-600 mb-6">
                Dear {instructorName},
              </Text>
              <Text className="text-gray-600 mb-6">
                We're pleased to inform you that your instructor payout for {period} has been processed.
              </Text>
              <Hr className="border-gray-200 my-6" />
              <Section className="mb-6">
                <Text className="text-gray-600 mb-2">
                  <strong>Payout Amount:</strong> {amount}
                </Text>
                <Text className="text-gray-600 mb-2">
                  <strong>Period:</strong> {period}
                </Text>
                <Text className="text-gray-600 mb-2">
                  <strong>Transaction ID:</strong> {transactionId}
                </Text>
                <Text className="text-gray-600 mb-2">
                  <strong>Payout Date:</strong> {payoutDate}
                </Text>
              </Section>
              <Hr className="border-gray-200 my-6" />
              <Text className="text-gray-600 mb-6">
                The funds have been transferred to your registered payment method. Please allow 3-5 business days for the amount to reflect in your account, depending on your bank's processing times.
              </Text>
              <Text className="text-gray-600 mb-6">
                Thank you for your valuable contributions to {appName}. We appreciate your dedication to teaching and look forward to our continued partnership.
              </Text>
              <Text className="text-gray-500 text-sm">
                If you have any questions about this payout, please don't hesitate to contact our support team.
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

export default InstructorPayoutEmail;
