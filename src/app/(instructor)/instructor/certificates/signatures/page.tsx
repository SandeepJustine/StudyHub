'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import { Plus, Edit, Trash2, Upload } from 'lucide-react';

interface CertificateSignature {
  id: string;
  name: string;
  title: string;
  imageUrl: string;
  type: string;
  isActive: boolean;
}

export default function InstructorCertificateSignatures() {
  const [signatures, setSignatures] = useState<CertificateSignature[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSignature, setEditingSignature] = useState<CertificateSignature | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    imageUrl: '',
    type: 'INSTRUCTOR',
  });

  useEffect(() => {
    fetchSignatures();
  }, []);

  const fetchSignatures = async () => {
    try {
      const res = await fetch('/api/certificates/signatures?type=INSTRUCTOR');
      const result = await res.json();
      if (result.success) {
        setSignatures(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch signatures:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingSignature ? `/api/certificates/signatures/${editingSignature.id}` : '/api/certificates/signatures';
      const method = editingSignature ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save signature');
      }

      setToast({ message: editingSignature ? 'Signature updated' : 'Signature created', type: 'success' });
      setShowModal(false);
      setEditingSignature(null);
      setFormData({ name: '', title: '', imageUrl: '', type: 'INSTRUCTOR' });
      fetchSignatures();
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    }
  };

  const handleEdit = (signature: CertificateSignature) => {
    setEditingSignature(signature);
    setFormData({
      name: signature.name,
      title: signature.title,
      imageUrl: signature.imageUrl,
      type: signature.type,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this signature?')) return;

    try {
      const res = await fetch(`/api/certificates/signatures/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete signature');
      }

      setToast({ message: 'Signature deleted', type: 'success' });
      fetchSignatures();
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
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
        <h1 className="text-2xl font-bold text-navy">My Signatures</h1>
        <Button onClick={() => { setEditingSignature(null); setFormData({ name: '', title: '', imageUrl: '', type: 'INSTRUCTOR' }); setShowModal(true); }}>
          <Plus size={16} className="mr-1" /> Add Signature
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {signatures.map((signature) => (
          <Card key={signature.id} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <img
                    src={signature.imageUrl}
                    alt={signature.name}
                    className="w-16 h-16 object-contain bg-grey-light rounded-lg"
                  />
                  <div>
                    <h3 className="font-semibold text-navy">{signature.name}</h3>
                    <p className="text-sm text-grey-medium">{signature.title}</p>
                  </div>
                </div>
                {!signature.isActive && <Badge variant="error" size="sm">Inactive</Badge>}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="xs" onClick={() => handleEdit(signature)}>
                  <Edit size={14} />
                </Button>
                <Button variant="ghost" size="xs" onClick={() => handleDelete(signature.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {signatures.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center">
            <Upload size={40} className="mx-auto text-grey-medium mb-3" />
            <h3 className="font-semibold text-navy">No Signatures Yet</h3>
            <p className="text-sm text-grey-dark">Add your signature to issue certificates.</p>
          </CardContent>
        </Card>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingSignature(null); }}
        title={editingSignature ? 'Edit Signature' : 'Add Signature'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Title / Position"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <Input
            label="Signature Image URL"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            placeholder="https://example.com/signature.png"
            required
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline" fullWidth onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary" fullWidth>Save</Button>
          </div>
        </form>
      </Modal>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
