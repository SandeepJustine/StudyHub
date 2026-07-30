// src/emails/password-reset.tsx
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

interface PasswordResetEmailProps {
  userName?: string;
  resetLink?: string;
  expiryHours?: number;
  appName?: string;
}

export const PasswordResetEmail: React.FC<PasswordResetEmailProps> = ({
  userName = 'User',
  resetLink = '#',
  expiryHours = 24,
  appName = 'StudyHub Malawi',
}) => {
  return (
    <Html>
      <Head />
      <Preview>Reset your password for {appName}</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto max-w-xl py-5 px-4">
            <Section className="bg-white rounded-lg shadow-md p-8">
              <Heading className="text-2xl font-bold text-gray-800 mb-4">
                Reset Your Password
              </Heading>
              <Text className="text-gray-600 mb-6">
                Hi {userName},
              </Text>
              <Text className="text-gray-600 mb-6">
                We received a request to reset your password for your {appName} account. If you made this request, please click the button below to set a new password.
              </Text>
              <Section className="text-center mb-6">
                <Button 
                  className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-md"
                  href={resetLink}
                >
                  Reset Password
                </Button>
              </Section>
              <Text className="text-gray-600 mb-6">
                This link will expire in {expiryHours} hours. If you didn't request a password reset, you can safely ignore this email.
              </Text>
              <Text className="text-gray-500 text-sm">
                If the button above doesn't work, you can copy and paste the following link into your browser:
              </Text>
              <Link 
                className="text-blue-600 text-sm break-all"
                href={resetLink}
              >
                {resetLink}
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

export default PasswordResetEmail;
