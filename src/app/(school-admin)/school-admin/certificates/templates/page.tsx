'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import { Plus, Edit, Trash2, FileText, Check, X, Palette, Type, Layout, Upload } from 'lucide-react';
import { CertificateTemplate, CertificateDesignConfig } from '@/types/certificates';
import { CertificateTemplateManager } from '@/components/features/certificate/CertificateTemplateManager';
import { TabContainer } from '@/components/shared/TabContainer';

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
  logoUrl: '',
  backgroundPattern: '',
  signatures: [],
};

export default function SchoolAdminCertificateTemplates() {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CertificateTemplate | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [uploading, setUploading] = useState(false);
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

  const handleFileUpload = async (file: File, type: 'logo' | 'background' | 'signature'): Promise<string> => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/upload/certificate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload file');
      }

      const data = await response.json();
      return data.url;
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to upload file', type: 'error' });
      throw error;
    } finally {
      setUploading(false);
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Certificate Templates</h1>
      </div>

      <TabContainer
        tabs={[
          { key: 'quick', label: 'Quick Manager', icon: <FileText size={16} /> },
          { key: 'advanced', label: 'Advanced Editor', icon: <Palette size={16} /> },
        ]}
        defaultTab="quick"
      >
        {(activeTab) => (
          <>
            {activeTab === 'quick' && (
              <CertificateTemplateManager userRole="SCHOOL_ADMIN" />
            )}
            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-navy">Advanced Template Editor</h2>
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
              </div>
            )}
          </>
        )}
      </TabContainer>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingTemplate(null); }}
        title={editingTemplate ? 'Edit Template' : 'Create Template'}
        size="xl"
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

          <div className="border-t border-grey-light pt-4 space-y-4">
            <h3 className="text-sm font-medium text-navy mb-3 flex items-center gap-2">
              Branding & Visuals
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Logo</label>
                <div className="flex gap-2">
                  <Input
                    value={formData.designConfig.logoUrl || ''}
                    onChange={(e) => updateDesignConfig('logoUrl', e.target.value)}
                    placeholder="https://example.com/logo.png or upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = async (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          const url = await handleFileUpload(file, 'logo');
                          updateDesignConfig('logoUrl', url);
                        }
                      };
                      input.click();
                    }}
                    disabled={uploading}
                  >
                    <Upload size={14} />
                  </Button>
                </div>
                {formData.designConfig.logoUrl && (
                  <img src={formData.designConfig.logoUrl} alt="Logo preview" className="mt-2 h-16 object-contain border rounded" />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Background Pattern / Watermark</label>
                <div className="flex gap-2">
                  <Input
                    value={formData.designConfig.backgroundPattern || ''}
                    onChange={(e) => updateDesignConfig('backgroundPattern', e.target.value)}
                    placeholder="https://example.com/pattern.png or upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = async (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          const url = await handleFileUpload(file, 'background');
                          updateDesignConfig('backgroundPattern', url);
                        }
                      };
                      input.click();
                    }}
                    disabled={uploading}
                  >
                    <Upload size={14} />
                  </Button>
                </div>
                {formData.designConfig.backgroundPattern && (
                  <img src={formData.designConfig.backgroundPattern} alt="Background preview" className="mt-2 h-16 object-contain border rounded" />
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-grey-light pt-4 space-y-4">
            <h3 className="text-sm font-medium text-navy mb-3 flex items-center gap-2">
              Signatures
            </h3>
            <div className="space-y-3">
              {(formData.designConfig.signatures || []).map((sig, idx) => (
                <div key={idx} className="border border-grey-light rounded-lg p-3 space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      label="Name"
                      value={sig.name}
                      onChange={(e) => {
                        const newSigs = [...(formData.designConfig.signatures || [])];
                        newSigs[idx] = { ...newSigs[idx], name: e.target.value };
                        updateDesignConfig('signatures', newSigs);
                      }}
                    />
                    <Input
                      label="Title"
                      value={sig.title}
                      onChange={(e) => {
                        const newSigs = [...(formData.designConfig.signatures || [])];
                        newSigs[idx] = { ...newSigs[idx], title: e.target.value };
                        updateDesignConfig('signatures', newSigs);
                      }}
                    />
                    <Input
                      label="Signature Image"
                      value={sig.imageUrl || ''}
                      onChange={(e) => {
                        const newSigs = [...(formData.designConfig.signatures || [])];
                        newSigs[idx] = { ...newSigs[idx], imageUrl: e.target.value };
                        updateDesignConfig('signatures', newSigs);
                      }}
                      placeholder="https://example.com/signature.png or upload"
                    />
                    <div>
                      <label className="block text-sm font-medium text-navy mb-1">Type</label>
                      <select
                        value={(sig.type || 'typed') as 'typed' | 'uploaded' | 'drawn'}
                        onChange={(e) => {
                          const newSigs = [...(formData.designConfig.signatures || [])];
                          newSigs[idx] = { ...newSigs[idx], type: e.target.value as 'typed' | 'uploaded' | 'drawn' };
                          updateDesignConfig('signatures', newSigs);
                        }}
                        className="w-full px-3 py-2 border border-grey-light rounded-lg text-sm"
                      >
                        <option value="typed">Typed</option>
                        <option value="uploaded">Uploaded Image</option>
                        <option value="drawn">Drawn / E-Signature</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = async (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              const url = await handleFileUpload(file, 'signature');
                              const newSigs = [...(formData.designConfig.signatures || [])];
                              newSigs[idx] = { ...newSigs[idx], imageUrl: url, type: 'uploaded' };
                              updateDesignConfig('signatures', newSigs);
                            }
                          };
                          input.click();
                        }}
                        disabled={uploading}
                      >
                        <Upload size={14} className="mr-1" /> Upload Signature Image
                      </Button>
                    </div>
                  </div>
                  {sig.type === 'drawn' && (
                    <div>
                      <label className="block text-sm font-medium text-navy mb-1">Drawn Signature Data (base64 or data URI)</label>
                      <textarea
                        value={sig.data || ''}
                        onChange={(e) => {
                          const newSigs = [...(formData.designConfig.signatures || [])];
                          newSigs[idx] = { ...newSigs[idx], data: e.target.value };
                          updateDesignConfig('signatures', newSigs);
                        }}
                        placeholder="data:image/png;base64,..."
                        className="w-full px-3 py-2 border border-grey-light rounded-lg text-sm"
                        rows={2}
                      />
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      const newSigs = formData.designConfig.signatures?.filter((_, i) => i !== idx) || [];
                      updateDesignConfig('signatures', newSigs);
                    }}
                  >
                    Remove Signature
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newSigs = [...(formData.designConfig.signatures || []), { name: '', title: '', type: 'typed' }];
                  updateDesignConfig('signatures', newSigs);
                }}
              >
                Add Signature
              </Button>
            </div>
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
