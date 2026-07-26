// src/emails/payment-confirmation.tsx
import {
  Body,
  Container,
  Column,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
  Link,
  Hr,
} from '@react-email/components';

interface PaymentConfirmationEmailProps {
  userName?: string;
  amount?: number;
  planName?: string;
  paymentMethod?: string;
  transactionReference?: string;
  date?: string;
  invoiceUrl?: string;
}

export const PaymentConfirmationEmail = ({
  userName = 'Student',
  amount = 5000,
  planName = 'Student Basic',
  paymentMethod = 'Airtel Money',
  transactionReference = 'SH-20260723-ABC123',
  date = new Date().toLocaleDateString('en-MW', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }),
  invoiceUrl = 'https://studyhub.mw/invoices/SH-20260723-ABC123',
}: PaymentConfirmationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Payment Confirmed - StudyHub Malawi</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img
              src="https://studyhub.mw/logo-color.png"
              width="150"
              height="40"
              alt="StudyHub Malawi"
            />
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading style={heading}>Payment Confirmed! 🎉</Heading>
            
            <Text style={paragraph}>
              Dear {userName},
            </Text>
            
            <Text style={paragraph}>
              Thank you for your payment. Your subscription to <strong>{planName}</strong> is now active.
            </Text>

            {/* Payment Details Box */}
            <Section style={detailsBox}>
              <Heading as="h2" style={detailsHeading}>
                Payment Details
              </Heading>
              
              <Row style={detailRow}>
                <Column style={detailLabel}>Amount Paid:</Column>
                <Column style={detailValue}>MWK {amount.toLocaleString()}</Column>
              </Row>
              
              <Row style={detailRow}>
                <Column style={detailLabel}>Plan:</Column>
                <Column style={detailValue}>{planName}</Column>
              </Row>
              
              <Row style={detailRow}>
                <Column style={detailLabel}>Payment Method:</Column>
                <Column style={detailValue}>{paymentMethod}</Column>
              </Row>
              
              <Row style={detailRow}>
                <Column style={detailLabel}>Date:</Column>
                <Column style={detailValue}>{date}</Column>
              </Row>
              
              <Row style={detailRow}>
                <Column style={detailLabel}>Reference:</Column>
                <Column style={detailValue}>{transactionReference}</Column>
              </Row>
            </Section>

            <Text style={paragraph}>
              You now have access to all the features included in your plan. Start learning today!
            </Text>

            {/* CTA Button */}
            <Section style={ctaContainer}>
              <Link href="https://studyhub.mw/student/dashboard" style={ctaButton}>
                Go to Dashboard
              </Link>
            </Section>

            <Text style={paragraph}>
              You can view your invoice anytime by clicking{' '}
              <Link href={invoiceUrl} style={link}>
                here
              </Link>
              .
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              StudyHub Malawi • Learn. Practice. Succeed.
            </Text>
            <Text style={footerText}>
              Need help? Contact us at{' '}
              <Link href="mailto:support@studyhub.mw" style={link}>
                support@studyhub.mw
              </Link>
            </Text>
            <Text style={footerTextSmall}>
              This email was sent to you because you made a payment on StudyHub Malawi.
              If you did not make this payment, please contact us immediately.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: '#F2F4F7',
  fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
};

const header = {
  backgroundColor: '#0D1B3D',
  padding: '20px',
  borderRadius: '8px 8px 0 0',
  textAlign: 'center' as const,
};

const content = {
  backgroundColor: '#FFFFFF',
  padding: '40px',
  borderRadius: '0 0 8px 8px',
};

const heading = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#0D1B3D',
  marginBottom: '20px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#333333',
  marginBottom: '16px',
};

const detailsBox = {
  backgroundColor: '#F2F4F7',
  padding: '20px',
  borderRadius: '8px',
  marginBottom: '24px',
};

const detailsHeading = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#0D1B3D',
  marginBottom: '16px',
};

const detailRow = {
  marginBottom: '12px',
};

const detailLabel = {
  fontSize: '14px',
  color: '#666666',
  width: '50%',
};

const detailValue = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#333333',
  width: '50%',
  textAlign: 'right' as const,
};

const ctaContainer = {
  textAlign: 'center' as const,
  marginTop: '24px',
  marginBottom: '24px',
};

const ctaButton = {
  backgroundColor: '#E63946',
  color: '#FFFFFF',
  padding: '12px 32px',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  display: 'inline-block',
};

const link = {
  color: '#E63946',
  textDecoration: 'underline',
};

const divider = {
  borderColor: '#E5E7EB',
  margin: '20px 0',
};

const footer = {
  textAlign: 'center' as const,
  padding: '20px',
};

const footerText = {
  fontSize: '14px',
  color: '#666666',
  marginBottom: '8px',
};

const footerTextSmall = {
  fontSize: '12px',
  color: '#999999',
  marginTop: '16px',
};