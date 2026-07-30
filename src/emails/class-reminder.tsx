// src/emails/class-reminder.tsx
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

interface ClassReminderEmailProps {
  userName?: string;
  className?: string;
  instructorName?: string;
  classDate?: string;
  classTime?: string;
  joinLink?: string;
  appName?: string;
}

export const ClassReminderEmail: React.FC<ClassReminderEmailProps> = ({
  userName = 'User',
  className = 'Class',
  instructorName = 'Instructor',
  classDate = new Date().toLocaleDateString(),
  classTime = 'Time',
  joinLink = '#',
  appName = 'StudyHub Malawi',
}) => {
  return (
    <Html>
      <Head />
      <Preview>Reminder: {className} is starting soon</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto max-w-xl py-5 px-4">
            <Section className="bg-white rounded-lg shadow-md p-8">
              <Heading className="text-2xl font-bold text-gray-800 mb-4">
                Upcoming Class Reminder
              </Heading>
              <Text className="text-gray-600 mb-6">
                Hi {userName},
              </Text>
              <Text className="text-gray-600 mb-6">
                This is a friendly reminder that you have an upcoming live class:
              </Text>
              <Section className="bg-gray-100 rounded-lg p-6 mb-6">
                <Text className="text-gray-600 mb-2">
                  <strong>Class:</strong> {className}
                </Text>
                <Text className="text-gray-600 mb-2">
                  <strong>Instructor:</strong> {instructorName}
                </Text>
                <Text className="text-gray-600 mb-2">
                  <strong>Date:</strong> {classDate}
                </Text>
                <Text className="text-gray-600 mb-2">
                  <strong>Time:</strong> {classTime}
                </Text>
              </Section>
              <Section className="text-center mb-6">
                <Button 
                  className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-md"
                  href={joinLink}
                >
                  Join Class
                </Button>
              </Section>
              <Text className="text-gray-600 mb-6">
                Please make sure you have a stable internet connection and any required materials ready before the class begins.
              </Text>
              <Text className="text-gray-500 text-sm">
                If you can't attend this class, a recording will be available afterward.
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

export default ClassReminderEmail;
