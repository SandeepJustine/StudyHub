'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import {
  Users, GraduationCap, BookOpen, TrendingUp,
  AlertTriangle, Download, UserPlus, CreditCard, Check,
  Smartphone, Building2,
} from 'lucide-react';
import { formatDate } from '@/utils/formatters';
import { PRICING_TIERS, getTiersForRole } from '@/lib/billing/pricing-tiers';

interface DashboardData {
  institution: {
    name: string;
    tier: string;
    studentCount: number;
    maxStudents: number;
    currentStudents: number;
  };
  stats: {
    totalStudents: number;
    totalTeachers: number;
    activeStudents: number;
    coursesAssigned: number;
    averageProgress: number;
    studentsAtRisk: number;
  };
  analytics: {
    totalEnrollments: number;
    courseCompletion: number;
    averageScore: number;
    certificatesIssued: number;
    enrollmentTrend: string;
    completionTrend: string;
    scoreTrend: string;
    certificateTrend: string;
  };
  subscription: {
    status: string;
    tier: string;
    endDate: string;
    autoRenew: boolean;
  } | null;
  courses: Array<{ id: string; title: string; subject: string; studentsCount: number }>;
}

export default function SchoolAdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedUpgradeTier, setSelectedUpgradeTier] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/institutions/analytics');
        if (!res.ok) {
          const result = await res.json().catch(() => ({ error: 'Failed to load dashboard' }));
          throw new Error(result.error || `Server error ${res.status}`);
        }
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        } else {
          setToast({ message: result.error || 'Failed to load dashboard', type: 'error' });
        }
      } catch (error: any) {
        setToast({ message: error.message || 'Failed to load dashboard', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
          institutionId: data?.institution.name,
        }),
      });
      if (!res.ok) {
        const result = await res.json().catch(() => ({ error: 'Failed to subscribe' }));
        throw new Error(result.error || `Server error ${res.status}`);
      }
      const result = await res.json();
      if (result.success) {
        setToast({ message: `Successfully subscribed to ${PRICING_TIERS[selectedUpgradeTier]?.name || selectedUpgradeTier}!`, type: 'success' });
        setShowUpgradeModal(false);
        setSelectedUpgradeTier(null);
        setPaymentMethod('');
        fetchData();
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

  const handleExportReport = () => {
    if (!data) return;
    try {
      const rows = [
        ['Metric', 'Value'],
        ['Institution', data.institution.name],
        ['Tier', data.institution.tier],
        ['Total Students', data.stats.totalStudents],
        ['Total Teachers', data.stats.totalTeachers],
        ['Active Students', data.stats.activeStudents],
        ['Courses Assigned', data.stats.coursesAssigned],
        ['Average Progress', `${data.stats.averageProgress}%`],
        ['Students at Risk', data.stats.studentsAtRisk],
        ...(data.analytics ? [
          ['Total Enrollments', data.analytics.totalEnrollments],
          ['Course Completion', `${data.analytics.courseCompletion}%`],
          ['Average Score', `${data.analytics.averageScore}%`],
          ['Certificates Issued', data.analytics.certificatesIssued],
          ['Enrollment Trend', data.analytics.enrollmentTrend],
          ['Completion Trend', data.analytics.completionTrend],
          ['Score Trend', data.analytics.scoreTrend],
          ['Certificate Trend', data.analytics.certificateTrend],
        ] : []),
        ['Subscription Status', data.subscription?.status || 'N/A'],
        ['Subscription Tier', data.subscription?.tier || 'N/A'],
        ['Next Renewal', data.subscription?.endDate ? formatDate(data.subscription.endDate) : 'N/A'],
        ['Auto Renew', data.subscription?.autoRenew ? 'Yes' : 'No'],
        ...data.courses.map(c => [`Course: ${c.title}`, `${c.studentsCount} students`]),
      ];
      const csvContent = rows.map(e => e.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setToast({ message: 'Report exported successfully', type: 'success' });
    } catch {
      setToast({ message: 'Failed to export report', type: 'error' });
    }
  };

  const availableTiers = getTiersForRole('SCHOOL_ADMIN').filter(t => t !== data?.institution.tier);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-6"><div className="h-6 bg-grey-light rounded animate-pulse mb-2"></div><div className="h-4 bg-grey-light rounded animate-pulse w-2/3"></div></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-grey-medium">Failed to load dashboard data</p>
      </div>
    );
  }

  const stats = data.stats;
  const tier = data.institution.tier.replace('INSTITUTION_', '');
  const isBronze = data.institution.tier === 'INSTITUTION_BRONZE';

  return (
    <div className="space-y-6">
      {/* Subscription Alert */}
      {isBronze && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800">Bronze Tier - Upgrade for More Features</p>
              <p className="text-sm text-yellow-700">
                Unlock advanced analytics, custom branding, and parent portal with Silver or Gold tier
              </p>
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={() => setShowUpgradeModal(true)}>Upgrade Now</Button>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-grey-medium">Total Students</p>
                <p className="text-2xl font-bold text-navy">{stats.totalStudents}</p>
                <p className="text-xs text-grey-medium">{stats.activeStudents} active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <GraduationCap className="text-green" size={24} />
              </div>
              <div>
                <p className="text-sm text-grey-medium">Teachers</p>
                <p className="text-2xl font-bold text-navy">{stats.totalTeachers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <BookOpen className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-grey-medium">Courses Assigned</p>
                <p className="text-2xl font-bold text-navy">{stats.coursesAssigned}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <TrendingUp className="text-yellow-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-grey-medium">Avg Progress</p>
                <p className="text-2xl font-bold text-navy">{stats.averageProgress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Button variant="primary" leftIcon={<UserPlus size={18} />} onClick={() => router.push('/school-admin/students?add=true')}>
          Add Students
        </Button>
        <Button variant="outline" leftIcon={<Download size={18} />} onClick={handleExportReport}>
          Export Report
        </Button>
      </div>

      {/* Students at Risk */}
      {stats.studentsAtRisk > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle size={20} className="text-red" />
                Students at Risk ({stats.studentsAtRisk})
              </CardTitle>
               <Button variant="ghost" size="sm" onClick={() => router.push('/school-admin/students?atRisk=true')}>View All</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-grey-medium">
                {stats.studentsAtRisk} student{stats.studentsAtRisk > 1 ? 's are' : ' is'} showing low progress.
                Review their records and intervene.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Course Performance */}
      {data.courses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Course Enrollment Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.courses.slice(0, 5).map((course) => (
                <div key={course.id} className="flex items-center justify-between p-3 bg-grey-light/30 rounded-lg">
                  <div>
                    <h4 className="font-medium text-navy">{course.title}</h4>
                    <p className="text-sm text-grey-medium">{course.subject}</p>
                  </div>
                  <Badge variant="info" size="sm">{course.studentsCount} students</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Info */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-navy/5 rounded-lg">
              <p className="text-sm text-grey-medium mb-1">Current Tier</p>
              <p className="text-xl font-bold text-navy">{tier}</p>
              <Badge variant="success" size="sm" className="mt-1">
                {data.subscription?.status || 'N/A'}
              </Badge>
            </div>
            <div className="p-4 bg-navy/5 rounded-lg">
              <p className="text-sm text-grey-medium mb-1">Student Capacity</p>
              <p className="text-xl font-bold text-navy">{data.institution.maxStudents}</p>
              <p className="text-xs text-grey-medium">
                {data.institution.currentStudents}/{data.institution.maxStudents} used
              </p>
            </div>
            <div className="p-4 bg-navy/5 rounded-lg">
              <p className="text-sm text-grey-medium mb-1">Next Renewal</p>
              <p className="text-xl font-bold text-navy">
                {data.subscription?.endDate ? formatDate(data.subscription.endDate) : 'N/A'}
              </p>
              <p className="text-xs text-green">
                {data.subscription?.autoRenew ? 'Auto-renewal enabled' : 'Auto-renewal disabled'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Modal */}
      <Modal isOpen={showUpgradeModal} onClose={() => { setShowUpgradeModal(false); setSelectedUpgradeTier(null); setPaymentMethod(''); }} title="Upgrade Subscription" size="xl">
        <div className="space-y-6">
          {!selectedUpgradeTier ? (
            <>
              <p className="text-grey-dark text-center">Choose a plan to upgrade to</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
