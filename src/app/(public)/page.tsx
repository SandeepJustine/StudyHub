'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HomeSlider } from '@/components/ui/slider';
import { Check, Star, Users, BookOpen, GraduationCap, TrendingUp } from 'lucide-react';
import { PricingCards } from '@/components/features/subscription/pricing-cards';
import { PublicSponsorships } from '@/components/features/sponsorship/public-sponsorships';

export default function LandingPage() {
  const router = useRouter();

  const handleSelectPlan = (tier: string, cycle: 'MONTHLY' | 'ANNUAL') => {
    router.push(`/auth/register?tier=${tier}&cycle=${cycle}`);
  };

  return (
    <>
      {/* Hero Slider - Replaces old hero section */}
      <HomeSlider />

      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '10,000+', label: 'Active Students', icon: <Users size={24} /> },
              { value: '500+', label: 'Courses Available', icon: <BookOpen size={24} /> },
              { value: '95%', label: 'Pass Rate', icon: <GraduationCap size={24} /> },
              { value: '50+', label: 'Partner Schools', icon: <TrendingUp size={24} /> },
            ].map((stat, i) => (
              <div key={i}>
                <div className="flex justify-center mb-2 text-navy">{stat.icon}</div>
                <p className="text-3xl font-bold text-navy">{stat.value}</p>
                <p className="text-sm text-grey-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-grey-light">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">Everything You Need to Succeed</h2>
            <p className="text-grey-dark max-w-2xl mx-auto">
              Comprehensive learning tools designed for Malawi's curriculum
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: '📚', title: 'Video Lessons', description: 'Learn from expert instructors with high-quality video content' },
              { icon: '📝', title: 'Practice Quizzes', description: 'Test your knowledge with interactive quizzes and instant feedback' },
              { icon: '🎓', title: 'Mock Exams', description: 'Prepare for MSCE, JCE, ICAM, and TEVETA with timed mock exams' },
              { icon: '💬', title: 'Live Classes', description: 'Join interactive live sessions with instructors and peers' },
              { icon: '🤖', title: 'AI Tutor', description: 'Get personalized help with our AI-powered learning assistant' },
              { icon: '📊', title: 'Progress Tracking', description: 'Monitor your learning journey with detailed analytics' },
            ].map((feature, i) => (
              <Card key={i} padding="lg" className="text-center">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-navy mb-2">{feature.title}</h3>
                <p className="text-sm text-grey-dark">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Sponsorships - Between Sections */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <PublicSponsorships placements={['BETWEEN_SECTIONS']} />
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">Simple, Affordable Pricing</h2>
            <p className="text-grey-dark">Choose the plan that works for you</p>
          </div>
          <PricingCards 
            role="STUDENT" 
            onSelectPlan={handleSelectPlan}
          />
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-grey-light">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">What Our Students Say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Chimwemwe Banda', school: 'MSCE Candidate', quote: 'StudyHub helped me pass my MSCE with flying colors. The mock exams were exactly like the real thing!' },
              { name: 'Thandiwe Phiri', school: 'University Student', quote: 'The AI tutor is amazing. It explains concepts in a way that really makes sense to me.' },
              { name: 'Peter Kamanga', school: 'Form 3 Student', quote: 'I love the video lessons. I can learn at my own pace and rewatch topics I don\'t understand.' },
            ].map((testimonial, i) => (
              <Card key={i} padding="lg">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={16} className="text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-grey-dark mb-4 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold text-navy">{testimonial.name}</p>
                  <p className="text-sm text-grey-medium">{testimonial.school}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-navy text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
            Join thousands of students across Malawi who are achieving their academic goals with StudyHub
          </p>
          <Link href="/auth/register">
            <Button variant="primary" size="xl">
              Get Started Free Today
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}