'use client';

import { useState } from 'react';
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
  Palette,
  Mail,
  Smartphone,
  Save,
  RefreshCw,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [settings, setSettings] = useState({
    // General
    platformName: 'StudyHub Malawi',
    tagline: 'Learn. Practice. Succeed.',
    supportEmail: 'support@studyhub.mw',
    supportPhone: '+265 888 000 000',
    
    // Payment
    minimumPayout: 10000,
    payoutDay: 15,
    commissionRate: 30,
    
    // Notification
    smsEnabled: true,
    emailEnabled: true,
    pushEnabled: true,
    
    // Security
    mfaRequired: false,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    
    // Localization
    defaultLocale: 'en',
    defaultCurrency: 'MWK',
    timezone: 'Africa/Blantyre',
  });

  const handleSave = (section: string) => {
    // In production, save to API
    setToast({ message: `${section} settings saved successfully`, type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: <SettingsIcon size={18} /> },
    { id: 'payment', label: 'Payment', icon: <CreditCard size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'security', label: 'Security', icon: <Shield size={18} /> },
    { id: 'localization', label: 'Localization', icon: <Globe size={18} /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Platform Settings</h1>
        <p className="text-grey-dark mt-1">Configure platform-wide settings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-grey-light pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
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
            <Button variant="primary" leftIcon={<Save size={16} />} onClick={() => handleSave('General')}>
              Save General Settings
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
            <Button variant="primary" leftIcon={<Save size={16} />} onClick={() => handleSave('Payment')}>
              Save Payment Settings
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
            <div className="flex items-center justify-between p-4 bg-grey-light/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Mail size={20} className="text-navy" />
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-grey-medium">Send transactional and marketing emails</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailEnabled}
                  onChange={(e) => setSettings({ ...settings, emailEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-grey-light peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-green after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-grey-light/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone size={20} className="text-green" />
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-grey-medium">Send critical alerts via SMS</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.smsEnabled}
                  onChange={(e) => setSettings({ ...settings, smsEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-grey-light peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-green after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-grey-light/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Bell size={20} className="text-red" />
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-grey-medium">In-app and browser push notifications</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.pushEnabled}
                  onChange={(e) => setSettings({ ...settings, pushEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-grey-light peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-green after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
              </label>
            </div>

            <Button variant="primary" leftIcon={<Save size={16} />} onClick={() => handleSave('Notification')}>
              Save Notification Settings
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
            <div className="flex items-center justify-between p-4 bg-grey-light/50 rounded-lg">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-grey-medium">Require MFA for all admin accounts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.mfaRequired}
                  onChange={(e) => setSettings({ ...settings, mfaRequired: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-grey-light peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-green after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
              </label>
            </div>

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

            <Button variant="primary" leftIcon={<Save size={16} />} onClick={() => handleSave('Security')}>
              Save Security Settings
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

            <Button variant="primary" leftIcon={<Save size={16} />} onClick={() => handleSave('Localization')}>
              Save Localization Settings
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