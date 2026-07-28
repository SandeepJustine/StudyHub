// src/emails/generic-notification.tsx
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Link,
} from '@react-email/components';

interface GenericNotificationEmailProps {
  userName?: string;
  title?: string;
  message?: string;
  metadata?: Record<string, any>;
  locale?: string;
}

export const GenericNotificationEmail = ({
  userName = 'Student',
  title = 'StudyHub Notification',
  message = 'You have a new notification from StudyHub Malawi.',
  metadata,
  locale = 'en',
}: GenericNotificationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>{title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={content}>
            <Heading style={heading}>{title}</Heading>
            <Text style={paragraph}>Hello {userName},</Text>
            <Text style={paragraph}>{message}</Text>
            {metadata?.actionUrl && (
              <Section style={ctaContainer}>
                <Link href={metadata.actionUrl} style={ctaButton}>{metadata.actionLabel || 'View Details'}</Link>
              </Section>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = { backgroundColor: '#F2F4F7', fontFamily: "'Poppins', sans-serif" };
const container = { margin: '0 auto', padding: '20px 0', maxWidth: '480px' };
const content = { backgroundColor: '#FFFFFF', padding: '40px', borderRadius: '8px' };
const heading = { fontSize: '24px', fontWeight: 'bold', color: '#0D1B3D', textAlign: 'center' as const, marginBottom: '24px' };
const paragraph = { fontSize: '16px', lineHeight: '24px', color: '#333333', marginBottom: '16px' };
const ctaContainer = { textAlign: 'center' as const, marginBottom: '24px' };
const ctaButton = { backgroundColor: '#E63946', color: '#FFFFFF', padding: '12px 32px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', textDecoration: 'none', display: 'inline-block' };
