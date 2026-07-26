'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Palette, Eye, Save, X } from 'lucide-react';

interface BrandingData {
  logo?: string;
  primaryColor: string;
  accentColor: string;
  schoolName: string;
  tagline: string;
  customDomain?: string;
}

interface SchoolBrandingProps {
  branding: BrandingData;
  onSave: (branding: BrandingData) => void;
  tier: string;
}

export function SchoolBranding({ branding, onSave, tier }: SchoolBrandingProps) {
  const [formData, setFormData] = useState<BrandingData>(branding);
  const [logoPreview, setLogoPreview] = useState<string | null>(branding.logo || null);
  const [isSaved, setIsSaved] = useState(false);

  const isGold = tier === 'INSTITUTION_GOLD';
  const isSilverOrAbove = ['INSTITUTION_SILVER', 'INSTITUTION_GOLD'].includes(tier);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
      setFormData({ ...formData, logo: url });
    }
  };

  const handleSave = () => {
    onSave(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  if (!isSilverOrAbove) {
    return (
      <Card padding="lg" className="text-center">
        <Palette size={48} className="mx-auto text-grey-medium mb-4" />
        <h3 className="text-lg font-semibold text-navy mb-2">Branding Not Available</h3>
        <p className="text-grey-dark mb-4">
          Custom branding is available on Silver and Gold tiers.
        </p>
        <Badge variant="warning">Upgrade to unlock</Badge>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Settings */}
      <Card padding="lg">
        <h3 className="font-semibold text-navy mb-6">Brand Settings</h3>
        <div className="space-y-6">
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-grey-dark mb-2">School Logo</label>
            <div className="border-2 border-dashed border-grey-light rounded-xl p-6 text-center">
              {logoPreview ? (
                <div className="space-y-3">
                  <img src={logoPreview} alt="Logo preview" className="h-16 mx-auto object-contain" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setLogoPreview(null);
                      setFormData({ ...formData, logo: undefined });
                    }}
                  >
                    <X size={14} className="mr-1" /> Remove
                  </Button>
                </div>
              ) : (
                <div>
                  <Upload size={32} className="mx-auto text-grey-medium mb-2" />
                  <p className="text-sm text-grey-dark mb-1">Upload logo</p>
                  <p className="text-xs text-grey-medium mb-3">PNG or SVG, max 2MB</p>
                  <label className="cursor-pointer">
                    <Button variant="outline" size="sm" as="span">Choose File</Button>
                    <input type="file" accept=".png,.svg" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Colors */}
          <div>
            <label className="block text-sm font-medium text-grey-dark mb-2">Brand Colors</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-grey-medium mb-1 block">Primary</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <Input value={formData.primaryColor} onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-grey-medium mb-1 block">Accent</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.accentColor}
                    onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <Input value={formData.accentColor} onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })} />
                </div>
              </div>
            </div>
          </div>

          <Input
            label="School Display Name"
            value={formData.schoolName}
            onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
          />

          <Input
            label="Tagline"
            value={formData.tagline}
            onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
          />

          <Input
            label="Custom Domain"
            placeholder="learn.yourschool.mw"
            value={formData.customDomain || ''}
            onChange={(e) => setFormData({ ...formData, customDomain: e.target.value })}
            disabled={!isGold}
            helperText={isGold ? 'Enter your custom domain' : 'Available on Gold tier only'}
          />

          <Button variant="primary" leftIcon={<Save size={16} />} onClick={handleSave} fullWidth>
            {isSaved ? 'Saved!' : 'Save Changes'}
          </Button>
        </div>
      </Card>

      {/* Preview */}
      <Card padding="lg">
        <h3 className="font-semibold text-navy mb-6 flex items-center gap-2">
          <Eye size={18} /> Preview
        </h3>
        <div className="border-2 border-grey-light rounded-xl overflow-hidden">
          <div className="p-4 text-white" style={{ backgroundColor: formData.primaryColor }}>
            <div className="flex items-center gap-3">
              {logoPreview && <img src={logoPreview} alt="Logo" className="h-8" />}
              <div>
                <p className="font-semibold">{formData.schoolName || 'School Name'}</p>
                <p className="text-xs opacity-80">{formData.tagline || 'Tagline'}</p>
              </div>
            </div>
          </div>
          <div className="p-6 bg-white space-y-3">
            <div className="h-3 rounded w-3/4" style={{ backgroundColor: formData.primaryColor + '30' }} />
            <div className="h-3 rounded w-1/2" style={{ backgroundColor: formData.primaryColor + '20' }} />
            <div className="flex gap-2 mt-4">
              <button className="px-4 py-2 rounded-lg text-white text-sm" style={{ backgroundColor: formData.accentColor }}>
                Primary Button
              </button>
              <button className="px-4 py-2 rounded-lg text-sm border-2" style={{ borderColor: formData.primaryColor, color: formData.primaryColor }}>
                Secondary Button
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}