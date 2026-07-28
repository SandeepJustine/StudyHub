'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Toast } from '@/components/ui/toast';
import {
  Save,
  RefreshCw,
  DollarSign,
  Calendar,
  Clock,
  Shield,
  Loader2,
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

export default function PayoutSettingsPage() {
  const [settings, setSettings] = useState({
    minimumPayout: 10000,
    payoutSchedule: 'monthly',
    payoutDay: 15,
    autoApprove: false,
    paymentMethods: ['AIRTEL_MONEY', 'TNM_MPAMBA', 'BANK_TRANSFER'],
    processingFee: 0,
    holdPeriod: 7,
    maxBulkProcess: 50,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/payouts/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      if (data.success && data.data) {
        setSettings(prev => ({ ...prev, ...data.data }));
      }
    } catch (error) {
      console.error('Failed to fetch payout settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/payouts/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) throw new Error('Failed to save settings');

      setToast({ message: 'Payout settings saved successfully', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to save settings', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-navy" />
        <span className="ml-3 text-grey-dark">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Payout Settings</h1>
          <p className="text-grey-dark mt-1">Configure instructor payout rules and thresholds</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={fetchSettings}>
            <RefreshCw size={16} />
          </Button>
          <Button variant="primary" leftIcon={<Save size={16} />} onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* Threshold Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign size={20} className="text-green" />
            Payout Thresholds
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Minimum Payout Amount (MWK)"
            type="number"
            value={settings.minimumPayout}
            onChange={(e) => setSettings({ ...settings, minimumPayout: parseInt(e.target.value) || 0 })}
            helperText="Instructors must earn at least this amount before they can withdraw"
          />
          <Input
            label="Processing Fee (%)"
            type="number"
            min={0}
            max={10}
            value={settings.processingFee}
            onChange={(e) => setSettings({ ...settings, processingFee: parseInt(e.target.value) || 0 })}
            helperText="Fee deducted from each payout (0% for now)"
          />
          <Input
            label="Hold Period (Days)"
            type="number"
            min={0}
            max={30}
            value={settings.holdPeriod}
            onChange={(e) => setSettings({ ...settings, holdPeriod: parseInt(e.target.value) || 0 })}
            helperText="Number of days to hold earnings before they become available for payout"
          />
        </CardContent>
      </Card>

      {/* Schedule Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar size={20} className="text-blue-600" />
            Payout Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-grey-dark">Payout Frequency</label>
            <select
              className="w-full px-4 py-3 border-2 border-grey-light rounded-lg"
              value={settings.payoutSchedule}
              onChange={(e) => setSettings({ ...settings, payoutSchedule: e.target.value })}
            >
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <Input
            label="Payout Day"
            type="number"
            min={1}
            max={28}
            value={settings.payoutDay}
            onChange={(e) => setSettings({ ...settings, payoutDay: parseInt(e.target.value) || 15 })}
            helperText="Day of the month when payouts are processed (1-28)"
          />
        </CardContent>
      </Card>

      {/* Automation Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock size={20} className="text-purple-600" />
            Automation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-grey-light/50 rounded-lg">
            <div>
              <p className="font-medium text-navy">Auto-Approve Payouts</p>
              <p className="text-sm text-grey-medium">Automatically approve payouts below threshold</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoApprove}
                onChange={(e) => setSettings({ ...settings, autoApprove: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-grey-light peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-green after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
            </label>
          </div>
          <Input
            label="Max Bulk Process"
            type="number"
            min={1}
            max={100}
            value={settings.maxBulkProcess}
            onChange={(e) => setSettings({ ...settings, maxBulkProcess: parseInt(e.target.value) || 50 })}
            helperText="Maximum number of payouts to process in one batch"
          />
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield size={20} className="text-red" />
            Allowed Payment Methods
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { id: 'AIRTEL_MONEY', label: 'Airtel Money', icon: '📱' },
              { id: 'TNM_MPAMBA', label: 'TNM Mpamba', icon: '📱' },
              { id: 'BANK_TRANSFER', label: 'Bank Transfer', icon: '🏦' },
            ].map((method) => (
              <div key={method.id} className="flex items-center justify-between p-4 bg-grey-light/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{method.icon}</span>
                  <div>
                    <p className="font-medium text-navy">{method.label}</p>
                    <p className="text-sm text-grey-medium">{method.id.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.paymentMethods.includes(method.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSettings({
                          ...settings,
                          paymentMethods: [...settings.paymentMethods, method.id],
                        });
                      } else {
                        setSettings({
                          ...settings,
                          paymentMethods: settings.paymentMethods.filter(m => m !== method.id),
                        });
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-grey-light peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-green after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                </label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}