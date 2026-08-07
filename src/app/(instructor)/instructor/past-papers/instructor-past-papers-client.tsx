'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import { FileText, Upload, Download, Eye, Calendar, Search, Trash2, CreditCard, Smartphone, Building2, Check } from 'lucide-react';
import { PRICING_TIERS, getTiersForRole } from '@/lib/billing/pricing-tiers';
import { UpgradeBanner } from '@/components/features/subscription/upgrade-banner';

interface InstructorPastPapersClientProps {
  canUpload: boolean;
  myPapers: any[];
  examBoards: string[];
  subjects: string[];
}

export function InstructorPastPapersClient({ canUpload, myPapers, examBoards, subjects }: InstructorPastPapersClientProps) {
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
        // Payment not verified yet — show exact backend message and keep modal open
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
          // Payment is still pending — do not close the modal
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

  const availableTiers = getTiersForRole('INSTRUCTOR').filter(t => t !== 'INSTRUCTOR_FREE');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-100 rounded-xl"><FileText size={22} className="text-orange-600" /></div>
          <div><h1 className="text-2xl font-bold text-navy">Past Papers</h1><p className="text-sm text-grey-medium">Manage and upload past papers for your students</p></div>
        </div>
        {canUpload && (
          <Button variant="primary" onClick={() => router.push('/instructor/past-papers/upload')}><Upload size={16} className="mr-1" />Upload Paper</Button>
        )}
      </div>

      {!canUpload && (
        <UpgradeBanner type="upload" onUpgradeClick={() => setShowUpgradeModal(true)} />
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[{ l:'My Papers', v:myPapers.length, i:<FileText size={16} className="text-orange-600" />, b:'bg-orange-50' },{ l:'Exam Boards', v:examBoards.length, i:<Search size={16} className="text-blue-600" />, b:'bg-blue-50' },{ l:'Subjects', v:subjects.length, i:<FileText size={16} className="text-green-600" />, b:'bg-green-50' },{ l:'Total Views', v:myPapers.length * 12, i:<Eye size={16} className="text-purple-600" />, b:'bg-purple-50' }].map((s,i)=>(
          <Card key={i} className="border-0 shadow-sm"><CardContent className="p-3 text-center"><div className={`p-1.5 rounded-lg ${s.b} inline-block mb-1`}>{s.i}</div><p className="text-xl font-bold text-navy">{s.v}</p><p className="text-xs text-grey-medium">{s.l}</p></CardContent></Card>
        ))}
      </div>

      {/* Papers Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-grey-light">
                <th className="text-left p-4 text-xs font-medium text-grey-medium uppercase">Title</th>
                <th className="text-left p-4 text-xs font-medium text-grey-medium uppercase">Subject</th>
                <th className="text-left p-4 text-xs font-medium text-grey-medium uppercase">Exam Board</th>
                <th className="text-left p-4 text-xs font-medium text-grey-medium uppercase">Year</th>
                <th className="text-left p-4 text-xs font-medium text-grey-medium uppercase">Status</th>
                <th className="text-right p-4 text-xs font-medium text-grey-medium uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {myPapers.length > 0 ? myPapers.map((paper) => (
                <tr key={paper.id} className="border-b border-grey-light hover:bg-grey-light/50">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-grey-medium" />
                      <span className="text-sm font-medium text-navy">{paper.title}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-grey-dark">{paper.subject}</td>
                  <td className="p-4"><Badge variant="info" size="sm">{paper.examBoard}</Badge></td>
                  <td className="p-4 text-sm text-grey-dark">{paper.year}</td>
                  <td className="p-4"><Badge variant="success" size="sm">{paper.status}</Badge></td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="xs" className="h-8 w-8 p-0"><Eye size={14} /></Button>
                      <Button variant="ghost" size="xs" className="h-8 w-8 p-0"><Download size={14} /></Button>
                      <Button variant="ghost" size="xs" className="h-8 w-8 p-0 text-red hover:text-red-700"><Trash2 size={14} /></Button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <FileText size={40} className="mx-auto text-grey-medium mb-3" />
                    <h3 className="font-semibold text-navy">No Past Papers Yet</h3>
                    <p className="text-sm text-grey-dark">Upload your first past paper to get started.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Upgrade Modal */}
      <Modal isOpen={showUpgradeModal} onClose={() => { setShowUpgradeModal(false); setSelectedUpgradeTier(null); setPaymentMethod(''); setPhone(''); }} title="Upgrade to Instructor Pro" size="xl">
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
