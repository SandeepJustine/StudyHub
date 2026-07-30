// src/emails/event-registration.tsx
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

interface EventRegistrationEmailProps {
  userName?: string;
  eventName?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  eventLink?: string;
  calendarLink?: string;
  appName?: string;
}

export const EventRegistrationEmail: React.FC<EventRegistrationEmailProps> = ({
  userName = 'User',
  eventName = 'Event',
  eventDate = new Date().toLocaleDateString(),
  eventTime = 'Time',
  eventLocation = 'Location',
  eventLink = '#',
  calendarLink = '#',
  appName = 'StudyHub Malawi',
}) => {
  return (
    <Html>
      <Head />
      <Preview>You're registered for {eventName}</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto max-w-xl py-5 px-4">
            <Section className="bg-white rounded-lg shadow-md p-8">
              <Heading className="text-2xl font-bold text-gray-800 mb-4">
                Event Registration Confirmed
              </Heading>
              <Text className="text-gray-600 mb-6">
                Hi {userName},
              </Text>
              <Text className="text-gray-600 mb-6">
                You're successfully registered for <strong>{eventName}</strong>! We're excited to have you join us.
              </Text>
              <Section className="bg-gray-100 rounded-lg p-6 mb-6">
                <Text className="text-gray-600 mb-2">
                  <strong>Event:</strong> {eventName}
                </Text>
                <Text className="text-gray-600 mb-2">
                  <strong>Date:</strong> {eventDate}
                </Text>
                <Text className="text-gray-600 mb-2">
                  <strong>Time:</strong> {eventTime}
                </Text>
                <Text className="text-gray-600 mb-2">
                  <strong>Location:</strong> {eventLocation}
                </Text>
              </Section>
              <Section className="text-center mb-6">
                <Button 
                  className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-md mr-2"
                  href={eventLink}
                >
                  View Event Details
                </Button>
                <Button 
                  className="bg-green-600 text-white font-semibold py-3 px-6 rounded-md"
                  href={calendarLink}
                >
                  Add to Calendar
                </Button>
              </Section>
              <Text className="text-gray-600 mb-6">
                Please arrive 15 minutes before the event starts to check in. If this is a virtual event, please ensure you have a stable internet connection.
              </Text>
              <Text className="text-gray-500 text-sm">
                If you can no longer attend, please let us know so we can offer your spot to someone else.
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

export default EventRegistrationEmail;
