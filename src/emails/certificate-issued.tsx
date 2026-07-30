// src/emails/certificate-issued.tsx
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

interface CertificateIssuedEmailProps {
  userName?: string;
  courseName?: string;
  certificateId?: string;
  issueDate?: string;
  viewCertificateLink?: string;
  downloadCertificateLink?: string;
  appName?: string;
}

export const CertificateIssuedEmail: React.FC<CertificateIssuedEmailProps> = ({
  userName = 'User',
  courseName = 'Course',
  certificateId = 'CERT-XXXXX',
  issueDate = new Date().toLocaleDateString(),
  viewCertificateLink = '#',
  downloadCertificateLink = '#',
  appName = 'StudyHub Malawi',
}) => {
  return (
    <Html>
      <Head />
      <Preview>Certificate of Completion for {courseName}</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto max-w-xl py-5 px-4">
            <Section className="bg-white rounded-lg shadow-md p-8">
              <Heading className="text-2xl font-bold text-gray-800 mb-4">
                Congratulations! You've Earned a Certificate
              </Heading>
              <Text className="text-gray-600 mb-6">
                Hi {userName},
              </Text>
              <Text className="text-gray-600 mb-6">
                We're thrilled to inform you that you've successfully completed <strong>{courseName}</strong> and have been awarded a Certificate of Completion!
              </Text>
              <Section className="bg-gray-100 rounded-lg p-6 mb-6">
                <Text className="text-gray-600 mb-2">
                  <strong>Course:</strong> {courseName}
                </Text>
                <Text className="text-gray-600 mb-2">
                  <strong>Certificate ID:</strong> {certificateId}
                </Text>
                <Text className="text-gray-600 mb-2">
                  <strong>Issue Date:</strong> {issueDate}
                </Text>
              </Section>
              <Section className="text-center mb-6">
                <Button 
                  className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-md mr-2"
                  href={viewCertificateLink}
                >
                  View Certificate
                </Button>
                <Button 
                  className="bg-green-600 text-white font-semibold py-3 px-6 rounded-md"
                  href={downloadCertificateLink}
                >
                  Download Certificate
                </Button>
              </Section>
              <Text className="text-gray-600 mb-6">
                This certificate verifies your achievement and can be shared on your professional profiles, such as LinkedIn. It's a testament to your dedication and hard work.
              </Text>
              <Text className="text-gray-500 text-sm">
                Keep up the excellent work on your learning journey!
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

export default CertificateIssuedEmail;
