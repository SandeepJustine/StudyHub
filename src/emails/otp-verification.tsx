// src/emails/otp-verification.tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Link,
} from '@react-email/components';

interface OTPVerificationEmailProps {
  userName?: string;
  otp?: string;
  purpose?: string;
  expiryMinutes?: number;
}

export const OTPVerificationEmail = ({
  userName = 'Student',
  otp = '123456',
  purpose = 'verify your identity',
  expiryMinutes = 10,
}: OTPVerificationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your verification code: {otp}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={content}>
            <Heading style={heading}>Verification Code</Heading>
            
            <Text style={paragraph}>
              Hello {userName},
            </Text>
            
            <Text style={paragraph}>
              You requested to {purpose}. Use the code below to complete the process:
            </Text>

            {/* OTP Display */}
            <Section style={otpContainer}>
              <Text style={otpCode}>{otp}</Text>
            </Section>

            <Text style={warningText}>
              ⏰ This code expires in {expiryMinutes} minutes.
            </Text>

            <Text style={paragraph}>
              If you didn't request this code, please ignore this email or{' '}
              <Link href="mailto:security@studyhub.mw" style={link}>
                contact our security team
              </Link>
              .
            </Text>

            <Section style={securityNote}>
              <Text style={securityText}>
                🔒 For your security, never share this code with anyone.
                StudyHub will never ask for your verification code via phone or email.
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#F2F4F7',
  fontFamily: "'Poppins', sans-serif",
};

const container = {
  margin: '0 auto',
  padding: '20px 0',
  maxWidth: '480px',
};

const content = {
  backgroundColor: '#FFFFFF',
  padding: '40px',
  borderRadius: '8px',
};

const heading = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#0D1B3D',
  textAlign: 'center' as const,
  marginBottom: '24px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#333333',
  marginBottom: '16px',
};

const otpContainer = {
  backgroundColor: '#0D1B3D',
  padding: '20px',
  borderRadius: '8px',
  textAlign: 'center' as const,
  marginBottom: '24px',
};

const otpCode = {
  fontSize: '36px',
  fontWeight: 'bold',
  color: '#FFFFFF',
  letterSpacing: '8px',
};

const warningText = {
  fontSize: '14px',
  color: '#E63946',
  textAlign: 'center' as const,
  marginBottom: '24px',
  fontWeight: '500',
};

const link = {
  color: '#E63946',
  textDecoration: 'underline',
};

const securityNote = {
  backgroundColor: '#FFF3F3',
  padding: '16px',
  borderRadius: '8px',
  marginTop: '24px',
};

const securityText = {
  fontSize: '14px',
  color: '#666666',
  margin: 0,
};