'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import { Plus, Edit, Trash2, FileText, Check, X, Palette, Type, Layout } from 'lucide-react';
import { CertificateTemplate, CertificateDesignConfig } from '@/types/certificates';

interface FormData {
  name: string;
  description: string;
  isDefault: boolean;
  isActive: boolean;
  designConfig: CertificateDesignConfig;
}

const DEFAULT_DESIGN_CONFIG: CertificateDesignConfig = {
  layout: 'landscape',
  borderStyle: 'double',
  borderWidth: 20,
  borderColor: '#1a1a2e',
  innerBorderColor: '#e94560',
  headerText: 'Certificate of Achievement',
  subheaderText: 'This is to certify that',
  footerText: 'Verify at: {{verificationUrl}}',
  showLogo: true,
  showSeal: true,
  showSignature: true,
  signatureLines: 2,
  primaryFont: 'Georgia, serif',
  secondaryFont: 'Arial, sans-serif',
  titleFontSize: 48,
  subtitleFontSize: 18,
  recipientFontSize: 36,
  descriptionFontSize: 16,
  courseTitleFontSize: 24,
  spacing: {
    headerMargin: 30,
    contentMargin: 40,
    footerMargin: 40,
  },
};

export default function AdminCertificateTemplates() {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CertificateTemplate | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    isDefault: false,
    isActive: true,
    designConfig: DEFAULT_DESIGN_CONFIG,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/certificates/templates');
      const result = await res.json();
      if (result.success) {
        setTemplates(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingTemplate ? `/api/certificates/templates/${editingTemplate.id}` : '/api/certificates/templates';
      const method = editingTemplate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save template');
      }

      setToast({ message: editingTemplate ? 'Template updated' : 'Template created', type: 'success' });
      setShowModal(false);
      setEditingTemplate(null);
      setFormData({ name: '', description: '', isDefault: false, isActive: true, designConfig: DEFAULT_DESIGN_CONFIG });
      fetchTemplates();
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    }
  };

  const handleEdit = (template: CertificateTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      isDefault: template.isDefault,
      isActive: template.isActive,
      designConfig: template.designConfig || DEFAULT_DESIGN_CONFIG,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const res = await fetch(`/api/certificates/templates/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete template');
      }

      setToast({ message: 'Template deleted', type: 'success' });
      fetchTemplates();
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    }
  };

  const updateDesignConfig = (key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      designConfig: {
        ...prev.designConfig,
        [key]: value,
      },
    }));
  };

  const updateSpacing = (key: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      designConfig: {
        ...prev.designConfig,
        spacing: {
          ...prev.designConfig.spacing,
          [key]: value,
        },
      },
    }));
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Certificate Templates</h1>
        <Button onClick={() => { setEditingTemplate(null); setFormData({ name: '', description: '', isDefault: false, isActive: true, designConfig: DEFAULT_DESIGN_CONFIG }); setShowModal(true); }}>
          <Plus size={16} className="mr-1" /> New Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-navy">{template.name}</h3>
                  <p className="text-sm text-grey-medium">{template.description}</p>
                </div>
                <div className="flex gap-1">
                  {template.isDefault && <Badge variant="success" size="sm">Default</Badge>}
                  {!template.isActive && <Badge variant="error" size="sm">Inactive</Badge>}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-grey-medium">By {template.createdByRole}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="xs" onClick={() => handleEdit(template)}>
                    <Edit size={14} />
                  </Button>
                  {!template.isDefault && (
                    <Button variant="ghost" size="xs" onClick={() => handleDelete(template.id)}>
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center">
            <FileText size={40} className="mx-auto text-grey-medium mb-3" />
            <h3 className="font-semibold text-navy">No Templates Yet</h3>
            <p className="text-sm text-grey-dark">Create your first certificate template to get started.</p>
          </CardContent>
        </Card>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingTemplate(null); }}
        title={editingTemplate ? 'Edit Template' : 'Create Template'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Template Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              />
              <span className="text-sm">Default Template</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <span className="text-sm">Active</span>
            </label>
          </div>

          <div className="border-t border-grey-light pt-4">
            <h3 className="text-sm font-medium text-navy mb-3 flex items-center gap-2">
              <Layout size={14} /> Design Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Layout</label>
                <select
                  value={formData.designConfig.layout || 'landscape'}
                  onChange={(e) => updateDesignConfig('layout', e.target.value)}
                  className="w-full px-3 py-2 border border-grey-light rounded-lg text-sm"
                >
                  <option value="landscape">Landscape</option>
                  <option value="portrait">Portrait</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Border Style</label>
                <select
                  value={formData.designConfig.borderStyle || 'double'}
                  onChange={(e) => updateDesignConfig('borderStyle', e.target.value)}
                  className="w-full px-3 py-2 border border-grey-light rounded-lg text-sm"
                >
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                  <option value="decorative">Decorative</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Border Width (px)</label>
                <Input
                  type="number"
                  value={formData.designConfig.borderWidth || 20}
                  onChange={(e) => updateDesignConfig('borderWidth', parseInt(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Border Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.designConfig.borderColor || '#1a1a2e'}
                    onChange={(e) => updateDesignConfig('borderColor', e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={formData.designConfig.borderColor || '#1a1a2e'}
                    onChange={(e) => updateDesignConfig('borderColor', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Accent Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.designConfig.innerBorderColor || '#e94560'}
                    onChange={(e) => updateDesignConfig('innerBorderColor', e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={formData.designConfig.innerBorderColor || '#e94560'}
                    onChange={(e) => updateDesignConfig('innerBorderColor', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Primary Font</label>
                <select
                  value={formData.designConfig.primaryFont || 'Georgia, serif'}
                  onChange={(e) => updateDesignConfig('primaryFont', e.target.value)}
                  className="w-full px-3 py-2 border border-grey-light rounded-lg text-sm"
                >
                  <option value="Georgia, serif">Georgia (Serif)</option>
                  <option value="Arial, sans-serif">Arial (Sans-serif)</option>
                  <option value="Times New Roman, serif">Times New Roman</option>
                  <option value="Courier New, monospace">Courier New</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Title Font Size (px)</label>
                <Input
                  type="number"
                  value={formData.designConfig.titleFontSize || 48}
                  onChange={(e) => updateDesignConfig('titleFontSize', parseInt(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Recipient Font Size (px)</label>
                <Input
                  type="number"
                  value={formData.designConfig.recipientFontSize || 36}
                  onChange={(e) => updateDesignConfig('recipientFontSize', parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" fullWidth onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary" fullWidth>Save Template</Button>
          </div>
        </form>
      </Modal>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
