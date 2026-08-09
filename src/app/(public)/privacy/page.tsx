import { Card } from '@/components/ui/card';
import { Shield, Lock, Eye, UserCheck, Cookie, Mail } from 'lucide-react';
import { PageHero } from '@/components/ui/page-hero';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <PageHero
        title="Privacy Policy"
        subtitle="Last updated: July 24, 2026"
        description="We take your privacy seriously. Learn how we collect, use, and protect your information."
        backgroundImage="/images/hero/privacy-hero.jpg"
        size="sm"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Privacy Policy' },
        ]}
      />

      <section className="py-16 bg-grey-light">
        <div className="max-w-4xl mx-auto px-4">
          {/* Introduction */}
          <Card padding="lg" className="mb-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-navy/10 rounded-lg">
                <Shield size={24} className="text-navy" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-navy mb-2">Our Commitment to Privacy</h2>
                <p className="text-grey-dark">
                  At StudyHub Malawi, we take your privacy seriously. This policy describes how we collect, 
                  use, and protect your personal information. We are committed to complying with Malawi's 
                  data protection laws and international best practices.
                </p>
              </div>
            </div>
          </Card>

          {/* Policy Sections */}
          <div className="space-y-6">
            {[
              {
                icon: <UserCheck size={24} className="text-green" />,
                title: '1. Information We Collect',
                content: (
                  <div className="space-y-3">
                    <p>We collect the following types of information:</p>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Personal Information:</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Full name and contact details (email, phone number)</li>
                        <li>Date of birth (for age verification - students must be 13+)</li>
                        <li>Educational information (grade, school, exam board)</li>
                        <li>Payment information (processed securely through our payment partners)</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Usage Information:</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Course progress and completion data</li>
                        <li>Quiz and exam results</li>
                        <li>Time spent on lessons and activities</li>
                        <li>Device and browser information</li>
                      </ul>
                    </div>
                  </div>
                ),
              },
              {
                icon: <Eye size={24} className="text-blue-600" />,
                title: '2. How We Use Your Information',
                content: (
                  <div className="space-y-3">
                    <p>We use your information to:</p>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>Provide and improve our educational services</li>
                      <li>Personalize your learning experience</li>
                      <li>Process payments and manage subscriptions</li>
                      <li>Send important notifications about your account and courses</li>
                      <li>Generate progress reports for students, parents, and schools</li>
                      <li>Analyze platform usage to improve our services</li>
                      <li>Comply with legal obligations</li>
                    </ul>
                  </div>
                ),
              },
              {
                icon: <Lock size={24} className="text-red" />,
                title: '3. Data Protection & Security',
                content: (
                  <div className="space-y-3">
                    <p>We implement robust security measures:</p>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>Encryption of all data in transit (SSL/TLS) and at rest</li>
                      <li>Secure payment processing through PCI-compliant partners</li>
                      <li>Regular security audits and vulnerability assessments</li>
                      <li>Strict access controls and authentication requirements</li>
                      <li>Employee training on data protection and privacy</li>
                      <li>Incident response plan for data breaches</li>
                    </ul>
                    <div className="bg-green-50 p-4 rounded-lg mt-4">
                      <p className="text-sm text-green-800">
                        <strong>Special Protection for Minors:</strong> Given that many of our users are 
                        secondary school students, we take extra precautions with minors' data. We never 
                        share student data with third parties for marketing purposes, and we provide 
                        parents/guardians with access to their children's data upon verification.
                      </p>
                    </div>
                  </div>
                ),
              },
              {
                icon: <Cookie size={24} className="text-yellow-600" />,
                title: '4. Cookies & Tracking',
                content: (
                  <div className="space-y-3">
                    <p>We use cookies and similar technologies to:</p>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>Keep you logged in to your account</li>
                      <li>Remember your preferences and settings</li>
                      <li>Understand how you use our platform</li>
                      <li>Improve our services based on usage patterns</li>
                    </ul>
                    <p className="text-sm text-grey-medium">
                      You can control cookies through your browser settings. However, disabling 
                      cookies may affect certain features of our platform.
                    </p>
                  </div>
                ),
              },
              {
                icon: <Mail size={24} className="text-purple-600" />,
                title: '5. Communications',
                content: (
                  <div className="space-y-3">
                    <p>We may contact you for:</p>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>Account-related notifications (password resets, payment confirmations)</li>
                      <li>Course updates and learning reminders</li>
                      <li>Platform announcements and feature updates</li>
                      <li>Promotional offers (with your consent)</li>
                    </ul>
                    <p className="text-sm text-grey-medium">
                      You can manage your communication preferences in your account settings. 
                      You may opt out of marketing communications at any time.
                    </p>
                  </div>
                ),
              },
              {
                icon: <UserCheck size={24} className="text-navy" />,
                title: '6. Your Rights',
                content: (
                  <div className="space-y-3">
                    <p>You have the right to:</p>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>Access your personal data</li>
                      <li>Correct inaccurate data</li>
                      <li>Delete your account and associated data</li>
                      <li>Export your data in a portable format</li>
                      <li>Object to processing of your data</li>
                      <li>Withdraw consent at any time</li>
                    </ul>
                    <p className="text-sm">
                      To exercise these rights, contact us at{' '}
                      <span className="text-red font-medium">privacy@studyhubmw.com</span>
                    </p>
                  </div>
                ),
              },
            ].map((section, i) => (
              <Card key={i} padding="lg">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-grey-light rounded-lg">
                    {section.icon}
                  </div>
                  <h2 className="text-xl font-bold text-navy">{section.title}</h2>
                </div>
                <div className="ml-16 text-grey-dark">
                  {section.content}
                </div>
              </Card>
            ))}
          </div>

          {/* Contact */}
          <Card padding="lg" className="mt-8 bg-navy text-white">
            <h2 className="text-xl font-bold mb-4">Questions About Privacy?</h2>
            <p className="text-grey-light mb-4">
              If you have any questions about this privacy policy or how we handle your data, 
              please contact our Data Protection Officer:
            </p>
            <div className="space-y-2 text-grey-light">
              <p><strong>Email:</strong> privacy@studyhubmw.com</p>
              <p><strong>Phone:</strong> +265 997 011 620</p>
              <p><strong>Address:</strong> Area 12, Plot 45, Lilongwe, Malawi</p>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}