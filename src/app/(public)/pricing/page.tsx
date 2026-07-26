'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHero } from '@/components/ui/page-hero';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, HelpCircle, ArrowRight, GraduationCap, Building2, Users } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/utils/formatters';

export default function PricingPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'student' | 'institution' | 'instructor'>('student');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const handleSelectPlan = (planName: string) => {
    router.push(`/auth/register?plan=${planName.toLowerCase().replace(/\s+/g, '-')}&cycle=${billingCycle}`);
  };

  const studentPlans = [
    {
      name: 'Student Basic',
      monthlyPrice: 5000,
      annualPrice: null,
      description: 'Start your learning journey',
      features: [
        { included: true, text: 'Access to limited courses (3)' },
        { included: true, text: 'Basic quizzes and exercises' },
        { included: true, text: 'Past papers access' },
        { included: true, text: 'Community forum access' },
        { included: false, text: 'AI Tutor assistance' },
        { included: false, text: 'Live classes' },
        { included: false, text: 'Mock examinations' },
        { included: false, text: 'Digital certificates' },
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Student Premium',
      monthlyPrice: 10000,
      annualPrice: null,
      description: 'Unlock your full potential',
      features: [
        { included: true, text: 'Unlimited course access' },
        { included: true, text: 'AI Tutor assistance' },
        { included: true, text: 'Live class participation' },
        { included: true, text: 'Mock examinations' },
        { included: true, text: 'Digital certificates' },
        { included: true, text: 'Priority support' },
        { included: true, text: 'Downloadable content' },
        { included: true, text: 'Advanced analytics' },
      ],
      cta: 'Go Premium',
      popular: true,
    },
    {
      name: 'Student Annual',
      monthlyPrice: null,
      annualPrice: 50000,
      description: 'Best value - save 58%',
      features: [
        { included: true, text: 'All Premium features' },
        { included: true, text: 'Save MWK 70,000 per year' },
        { included: true, text: 'Early access to new features' },
        { included: true, text: 'Exclusive webinars' },
        { included: true, text: 'Priority certificate processing' },
        { included: true, text: 'Extended AI Tutor usage' },
        { included: true, text: 'Offline content access' },
        { included: true, text: 'Annual progress report' },
      ],
      cta: 'Save with Annual',
      popular: false,
    },
  ];

  const institutionPlans = [
    {
      name: 'Bronze',
      monthlyPrice: 100000,
      annualPrice: null,
      description: 'Essential digital tools',
      features: [
        { included: true, text: 'Up to 200 students' },
        { included: true, text: 'Basic LMS features' },
        { included: true, text: 'Student progress reports' },
        { included: true, text: 'Teacher accounts (up to 10)' },
        { included: true, text: 'Content library access' },
        { included: true, text: 'Email support' },
        { included: false, text: 'Custom branding' },
        { included: false, text: 'AI-powered reports' },
        { included: false, text: 'API access' },
        { included: false, text: 'Parent dashboard' },
      ],
      cta: 'Choose Bronze',
      popular: false,
    },
    {
      name: 'Silver',
      monthlyPrice: 250000,
      annualPrice: null,
      description: 'Advanced features for growth',
      features: [
        { included: true, text: 'Up to 500 students' },
        { included: true, text: 'Advanced LMS' },
        { included: true, text: 'Custom branding' },
        { included: true, text: 'AI-powered reports' },
        { included: true, text: 'Bulk enrollment' },
        { included: true, text: 'Advanced analytics' },
        { included: true, text: 'Priority support' },
        { included: false, text: 'API access' },
        { included: false, text: 'Parent dashboard' },
        { included: false, text: 'White-label solution' },
      ],
      cta: 'Choose Silver',
      popular: true,
    },
    {
      name: 'Gold',
      monthlyPrice: 500000,
      annualPrice: null,
      description: 'Enterprise-grade solution',
      features: [
        { included: true, text: 'Unlimited students' },
        { included: true, text: 'Full LMS suite' },
        { included: true, text: 'API access' },
        { included: true, text: 'Parent dashboard' },
        { included: true, text: 'White-label solution' },
        { included: true, text: 'Custom integrations' },
        { included: true, text: 'Dedicated support manager' },
        { included: true, text: 'SLA guarantee' },
        { included: true, text: 'All Silver features' },
      ],
      cta: 'Choose Gold',
      popular: false,
    },
  ];

  const instructorPlans = [
    {
      name: 'Free',
      monthlyPrice: 0,
      annualPrice: null,
      description: 'Start teaching',
      features: [
        { included: true, text: 'Create up to 5 courses' },
        { included: true, text: 'Basic analytics' },
        { included: true, text: 'Student management' },
        { included: true, text: 'Community access' },
        { included: true, text: '70% revenue share' },
        { included: false, text: 'Advanced analytics' },
        { included: false, text: 'Priority listing' },
        { included: false, text: 'Marketing tools' },
      ],
      cta: 'Start Free',
      popular: false,
    },
    {
      name: 'Pro',
      monthlyPrice: 25000,
      annualPrice: null,
      description: 'Maximize your earnings',
      features: [
        { included: true, text: 'Unlimited courses' },
        { included: true, text: '80% revenue share' },
        { included: true, text: 'Advanced analytics' },
        { included: true, text: 'Priority listing' },
        { included: true, text: 'Marketing tools' },
        { included: true, text: 'Custom coupons' },
        { included: true, text: 'Dedicated support' },
        { included: true, text: 'All Free features' },
      ],
      cta: 'Go Pro',
      popular: true,
    },
  ];

  // Select plans based on role
  const plans = selectedRole === 'student' ? studentPlans : 
                 selectedRole === 'institution' ? institutionPlans : 
                 instructorPlans;

  // Check if annual billing is available for selected role
  const hasAnnualOption = selectedRole === 'student';

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <PageHero
        title="Simple, Transparent Pricing"
        subtitle="Plans & Pricing"
        description="Choose the plan that works for you. No hidden fees."
        backgroundImage="/images/hero/pricing-hero.jpg"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Pricing' },
        ]}
      />

      {/* Plan Selector */}
      <section className="py-12 bg-white border-b border-grey-light">
        <div className="max-w-7xl mx-auto px-4">
          {/* Role Tabs */}
          <div className="flex justify-center mb-8">
            <div className="bg-grey-light rounded-lg p-1 inline-flex flex-wrap justify-center">
              {[
                { id: 'student', label: 'Students', icon: <GraduationCap size={18} /> },
                { id: 'institution', label: 'Schools', icon: <Building2 size={18} /> },
                { id: 'instructor', label: 'Instructors', icon: <Users size={18} /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSelectedRole(tab.id as any);
                    // Reset billing cycle when switching roles
                    if (tab.id !== 'student') {
                      setBillingCycle('monthly');
                    }
                  }}
                  className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all ${
                    selectedRole === tab.id
                      ? 'bg-white shadow text-navy'
                      : 'text-grey-dark hover:text-navy'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Billing Cycle Toggle (only for students) */}
          {hasAnnualOption && (
            <div className="flex justify-center mb-4">
              <div className="bg-grey-light rounded-lg p-1 inline-flex">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                    billingCycle === 'monthly' ? 'bg-white shadow text-navy' : 'text-grey-dark'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('annual')}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                    billingCycle === 'annual' ? 'bg-white shadow text-navy' : 'text-grey-dark'
                  }`}
                >
                  Annual
                  <Badge variant="success" size="sm" className="ml-2">Save 58%</Badge>
                </button>
              </div>
            </div>
          )}

          {/* Annual Savings Info */}
          {billingCycle === 'annual' && (
            <div className="text-center">
              <p className="text-sm text-green font-medium">
                💰 Annual plans save you up to 58% compared to monthly billing
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 bg-grey-light">
        <div className="max-w-7xl mx-auto px-4">
          <div className={`grid gap-8 ${
            plans.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 max-w-4xl mx-auto'
          }`}>
            {plans.map((plan, index) => {
              // Determine the price to display based on billing cycle
              const isAnnual = billingCycle === 'annual' && plan.annualPrice !== null;
              const displayPrice = isAnnual ? plan.annualPrice! : plan.monthlyPrice;
              const isFree = displayPrice === 0;
              const isPopular = plan.popular;
              
              // Calculate monthly equivalent for annual plans
              const monthlyEquivalent = isAnnual && plan.annualPrice 
                ? Math.round(plan.annualPrice / 12) 
                : null;

              return (
                <Card
                  key={index}
                  padding="lg"
                  className={`relative ${
                    isPopular ? 'ring-2 ring-red md:scale-105' : ''
                  }`}
                >
                  {/* Popular Badge */}
                  {isPopular && (
                    <Badge
                      variant="error"
                      className="absolute -top-3 left-1/2 -translate-x-1/2 z-10"
                    >
                      Most Popular
                    </Badge>
                  )}

                  {/* Annual Badge */}
                  {isAnnual && (
                    <Badge
                      variant="success"
                      className="absolute -top-3 right-4 z-10"
                    >
                      Best Value
                    </Badge>
                  )}

                  {/* Plan Header */}
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-navy mb-2">{plan.name}</h3>
                    <p className="text-sm text-grey-medium">{plan.description}</p>
                    
                    {/* Price Display */}
                    <div className="mt-4">
                      {isFree ? (
                        <span className="text-4xl font-bold text-navy">Free</span>
                      ) : (
                        <div>
                          <div className="flex items-baseline justify-center gap-1">
                            <span className="text-sm text-grey-medium">MWK</span>
                            <span className="text-4xl font-bold text-navy">
                              {displayPrice?.toLocaleString()}
                            </span>
                            <span className="text-grey-medium text-sm">
                              /{isAnnual ? 'year' : 'month'}
                            </span>
                          </div>
                          
                          {/* Show monthly equivalent for annual plans */}
                          {monthlyEquivalent && (
                            <p className="text-sm text-green font-medium mt-2">
                              Only MWK {monthlyEquivalent.toLocaleString()}/month
                            </p>
                          )}
                        </div>
                      )}

                      {/* Show annual price if plan has one and currently showing monthly */}
                      {!isAnnual && plan.annualPrice && (
                        <div className="mt-2">
                          <span className="text-sm text-green font-medium">
                            {formatCurrency(plan.annualPrice)}/year
                          </span>
                          <Badge variant="success" size="sm" className="ml-1">Save 58%</Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        {feature.included ? (
                          <Check size={16} className="text-green mt-0.5 flex-shrink-0" />
                        ) : (
                          <X size={16} className="text-grey-medium mt-0.5 flex-shrink-0" />
                        )}
                        <span className={feature.included ? 'text-grey-dark' : 'text-grey-medium'}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    variant={isPopular ? 'primary' : 'outline'}
                    fullWidth
                    size="lg"
                    onClick={() => handleSelectPlan(plan.name)}
                    rightIcon={<ArrowRight size={16} />}
                  >
                    {isFree ? 'Get Started Free' : plan.cta}
                  </Button>

                  {/* Additional Info */}
                  {!isFree && (
                    <p className="text-xs text-grey-medium text-center mt-3">
                      Cancel anytime. No long-term commitment.
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-navy text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              { q: 'Can I switch plans later?', a: 'Yes! You can upgrade or downgrade your plan at any time. When upgrading, you\'ll only pay the prorated difference. When downgrading, changes take effect at the next billing cycle.' },
              { q: 'Is there a free trial?', a: 'We offer a free Basic plan with limited access. You can explore the platform and upgrade when you\'re ready for more features. No credit card required for the free plan.' },
              { q: 'What payment methods do you accept?', a: 'We accept Airtel Money, TNM Mpamba, bank transfers (National Bank, Standard Bank, NBS, FDH), and credit/debit cards through PayChangu.' },
              { q: 'Can I cancel anytime?', a: 'Absolutely! There are no long-term contracts. Cancel anytime and your access continues until the end of your billing period.' },
              { q: 'Do you offer refunds?', a: 'We offer a 7-day money-back guarantee for new subscriptions. Contact our support team for assistance.' },
              { q: 'Are there any hidden fees?', a: 'No hidden fees whatsoever. The price you see is the price you pay. All taxes are included.' },
            ].map((faq, i) => (
              <div key={i} className="p-4 bg-grey-light/50 rounded-lg">
                <h4 className="font-semibold text-navy mb-1 flex items-center gap-2">
                  <HelpCircle size={16} className="text-red flex-shrink-0" />
                  {faq.q}
                </h4>
                <p className="text-sm text-grey-dark ml-7">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-navy text-white text-center">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
            Join thousands of students and educators already using StudyHub Malawi
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/auth/register">
              <Button variant="primary" size="lg">
                Start Free Today
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-navy">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}