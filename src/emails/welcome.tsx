// src/emails/welcome.tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Link,
  Row,
  Column,
} from '@react-email/components';

interface WelcomeEmailProps {
  userName?: string;
  role?: string;
  features?: Array<{ icon: string; title: string; description: string }>;
}

export const WelcomeEmail = ({
  userName = 'Student',
  role = 'Student',
  features = [
    { icon: '📚', title: 'Video Lessons', description: 'Learn from expert instructors' },
    { icon: '📝', title: 'Practice Quizzes', description: 'Test your knowledge' },
    { icon: '🎓', title: 'Mock Exams', description: 'Prepare for real exams' },
    { icon: '💬', title: 'Community', description: 'Connect with other learners' },
  ],
}: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to StudyHub Malawi - Let's start learning!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img
              src="https://studyhub.mw/logo-white.png"
              width="150"
              height="40"
              alt="StudyHub Malawi"
            />
          </Section>

          <Section style={content}>
            <Heading style={heading}>
              Welcome to StudyHub, {userName}! 🎉
            </Heading>

            <Text style={paragraph}>
              We're thrilled to have you join our learning community. Your {role.toLowerCase()} account 
              is now set up and ready to use.
            </Text>

            <Text style={tagline}>
              Learn. Practice. Succeed.
            </Text>

            {/* Features Grid */}
            <Section style={featuresGrid}>
              {features.map((feature, index) => (
                <Row key={index} style={featureRow}>
                  <Column style={featureIcon}>{feature.icon}</Column>
                  <Column style={featureContent}>
                    <Text style={featureTitle}>{feature.title}</Text>
                    <Text style={featureDescription}>{feature.description}</Text>
                  </Column>
                </Row>
              ))}
            </Section>

            {/* CTA */}
            <Section style={ctaContainer}>
              <Link href="https://studyhub.mw/student/dashboard" style={ctaButton}>
                Start Learning Now
              </Link>
            </Section>

            <Text style={paragraph}>
              Need help getting started? Check out our{' '}
              <Link href="https://studyhub.mw/help" style={link}>
                Getting Started Guide
              </Link>
              .
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              StudyHub Malawi • Learn. Practice. Succeed.
            </Text>
            <Text style={footerText}>
              Follow us on{' '}
              <Link href="https://facebook.com/studyhubmw" style={link}>Facebook</Link>
              {' • '}
              <Link href="https://twitter.com/studyhubmw" style={link}>Twitter</Link>
              {' • '}
              <Link href="https://instagram.com/studyhubmw" style={link}>Instagram</Link>
            </Text>
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
  maxWidth: '600px',
};

const header = {
  backgroundColor: '#0D1B3D',
  padding: '32px 20px',
  textAlign: 'center' as const,
};

const content = {
  backgroundColor: '#FFFFFF',
  padding: '40px',
};

const heading = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#0D1B3D',
  marginBottom: '20px',
  textAlign: 'center' as const,
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#333333',
  marginBottom: '16px',
};

const tagline = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#E63946',
  textAlign: 'center' as const,
  marginBottom: '32px',
  fontStyle: 'italic',
};

const featuresGrid = {
  marginBottom: '32px',
};

const featureRow = {
  marginBottom: '20px',
};

const featureIcon = {
  fontSize: '32px',
  width: '60px',
  textAlign: 'center' as const,
};

const featureContent = {
  paddingLeft: '16px',
};

const featureTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#0D1B3D',
  marginBottom: '4px',
};

const featureDescription = {
  fontSize: '14px',
  color: '#666666',
};

const ctaContainer = {
  textAlign: 'center' as const,
  marginBottom: '24px',
};

const ctaButton = {
  backgroundColor: '#E63946',
  color: '#FFFFFF',
  padding: '14px 40px',
  borderRadius: '8px',
  fontSize: '18px',
  fontWeight: 'bold',
  textDecoration: 'none',
  display: 'inline-block',
};

const link = {
  color: '#E63946',
  textDecoration: 'underline',
};

const footer = {
  textAlign: 'center' as const,
  padding: '20px',
  backgroundColor: '#0D1B3D',
};

const footerText = {
  fontSize: '14px',
  color: '#FFFFFF',
  marginBottom: '8px',
};