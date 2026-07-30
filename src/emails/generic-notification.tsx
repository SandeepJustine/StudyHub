// src/emails/generic-notification.tsx
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
} from '@react-email/components';

interface GenericNotificationEmailProps {
  userName?: string;
  title?: string;
  message?: string;
  appName?: string;
}

export const GenericNotificationEmail: React.FC<GenericNotificationEmailProps> = ({
  userName = 'User',
  title = 'Notification',
  message = 'You have a new notification.',
  appName = 'StudyHub Malawi',
}) => {
  return (
    <Html>
      <Head />
      <Preview>{title}</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto max-w-xl py-5 px-4">
            <Section className="bg-white rounded-lg shadow-md p-8">
              <Heading className="text-2xl font-bold text-gray-800 mb-4">
                {title}
              </Heading>
              <Text className="text-gray-600 mb-6">
                Hi {userName},
              </Text>
              <Text className="text-gray-600 mb-6">
                {message}
              </Text>
              <Text className="text-gray-500 text-sm">
                If you have any questions about this notification, please don't hesitate to contact our support team.
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

export default GenericNotificationEmail;
