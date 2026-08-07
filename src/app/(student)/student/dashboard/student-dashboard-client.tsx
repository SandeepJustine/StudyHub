'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import {
  BookOpen, Clock, TrendingUp, Award, ChevronRight, Play, Star, GraduationCap, Target, CreditCard, Smartphone, Building2, Check, Crown
} from 'lucide-react';
import Link from 'next/link';
import { formatRelativeTime, formatCurrency } from '@/utils/formatters';
import { PRICING_TIERS, getTiersForRole } from '@/lib/billing/pricing-tiers';

interface StudentDashboardClientProps {
  student: { id: string; grade: string | null; examBoard: string | null; subjects: string[]; institutionId: string | null };
  session: { user: { name?: string | null } };
  institution: any;
  institutionCourses: any[];
  enrollments: any[];
  examAttempts: any[];
  activeEnrollments: any[];
  completedEnrollments: any[];
  averageProgress: number;
  studyHours: number;
  subscription: { id: string; tier: string; status: string } | null;
  isPremium: boolean;
}

export function StudentDashboardClient({
  student,
  session,
  institution,
  institutionCourses,
  enrollments,
  examAttempts,
  activeEnrollments,
  completedEnrollments,
  averageProgress,
  studyHours,
  subscription,
  isPremium,
}: StudentDashboardClientProps) {
  const router = useRouter();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedUpgradeTier, setSelectedUpgradeTier] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [phone, setPhone] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleUpgrade = async () => {
    if (!selectedUpgradeTier || !paymentMethod) {
      setToast({ message: 'Please select a plan and payment method', type: 'error' });
      return;
    }
    setSubscribing(true);
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: selectedUpgradeTier,
          cycle: billingCycle,
          paymentMethod,
          phone,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || `Server error ${res.status}`);
      }

      if (result.success && result.data) {
        const sub = result.data;
        if (sub.status === 'active' && sub.tier === selectedUpgradeTier) {
          setToast({ message: `Successfully subscribed to ${PRICING_TIERS[selectedUpgradeTier]?.name || selectedUpgradeTier}!`, type: 'success' });
          setShowUpgradeModal(false);
          setSelectedUpgradeTier(null);
          setPaymentMethod('');
          setPhone('');
        } else {
          setToast({ message: sub.status === 'pending' ? 'Payment is being processed. Please wait for confirmation.' : 'Subscription update is pending.', type: 'error' });
        }
      } else {
        setToast({ message: result.error || 'Failed to subscribe', type: 'error' });
      }
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to subscribe', type: 'error' });
    } finally {
      setSubscribing(false);
    }
  };

  const paymentMethods = [
    { id: 'AIRTEL_MONEY', name: 'Airtel Money', icon: <Smartphone size={20} /> },
    { id: 'TNM_MPAMBA', name: 'TNM Mpamba', icon: <Smartphone size={20} /> },
    { id: 'BANK_TRANSFER', name: 'Bank Transfer', icon: <Building2 size={20} /> },
    { id: 'PAYCHANGU', name: 'Card Payment', icon: <CreditCard size={20} /> },
  ];

  const availableTiers = getTiersForRole('STUDENT').filter(t => t !== 'STUDENT_BASIC');

  return (
    <div className="min-h-screen bg-grey-light p-6 space-y-6">
      {/* Greeting Card */}
      <Card className="bg-gradient-to-r from-white to-grey-light border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-navy/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-navy">
                  {session.user.name?.charAt(0)?.toUpperCase() || 'S'}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-navy">
                  Hello, {session.user.name?.split(' ')[0]}! 👋
                </h1>
                <p className="text-grey-dark mt-1">Ready to continue learning today?</p>
                {student.grade && (
                  <div className="flex gap-2 mt-2">
                    <Badge variant="neutral" size="sm">{student.grade}</Badge>
                    {student.examBoard && <Badge variant="neutral" size="sm">{student.examBoard}</Badge>}
                  </div>
                )}
              </div>
            </div>
            <Link href="/student/courses">
              <Button variant="primary" rightIcon={<ChevronRight size={16} />}>
                Browse Courses
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Banner */}
      {!isPremium && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-xl">
              <Crown size={20} className="text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold text-navy">Upgrade to Premium</h3>
              <p className="text-sm text-grey-dark">Unlock unlimited courses, AI Tutor, live classes, and downloadable past papers.</p>
            </div>
          </div>
          <Button variant="primary" size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-navy font-semibold" onClick={() => setShowUpgradeModal(true)}>
            Upgrade Now
          </Button>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-green-100 rounded-xl">
                <BookOpen className="text-green" size={20} />
              </div>
              <p className="text-sm font-medium text-grey-medium">Active Courses</p>
            </div>
            <p className="text-3xl font-bold text-navy">{activeEnrollments.length}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-blue-100 rounded-xl">
                <Award className="text-blue-600" size={20} />
              </div>
              <p className="text-sm font-medium text-grey-medium">Completed</p>
            </div>
            <p className="text-3xl font-bold text-navy">{completedEnrollments.length}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-yellow-100 rounded-xl">
                <TrendingUp className="text-yellow-600" size={20} />
              </div>
              <p className="text-sm font-medium text-grey-medium">Avg Progress</p>
            </div>
            <p className="text-3xl font-bold text-navy">{averageProgress}%</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-red-100 rounded-xl">
                <Clock className="text-red" size={20} />
              </div>
              <p className="text-sm font-medium text-grey-medium">Study Hours</p>
            </div>
            <p className="text-3xl font-bold text-navy">{studyHours}h</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Courses - Takes 2/3 width */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy flex items-center gap-2">
              <BookOpen size={18} className="text-green" />
              Active Courses
            </h2>
            <Link href="/student/courses">
              <Button variant="ghost" size="sm" rightIcon={<ChevronRight size={14} />}>View All</Button>
            </Link>
          </div>

          <div className="space-y-3">
            {activeEnrollments.length > 0 ? (
              activeEnrollments.map((enrollment) => (
                <Link key={enrollment.id} href={`/student/courses/${enrollment.courseId}`}>
                  <Card className="border-0 shadow-sm hover:shadow-md transition-all group cursor-pointer mb-5">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-5">
                            <h3 className="font-semibold text-navy group-hover:text-red transition-colors">
                              {enrollment.course.title}
                            </h3>
                            {enrollment.certificateId && (
                              <Badge variant="success" size="sm">Certified</Badge>
                            )}
                          </div>
                          <p className="text-sm text-grey-medium">
                            {enrollment.course.subject} • {enrollment.course.instructor?.user?.fullName || 'Unknown'}
                          </p>
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="text-grey-medium">Progress</span>
                              <span className="font-semibold text-navy">{enrollment.progress}%</span>
                            </div>
                            <div className="w-full bg-grey-light rounded-full h-2">
                              <div
                                className="bg-green rounded-full h-2 transition-all duration-500"
                                style={{ width: `${enrollment.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <Button variant="primary" size="sm" className="ml-4 flex-shrink-0">
                          <Play size={14} className="mr-1" /> Continue
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8 text-center">
                  <BookOpen size={40} className="mx-auto text-grey-medium mb-3" />
                  <h3 className="font-semibold text-navy mb-1">No active courses</h3>
                  <p className="text-sm text-grey-dark mb-4">Start learning by enrolling in a course</p>
                  <Link href="/student/courses">
                    <Button variant="primary">Browse Courses</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Institution Courses */}
        {institution && institutionCourses.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-navy flex items-center gap-2">
                    <BookOpen size={18} className="text-blue-600" />
                    {institution.name} Courses
                  </h2>
                  <p className="text-sm text-grey-medium">Recommended courses from your institution</p>
                </div>
                <Link href="/student/courses">
                  <Button variant="ghost" size="sm" rightIcon={<ChevronRight size={14} />}>View All</Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {institutionCourses.slice(0, 3).map((course) => (
                  <Link key={course.id} href={`/student/courses/${course.id}`}>
                    <Card className="border-0 shadow-sm hover:shadow-md transition-all group cursor-pointer h-full">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="info" size="sm">{course.subject}</Badge>
                          {course.examBoard && <Badge variant="neutral" size="sm">{course.examBoard}</Badge>}
                        </div>
                        <h3 className="font-semibold text-navy text-sm mb-1 group-hover:text-red transition-colors line-clamp-2">{course.title}</h3>
                        <p className="text-xs text-grey-medium mb-3">{course.instructor?.user?.fullName || 'Unknown'}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-navy">{course.price > 0 ? formatCurrency(course.price) : 'Free'}</span>
                          <Button variant="primary" size="sm">Enroll</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sidebar - Recent Exams */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy flex items-center gap-2">
              <Target size={18} className="text-red" />
              Recent Exams
            </h2>
            <Link href="/student/exams">
              <Button variant="ghost" size="sm" rightIcon={<ChevronRight size={14} />}>View All</Button>
            </Link>
          </div>

          <div className="space-y-3">
            {examAttempts.length > 0 ? (
              examAttempts.slice(0, 5).map((attempt) => (
                <Card key={attempt.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <h4 className="font-medium text-navy text-sm truncate">
                          {attempt.quiz?.title || 'Unknown Quiz'}
                        </h4>
                        <p className="text-xs text-grey-medium mt-0.5">
                          {attempt.quiz?.module?.course?.title || 'Unknown'}
                        </p>
                        <p className="text-xs text-grey-medium mt-1">
                          {attempt.completedAt ? formatRelativeTime(attempt.completedAt) : 'In progress'}
                        </p>
                      </div>
                      <div className="text-right ml-3 flex-shrink-0">
                        <p className={`text-lg font-bold ${attempt.passed ? 'text-green' : 'text-red'}`}>
                          {attempt.score}%
                        </p>
                        <Badge variant={attempt.passed ? 'success' : 'error'} size="sm">
                          {attempt.passed ? 'Pass' : 'Fail'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6 text-center">
                  <Target size={32} className="mx-auto text-grey-medium mb-2" />
                  <h4 className="font-semibold text-navy text-sm mb-1">No exams yet</h4>
                  <p className="text-xs text-grey-dark mb-3">Test your knowledge</p>
                  <Link href="/student/exams">
                    <Button variant="primary" size="sm">Take an Exam</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quick Links */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <h3 className="font-semibold text-navy text-sm mb-3">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/student/certificates" className="flex items-center gap-2 text-sm text-grey-dark hover:text-navy transition-colors">
                  <Award size={14} /> My Certificates
                </Link>
                <Link href="/student/lab" className="flex items-center gap-2 text-sm text-grey-dark hover:text-navy transition-colors">
                  <Star size={14} /> Virtual Lab
                </Link>
                <Link href="/student/community" className="flex items-center gap-2 text-sm text-grey-dark hover:text-navy transition-colors">
                  <GraduationCap size={14} /> Community
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upgrade Modal */}
      <Modal isOpen={showUpgradeModal} onClose={() => { setShowUpgradeModal(false); setSelectedUpgradeTier(null); setPaymentMethod(''); setPhone(''); }} title="Upgrade to Premium" size="xl">
        <div className="space-y-6">
          {!selectedUpgradeTier ? (
            <>
              <p className="text-grey-dark text-center">Choose a plan to upgrade to</p>
              <div className="grid grid-cols-1 gap-4">
                {availableTiers.map(tier => {
                  const config = PRICING_TIERS[tier];
                  if (!config) return null;
                  return (
                    <div key={tier} className="border-2 border-grey-light rounded-xl p-4 hover:border-navy transition-colors cursor-pointer" onClick={() => setSelectedUpgradeTier(tier)}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-navy">{config.name}</h3>
                        <span className="text-lg font-bold text-navy">{config.monthlyPrice ? `MWK ${config.monthlyPrice.toLocaleString()}/mo` : 'Custom'}</span>
                      </div>
                      <p className="text-sm text-grey-medium mb-3">{config.description}</p>
                      <ul className="space-y-1 mb-4">
                        {config.features.slice(0, 4).map((feature, i) => (
                          <li key={i} className="text-sm text-grey-dark flex items-center gap-2">
                            <Check size={14} className="text-green flex-shrink-0" /> <span className="truncate">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button variant="primary" className="w-full" leftIcon={<CreditCard size={16} />}>
                        Select {config.name}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-navy">{PRICING_TIERS[selectedUpgradeTier]?.name}</h3>
                  <p className="text-sm text-grey-medium">{PRICING_TIERS[selectedUpgradeTier]?.description}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedUpgradeTier(null)}>Change Plan</Button>
              </div>

              {/* Billing Cycle */}
              <div className="flex justify-center">
                <div className="bg-grey-light rounded-lg p-1 inline-flex">
                  <button
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${billingCycle === 'MONTHLY' ? 'bg-white shadow text-navy' : 'text-grey-dark hover:text-navy'}`}
                    onClick={() => setBillingCycle('MONTHLY')}
                  >
                    Monthly
                  </button>
                  <button
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${billingCycle === 'ANNUAL' ? 'bg-white shadow text-navy' : 'text-grey-dark hover:text-navy'}`}
                    onClick={() => setBillingCycle('ANNUAL')}
                  >
                    Annual
                    <Badge variant="success" size="sm" className="ml-2">Save 58%</Badge>
                  </button>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <h4 className="text-sm font-medium text-grey-dark mb-3">Select Payment Method</h4>
                <div className="grid grid-cols-2 gap-3">
                  {paymentMethods.map(method => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${paymentMethod === method.id ? 'border-navy bg-navy/5' : 'border-grey-light hover:border-navy/50'}`}
                    >
                      <span className={paymentMethod === method.id ? 'text-navy' : 'text-grey-medium'}>{method.icon}</span>
                      <span className="text-sm font-medium text-grey-dark">{method.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone Number for Mobile Money */}
              {(paymentMethod === 'AIRTEL_MONEY' || paymentMethod === 'TNM_MPAMBA') && (
                <Input
                  label={paymentMethod === 'AIRTEL_MONEY' ? 'Airtel Phone Number' : 'TNM Phone Number'}
                  placeholder={paymentMethod === 'AIRTEL_MONEY' ? '+265 999 000 000' : '+265 888 000 000'}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  disabled={subscribing}
                  helperText={paymentMethod === 'AIRTEL_MONEY' ? 'Your Airtel Money registered phone number' : 'Your TNM Mpamba registered phone number'}
                />
              )}

              {/* Total */}
              <div className="bg-grey-light/50 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-grey-medium">Total Amount</p>
                  <p className="text-2xl font-bold text-navy">
                    {billingCycle === 'MONTHLY'
                      ? `MWK ${(PRICING_TIERS[selectedUpgradeTier]?.monthlyPrice || 0).toLocaleString()}`
                      : `MWK ${(PRICING_TIERS[selectedUpgradeTier]?.annualPrice || 0).toLocaleString()}`}
                  </p>
                </div>
                <p className="text-xs text-grey-medium">{billingCycle === 'MONTHLY' ? 'per month' : 'per year'}</p>
              </div>

              <Button variant="primary" className="w-full" size="lg" onClick={handleUpgrade} loading={subscribing} leftIcon={<CreditCard size={18} />}>
                {subscribing ? 'Processing...' : `Subscribe to ${PRICING_TIERS[selectedUpgradeTier]?.name}`}
              </Button>
            </>
          )}
        </div>
      </Modal>

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
