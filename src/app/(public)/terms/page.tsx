'use client'
import { PageHero } from '@/components/ui/page-hero';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  ScrollText, 
  Users, 
  CreditCard, 
  Shield, 
  GraduationCap, 
  AlertTriangle,
  FileText,
  Scale,
  Ban,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  Download,
  Printer,
} from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <PageHero
        title="Terms of Service"
        subtitle="Last updated: July 24, 2026"
        description="Please read these terms carefully before using StudyHub Malawi. By using our platform, you agree to be bound by these terms."
        backgroundImage="/images/hero/terms-hero.jpg"
        size="sm"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Terms of Service' },
        ]}
      />

      {/* Content */}
      <section className="py-16 bg-grey-light">
        <div className="max-w-4xl mx-auto px-4">
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Button variant="outline" size="sm" leftIcon={<Printer size={14} />} onClick={() => window.print()}>
              Print Terms
            </Button>
            <Button variant="outline" size="sm" leftIcon={<Download size={14} />}>
              Download PDF
            </Button>
          </div>

          {/* Introduction */}
          <Card padding="lg" className="mb-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-navy/10 rounded-lg flex-shrink-0">
                <ScrollText size={24} className="text-navy" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-navy mb-2">Agreement to Terms</h2>
                <p className="text-grey-dark leading-relaxed">
                  By accessing or using StudyHub Malawi ("the Platform"), you agree to be bound by 
                  these Terms of Service ("Terms"). If you do not agree to these Terms, please do not 
                  access or use the Platform. These Terms apply to all visitors, users, and others who 
                  access or use the Platform.
                </p>
                <p className="text-grey-dark leading-relaxed mt-3">
                  We reserve the right to update or modify these Terms at any time. Changes will be 
                  effective immediately upon posting. Your continued use of the Platform after any 
                  modifications indicates your acceptance of the updated Terms.
                </p>
              </div>
            </div>
          </Card>

          {/* Terms Sections */}
          <div className="space-y-6">
            
            {/* Section 1: Account Registration */}
            <Card padding="lg">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0">
                  <Users size={24} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-navy">1. Account Registration</h2>
                </div>
              </div>
              <div className="ml-16 space-y-4">
                <div className="space-y-3 text-grey-dark leading-relaxed">
                  <p>When creating an account on StudyHub Malawi, you agree to:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Provide accurate, current, and complete registration information</li>
                    <li>Maintain and promptly update your account information</li>
                    <li>Keep your password secure and confidential</li>
                    <li>Be fully responsible for all activities that occur under your account</li>
                    <li>Notify us immediately of any unauthorized use of your account</li>
                    <li>Be at least 13 years of age. Users under 18 must have parental or guardian consent</li>
                    <li>Not share your account credentials with any third party</li>
                    <li>Not create more than one account without prior written permission</li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Important:</strong> You may not share your account credentials with others. 
                    Each account is for individual use only, except for institution accounts which may 
                    have multiple authorized users as per the institution subscription terms.
                  </p>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Account Termination:</strong> We reserve the right to suspend or terminate 
                    accounts that violate these Terms, provide false information, or engage in 
                    fraudulent or illegal activities.
                  </p>
                </div>
              </div>
            </Card>

            {/* Section 2: Use of Platform */}
            <Card padding="lg">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-green-100 rounded-lg flex-shrink-0">
                  <GraduationCap size={24} className="text-green" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-navy">2. Use of the Platform</h2>
                </div>
              </div>
              <div className="ml-16 space-y-4">
                <p className="text-grey-dark leading-relaxed">
                  StudyHub Malawi grants you a limited, non-exclusive, non-transferable, and revocable 
                  license to use the Platform for your personal, educational purposes, subject to these Terms.
                </p>

                <div className="space-y-3">
                  <h4 className="font-semibold text-navy">You agree NOT to:</h4>
                  <ul className="list-disc pl-5 space-y-2 text-grey-dark">
                    <li>Copy, modify, distribute, sell, or lease any part of the Platform or its content</li>
                    <li>Reverse engineer, decompile, or attempt to extract the source code</li>
                    <li>Use the Platform for any commercial purpose not explicitly authorized by StudyHub</li>
                    <li>Attempt to gain unauthorized access to any part of the Platform or its systems</li>
                    <li>Interfere with or disrupt the Platform, its servers, or networks</li>
                    <li>Upload, post, or transmit any viruses, malware, or malicious code</li>
                    <li>Harass, abuse, insult, harm, defame, or discriminate against other users</li>
                    <li>Impersonate any person or entity, or falsely state your affiliation</li>
                    <li>Violate any applicable laws or regulations of the Republic of Malawi</li>
                    <li>Use any automated system (bots, scrapers) without our express permission</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-navy">You are responsible for:</h4>
                  <ul className="list-disc pl-5 space-y-2 text-grey-dark">
                    <li>Ensuring you have the necessary equipment and internet connection</li>
                    <li>Complying with all applicable laws while using the Platform</li>
                    <li>Any content you upload, post, or share on the Platform</li>
                    <li>Maintaining the confidentiality of your account credentials</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Section 3: Payments & Subscriptions */}
            <Card padding="lg">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-purple-100 rounded-lg flex-shrink-0">
                  <CreditCard size={24} className="text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-navy">3. Payments & Subscriptions</h2>
                </div>
              </div>
              <div className="ml-16 space-y-4">
                <div className="space-y-3 text-grey-dark leading-relaxed">
                  <h4 className="font-semibold">Billing:</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Subscription fees are billed in advance on a monthly or annual basis</li>
                    <li>All prices are in Malawi Kwacha (MWK) and include applicable taxes</li>
                    <li>Prices are subject to change with 30 days' notice</li>
                    <li>Subscription auto-renews unless cancelled at least 24 hours before renewal</li>
                    <li>Payment is processed through authorized payment providers</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Refund Policy:</h4>
                  <ul className="list-disc pl-5 space-y-2 text-grey-dark">
                    <li>Full refund available within 7 days of initial subscription purchase</li>
                    <li>After 7 days, refunds are provided at our sole discretion</li>
                    <li>Refunds for annual subscriptions are prorated minus any discounts received</li>
                    <li>Course purchases are refundable within 48 hours if less than 25% completed</li>
                    <li>Refunds are processed to the original payment method within 10 business days</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Cancellation:</h4>
                  <ul className="list-disc pl-5 space-y-2 text-grey-dark">
                    <li>You may cancel your subscription at any time</li>
                    <li>Access continues until the end of your current billing period</li>
                    <li>No partial refunds are provided for mid-cycle cancellations</li>
                    <li>Upon cancellation, your account reverts to the free tier at period end</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Failed Payments:</strong> If a payment fails, we will notify you and may 
                    retry the payment. Continued failure may result in suspension or termination of 
                    your subscription.
                  </p>
                </div>
              </div>
            </Card>

            {/* Section 4: Intellectual Property */}
            <Card padding="lg">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-red-100 rounded-lg flex-shrink-0">
                  <Shield size={24} className="text-red" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-navy">4. Intellectual Property Rights</h2>
                </div>
              </div>
              <div className="ml-16 space-y-4">
                <div className="space-y-3 text-grey-dark leading-relaxed">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-navy">Platform Content:</h4>
                    <p>
                      StudyHub Malawi owns all rights, title, and interest in and to the Platform, 
                      including but not limited to its design, code, text, graphics, logos, icons, 
                      and all content created by StudyHub ("Platform Content"). This content is 
                      protected by copyright, trademark, and other intellectual property laws.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-navy">Instructor Content:</h4>
                    <p>
                      Instructors retain ownership of their course content, including videos, notes, 
                      quizzes, and other educational materials ("Instructor Content"). By uploading 
                      content to the Platform, instructors grant StudyHub a worldwide, non-exclusive, 
                      royalty-free license to host, distribute, and display such content on the Platform.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-navy">User Content:</h4>
                    <p>
                      You retain ownership of content you upload, post, or share on the Platform 
                      ("User Content"). By posting User Content, you grant StudyHub a non-exclusive, 
                      transferable, sub-licensable, royalty-free license to use, reproduce, modify, 
                      and display such content in connection with the Platform.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-navy">Trademarks:</h4>
                    <p>
                      "StudyHub Malawi", our logo, "Learn. Practice. Succeed.", and all related 
                      names, logos, and slogans are trademarks of StudyHub Malawi. You may not use 
                      these marks without our prior written permission.
                    </p>
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Copyright Infringement:</strong> We respect intellectual property rights. 
                    If you believe your copyright has been infringed on our Platform, please contact 
                    us at copyright@studyhub.mw with detailed information.
                  </p>
                </div>
              </div>
            </Card>

            {/* Section 5: Disclaimers */}
            <Card padding="lg">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-yellow-100 rounded-lg flex-shrink-0">
                  <AlertTriangle size={24} className="text-yellow-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-navy">5. Disclaimers & Limitations of Liability</h2>
                </div>
              </div>
              <div className="ml-16 space-y-4">
                <div className="space-y-3 text-grey-dark leading-relaxed">
                  <h4 className="font-semibold">Platform Provided "As Is":</h4>
                  <p>
                    The Platform is provided on an "as is" and "as available" basis. We make no 
                    warranties, express or implied, regarding the Platform's operation, availability, 
                    or content. We do not guarantee that the Platform will be uninterrupted, secure, 
                    or error-free.
                  </p>

                  <h4 className="font-semibold">Educational Outcomes:</h4>
                  <p>
                    While we strive to provide high-quality educational content, we do not guarantee 
                    specific educational outcomes, exam results, or career achievements. Educational 
                    success depends on various factors including student effort and engagement.
                  </p>

                  <h4 className="font-semibold">Limitation of Liability:</h4>
                  <p>
                    To the fullest extent permitted by law, StudyHub Malawi shall not be liable for 
                    any indirect, incidental, special, consequential, or punitive damages, including 
                    but not limited to loss of profits, data, or goodwill, arising from your use of 
                    the Platform. Our total liability shall not exceed the amount you paid us in the 
                    12 months preceding the claim.
                  </p>
                </div>
              </div>
            </Card>

            {/* Section 6: Termination */}
            <Card padding="lg">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-orange-100 rounded-lg flex-shrink-0">
                  <Ban size={24} className="text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-navy">6. Termination</h2>
                </div>
              </div>
              <div className="ml-16 space-y-4">
                <p className="text-grey-dark leading-relaxed">
                  We reserve the right to suspend or terminate your account and access to the Platform 
                  at any time, with or without cause, including but not limited to:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-grey-dark">
                  <li>Violation of these Terms of Service</li>
                  <li>Fraudulent or illegal activities</li>
                  <li>Non-payment of subscription fees</li>
                  <li>Extended period of inactivity (12+ months)</li>
                  <li>Request by law enforcement or government authorities</li>
                </ul>
                <p className="text-grey-dark">
                  Upon termination, your right to access the Platform ceases immediately. You may 
                  request a copy of your data within 30 days of termination by contacting us.
                </p>
              </div>
            </Card>

            {/* Section 7: Governing Law */}
            <Card padding="lg">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-navy/10 rounded-lg flex-shrink-0">
                  <Scale size={24} className="text-navy" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-navy">7. Governing Law & Dispute Resolution</h2>
                </div>
              </div>
              <div className="ml-16 space-y-4 text-grey-dark leading-relaxed">
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the 
                  Republic of Malawi. Any disputes arising from these Terms or your use of the Platform 
                  shall be subject to the exclusive jurisdiction of the courts of Malawi.
                </p>
                <p>
                  Before initiating formal legal proceedings, we encourage you to contact us to seek 
                  an informal resolution. Many disputes can be resolved through direct communication.
                </p>
                <div className="bg-navy/5 p-4 rounded-lg">
                  <p className="text-sm text-navy">
                    <strong>Dispute Resolution Process:</strong>
                  </p>
                  <ol className="list-decimal pl-5 space-y-1 text-sm mt-2">
                    <li>Contact our support team to discuss the issue</li>
                    <li>If unresolved, escalate to management review</li>
                    <li>Consider mediation before legal action</li>
                    <li>File in the appropriate Malawi court if necessary</li>
                  </ol>
                </div>
              </div>
            </Card>

            {/* Section 8: Changes to Terms */}
            <Card padding="lg">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-green-100 rounded-lg flex-shrink-0">
                  <RefreshCw size={24} className="text-green" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-navy">8. Changes to Terms</h2>
                </div>
              </div>
              <div className="ml-16 space-y-4 text-grey-dark leading-relaxed">
                <p>
                  We reserve the right to modify these Terms at any time. When we make material changes, 
                  we will:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Post the updated Terms on this page with a new effective date</li>
                  <li>Send an email notification to account holders (for material changes)</li>
                  <li>Display a notice on the Platform for 30 days after changes take effect</li>
                </ul>
                <p>
                  Your continued use of the Platform after changes become effective constitutes your 
                  acceptance of the new Terms. If you do not agree to the changes, you must stop using 
                  the Platform.
                </p>
              </div>
            </Card>

            {/* Section 9: Contact Information */}
            <Card padding="lg">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0">
                  <FileText size={24} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-navy">9. Contact Us</h2>
                </div>
              </div>
              <div className="ml-16 space-y-4">
                <p className="text-grey-dark leading-relaxed">
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-grey-light rounded-lg">
                    <Mail size={20} className="text-navy mb-2" />
                    <p className="text-sm font-medium text-navy">Email</p>
                    <p className="text-sm text-grey-dark">legal@studyhub.mw</p>
                    <p className="text-sm text-grey-dark">support@studyhub.mw</p>
                  </div>
                  
                  <div className="p-4 bg-grey-light rounded-lg">
                    <Phone size={20} className="text-navy mb-2" />
                    <p className="text-sm font-medium text-navy">Phone</p>
                    <p className="text-sm text-grey-dark">+265 888 000 000</p>
                    <p className="text-xs text-grey-medium">Mon-Fri, 8:00 AM - 5:00 PM</p>
                  </div>
                  
                  <div className="p-4 bg-grey-light rounded-lg">
                    <MapPin size={20} className="text-navy mb-2" />
                    <p className="text-sm font-medium text-navy">Address</p>
                    <p className="text-sm text-grey-dark">Area 12, Plot 45</p>
                    <p className="text-sm text-grey-dark">Lilongwe, Malawi</p>
                  </div>
                </div>

                <p className="text-sm text-grey-medium mt-4">
                  For copyright infringement notices, please email: copyright@studyhub.mw
                </p>
              </div>
            </Card>

          </div>

          {/* Acceptance Card */}
          <Card padding="lg" className="mt-8 bg-navy text-white">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Acceptance of Terms</h2>
              <p className="text-slate-300 mb-6 max-w-2xl mx-auto leading-relaxed">
                By using StudyHub Malawi, you acknowledge that you have read, understood, and agree 
                to be bound by these Terms of Service. If you do not agree, please discontinue use 
                of the Platform immediately.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/auth/register">
                  <Button variant="primary" size="lg">
                    I Agree - Create Account
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-navy">
                    Have Questions? Contact Us
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Version History */}
          <div className="mt-8 text-center">
            <p className="text-sm text-grey-medium">
              <strong>Version History:</strong> v1.0 (January 15, 2025) • v1.1 (March 10, 2025) • v2.0 (July 24, 2026 - Current)
            </p>
          </div>

        </div>
      </section>

      {/* Quick Navigation Sidebar (Fixed on desktop) */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 hidden xl:block z-40">
        <nav className="bg-white rounded-xl shadow-lg p-4 space-y-2 max-w-[200px]">
          <p className="text-xs font-semibold text-navy mb-2 uppercase tracking-wider">On This Page</p>
          {[
            { label: 'Registration', href: '#section-1' },
            { label: 'Platform Use', href: '#section-2' },
            { label: 'Payments', href: '#section-3' },
            { label: 'Intellectual Property', href: '#section-4' },
            { label: 'Disclaimers', href: '#section-5' },
            { label: 'Termination', href: '#section-6' },
            { label: 'Governing Law', href: '#section-7' },
            { label: 'Changes', href: '#section-8' },
            { label: 'Contact', href: '#section-9' },
          ].map((item, i) => (
            <a
              key={i}
              href={item.href}
              className="block text-xs text-grey-dark hover:text-navy hover:bg-grey-light px-2 py-1 rounded transition-colors"
            >
              {item.label}
            </a>
          ))}
          <div className="pt-2 border-t border-grey-light">
            <Button variant="primary" size="sm" fullWidth onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              Back to Top ↑
            </Button>
          </div>
        </nav>
      </div>
    </div>
  );
}