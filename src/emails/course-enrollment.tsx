// src/emails/course-enrollment.tsx
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

interface CourseEnrollmentEmailProps {
  userName?: string;
  courseName?: string;
  instructorName?: string;
  courseLink?: string;
  startDate?: string;
  appName?: string;
}

export const CourseEnrollmentEmail: React.FC<CourseEnrollmentEmailProps> = ({
  userName = 'User',
  courseName = 'Course',
  instructorName = 'Instructor',
  courseLink = '#',
  startDate = 'Soon',
  appName = 'StudyHub Malawi',
}) => {
  return (
    <Html>
      <Head />
      <Preview>You're enrolled in {courseName}!</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto max-w-xl py-5 px-4">
            <Section className="bg-white rounded-lg shadow-md p-8">
              <Heading className="text-2xl font-bold text-gray-800 mb-4">
                You're Enrolled!
              </Heading>
              <Text className="text-gray-600 mb-6">
                Hi {userName},
              </Text>
              <Text className="text-gray-600 mb-6">
                Congratulations! You've successfully enrolled in <strong>{courseName}</strong> taught by {instructorName}.
              </Text>
              <Text className="text-gray-600 mb-6">
                Course Details:
              </Text>
              <Section className="bg-gray-100 rounded-lg p-6 mb-6">
                <Text className="text-gray-600 mb-2">
                  <strong>Course:</strong> {courseName}
                </Text>
                <Text className="text-gray-600 mb-2">
                  <strong>Instructor:</strong> {instructorName}
                </Text>
                <Text className="text-gray-600 mb-2">
                  <strong>Start Date:</strong> {startDate}
                </Text>
              </Section>
              <Section className="text-center mb-6">
                <Button 
                  className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-md"
                  href={courseLink}
                >
                  Go to Course
                </Button>
              </Section>
              <Text className="text-gray-600 mb-6">
                Get ready to start your learning journey! If you have any questions about the course, feel free to reach out to your instructor or our support team.
              </Text>
              <Text className="text-gray-500 text-sm">
                Happy learning!
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

export default CourseEnrollmentEmail;
