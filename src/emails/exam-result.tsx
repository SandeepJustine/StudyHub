// src/emails/exam-result.tsx
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
  Hr,
} from '@react-email/components';

interface ExamResultEmailProps {
  userName?: string;
  examName?: string;
  score?: string;
  percentage?: string;
  passed?: boolean;
  resultsLink?: string;
  appName?: string;
}

export const ExamResultEmail: React.FC<ExamResultEmailProps> = ({
  userName = 'User',
  examName = 'Exam',
  score = '0/0',
  percentage = '0%',
  passed = false,
  resultsLink = '#',
  appName = 'StudyHub Malawi',
}) => {
  const resultColor = passed ? 'text-green-600' : 'text-red-600';
  const resultText = passed ? 'Congratulations! You passed!' : 'Unfortunately, you did not pass this exam.';
  
  return (
    <Html>
      <Head />
      <Preview>Your results for {examName}</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto max-w-xl py-5 px-4">
            <Section className="bg-white rounded-lg shadow-md p-8">
              <Heading className="text-2xl font-bold text-gray-800 mb-4">
                Your Exam Results
              </Heading>
              <Text className="text-gray-600 mb-6">
                Hi {userName},
              </Text>
              <Text className="text-gray-600 mb-6">
                Your results for {examName} are now available.
              </Text>
              <Section className="bg-gray-100 rounded-lg p-6 mb-6">
                <Text className="text-gray-600 mb-2">
                  <strong>Exam:</strong> {examName}
                </Text>
                <Text className="text-gray-600 mb-2">
                  <strong>Score:</strong> {score}
                </Text>
                <Text className="text-gray-600 mb-2">
                  <strong>Percentage:</strong> {percentage}
                </Text>
                <Text className={`font-bold ${resultColor} mt-4`}>
                  {resultText}
                </Text>
              </Section>
              <Section className="text-center mb-6">
                <Button 
                  className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-md"
                  href={resultsLink}
                >
                  View Detailed Results
                </Button>
              </Section>
              <Text className="text-gray-600 mb-6">
                {passed 
                  ? "Great job on your performance! Keep up the good work and continue your learning journey."
                  : "Don't be discouraged! Review the material and try again. Remember, learning is a journey, and every attempt helps you improve."
                }
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

export default ExamResultEmail;
