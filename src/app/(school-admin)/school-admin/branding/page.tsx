'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Upload, Palette, Eye, Save } from 'lucide-react';

export default function BrandingPage() {
  const [branding, setBranding] = useState({
    logo: null as File | null,
    logoPreview: '',
    primaryColor: '#0D1B3D',
    accentColor: '#E63946',
    customDomain: '',
    schoolName: 'Lilongwe Secondary School',
    tagline: 'Excellence in Education',
  });

  const [saved, setSaved] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBranding({
        ...branding,
        logo: file,
        logoPreview: URL.createObjectURL(file),
      });
    }
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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
          <Button variant="primary" leftIcon={<Save size={16} />} onClick={handleSave}>
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
                {branding.logoPreview ? (
                  <div className="space-y-4">
                    <img
                      src={branding.logoPreview}
                      alt="School logo"
                      className="h-20 mx-auto object-contain"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setBranding({ ...branding, logo: null, logoPreview: '' })}
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
                      <Button variant="outline" size="sm" as="span">
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
                      value={branding.primaryColor}
                      onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                      className="w-12 h-10 rounded border border-grey-light cursor-pointer"
                    />
                    <Input
                      value={branding.primaryColor}
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
                      value={branding.accentColor}
                      onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                      className="w-12 h-10 rounded border border-grey-light cursor-pointer"
                    />
                    <Input
                      value={branding.accentColor}
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
              value={branding.schoolName}
              onChange={(e) => setBranding({ ...branding, schoolName: e.target.value })}
            />

            <Input
              label="Tagline"
              value={branding.tagline}
              onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
            />

            <Input
              label="Custom Domain (Gold Tier)"
              placeholder="learn.yourschool.mw"
              value={branding.customDomain}
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
                style={{ backgroundColor: branding.primaryColor }}
              >
                <div className="flex items-center gap-3">
                  {branding.logoPreview && (
                    <img src={branding.logoPreview} alt="Logo" className="h-8" />
                  )}
                  <div>
                    <p className="font-semibold">{branding.schoolName}</p>
                    <p className="text-xs opacity-80">{branding.tagline}</p>
                  </div>
                </div>
              </div>

              {/* Preview Content */}
              <div className="p-6 space-y-4 bg-white">
                <div className="h-4 rounded w-3/4" style={{ backgroundColor: branding.primaryColor + '20' }} />
                <div className="h-4 rounded w-1/2" style={{ backgroundColor: branding.primaryColor + '20' }} />
                <div className="h-4 rounded w-2/3" style={{ backgroundColor: branding.primaryColor + '20' }} />
                
                <div className="flex gap-2 mt-4">
                  <button
                    className="px-4 py-2 rounded-lg text-white text-sm"
                    style={{ backgroundColor: branding.accentColor }}
                  >
                    Primary Button
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg text-sm border-2"
                    style={{ borderColor: branding.primaryColor, color: branding.primaryColor }}
                  >
                    Secondary Button
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}