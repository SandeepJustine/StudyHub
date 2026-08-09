import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Users, Target, Heart, Award, MapPin, Phone, Mail } from 'lucide-react';
import { PageHero } from '@/components/ui/page-hero';

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <PageHero
        title="About StudyHub Malawi"
        subtitle="Our Story"
        description="We're on a mission to transform education in Malawi by making quality learning accessible to every student, regardless of their location or background."
        backgroundImage="/images/hero/about-hero.jpg"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'About Us' },
        ]}
      />

      {/* Our Story */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-navy mb-6">Our Story</h2>
              <div className="space-y-4 text-grey-dark">
                <p>
                  StudyHub Malawi was founded in 2024 with a simple but powerful vision: 
                  to bridge the educational gap in Malawi through technology.
                </p>
                <p>
                  Recognizing the challenges students face - from limited access to quality 
                  study materials to the high cost of private tutoring - we built a platform 
                  that brings together the best educators, comprehensive study resources, 
                  and innovative learning tools.
                </p>
                <p>
                  Today, StudyHub serves thousands of students across Malawi, from MSCE 
                  candidates to professional certification seekers. Our platform has become 
                  the go-to destination for affordable, accessible, and effective digital learning.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '10,000+', label: 'Active Students', icon: <Users size={24} /> },
                { value: '500+', label: 'Courses', icon: <Target size={24} /> },
                { value: '50+', label: 'Partner Schools', icon: <Heart size={24} /> },
                { value: '95%', label: 'Pass Rate', icon: <Award size={24} /> },
              ].map((stat, i) => (
                <Card key={i} padding="lg" className="text-center">
                  <div className="flex justify-center mb-3 text-navy">{stat.icon}</div>
                  <p className="text-2xl font-bold text-navy">{stat.value}</p>
                  <p className="text-sm text-grey-medium">{stat.label}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-grey-light">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <Card padding="lg">
              <div className="text-center">
                <div className="w-16 h-16 bg-navy/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target size={32} className="text-navy" />
                </div>
                <h3 className="text-xl font-bold text-navy mb-4">Our Mission</h3>
                <p className="text-grey-dark">
                  To democratize education in Malawi by providing affordable, high-quality 
                  digital learning resources that empower students to achieve their academic 
                  and professional goals.
                </p>
              </div>
            </Card>

            <Card padding="lg">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart size={32} className="text-green" />
                </div>
                <h3 className="text-xl font-bold text-navy mb-4">Our Vision</h3>
                <p className="text-grey-dark">
                  A Malawi where every student, regardless of their location or economic 
                  background, has access to world-class education and the opportunity to 
                  reach their full potential.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">Our Values</h2>
            <p className="text-grey-dark max-w-2xl mx-auto">
              These principles guide everything we do at StudyHub Malawi
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Accessibility',
                description: 'We believe education should be accessible to everyone. Our platform works on basic smartphones and low-bandwidth connections.',
                icon: '🌍',
              },
              {
                title: 'Quality',
                description: 'We maintain high standards for all our content, working with qualified instructors and regularly updating materials.',
                icon: '⭐',
              },
              {
                title: 'Innovation',
                description: 'We leverage technology like AI tutoring and adaptive learning to create personalized educational experiences.',
                icon: '💡',
              },
              {
                title: 'Affordability',
                description: 'We keep our prices accessible for Malawian families while ensuring fair compensation for our educators.',
                icon: '💰',
              },
              {
                title: 'Community',
                description: 'We foster a supportive learning community where students help each other and grow together.',
                icon: '🤝',
              },
              {
                title: 'Local Focus',
                description: 'Our content is tailored to Malawi\'s curriculum, examinations, and context, available in both English and Chichewa.',
                icon: '🇲🇼',
              },
            ].map((value, i) => (
              <Card key={i} padding="lg" className="text-center hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{value.icon}</div>
                <h3 className="text-lg font-semibold text-navy mb-2">{value.title}</h3>
                <p className="text-sm text-grey-dark">{value.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 bg-grey-light">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">Our Team</h2>
            <p className="text-grey-dark max-w-2xl mx-auto">
              Meet the passionate people behind StudyHub Malawi
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { name: 'Joseph Justine', role: 'CTO & Founder', bio: 'Software engineer passionate about edtech and digital transformation' },
              { name: 'Paul Sambo', role: 'CMO', bio: 'Former educator with 15 years experience in Malawi\'s education sector' },
              { name: 'Samuel Jamali', role: 'Head of Content', bio: 'Curriculum specialist with expertise in MSCE and professional exams' },
              { name: 'George Musicha', role: 'Head of Partnerships', bio: 'Building bridges between schools, corporates, and StudyHub' },
            ].map((member, i) => (
              <Card key={i} padding="lg" className="text-center">
                <div className="w-20 h-20 bg-navy/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-navy">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <h3 className="font-semibold text-navy">{member.name}</h3>
                <p className="text-sm text-red mb-2">{member.role}</p>
                <p className="text-xs text-grey-dark">{member.bio}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-navy text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Get in Touch</h2>
          <p className="text-grey-light mb-8 max-w-2xl mx-auto">
            Have questions or want to partner with us? We'd love to hear from you.
          </p>
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center mb-8">
            <div className="flex items-center gap-3">
              <Phone size={20} />
              <span>+265 997 011 620</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={20} />
              <span>info@studyhubmw.com</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin size={20} />
              <span>Lilongwe, Malawi</span>
            </div>
          </div>
          <Link href="/contact">
            <Button variant="primary" size="lg">
              Contact Us
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}