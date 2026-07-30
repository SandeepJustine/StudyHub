// src/emails/account-verification.tsx
import React from 'react';
import { 
  Body, 
  Button, 
  Container, 
  Head, 
  Heading, 
  Html, 
  Link, 
  Preview, 
  Section, 
  Text, 
  Tailwind,
} from '@react-email/components';

interface AccountVerificationEmailProps {
  userName?: string;
  verificationLink?: string;
  appName?: string;
}

export const AccountVerificationEmail: React.FC<AccountVerificationEmailProps> = ({
  userName = 'User',
  verificationLink = '#',
  appName = 'StudyHub Malawi',
}) => {
  return (
    <Html>
      <Head />
      <Preview>Verify your email address for {appName}</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto max-w-xl py-5 px-4">
            <Section className="bg-white rounded-lg shadow-md p-8">
              <Heading className="text-2xl font-bold text-gray-800 mb-4">
                Verify Your Email Address
              </Heading>
              <Text className="text-gray-600 mb-6">
                Hi {userName},
              </Text>
              <Text className="text-gray-600 mb-6">
                Thank you for signing up for {appName}. To complete your registration, please verify your email address by clicking the button below.
              </Text>
              <Section className="text-center mb-6">
                <Button 
                  className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-md"
                  href={verificationLink}
                >
                  Verify Email Address
                </Button>
              </Section>
              <Text className="text-gray-600 mb-6">
                This link will expire in 24 hours. If you didn't create an account with {appName}, you can safely ignore this email.
              </Text>
              <Text className="text-gray-500 text-sm">
                If the button above doesn't work, you can copy and paste the following link into your browser:
              </Text>
              <Link 
                className="text-blue-600 text-sm break-all"
                href={verificationLink}
              >
                {verificationLink}
              </Link>
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

export default AccountVerificationEmail;
