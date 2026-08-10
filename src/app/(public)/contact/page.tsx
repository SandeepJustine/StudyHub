'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toast } from '@/components/ui/toast';
import { PageHero } from '@/components/ui/page-hero';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, MessageSquare, HelpCircle, Building2 } from 'lucide-react';
import { Recaptcha, RecaptchaHandle, isRecaptchaClientEnabled } from '@/components/ui/recaptcha';

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
const USE_RECAPTCHA = isRecaptchaClientEnabled();

function generateMathChallenge() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  return { a, b, answer: a + b };
}

export default function ContactPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    category: 'general',
    message: '',
    company: '', // honeypot
  });
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<RecaptchaHandle>(null);
  const [mathChallenge, setMathChallenge] = useState(generateMathChallenge());
  const [mathAnswer, setMathAnswer] = useState('');
  const [formStartTime] = useState(() => Date.now());
  const [isVerifying, setIsVerifying] = useState(false);

  const resetMathChallenge = useCallback(() => {
    setMathChallenge(generateMathChallenge());
    setMathAnswer('');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const elapsed = Date.now() - formStartTime;
      if (elapsed < 2000) {
        throw new Error('Please take a moment to fill out the form properly.');
      }

      if (USE_RECAPTCHA && RECAPTCHA_SITE_KEY) {
        setIsVerifying(true);
        const verifyRes = await fetch('/api/auth/verify-recaptcha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: recaptchaToken }),
        });

        const verifyData = await verifyRes.json();
        if (!verifyRes.ok || !verifyData.success) {
          throw new Error(verifyData.error || 'reCAPTCHA verification failed');
          return;
        }
      }

      const userAnswer = parseInt(mathAnswer, 10);
      if (isNaN(userAnswer) || userAnswer !== mathChallenge.answer) {
        throw new Error('Incorrect answer. Please try again.');
        return;
      }

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setIsSubmitted(true);
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to send message', type: 'error' });
      resetMathChallenge();
      if (recaptchaRef.current) recaptchaRef.current.reset();
      setRecaptchaToken(null);
    } finally {
      setIsLoading(false);
      setIsVerifying(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-grey-light flex items-center justify-center p-4">
        <Card padding="lg" className="max-w-md w-full text-center">
          <CheckCircle size={64} className="mx-auto text-green mb-4" />
          <h2 className="text-2xl font-bold text-navy mb-2">Message Sent!</h2>
          <p className="text-grey-dark mb-6">
            Thank you for contacting us. We'll get back to you within 24 hours.
          </p>
          <Button variant="primary" onClick={() => setIsSubmitted(false)}>
            Send Another Message
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PageHero
          title="Contact Us"
          subtitle="Get in Touch"
          description="We're here to help and answer any questions you might have"
          backgroundImage="/images/hero/contact-hero.jpg"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Contact' },
          ]}
        />

      <section className="py-16 bg-grey-light">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="space-y-6">
              <Card padding="lg">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-navy/10 rounded-lg">
                    <Phone size={24} className="text-navy" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy mb-1">Phone</h3>
                    <p className="text-grey-dark">+265 888 000 000</p>
                    <p className="text-sm text-grey-medium">Mon-Fri, 8am-5pm</p>
                  </div>
                </div>
              </Card>

              <Card padding="lg">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Mail size={24} className="text-green" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy mb-1">Email</h3>
                    <p className="text-grey-dark">info@studyhub.mw</p>
                    <p className="text-sm text-grey-medium">support@studyhub.mw</p>
                  </div>
                </div>
              </Card>

              <Card padding="lg">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red/10 rounded-lg">
                    <MapPin size={24} className="text-red" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy mb-1">Office</h3>
                    <p className="text-grey-dark">Area 12, Plot 45</p>
                    <p className="text-sm text-grey-medium">Lilongwe, Malawi</p>
                  </div>
                </div>
              </Card>

              <Card padding="lg">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Clock size={24} className="text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy mb-1">Business Hours</h3>
                    <p className="text-sm text-grey-dark">Monday - Friday: 8:00 AM - 5:00 PM</p>
                    <p className="text-sm text-grey-dark">Saturday: 9:00 AM - 1:00 PM</p>
                    <p className="text-sm text-grey-medium">Sunday: Closed</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card padding="lg">
                <h2 className="text-2xl font-bold text-navy mb-6">Send Us a Message</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="Full Name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                    <Input
                      label="Email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="Phone (Optional)"
                      type="tel"
                      placeholder="+265 997 011 620"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-grey-dark">Category</label>
                      <select
                        className="w-full px-4 py-3 border-2 border-grey-light rounded-lg focus:border-navy focus:ring-2 focus:ring-navy/20"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        <option value="general">General Inquiry</option>
                        <option value="support">Technical Support</option>
                        <option value="billing">Billing Question</option>
                        <option value="partnership">Partnership</option>
                        <option value="school">School Registration</option>
                        <option value="instructor">Become an Instructor</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <Input
                    label="Subject"
                    placeholder="How can we help you?"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-grey-dark">Message</label>
                    <textarea
                      className="w-full px-4 py-3 border-2 border-grey-light rounded-lg focus:border-navy focus:ring-2 focus:ring-navy/20 min-h-[150px]"
                      placeholder="Describe your inquiry in detail..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-grey-dark">Company (Optional)</label>
                    <input
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      className="w-full px-4 py-3 border-2 border-grey-light rounded-lg focus:border-navy focus:ring-2 focus:ring-navy/20 opacity-0 h-0 overflow-hidden absolute"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    />
                  </div>

                  {USE_RECAPTCHA && RECAPTCHA_SITE_KEY && (
                    <div className="flex justify-center py-2">
                      <Recaptcha
                        ref={recaptchaRef}
                        siteKey={RECAPTCHA_SITE_KEY}
                        onVerify={setRecaptchaToken}
                        onExpired={() => setRecaptchaToken(null)}
                        theme="light"
                      />
                    </div>
                  )}

                  <div className="p-4 bg-grey-light/50 rounded-lg">
                    <label className="block text-sm font-medium text-navy mb-2">
                      Security Check: What is {mathChallenge.a} + {mathChallenge.b}?
                    </label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="Your answer"
                      value={mathAnswer}
                      onChange={(e) => setMathAnswer(e.target.value)}
                      required
                      className="max-w-xs"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={isLoading || isVerifying}
                    leftIcon={<Send size={18} />}
                  >
                    {isVerifying ? 'Verifying...' : 'Send Message'}
                  </Button>
                </form>
              </Card>
            </div>
          </div>

          <div className="mt-16">
            <h2 className="text-2xl font-bold text-navy text-center mb-8">Frequently Asked Questions</h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {[
                {
                  q: 'How do I get started with StudyHub?',
                  a: 'Simply create a free account, choose your subscription plan, and start learning! You can browse courses before subscribing.',
                },
                {
                  q: 'What payment methods do you accept?',
                  a: 'We accept Airtel Money, TNM Mpamba, bank transfers, and credit/debit cards through PayChangu.',
                },
                {
                  q: 'Can I cancel my subscription anytime?',
                  a: 'Yes! You can cancel anytime. Your access continues until the end of your billing period.',
                },
                {
                  q: 'How do I become an instructor?',
                  a: 'Register as an instructor, create your profile, and start uploading courses. Our team reviews all courses for quality.',
                },
                {
                  q: 'Do you offer school discounts?',
                  a: 'Yes! We have special institution pricing for schools. Contact our partnerships team for custom quotes.',
                },
                {
                  q: 'Is my data secure?',
                  a: 'Absolutely. We use bank-level encryption and follow strict data protection policies, especially for student data.',
                },
              ].map((faq, i) => (
                <Card key={i} padding="lg">
                  <h3 className="font-semibold text-navy mb-2 flex items-start gap-2">
                    <HelpCircle size={18} className="text-red mt-0.5 flex-shrink-0" />
                    {faq.q}
                  </h3>
                  <p className="text-sm text-grey-dark ml-7">{faq.a}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
