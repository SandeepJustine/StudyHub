'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import {
  Plus, Trash2, Edit, Save, ArrowLeft, Video, Music, FileText,
  Presentation, Link as LinkIcon, Upload, GripVertical, Play,
  CheckCircle, Clock, AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

const CONTENT_TYPES = [
  { type: 'VIDEO', label: 'Video', icon: <Video size={20} /> },
  { type: 'AUDIO', label: 'Audio', icon: <Music size={20} /> },
  { type: 'TEXT', label: 'Text', icon: <FileText size={20} /> },
  { type: 'PDF', label: 'PDF', icon: <FileText size={20} /> },
  { type: 'SLIDES', label: 'Slides', icon: <Presentation size={20} /> },
  { type: 'LINK', label: 'Link', icon: <LinkIcon size={20} /> },
  { type: 'EMBED', label: 'Embed', icon: <LinkIcon size={20} /> },
  { type: 'QUIZ', label: 'Quiz', icon: <FileText size={20} /> },
];

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

export default function CourseBuilderPage({ params }: { params: Promise<{ courseId: string }> }) {
  const router = useRouter();
  const [courseId, setCourseId] = useState<string>('');
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state for new/editing module
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    contentType: 'VIDEO',
    contentUrl: '',
    contentData: '',
    duration: 0,
    isPreview: false,
  });

  useEffect(() => {
    params.then(p => setCourseId(p.courseId));
  }, [params]);

  useEffect(() => {
    if (courseId) {
      loadModules();
    }
  }, [courseId]);

  async function loadModules() {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/courses/modules?courseId=${courseId}`);
      const data = await response.json();
      if (response.ok) {
        setModules(data.data || []);
      } else {
        setError(data.error || 'Failed to load modules');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load modules');
    } finally {
      setIsLoading(false);
    }
  }

  const resetForm = () => {
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
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
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
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setToast({ message: 'Module title is required', type: 'error' });
      return;
    }

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
        setShowAddModal(false);
        loadModules();
      } else {
        setToast({ message: data.error || 'Failed to save module', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to save module', type: 'error' });
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
        setModules(modules.filter(m => m.id !== moduleId));
      } else {
        setToast({ message: data.error || 'Failed to delete module', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to delete module', type: 'error' });
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('type', 'VIDEO');

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });
      const data = await response.json();
      if (response.ok) {
        setFormData({ ...formData, contentUrl: data.data.url });
        setToast({ message: 'File uploaded successfully', type: 'success' });
      } else {
        setToast({ message: data.error || 'Upload failed', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Upload failed', type: 'error' });
    }
  };

  const moveModule = (fromIndex: number, toIndex: number) => {
    const newModules = [...modules];
    const [moved] = newModules.splice(fromIndex, 1);
    newModules.splice(toIndex, 0, moved);
    setModules(newModules);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/instructor/courses/${courseId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft size={16} className="mr-1" />
            Back to Course
          </Button>
        </Link>
        <div className="p-2.5 bg-green-100 rounded-xl">
          <Plus size={22} className="text-green" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy">Course Builder</h1>
          <p className="text-sm text-grey-medium">Add, edit, and organize your course modules</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Add Module Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-navy">Modules ({modules.length})</h2>
        <Button variant="primary" onClick={openAddModal}>
          <Plus size={16} className="mr-2" />
          Add Module
        </Button>
      </div>

      {/* Modules List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="animate-pulse h-16 bg-grey-light/50 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : modules.length === 0 ? (
        <Card className="border-0 shadow-sm text-center py-12">
          <CardContent>
            <Plus size={48} className="mx-auto text-grey-medium mb-4" />
            <h3 className="text-lg font-semibold text-navy mb-2">No modules yet</h3>
            <p className="text-grey-medium mb-4">Add your first module to start building your course content.</p>
            <Button variant="primary" onClick={openAddModal}>
              Add First Module
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {modules.map((module, index) => (
            <Card key={module.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <GripVertical size={16} className="text-grey-medium cursor-move" />

                  <span className="text-sm font-medium text-navy w-6">{index + 1}.</span>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-navy">{module.title}</h3>
                      <Badge size="sm">{module.contentType}</Badge>
                      {module.isPreview && <Badge variant="success" size="sm">Preview</Badge>}
                      {module.quiz && (
                        <Badge variant="info" size="sm">
                          {module.quiz.questionsCount} Q's
                        </Badge>
                      )}
                    </div>
                    {module.description && (
                      <p className="text-sm text-grey-medium line-clamp-1">{module.description}</p>
                    )}
                    {module.duration > 0 && (
                      <p className="text-xs text-grey-light mt-1">
                        <Clock size={12} className="inline mr-1" />
                        {module.duration} min
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {module.contentType === 'QUIZ' && (
                      <Link href={`/instructor/courses/${courseId}/modules/${module.id}/quiz`}>
                        <Button variant="outline" size="sm">
                          <Edit size={14} />
                        </Button>
                      </Link>
                    )}
                    <Button variant="outline" size="sm" onClick={() => openEditModal(module)}>
                      <Edit size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(module.id)}>
                      <Trash2 size={14} className="text-red" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Module Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
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
              {CONTENT_TYPES.map((ct) => (
                <button
                  key={ct.type}
                  onClick={() => setFormData({ ...formData, contentType: ct.type })}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    formData.contentType === ct.type
                      ? 'border-navy bg-navy/5'
                      : 'border-grey-light hover:border-navy/50'
                  }`}
                >
                  <div className="flex justify-center mb-1 text-navy">{ct.icon}</div>
                  <p className="text-xs font-medium text-navy">{ct.label}</p>
                </button>
              ))}
            </div>
          </div>

          {formData.contentType === 'VIDEO' && (
            <div className="space-y-3">
              <Input
                label="Video URL or Upload"
                placeholder="YouTube/Vimeo link or upload a video file"
                value={formData.contentUrl}
                onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
              />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-grey-dark cursor-pointer">
                  <Upload size={16} />
                  Upload Video File
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleUpload}
                  />
                </label>
              </div>
            </div>
          )}

          {formData.contentType === 'AUDIO' && (
            <Input
              label="Audio URL or Upload"
              placeholder="SoundCloud/Spotify link or upload audio file"
              value={formData.contentUrl}
              onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
            />
          )}

          {formData.contentType === 'TEXT' && (
            <div>
              <label className="block text-sm font-medium text-grey-dark mb-1.5">
                Text Content
              </label>
              <textarea
                className="w-full px-4 py-3 border-2 border-grey-light rounded-lg focus:border-navy min-h-[200px] text-sm"
                placeholder="Write your lesson content here..."
                value={formData.contentData}
                onChange={(e) => setFormData({ ...formData, contentData: e.target.value })}
              />
            </div>
          )}

          {formData.contentType === 'PDF' && (
            <Input
              label="PDF URL"
              placeholder="Upload or link to a PDF file"
              value={formData.contentUrl}
              onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
            />
          )}

          {formData.contentType === 'SLIDES' && (
            <div className="space-y-3">
              <Input
                label="Slides URL (Google Slides, Canva, etc.)"
                placeholder="https://docs.google.com/presentation/..."
                value={formData.contentUrl}
                onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
              />
              <Input
                label="Embed Code (optional)"
                placeholder="<iframe>...</iframe>"
                value={formData.contentData}
                onChange={(e) => setFormData({ ...formData, contentData: e.target.value })}
              />
            </div>
          )}

          {formData.contentType === 'LINK' && (
            <Input
              label="Link URL"
              placeholder="https://..."
              value={formData.contentUrl}
              onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
            />
          )}

          {formData.contentType === 'EMBED' && (
            <Input
              label="Embed Code"
              placeholder="<iframe>...</iframe>"
              value={formData.contentData}
              onChange={(e) => setFormData({ ...formData, contentData: e.target.value })}
            />
          )}

          {formData.contentType === 'QUIZ' && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 mb-2">
                Quiz modules are configured separately. This will create a placeholder module.
              </p>
              <p className="text-xs text-blue-700">
                After saving, click the edit button to configure quiz questions.
              </p>
            </div>
          )}

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
          <Button variant="outline" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {editingModule ? 'Update Module' : 'Add Module'}
          </Button>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
