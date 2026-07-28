'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Toast } from '@/components/ui/toast';
import {
  Settings as SettingsIcon,
  CreditCard,
  Bell,
  Shield,
  Globe,
  Mail,
  Smartphone,
  Save,
  RefreshCw,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [settings, setSettings] = useState({
    platformName: 'StudyHub Malawi',
    tagline: 'Learn. Practice. Succeed.',
    supportEmail: 'support@studyhub.mw',
    supportPhone: '+265 888 000 000',
    minimumPayout: 10000,
    payoutDay: 15,
    commissionRate: 30,
    smsEnabled: true,
    emailEnabled: true,
    pushEnabled: true,
    mfaRequired: false,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    defaultLocale: 'en',
    defaultCurrency: 'MWK',
    timezone: 'Africa/Blantyre',
  });

  // Load settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      if (data.success && data.data) {
        setSettings(prev => ({ ...prev, ...data.data }));
      }
    } catch (err: any) {
      console.error('Failed to load settings:', err);
      setError('Failed to load settings. Using defaults.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (section: string) => {
    setIsSaving(true);
    setError(null);
    
    try {
      // Get settings relevant to the section
      let sectionSettings: any = {};
      
      switch (section) {
        case 'General':
          sectionSettings = {
            platformName: settings.platformName,
            tagline: settings.tagline,
            supportEmail: settings.supportEmail,
            supportPhone: settings.supportPhone,
          };
          break;
        case 'Payment':
          sectionSettings = {
            minimumPayout: settings.minimumPayout,
            payoutDay: settings.payoutDay,
            commissionRate: settings.commissionRate,
          };
          break;
        case 'Notification':
          sectionSettings = {
            smsEnabled: settings.smsEnabled,
            emailEnabled: settings.emailEnabled,
            pushEnabled: settings.pushEnabled,
          };
          break;
        case 'Security':
          sectionSettings = {
            mfaRequired: settings.mfaRequired,
            sessionTimeout: settings.sessionTimeout,
            maxLoginAttempts: settings.maxLoginAttempts,
          };
          break;
        case 'Localization':
          sectionSettings = {
            defaultLocale: settings.defaultLocale,
            defaultCurrency: settings.defaultCurrency,
            timezone: settings.timezone,
          };
          break;
      }

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: section.toLowerCase(),
          settings: sectionSettings,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }

      setToast({ message: `${section} settings saved successfully`, type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to save settings', type: 'error' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: <SettingsIcon size={18} /> },
    { id: 'payment', label: 'Payment', icon: <CreditCard size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'security', label: 'Security', icon: <Shield size={18} /> },
    { id: 'localization', label: 'Localization', icon: <Globe size={18} /> },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-navy" />
          <span className="ml-3 text-grey-dark">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Platform Settings</h1>
          <p className="text-grey-dark mt-1">Configure platform-wide settings</p>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchSettings}>
          <RefreshCw size={16} className="mr-1" />
          Reload
        </Button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-sm text-yellow-800">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-grey-light pb-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-navy text-white'
                : 'text-grey-dark hover:bg-grey-light'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Platform Name"
              value={settings.platformName}
              onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
            />
            <Input
              label="Tagline"
              value={settings.tagline}
              onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
            />
            <Input
              label="Support Email"
              type="email"
              value={settings.supportEmail}
              onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
            />
            <Input
              label="Support Phone"
              value={settings.supportPhone}
              onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
            />
            <Button 
              variant="primary" 
              leftIcon={isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
              onClick={() => handleSave('General')}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save General Settings'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Payment Settings */}
      {activeTab === 'payment' && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Minimum Payout (MWK)"
              type="number"
              value={settings.minimumPayout}
              onChange={(e) => setSettings({ ...settings, minimumPayout: parseInt(e.target.value) || 0 })}
              helperText="Minimum amount instructors can withdraw"
            />
            <Input
              label="Payout Day"
              type="number"
              min={1}
              max={28}
              value={settings.payoutDay}
              onChange={(e) => setSettings({ ...settings, payoutDay: parseInt(e.target.value) || 15 })}
              helperText="Day of month when payouts are processed"
            />
            <Input
              label="Platform Commission (%)"
              type="number"
              min={0}
              max={100}
              value={settings.commissionRate}
              onChange={(e) => setSettings({ ...settings, commissionRate: parseInt(e.target.value) || 0 })}
              helperText="Default platform commission on course sales"
            />
            <Button 
              variant="primary" 
              leftIcon={isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
              onClick={() => handleSave('Payment')}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Payment Settings'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleSetting
              icon={<Mail size={20} className="text-navy" />}
              title="Email Notifications"
              description="Send transactional and marketing emails"
              checked={settings.emailEnabled}
              onChange={(checked) => setSettings({ ...settings, emailEnabled: checked })}
            />
            <ToggleSetting
              icon={<Smartphone size={20} className="text-green" />}
              title="SMS Notifications"
              description="Send critical alerts via SMS"
              checked={settings.smsEnabled}
              onChange={(checked) => setSettings({ ...settings, smsEnabled: checked })}
            />
            <ToggleSetting
              icon={<Bell size={20} className="text-red" />}
              title="Push Notifications"
              description="In-app and browser push notifications"
              checked={settings.pushEnabled}
              onChange={(checked) => setSettings({ ...settings, pushEnabled: checked })}
            />
            <Button 
              variant="primary" 
              leftIcon={isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
              onClick={() => handleSave('Notification')}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Notification Settings'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleSetting
              icon={<Shield size={20} className="text-purple-600" />}
              title="Two-Factor Authentication"
              description="Require MFA for all admin accounts"
              checked={settings.mfaRequired}
              onChange={(checked) => setSettings({ ...settings, mfaRequired: checked })}
            />
            <Input
              label="Session Timeout (minutes)"
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) || 60 })}
            />
            <Input
              label="Max Login Attempts"
              type="number"
              value={settings.maxLoginAttempts}
              onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) || 5 })}
              helperText="Account locks after this many failed attempts"
            />
            <Button 
              variant="primary" 
              leftIcon={isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
              onClick={() => handleSave('Security')}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Security Settings'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Localization Settings */}
      {activeTab === 'localization' && (
        <Card>
          <CardHeader>
            <CardTitle>Localization Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-grey-dark">Default Language</label>
              <select
                className="w-full px-4 py-3 border-2 border-grey-light rounded-lg"
                value={settings.defaultLocale}
                onChange={(e) => setSettings({ ...settings, defaultLocale: e.target.value })}
              >
                <option value="en">English</option>
                <option value="ny">Chichewa</option>
              </select>
            </div>
            <Input
              label="Default Currency"
              value={settings.defaultCurrency}
              onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
            />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-grey-dark">Timezone</label>
              <select
                className="w-full px-4 py-3 border-2 border-grey-light rounded-lg"
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              >
                <option value="Africa/Blantyre">Africa/Blantyre (CAT)</option>
                <option value="Africa/Johannesburg">Africa/Johannesburg (SAST)</option>
                <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
              </select>
            </div>
            <Button 
              variant="primary" 
              leftIcon={isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
              onClick={() => handleSave('Localization')}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Localization Settings'}
            </Button>
          </CardContent>
        </Card>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

// Reusable Toggle Setting Component
function ToggleSetting({ 
  icon, 
  title, 
  description, 
  checked, 
  onChange 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  checked: boolean; 
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-grey-light/50 rounded-lg">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="font-medium text-navy">{title}</p>
          <p className="text-sm text-grey-medium">{description}</p>
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-grey-light peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-green after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
      </label>
    </div>
  );
}