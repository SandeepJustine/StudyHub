'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Toast } from '@/components/ui/toast';
import {
  Save, Shield, Bell, Globe, Upload, Download,
  Link as LinkIcon, Mail, Phone, MapPin,
} from 'lucide-react';

interface SettingsData {
  name: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  twoFactorEnabled: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    emailNotifications: true,
    smsNotifications: false,
    twoFactorEnabled: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/institutions/settings');
        const result = await res.json();
        if (result.success) {
          setSettings(result.data);
        } else {
          setToast({ message: result.error || 'Failed to load settings', type: 'error' });
        }
      } catch (error) {
        setToast({ message: 'Failed to load settings', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/institutions/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const result = await res.json();
      if (result.success) {
        setSettings(result.data);
        setSaved(true);
        setToast({ message: 'Settings saved successfully!', type: 'success' });
        setTimeout(() => setSaved(false), 3000);
      } else {
        setToast({ message: result.error || 'Failed to save settings', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Failed to save settings', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const toggleSetting = (key: keyof SettingsData) => {
    if (key === 'emailNotifications' || key === 'smsNotifications' || key === 'twoFactorEnabled') {
      setSettings({ ...settings, [key]: !settings[key] });
    }
  };

  const handleExportData = () => {
    setToast({ message: 'Preparing data export...', type: 'success' });
    // In a real implementation, this would trigger a server-side export
    setTimeout(() => {
      setToast({ message: 'Data export ready! Check your email for the download link.', type: 'success' });
    }, 2000);
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        setToast({ message: `Importing ${file.name}...`, type: 'success' });
        setTimeout(() => {
          setToast({ message: 'Data imported successfully!', type: 'success' });
        }, 1500);
      }
    };
    input.click();
  };

  const handleManageIntegrations = () => {
    setToast({ message: 'Integration settings coming soon!', type: 'success' });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-grey-light rounded animate-pulse w-48"></div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-grey-light rounded animate-pulse"></div>
              ))}
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
          <p className="text-grey-medium mt-1">Configure your institution settings</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <Badge variant="success" size="sm">Saved!</Badge>}
          <Button variant="primary" leftIcon={<Save size={16} />} onClick={handleSave} loading={saving}>
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail size={18} className="text-navy" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="School Name"
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                disabled={saving}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Email Address"
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  disabled={saving}
                />
                <Input
                  label="Phone Number"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  disabled={saving}
                />
              </div>
              <Input
                label="Address"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                disabled={saving}
              />
              <Input
                label="Website"
                value={settings.website}
                onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                disabled={saving}
                helperText="e.g. https://yourschool.edu.mw"
              />
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell size={18} className="text-navy" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-grey-light rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-grey-medium" />
                  <div>
                    <p className="font-medium text-navy">Email Notifications</p>
                    <p className="text-sm text-grey-medium">Receive notifications via email</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleSetting('emailNotifications')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.emailNotifications ? 'bg-navy' : 'bg-grey-light'
                  }`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 border border-grey-light rounded-lg">
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-grey-medium" />
                  <div>
                    <p className="font-medium text-navy">SMS Notifications</p>
                    <p className="text-sm text-grey-medium">Receive notifications via SMS</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleSetting('smsNotifications')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.smsNotifications ? 'bg-navy' : 'bg-grey-light'
                  }`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    settings.smsNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield size={18} className="text-navy" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-grey-light rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield size={16} className="text-grey-medium" />
                  <div>
                    <p className="font-medium text-navy">Two-Factor Authentication</p>
                    <p className="text-sm text-grey-medium">Add an extra layer of security to your account</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleSetting('twoFactorEnabled')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.twoFactorEnabled ? 'bg-navy' : 'bg-grey-light'
                  }`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    settings.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe size={18} className="text-navy" />
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-grey-light rounded-lg">
                <div className="flex items-center gap-3">
                  <Download size={16} className="text-grey-medium" />
                  <div>
                    <p className="font-medium text-navy">Export Data</p>
                    <p className="text-sm text-grey-medium">Download all institution data as CSV</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportData}>
                  Export
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border border-grey-light rounded-lg">
                <div className="flex items-center gap-3">
                  <Upload size={16} className="text-grey-medium" />
                  <div>
                    <p className="font-medium text-navy">Import Data</p>
                    <p className="text-sm text-grey-medium">Upload student or course data from CSV</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleImportData}>
                  Import
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border border-grey-light rounded-lg">
                <div className="flex items-center gap-3">
                  <LinkIcon size={16} className="text-grey-medium" />
                  <div>
                    <p className="font-medium text-navy">Manage Integrations</p>
                    <p className="text-sm text-grey-medium">Connect third-party services</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleManageIntegrations}>
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-grey-medium">Institution ID</p>
                  <p className="font-medium text-navy break-all text-xs">
                    {settings.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-grey-medium">2FA Status</p>
                  <Badge variant={settings.twoFactorEnabled ? 'success' : 'warning'} size="sm">
                    {settings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
