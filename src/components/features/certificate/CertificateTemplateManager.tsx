'use client';

import { useState, useEffect } from 'react';
import { CertificateTemplate, CertificateDesignConfig } from '@/types/certificates';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import { PlusCircle, Edit, Trash, Eye, Loader2, AlertTriangle, Palette, Layout, Plus, Trash2, Upload } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface CertificateTemplateManagerProps {
  userRole: 'SCHOOL_ADMIN' | 'INSTRUCTOR' | 'PLATFORM_ADMIN';
  institutionId?: string;
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

interface FormData {
  name: string;
  description: string;
  isDefault: boolean;
  isActive: boolean;
  designConfig: CertificateDesignConfig;
}

export function CertificateTemplateManager({ userRole, institutionId }: CertificateTemplateManagerProps) {
  const { data: session } = useSession();
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CertificateTemplate | null>(null);
  const [submitting, setSubmitting] = useState(false);
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
  }, [session, userRole, institutionId]);

  const fetchTemplates = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (institutionId) {
        queryParams.append('institutionId', institutionId);
      }
      if (userRole === 'INSTRUCTOR') {
        queryParams.append('createdByRole', 'INSTRUCTOR');
      }

      const response = await fetch(`/api/certificates/templates?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch templates.');
      }
      const data = await response.json();
      setTemplates(data.data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      description: '',
      isDefault: false,
      isActive: true,
      designConfig: DEFAULT_DESIGN_CONFIG,
    });
    setShowModal(true);
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
    if (!confirm('Are you sure you want to delete this template? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/certificates/templates/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete template.');
      }

      setTemplates(templates.filter((t) => t.id !== id));
      setToast({ message: 'Template deleted successfully', type: 'success' });
    } catch (err: any) {
      setError(err.message);
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handlePreview = (template: CertificateTemplate) => {
    window.open(`/api/certificates/templates/${template.id}/preview`, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingTemplate ? `/api/certificates/templates/${editingTemplate.id}` : '/api/certificates/templates';
      const method = editingTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${editingTemplate ? 'update' : 'create'} template.`);
      }

      const data = await response.json();
      setToast({ message: editingTemplate ? 'Template updated successfully' : 'Template created successfully', type: 'success' });
      setShowModal(false);
      fetchTemplates();
    } catch (err: any) {
      setError(err.message);
      setToast({ message: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
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

  const updateDesignConfig = (key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      designConfig: {
        ...prev.designConfig,
        [key]: value,
      },
    }));
  };

  const canManageTemplates = userRole === 'PLATFORM_ADMIN' || userRole === 'SCHOOL_ADMIN' || userRole === 'INSTRUCTOR';

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-navy" />
        <span className="ml-4 text-lg">Loading Templates...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card padding="lg" className="bg-red-50 border-red-200">
        <div className="flex items-center">
          <AlertTriangle className="h-6 w-6 text-red-600 mr-4" />
          <div>
            <h3 className="font-bold text-red-800">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-navy">Certificate Templates</h2>
          <p className="text-grey-dark">Manage templates for your certificates.</p>
        </div>
        {canManageTemplates && (
          <Button onClick={handleCreate} leftIcon={<PlusCircle size={18} />}>
            Create Template
          </Button>
        )}
      </div>

      {templates.length === 0 ? (
        <Card padding="lg" className="text-center">
          <h3 className="text-lg font-medium">No Templates Found</h3>
          <p className="text-grey-dark mt-2 mb-4">Get started by creating your first certificate template.</p>
          {canManageTemplates && (
            <Button onClick={handleCreate} variant="outline">
              Create Your First Template
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} padding="lg" className="flex flex-col">
              <div className="flex-grow">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold text-navy pr-2">{template.name}</h3>
                  <div className="flex gap-1">
                    {template.isDefault && (
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                    {!template.isActive && (
                      <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-grey-dark mt-2 h-10 overflow-hidden">
                  {template.description || 'No description provided.'}
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-grey-medium">
                  <Palette size={12} />
                  <span>{template.designConfig?.layout || 'landscape'}</span>
                  <span>•</span>
                  <span>{template.createdByRole}</span>
                </div>
              </div>

              <div className="mt-6 border-t border-grey-light pt-4 flex items-center justify-between space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePreview(template)}
                  title="Preview"
                >
                  <Eye size={16} />
                </Button>
                <div className="flex-grow" />
                {canManageTemplates && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(template)}
                      title="Edit"
                      disabled={template.isDefault}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                      title="Delete"
                      disabled={template.isDefault}
                    >
                      <Trash size={16} />
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
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
              <Palette size={14} /> Design Configuration
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
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" fullWidth onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" fullWidth loading={submitting}>
              {editingTemplate ? 'Update' : 'Create'} Template
            </Button>
          </div>
        </form>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
