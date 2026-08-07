'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';

interface CertificateBranding {
  id: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  fontFamily: string | null;
  logoUrl: string | null;
  sealUrl: string | null;
}

export default function InstitutionCertificateBranding({ institutionId }: { institutionId: string }) {
  const [branding, setBranding] = useState<CertificateBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [formData, setFormData] = useState({
    primaryColor: '#1a1a2e',
    secondaryColor: '#16213e',
    accentColor: '#e94560',
    fontFamily: 'serif',
    logoUrl: '',
    sealUrl: '',
  });

  useEffect(() => {
    fetchBranding();
  }, [institutionId]);

  const fetchBranding = async () => {
    try {
      const res = await fetch(`/api/certificates/branding?institutionId=${institutionId}`);
      const result = await res.json();
      if (result.success && result.data) {
        setBranding(result.data);
        setFormData({
          primaryColor: result.data.primaryColor || '#1a1a2e',
          secondaryColor: result.data.secondaryColor || '#16213e',
          accentColor: result.data.accentColor || '#e94560',
          fontFamily: result.data.fontFamily || 'serif',
          logoUrl: result.data.logoUrl || '',
          sealUrl: result.data.sealUrl || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch branding:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/certificates/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionId,
          ...formData,
          isActive: true,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save branding');
      }

      setToast({ message: 'Branding saved successfully', type: 'success' });
      fetchBranding();
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-navy">Certificate Branding</h1>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-2">Primary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <Input
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-2">Secondary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <Input
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-2">Accent Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.accentColor}
                  onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <Input
                  value={formData.accentColor}
                  onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-2">Font Family</label>
            <select
              value={formData.fontFamily}
              onChange={(e) => setFormData({ ...formData, fontFamily: e.target.value })}
              className="w-full px-3 py-2 border border-grey-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
            >
              <option value="serif">Serif</option>
              <option value="sans-serif">Sans Serif</option>
              <option value="monospace">Monospace</option>
              <option value="cursive">Cursive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-2">Logo URL</label>
            <Input
              value={formData.logoUrl}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-2">Seal URL</label>
            <Input
              value={formData.sealUrl}
              onChange={(e) => setFormData({ ...formData, sealUrl: e.target.value })}
              placeholder="https://example.com/seal.png"
            />
          </div>

          <Button variant="primary" onClick={handleSave} loading={saving} leftIcon={<Save size={16} />}>
            Save Branding
          </Button>
        </CardContent>
      </Card>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
