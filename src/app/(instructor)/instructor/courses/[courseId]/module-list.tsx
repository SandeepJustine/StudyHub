'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import { BookOpen, Plus, Edit, Trash2, GripVertical } from 'lucide-react';

interface Module {
  id: string;
  title: string;
  description: string;
  contentType: string;
  contentUrl: string;
  contentData: any;
  duration: number;
  isPreview: boolean;
  order: number;
  quiz?: { id: string; title: string; questionsCount: number };
}

interface ModuleListProps {
  courseId: string;
  modules: Module[];
}

export function ModuleList({ courseId, modules }: ModuleListProps) {
  const [localModules, setLocalModules] = useState(modules);
  const [showModal, setShowModal] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    contentType: 'VIDEO',
    contentUrl: '',
    contentData: '',
    duration: 0,
    isPreview: false,
  });

  const openAddModal = () => {
    setFormData({
      title: '',
      description: '',
      contentType: 'VIDEO',
      contentUrl: '',
      contentData: '',
      duration: 0,
      isPreview: false,
    });
    setEditingModule(null);
    setShowModal(true);
  };

  const openEditModal = (module: Module) => {
    setFormData({
      title: module.title,
      description: module.description || '',
      contentType: module.contentType,
      contentUrl: module.contentUrl || '',
      contentData: module.contentData ? JSON.stringify(module.contentData) : '',
      duration: module.duration || 0,
      isPreview: module.isPreview,
    });
    setEditingModule(module);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setToast({ message: 'Module title is required', type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      let contentData = undefined;
      if (formData.contentData) {
        try {
          contentData = JSON.parse(formData.contentData);
        } catch {
          contentData = formData.contentData;
        }
      }

      const body: any = {
        courseId,
        title: formData.title,
        description: formData.description,
        contentType: formData.contentType,
        contentUrl: formData.contentUrl,
        contentData,
        duration: formData.duration,
        isPreview: formData.isPreview,
      };

      if (editingModule) {
        body.moduleId = editingModule.id;
      }

      const response = await fetch('/api/courses/modules', {
        method: editingModule ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (response.ok) {
        setToast({ message: editingModule ? 'Module updated' : 'Module added', type: 'success' });
        setShowModal(false);
        if (editingModule) {
          setLocalModules((prev) =>
            prev.map((m) => (m.id === editingModule.id ? { ...m, ...data.data } : m))
          );
        } else {
          setLocalModules((prev) => [...prev, data.data]);
        }
      } else {
        setToast({ message: data.error || 'Failed to save module', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to save module', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (moduleId: string) => {
    if (!confirm('Are you sure you want to delete this module?')) return;

    try {
      const response = await fetch(`/api/courses/modules?moduleId=${moduleId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (response.ok) {
        setToast({ message: 'Module deleted', type: 'success' });
        setLocalModules((prev) => prev.filter((m) => m.id !== moduleId));
      } else {
        setToast({ message: data.error || 'Failed to delete module', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to delete module', type: 'error' });
    }
  };

  return (
    <>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-navy">
              Modules ({localModules.length})
            </h2>
            <Button variant="outline" size="sm" onClick={openAddModal}>
              <Plus size={14} className="mr-1" /> Add Module
            </Button>
          </div>
          {localModules.length > 0 ? (
            <div className="space-y-3">
              {localModules.map((m, i) => (
                <div key={m.id} className="flex items-center gap-3 p-3 bg-grey-light/50 rounded-lg">
                  <GripVertical size={16} className="text-grey-medium cursor-move" />
                  <span className="text-sm font-medium text-navy w-6">{i + 1}.</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-navy">{m.title}</p>
                    {m.description && (
                      <p className="text-xs text-grey-medium">{m.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge size="sm">{m.contentType}</Badge>
                    {m.isPreview && <Badge variant="success" size="sm">Preview</Badge>}
                    {m.quiz && <Badge variant="info" size="sm">{m.quiz.questionsCount} Q</Badge>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(m)}>
                      <Edit size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(m.id)}>
                      <Trash2 size={14} className="text-red" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen size={32} className="mx-auto text-grey-medium mb-3" />
              <p className="text-sm text-grey-medium mb-4">No modules added yet.</p>
              <Button variant="primary" onClick={openAddModal}>
                Add Your First Module
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Module Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingModule ? 'Edit Module' : 'Add New Module'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Module Title *"
            placeholder="e.g., Introduction to Algebra"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-grey-dark mb-1.5">
              Description
            </label>
            <textarea
              className="w-full px-4 py-3 border-2 border-grey-light rounded-lg focus:border-navy min-h-[100px] text-sm"
              placeholder="Brief description of this module"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-grey-dark mb-1.5">
              Content Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['VIDEO', 'AUDIO', 'TEXT', 'PDF', 'SLIDES', 'LINK', 'EMBED', 'QUIZ'].map((ct) => (
                <button
                  key={ct}
                  onClick={() => setFormData({ ...formData, contentType: ct })}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    formData.contentType === ct
                      ? 'border-navy bg-navy/5'
                      : 'border-grey-light hover:border-navy/50'
                  }`}
                >
                  <p className="text-xs font-medium text-navy">{ct}</p>
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Content URL"
            placeholder="https://..."
            value={formData.contentUrl}
            onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
          />

          <Input
            label="Duration (minutes)"
            type="number"
            placeholder="0"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
          />

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isPreview}
              onChange={(e) => setFormData({ ...formData, isPreview: e.target.checked })}
            />
            <span className="text-sm text-grey-dark">Available as preview for non-enrolled students</span>
          </label>
        </div>

        <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-grey-light">
          <Button variant="outline" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={isLoading}>
            {editingModule ? 'Update Module' : 'Add Module'}
          </Button>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
