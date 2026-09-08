'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Users, Calendar, Building2, MapPin, Monitor, X, Send, Mail, Phone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { formatCurrency } from '@/utils/formatters';
import type { TrainingCategory, TrainingMode } from '@/hooks/types/corporate';

interface TrainingPackage {
  id: string;
  title: string;
  description: string;
  category: TrainingCategory;
  mode: TrainingMode;
  totalBudget: number;
  status: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  maximumParticipants: number;
  enrolledCount: number;
  certificationIncluded: boolean;
  instructorName?: string | null;
  curriculum: any;
  createdAt: string;
  corporate?: {
    id: string;
    companyName: string;
    logo?: string | null;
    industry?: string | null;
  };
}

function getCategoryLabel(category: TrainingCategory): string {
  return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function getModeIcon(mode: TrainingMode) {
  switch (mode) {
    case 'IN_PERSON': return <Building2 size={14} />;
    case 'HYBRID': return <MapPin size={14} />;
    default: return <Monitor size={14} />;
  }
}

export default function PublicTrainingsPage() {
  const [packages, setPackages] = useState<TrainingPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<TrainingPackage | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/public/trainings');
      const result = await response.json();
      if (response.ok && result.success) {
        setPackages(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load trainings', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactSales = (pkg: TrainingPackage) => {
    setSelectedPackage(pkg);
    setContactForm(prev => ({
      ...prev,
      message: `I am interested in the "${pkg.title}" training package by ${pkg.corporate?.companyName || 'your company'}. Please provide more information.`,
    }));
    setSubmitSuccess(false);
    setShowContactModal(true);
  };

  const handleSubmitInquiry = async () => {
    if (!contactForm.name || !contactForm.email) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/public/contact-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...contactForm,
          packageId: selectedPackage?.id,
          packageName: selectedPackage?.title,
          companyName: selectedPackage?.corporate?.companyName,
        }),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setContactForm({ name: '', email: '', phone: '', company: '', message: '' });
      }
    } catch (error) {
      console.error('Failed to submit inquiry', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-blue-100 rounded-xl">
            <Building2 size={24} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-navy">Corporate Training Packages</h1>
            <p className="text-grey-dark mt-1">
              Browse training packages from companies across Malawi
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-6 bg-grey-light/50 rounded w-3/4"></div>
                    <div className="h-4 bg-grey-light/50 rounded w-1/2"></div>
                    <div className="h-4 bg-grey-light/50 rounded w-1/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-16">
            <Building2 size={64} className="mx-auto text-grey-medium mb-4" />
            <h3 className="text-xl font-semibold text-navy mb-2">No Training Packages Available</h3>
            <p className="text-grey-dark">
              Corporate training packages will appear here when they are published.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {packages.map((pkg) => (
              <Card key={pkg.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      {pkg.corporate?.logo ? (
                        <img
                          src={pkg.corporate.logo}
                          alt={pkg.corporate.companyName}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-navy/10 flex items-center justify-center">
                          <Building2 size={20} className="text-navy" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-navy text-lg">{pkg.title}</h3>
                        {pkg.corporate?.companyName && (
                          <p className="text-sm text-grey-dark">{pkg.corporate.companyName}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="info" size="sm">{getCategoryLabel(pkg.category)}</Badge>
                          <span className="flex items-center gap-1 text-xs text-grey-medium">
                            {getModeIcon(pkg.mode)} {pkg.mode.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="success" size="sm">{pkg.status}</Badge>
                  </div>

                  {pkg.description && (
                    <p className="text-sm text-grey-dark mb-4 line-clamp-2">
                      {pkg.description}
                    </p>
                  )}

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-grey-dark">
                      <Users size={14} />
                      <span>{pkg.enrolledCount}/{pkg.maximumParticipants} participants</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-grey-dark">
                      <Calendar size={14} />
                      <span>
                        {new Date(pkg.startDate).toLocaleDateString()} - {new Date(pkg.endDate).toLocaleDateString()}
                        <span className="text-grey-medium ml-1">({pkg.durationDays} days)</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-grey-dark">
                      <BookOpen size={14} />
                      <span>{pkg.curriculum?.length || 0} modules</span>
                      {pkg.certificationIncluded && <span className="text-xs text-green">(Certificate included)</span>}
                    </div>
                    {pkg.instructorName && (
                      <div className="flex items-center gap-2 text-sm text-grey-dark">
                        <span className="text-xs text-grey-medium">Instructor: {pkg.instructorName}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-grey-light">
                    <p className="text-xl font-bold text-navy">
                      {formatCurrency(pkg.totalBudget)}
                    </p>
                    <Button variant="outline" size="sm" onClick={() => handleContactSales(pkg)}>
                      Contact Sales
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        title="Contact Sales"
        size="md"
      >
        {selectedPackage && !submitSuccess ? (
          <div className="space-y-4">
            <div className="p-3 bg-grey-light/50 rounded-lg">
              <p className="text-sm font-medium text-navy">{selectedPackage.title}</p>
              <p className="text-xs text-grey-medium">by {selectedPackage.corporate?.companyName || 'Company'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Your Name *"
                placeholder="John Banda"
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
              />
              <Input
                label="Email *"
                type="email"
                placeholder="john@company.com"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Phone"
                placeholder="+265 888 000 000"
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
              />
              <Input
                label="Company"
                placeholder="Your Company Ltd"
                value={contactForm.company}
                onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-grey-dark">Message</label>
              <textarea
                className="w-full px-4 py-3 border-2 border-grey-light rounded-lg min-h-[100px]"
                placeholder="Tell us about your training needs..."
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowContactModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmitInquiry}
                loading={isSubmitting}
                disabled={!contactForm.name || !contactForm.email}
                leftIcon={<Send size={16} />}
              >
                Send Inquiry
              </Button>
            </div>
          </div>
        ) : submitSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send size={24} className="text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-navy mb-2">Inquiry Sent!</h3>
            <p className="text-sm text-grey-dark mb-4">
              Thank you for your interest. Our team will contact you within 24 hours.
            </p>
            <Button variant="outline" onClick={() => setShowContactModal(false)}>
              Close
            </Button>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
