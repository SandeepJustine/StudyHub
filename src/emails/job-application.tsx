// src/emails/job-application.tsx
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

interface JobApplicationEmailProps {
  userName?: string;
  jobTitle?: string;
  companyName?: string;
  applicationDate?: string;
  applicationId?: string;
  appName?: string;
}

export const JobApplicationEmail: React.FC<JobApplicationEmailProps> = ({
  userName = 'User',
  jobTitle = 'Position',
  companyName = 'Company',
  applicationDate = new Date().toLocaleDateString(),
  applicationId = 'APP-XXXXX',
  appName = 'StudyHub Malawi',
}) => {
  return (
    <Html>
      <Head />
      <Preview>Application received for {jobTitle} at {companyName}</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto max-w-xl py-5 px-4">
            <Section className="bg-white rounded-lg shadow-md p-8">
              <Heading className="text-2xl font-bold text-gray-800 mb-4">
                Application Received
              </Heading>
              <Text className="text-gray-600 mb-6">
                Hi {userName},
              </Text>
              <Text className="text-gray-600 mb-6">
                Thank you for applying for the <strong>{jobTitle}</strong> position at <strong>{companyName}</strong>. We've received your application and will review it shortly.
              </Text>
              <Section className="bg-gray-100 rounded-lg p-6 mb-6">
                <Text className="text-gray-600 mb-2">
                  <strong>Position:</strong> {jobTitle}
                </Text>
                <Text className="text-gray-600 mb-2">
                  <strong>Company:</strong> {companyName}
                </Text>
                <Text className="text-gray-600 mb-2">
                  <strong>Application Date:</strong> {applicationDate}
                </Text>
                <Text className="text-gray-600 mb-2">
                  <strong>Application ID:</strong> {applicationId}
                </Text>
              </Section>
              <Text className="text-gray-600 mb-6">
                Our hiring team will carefully review your qualifications and experience. If your profile matches our requirements, we'll contact you for the next steps in the recruitment process.
              </Text>
              <Text className="text-gray-600 mb-6">
                This process typically takes 1-2 weeks, but it may vary depending on the number of applications we receive.
              </Text>
              <Text className="text-gray-500 text-sm">
                Thank you for your interest in joining {companyName}. We appreciate the time you've taken to apply.
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

export default JobApplicationEmail;
