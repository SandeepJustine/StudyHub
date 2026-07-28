'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toast } from '@/components/ui/toast';
import { User, Mail, Phone, Lock, Bell, Globe, Save, Loader2 } from 'lucide-react';

export default function StudentSettingsPage() {
  const { data: session, status } = useSession();
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [settings, setSettings] = useState({
    fullName: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    language: 'en',
  });

  // Update settings when session loads
  if (status === 'authenticated' && session?.user && !settings.fullName) {
    setSettings(prev => ({
      ...prev,
      fullName: session.user.name || '',
      email: session.user.email || '',
    }));
  }

  if (status === 'loading') {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-navy" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    redirect('/auth/login');
  }

  const handleSave = async (section: string) => {
    setIsSaving(true);
    try {
      // In production, save to API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setToast({ message: `${section} settings saved`, type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to save settings', type: 'error' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-navy/10 rounded-xl"><User size={22} className="text-navy" /></div>
        <div><h1 className="text-2xl font-bold text-navy">Settings</h1><p className="text-sm text-grey-medium">Manage your account</p></div>
      </div>

      {/* Profile */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><User size={16} />Profile Information</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input label="Full Name" value={settings.fullName} onChange={(e) => setSettings({...settings, fullName: e.target.value})} />
          <Input label="Email" value={settings.email} disabled />
          <Input label="Phone" placeholder="+265 888 000 000" value={settings.phone} onChange={(e) => setSettings({...settings, phone: e.target.value})} />
          <Button variant="primary" size="sm" onClick={() => handleSave('Profile')} disabled={isSaving}>
            {isSaving ? <Loader2 size={14} className="animate-spin mr-1" /> : <Save size={14} className="mr-1" />} Update Profile
          </Button>
        </CardContent>
      </Card>

      {/* Password */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Lock size={16} />Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input label="Current Password" type="password" value={settings.currentPassword} onChange={(e) => setSettings({...settings, currentPassword: e.target.value})} />
          <Input label="New Password" type="password" value={settings.newPassword} onChange={(e) => setSettings({...settings, newPassword: e.target.value})} />
          <Input label="Confirm New Password" type="password" value={settings.confirmPassword} onChange={(e) => setSettings({...settings, confirmPassword: e.target.value})} />
          <Button variant="primary" size="sm" onClick={() => handleSave('Password')} disabled={isSaving}>
            {isSaving ? <Loader2 size={14} className="animate-spin mr-1" /> : <Save size={14} className="mr-1" />} Change Password
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell size={16} />Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: 'Email Notifications', value: 'emailNotifications', checked: settings.emailNotifications },
            { label: 'SMS Notifications', value: 'smsNotifications', checked: settings.smsNotifications },
            { label: 'Push Notifications', value: 'pushNotifications', checked: settings.pushNotifications },
          ].map((n) => (
            <div key={n.value} className="flex items-center justify-between p-2 bg-grey-light/50 rounded-lg">
              <span className="text-sm">{n.label}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={n.checked} onChange={(e) => setSettings({...settings, [n.value]: e.target.checked})} className="sr-only peer" />
                <div className="w-9 h-5 bg-grey-light peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-green after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
              </label>
            </div>
          ))}
          <Button variant="primary" size="sm" onClick={() => handleSave('Notification')} disabled={isSaving}>
            {isSaving ? <Loader2 size={14} className="animate-spin mr-1" /> : <Save size={14} className="mr-1" />} Save Preferences
          </Button>
        </CardContent>
      </Card>

      {/* Language */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe size={16} />Language</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <select className="w-full px-3 py-2 border rounded-lg text-sm" value={settings.language} onChange={(e) => setSettings({...settings, language: e.target.value})}>
            <option value="en">English</option>
            <option value="ny">Chichewa</option>
          </select>
          <Button variant="primary" size="sm" onClick={() => handleSave('Language')} disabled={isSaving}>
            {isSaving ? <Loader2 size={14} className="animate-spin mr-1" /> : <Save size={14} className="mr-1" />} Save Language
          </Button>
        </CardContent>
      </Card>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}