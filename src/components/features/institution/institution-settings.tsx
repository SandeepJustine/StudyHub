'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Toast } from '@/components/ui/toast';
import {
  Settings,
  Building2,
  Users,
  Shield,
  Bell,
  Globe,
  Save,
  MapPin,
  Phone,
  Mail,
  Clock,
} from 'lucide-react';

interface InstitutionSettingsData {
  name: string;
  slug: string;
  address: {
    street?: string;
    city: string;
    district: string;
    country: string;
  };
  contactPhone: string;
  contactEmail: string;
  website: string;
  timezone: string;
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    weeklyReport: boolean;
    studentAlerts: boolean;
  };
}

interface InstitutionSettingsProps {
  settings: InstitutionSettingsData;
  tier: string;
  onSave: (settings: InstitutionSettingsData) => void;
}

export function InstitutionSettings({ settings, tier, onSave }: InstitutionSettingsProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState<InstitutionSettingsData>(settings);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSave = (section: string) => {
    onSave(formData);
    setToast({ message: `${section} settings saved successfully`, type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-navy">Institution Settings</h2>
        <p className="text-grey-dark mt-1">Manage your institution's configuration</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="border-b border-grey-light pb-0 flex-wrap">
          {[
            { id: 'general', label: 'General', icon: <Building2 size={16} /> },
            { id: 'contact', label: 'Contact', icon: <Phone size={16} /> },
            { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
            { id: 'security', label: 'Security', icon: <Shield size={16} /> },
          ].map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              <span className="flex items-center gap-2">
                {tab.icon}
                {tab.label}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="general" className="pt-6">
          <Card padding="lg">
            <h3 className="font-semibold text-navy mb-4">General Settings</h3>
            <div className="space-y-4">
              <Input
                label="Institution Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <Input
                label="Slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                helperText="Used for your institution's URL: studyhub.mw/school/{slug}"
              />
              <Input
                label="Website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-grey-dark">Timezone</label>
                <select
                  className="w-full px-4 py-3 border-2 border-grey-light rounded-lg"
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                >
                  <option value="Africa/Blantyre">Africa/Blantyre (CAT)</option>
                  <option value="Africa/Johannesburg">Africa/Johannesburg (SAST)</option>
                  <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                </select>
              </div>
              <Button variant="primary" leftIcon={<Save size={16} />} onClick={() => handleSave('General')}>
                Save General Settings
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="pt-6">
          <Card padding="lg">
            <h3 className="font-semibold text-navy mb-4">Contact Information</h3>
            <div className="space-y-4">
              <Input
                label="Street Address"
                value={formData.address.street || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, street: e.target.value }
                })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City"
                  value={formData.address.city}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, city: e.target.value }
                  })}
                />
                <Input
                  label="District"
                  value={formData.address.district}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, district: e.target.value }
                  })}
                />
              </div>
              <Input
                label="Contact Phone"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              />
              <Input
                label="Contact Email"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              />
              <Button variant="primary" leftIcon={<Save size={16} />} onClick={() => handleSave('Contact')}>
                Save Contact Settings
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="pt-6">
          <Card padding="lg">
            <h3 className="font-semibold text-navy mb-4">Notification Preferences</h3>
            <div className="space-y-4">
              {[
                { key: 'emailEnabled', label: 'Email Notifications', desc: 'Receive updates via email' },
                { key: 'smsEnabled', label: 'SMS Notifications', desc: 'Receive critical alerts via SMS' },
                { key: 'weeklyReport', label: 'Weekly Reports', desc: 'Get weekly student performance reports' },
                { key: 'studentAlerts', label: 'Student Alerts', desc: 'Get notified about at-risk students' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-grey-light/50 rounded-lg">
                  <div>
                    <p className="font-medium text-navy">{item.label}</p>
                    <p className="text-sm text-grey-medium">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(formData.notifications as any)[item.key]}
                      onChange={(e) => setFormData({
                        ...formData,
                        notifications: {
                          ...formData.notifications,
                          [item.key]: e.target.checked,
                        },
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-grey-light peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-green after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                  </label>
                </div>
              ))}
              <Button variant="primary" leftIcon={<Save size={16} />} onClick={() => handleSave('Notification')}>
                Save Notification Settings
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="pt-6">
          <Card padding="lg">
            <h3 className="font-semibold text-navy mb-4">Security Settings</h3>
            <div className="space-y-4">
              <div className="p-4 bg-navy/5 rounded-lg">
                <p className="text-sm text-navy">
                  <strong>API Access:</strong> {tier === 'INSTITUTION_GOLD' ? 'Enabled' : 'Available on Gold tier'}
                </p>
              </div>
              <div className="p-4 bg-navy/5 rounded-lg">
                <p className="text-sm text-navy">
                  <strong>Two-Factor Authentication:</strong> Recommended for all admin accounts
                </p>
              </div>
              <Button variant="outline">
                <Shield size={16} className="mr-2" /> Configure 2FA
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}