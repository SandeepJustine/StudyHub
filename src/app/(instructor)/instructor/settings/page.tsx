'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Save, Bell, Globe, Shield, CreditCard, CheckCircle, User } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

export default function InstructorSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [phone, setPhone] = useState('');
  const [locale, setLocale] = useState('en');
  const [notificationPrefs, setNotificationPrefs] = useState<any>({
    email: true,
    sms: true,
    push: true,
  });
  const [bankDetails, setBankDetails] = useState<any>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch('/api/instructor/settings');
      if (res.ok) {
        const json = await res.json();
        setSettings(json.data);
        setPhone(json.data.user?.phone || '');
        setLocale(json.data.user?.locale || 'en');
        setNotificationPrefs(json.data.user?.notificationPreferences || {
          email: true,
          sms: true,
          push: true,
        });
        setBankDetails(json.data.instructor?.bankDetails || {});
      } else {
        setError('Failed to load settings');
      }
    } catch (e) {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/instructor/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          locale,
          notificationPreferences: notificationPrefs,
          bankDetails,
        }),
      });
      if (res.ok) {
        setSuccess('Settings updated successfully');
        await fetchSettings();
      } else {
        const json = await res.json();
        setError(json.error || 'Failed to update settings');
      }
    } catch (e) {
      setError('Failed to update settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-grey-light rounded animate-pulse w-48"></div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="h-4 bg-grey-light rounded animate-pulse"></div>
              <div className="h-4 bg-grey-light rounded animate-pulse w-5/6"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Settings</h1>
          <p className="text-sm text-grey-medium">Manage your account and instructor preferences</p>
        </div>
        <Button variant="primary" onClick={saveSettings} loading={saving} leftIcon={<Save size={18} />}>
          Save Changes
        </Button>
      </div>

      {/* Success/Error messages */}
      {success && (
        <div className="p-4 bg-green-50 text-green-800 rounded-lg flex items-center gap-2">
          <CheckCircle size={16} />
          {success}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 text-red-800 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User size={20} />
                Account Settings
              </CardTitle>
              <CardDescription>Update your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Full Name"
                value={settings?.user?.fullName || ''}
                disabled
                helperText="Name is managed in your profile"
              />
              <Input
                label="Email"
                value={settings?.user?.email || ''}
                disabled
                helperText="Email cannot be changed"
              />
              <Input
                label="Phone Number"
                placeholder="+265 99 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-grey-dark">Language</label>
                <select
                  className="w-full px-4 py-3 border-2 border-grey-light rounded-lg focus:border-navy focus:ring-2 focus:ring-navy/20"
                  value={locale}
                  onChange={(e) => setLocale(e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="ny">Chichewa</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell size={20} />
                Notification Preferences
              </CardTitle>
              <CardDescription>Choose how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-grey-light rounded-lg">
                <div>
                  <p className="font-medium text-navy">Email Notifications</p>
                  <p className="text-sm text-grey-medium">Receive notifications via email</p>
                </div>
                <label className="relative inline-flex h-6 w-10 items-center rounded-full">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.email}
                    onChange={(e) => setNotificationPrefs({ ...notificationPrefs, email: e.target.checked })}
                    className="h-6 w-10 rounded-full appearance-none cursor-pointer"
                  />
                  <span className="absolute inset-0 cursor-pointer">
                    <span
                      className={`absolute inline-block h-4 w-4 rounded-full bg-white top-1 transition-transform ${
                        notificationPrefs.email ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 border border-grey-light rounded-lg">
                <div>
                  <p className="font-medium text-navy">SMS Notifications</p>
                  <p className="text-sm text-grey-medium">Receive notifications via SMS</p>
                </div>
                <label className="relative inline-flex h-6 w-10 items-center rounded-full">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.sms}
                    onChange={(e) => setNotificationPrefs({ ...notificationPrefs, sms: e.target.checked })}
                    className="h-6 w-10 rounded-full appearance-none cursor-pointer"
                  />
                  <span className="absolute inset-0 cursor-pointer">
                    <span
                      className={`absolute inline-block h-4 w-4 rounded-full bg-white top-1 transition-transform ${
                        notificationPrefs.sms ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 border border-grey-light rounded-lg">
                <div>
                  <p className="font-medium text-navy">Push Notifications</p>
                  <p className="text-sm text-grey-medium">Receive push notifications in browser</p>
                </div>
                <label className="relative inline-flex h-6 w-10 items-center rounded-full">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.push}
                    onChange={(e) => setNotificationPrefs({ ...notificationPrefs, push: e.target.checked })}
                    className="h-6 w-10 rounded-full appearance-none cursor-pointer"
                  />
                  <span className="absolute inset-0 cursor-pointer">
                    <span
                      className={`absolute inline-block h-4 w-4 rounded-full bg-white top-1 transition-transform ${
                        notificationPrefs.push ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Payout Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard size={20} />
                Payout Information
              </CardTitle>
              <CardDescription>Configure your payout method and bank details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Account Holder Name"
                placeholder="John Doe"
                value={bankDetails?.accountHolderName || ''}
                onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
              />
              <Input
                label="Account Number"
                placeholder="1234567890"
                value={bankDetails?.accountNumber || ''}
                onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
              />
              <Input
                label="Bank Name"
                placeholder="Standard Bank"
                value={bankDetails?.bankName || ''}
                onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
              />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-grey-dark">Payment Method</label>
                <select
                  className="w-full px-4 py-3 border-2 border-grey-light rounded-lg focus:border-navy focus:ring-2 focus:ring-navy/20"
                  value={bankDetails?.paymentMethod || 'AIRTEL_MONEY'}
                  onChange={(e) => setBankDetails({ ...bankDetails, paymentMethod: e.target.value })}
                >
                  <option value="AIRTEL_MONEY">Airtel Money</option>
                  <option value="TNM_MPAMBA">TNM Mpamba</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield size={20} />
                Security
              </CardTitle>
              <CardDescription>Account security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-grey-light rounded-lg">
                <div>
                  <p className="font-medium text-navy">Two-Factor Authentication</p>
                  <p className="text-sm text-grey-medium">
                    {settings?.user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <Badge variant={settings?.user?.twoFactorEnabled ? 'success' : 'neutral'} size="sm">
                  {settings?.user?.twoFactorEnabled ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <Button variant="outline" size="sm">
                Change Password
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Instructor Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-navy">
                  {formatCurrency(settings?.instructor?.totalEarnings || 0)}
                </p>
                <p className="text-sm text-grey-medium">Total Earnings</p>
              </div>
              <div className="text-center">
                <Badge variant={settings?.instructor?.isVerified ? 'success' : 'warning'} size="sm">
                  {settings?.instructor?.isVerified ? 'Verified Instructor' : 'Verification Pending'}
                </Badge>
              </div>
              <div className="text-center">
                <p className="text-sm text-grey-medium">
                  Revenue Share: {Math.round((settings?.instructor?.revenueShare || 0.7) * 100)}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
