'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Toast } from '@/components/ui/toast';
import {
  Building2, Phone, Mail, Globe, Save, CheckCircle, AlertCircle,
  Upload,
} from 'lucide-react';

interface CompanyProfile {
  companyName: string;
  industry: string | null;
  isVerified: boolean;
  logo: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
}

export default function CorporateSettingsPage() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/corporate/settings');
      const result = await response.json();
      if (response.ok && result.success) {
        setProfile(result.data);
      } else {
        setToast({ message: result.error || 'Failed to load profile', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to load profile', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const response = await fetch('/api/corporate/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: profile.companyName,
          industry: profile.industry,
          logo: profile.logo,
          contactName: profile.contactName,
          contactEmail: profile.contactEmail,
          contactPhone: profile.contactPhone,
        }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setToast({ message: 'Company profile saved successfully', type: 'success' });
        setProfile(prev => prev ? { ...prev, ...result.data } : null);
      } else {
        setToast({ message: result.error || 'Failed to save profile', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to save profile', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-grey-light/50 rounded animate-pulse w-48"></div>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-12 bg-grey-light/50 rounded animate-pulse"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <Building2 size={48} className="mx-auto text-grey-medium mb-4" />
        <p className="text-grey-dark">No company profile found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Company Settings</h1>
          <p className="text-grey-dark mt-1">Manage your company profile and preferences</p>
        </div>
        <Button variant="primary" leftIcon={<Save size={16} />} onClick={saveProfile} loading={isSaving}>
          Save Changes
        </Button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Verification Status */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {profile.isVerified ? (
              <>
                <CheckCircle size={20} className="text-green" />
                <p className="text-green font-medium">Your company is verified</p>
              </>
            ) : (
              <>
                <AlertCircle size={20} className="text-yellow-600" />
                <p className="text-yellow-800">
                  Your company is not yet verified. Verification may take 1-2 business days.
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="border-b border-grey-light pb-0 flex-wrap">
          <TabsTrigger value="general">
            <span className="flex items-center gap-2">
              <Building2 size={16} />
              General
            </span>
          </TabsTrigger>
          <TabsTrigger value="contact">
            <span className="flex items-center gap-2">
              <Phone size={16} />
              Contact
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="pt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>General Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Company Name"
                value={profile.companyName}
                onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
              />
              <Input
                label="Industry"
                value={profile.industry || ''}
                onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                helperText="e.g. Technology, Finance, Healthcare"
              />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-grey-dark">Logo URL</label>
                <div className="flex gap-2">
                  <Input
                    value={profile.logo || ''}
                    onChange={(e) => setProfile({ ...profile, logo: e.target.value || null })}
                    placeholder="https://example.com/logo.png"
                  />
                  <Button variant="outline" size="sm" leftIcon={<Upload size={16} />}>
                    Upload
                  </Button>
                </div>
              </div>
              {profile.logo && (
                <div className="mt-2">
                  <img
                    src={profile.logo}
                    alt="Company Logo"
                    className="h-16 object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="pt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Contact Person Name"
                value={profile.contactName}
                onChange={(e) => setProfile({ ...profile, contactName: e.target.value })}
              />
              <Input
                label="Contact Email"
                type="email"
                value={profile.contactEmail}
                onChange={(e) => setProfile({ ...profile, contactEmail: e.target.value })}
              />
              <Input
                label="Contact Phone"
                value={profile.contactPhone || ''}
                onChange={(e) => setProfile({ ...profile, contactPhone: e.target.value || null })}
                leftIcon={<Phone size={18} className="text-grey-medium" />}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
