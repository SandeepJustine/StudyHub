'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Toast } from '@/components/ui/toast';
import { Upload, Palette, Eye, Save } from 'lucide-react';

interface BrandingData {
  logo: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  tagline: string | null;
  customDomain: string | null;
}

export default function BrandingPage() {
  const [branding, setBranding] = useState<BrandingData>({
    logo: null,
    primaryColor: '#0D1B3D',
    accentColor: '#E63946',
    tagline: '',
    customDomain: '',
  });
  const [schoolName, setSchoolName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchBranding = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/institutions/branding');
        const data = await res.json();
        if (data.success) {
          setBranding({
            logo: data.data.logo || null,
            primaryColor: data.data.primaryColor || '#0D1B3D',
            accentColor: data.data.accentColor || '#E63946',
            tagline: data.data.tagline || '',
            customDomain: data.data.customDomain || '',
          });
        } else if (data.error && data.error.includes('Silver')) {
          setToast({ message: data.error, type: 'error' });
        }
      } catch (error) {
        // Silently fail - may be Bronze tier
      } finally {
        setLoading(false);
      }

      // Also fetch institution name
      try {
        const res = await fetch('/api/institutions');
        const data = await res.json();
        if (data.success && data.data) {
          setSchoolName(data.data.name || '');
        }
      } catch (error) {
        // ignore
      }
    };
    fetchBranding();
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setBranding({ ...branding, logo: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/institutions/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logo: branding.logo,
          primaryColor: branding.primaryColor,
          accentColor: branding.accentColor,
          customDomain: branding.customDomain,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setToast({ message: 'Branding saved successfully!', type: 'success' });
        setTimeout(() => setSaved(false), 3000);
      } else {
        setToast({ message: data.error || 'Failed to save branding', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Failed to save branding', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">School Branding</h1>
          <p className="text-grey-dark mt-1">Customize your school's appearance on StudyHub</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="info">Silver Tier Feature</Badge>
          <Button variant="primary" leftIcon={<Save size={16} />} onClick={handleSave} loading={saving}>
            {saved ? 'Saved!' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branding Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-grey-dark mb-2">
                School Logo
              </label>
              <div className="border-2 border-dashed border-grey-light rounded-xl p-8 text-center">
                {branding.logo ? (
                  <div className="space-y-4">
                    <img src={branding.logo} alt="School logo" className="h-20 mx-auto object-contain" />
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => setBranding({ ...branding, logo: null })}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload size={32} className="mx-auto text-grey-medium mb-2" />
                    <p className="text-sm text-grey-dark mb-2">Upload your school logo</p>
                    <p className="text-xs text-grey-medium mb-4">PNG or SVG, max 2MB</p>
                    <label className="cursor-pointer">
                      <Button variant="outline" size="sm">
                        Choose File
                      </Button>
                      <input
                        type="file"
                        accept=".png,.svg"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* Colors */}
            <div>
              <label className="block text-sm font-medium text-grey-dark mb-2">
                <Palette size={16} className="inline mr-1" />
                Brand Colors
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-grey-medium mb-1 block">Primary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={branding.primaryColor || '#0D1B3D'}
                      onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                      className="w-12 h-10 rounded border border-grey-light cursor-pointer"
                    />
                    <Input
                      value={branding.primaryColor || '#0D1B3D'}
                      onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-grey-medium mb-1 block">Accent Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={branding.accentColor || '#E63946'}
                      onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                      className="w-12 h-10 rounded border border-grey-light cursor-pointer"
                    />
                    <Input
                      value={branding.accentColor || '#E63946'}
                      onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* School Info */}
            <Input
              label="School Display Name"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              disabled
              helperText="Name is set during institution registration"
            />

            <Input
              label="Tagline"
              value={branding.tagline || ''}
              onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
              placeholder="Excellence in Education"
            />

            <Input
              label="Custom Domain (Gold Tier)"
              placeholder="learn.yourschool.mw"
              value={branding.customDomain || ''}
              onChange={(e) => setBranding({ ...branding, customDomain: e.target.value })}
              helperText="Available on Gold tier only"
              disabled
            />
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye size={18} />
              Live Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-grey-light rounded-xl overflow-hidden">
              {/* Preview Header */}
              <div
                className="p-4 text-white"
                style={{ backgroundColor: branding.primaryColor || '#0D1B3D' }}
              >
                <div className="flex items-center gap-3">
                  {branding.logo && (
                    <img src={branding.logo} alt="Logo" className="h-8" />
                  )}
                  <div>
                    <p className="font-semibold">{schoolName || 'Your School'}</p>
                    <p className="text-xs opacity-80">{branding.tagline || 'Your tagline here'}</p>
                  </div>
                </div>
              </div>

              {/* Preview Content */}
              <div className="p-6 space-y-4 bg-white">
                <div className="h-4 rounded w-3/4" style={{ backgroundColor: (branding.primaryColor || '#0D1B3D') + '20' }} />
                <div className="h-4 rounded w-1/2" style={{ backgroundColor: (branding.primaryColor || '#0D1B3D') + '20' }} />
                <div className="h-4 rounded w-2/3" style={{ backgroundColor: (branding.primaryColor || '#0D1B3D') + '20' }} />

                <div className="flex gap-2 mt-4">
                  <button
                    className="px-4 py-2 rounded-lg text-white text-sm"
                    style={{ backgroundColor: branding.accentColor || '#E63946' }}
                  >
                    Primary Button
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg text-sm border-2"
                    style={{ borderColor: branding.primaryColor || '#0D1B3D', color: branding.primaryColor || '#0D1B3D' }}
                  >
                    Secondary Button
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
