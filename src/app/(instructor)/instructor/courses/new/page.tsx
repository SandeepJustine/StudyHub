'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Toast } from '@/components/ui/toast';
import { Plus, Trash2, GripVertical, Upload, Link as LinkIcon, FileText, Video, Music, Presentation, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

const CONTENT_TYPES = [
  { type: 'VIDEO', label: 'Video', icon: <Video size={24} />, description: 'Upload or link to videos' },
  { type: 'AUDIO', label: 'Audio', icon: <Music size={24} />, description: 'Upload or link to audio' },
  { type: 'TEXT', label: 'Text', icon: <FileText size={24} />, description: 'Write rich text content' },
  { type: 'PDF', label: 'PDF', icon: <FileText size={24} />, description: 'Upload PDF documents' },
  { type: 'SLIDES', label: 'Slides', icon: <Presentation size={24} />, description: 'Upload presentations' },
  { type: 'LINK', label: 'Link', icon: <LinkIcon size={24} />, description: 'Add external resources' },
];

const SUBJECTS = ['Mathematics', 'English', 'Physics', 'Biology', 'Chemistry', 'Geography', 'History', 'Agriculture', 'Computer Studies', 'Business Studies'];
const EXAM_BOARDS = ['MSCE', 'JCE', 'ICAM', 'TEVETA'];
const GRADES = ['Form 1', 'Form 2', 'Form 3', 'Form 4'];

export default function NewCoursePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    subject: '',
    examBoard: '',
    grade: '',
    price: 0,
    tags: [] as string[],
  });
  
  const [modules, setModules] = useState<any[]>([]);
  const [currentModule, setCurrentModule] = useState<any>({
    title: '',
    ContentType: 'VIDEO',
    contentUrl: '',
    description: '',
    isPreview: false,
  });

  const addModule = () => {
    if (!currentModule.title.trim()) {
      setToast({ message: 'Module title is required', type: 'error' });
      return;
    }
    setModules([...modules, { ...currentModule, id: Date.now().toString(), order: modules.length + 1 }]);
    setCurrentModule({ title: '', ContentType: 'VIDEO', contentUrl: '', description: '', isPreview: false });
  };

  const removeModule = (id: string) => {
    setModules(modules.filter(m => m.id !== id));
  };

  const handleCreateCourse = async () => {
    // Validate
    if (!courseData.title.trim()) {
      setError('Course title is required');
      setStep(1);
      return;
    }
    if (!courseData.subject) {
      setError('Subject is required');
      setStep(1);
      return;
    }
    if (modules.length === 0) {
      setError('At least one module is required');
      setStep(2);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: courseData.title,
          description: courseData.description,
          subject: courseData.subject,
          examBoard: courseData.examBoard || undefined,
          grade: courseData.grade || undefined,
          price: courseData.price,
          tags: courseData.tags,
          modules: modules.map((m, i) => ({
            title: m.title,
            description: m.description,
            ContentType: m.ContentType,
            contentUrl: m.contentUrl || '',
            duration: m.duration || 0,
            isPreview: m.isPreview || false,
            order: i + 1,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create course');
      }

      setToast({ message: 'Course created successfully!', type: 'success' });
      setTimeout(() => router.push('/instructor/courses'), 1500);
    } catch (err: any) {
      console.error('Failed to create course:', err);
      setError(err.message || 'Failed to create course');
      setToast({ message: err.message || 'Failed to create course', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const canProceedStep1 = courseData.title.trim() && courseData.subject;
  const canProceedStep2 = modules.length > 0;
  const canProceedStep3 = true;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-green-100 rounded-xl"><BookOpen size={22} className="text-green" /></div>
        <div><h1 className="text-2xl font-bold text-navy">Create New Course</h1><p className="text-sm text-grey-medium">Step {step} of 4</p></div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {['Details', 'Content', 'Pricing', 'Review'].map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step > i + 1 ? 'bg-green text-white' : step === i + 1 ? 'bg-navy text-white' : 'bg-grey-light text-grey-medium'
            }`}>
              {step > i + 1 ? <Check size={14} /> : i + 1}
            </div>
            <span className={`text-sm ${step === i + 1 ? 'font-medium text-navy' : 'text-grey-medium'}`}>{s}</span>
            {i < 3 && <div className="w-6 h-0.5 bg-grey-light" />}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{error}</div>
      )}

      {/* Step 1: Course Details */}
      {step === 1 && (
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Course Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input label="Course Title *" placeholder="e.g., MSCE Mathematics Complete Course" value={courseData.title} onChange={(e) => setCourseData({ ...courseData, title: e.target.value })} />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-grey-dark">Description</label>
              <textarea className="w-full px-4 py-3 border-2 border-grey-light rounded-lg focus:border-navy min-h-[120px] text-sm" placeholder="Describe your course..." value={courseData.description} onChange={(e) => setCourseData({ ...courseData, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-grey-dark">Subject *</label>
                <select className="w-full px-4 py-3 border-2 border-grey-light rounded-lg text-sm" value={courseData.subject} onChange={(e) => setCourseData({ ...courseData, subject: e.target.value })}>
                  <option value="">Select</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-grey-dark">Exam Board</label>
                <select className="w-full px-4 py-3 border-2 border-grey-light rounded-lg text-sm" value={courseData.examBoard} onChange={(e) => setCourseData({ ...courseData, examBoard: e.target.value })}>
                  <option value="">Select</option>
                  {EXAM_BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-grey-dark">Grade</label>
                <select className="w-full px-4 py-3 border-2 border-grey-light rounded-lg text-sm" value={courseData.grade} onChange={(e) => setCourseData({ ...courseData, grade: e.target.value })}>
                  <option value="">Select</option>
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <Button variant="primary" onClick={() => setStep(2)} disabled={!canProceedStep1} rightIcon={<ArrowRight size={14} />}>Continue</Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Add Content */}
      {step === 2 && (
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle>Add Module</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input label="Module Title *" placeholder="e.g., Introduction to Algebra" value={currentModule.title} onChange={(e) => setCurrentModule({ ...currentModule, title: e.target.value })} />
              <div className="space-y-2">
                <label className="block text-sm font-medium text-grey-dark">Content Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {CONTENT_TYPES.map((ct) => (
                    <button key={ct.type} onClick={() => setCurrentModule({ ...currentModule, ContentType: ct.type })}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${currentModule.ContentType === ct.type ? 'border-navy bg-navy/5' : 'border-grey-light hover:border-navy/50'}`}>
                      <div className="flex justify-center mb-1 text-navy">{ct.icon}</div>
                      <p className="text-xs font-medium text-navy">{ct.label}</p>
                    </button>
                  ))}
                </div>
              </div>
              <Input label="Content URL" placeholder="YouTube link, audio URL, etc." value={currentModule.contentUrl} onChange={(e) => setCurrentModule({ ...currentModule, contentUrl: e.target.value })} />
              <Input label="Description (optional)" placeholder="Brief description of this module" value={currentModule.description} onChange={(e) => setCurrentModule({ ...currentModule, description: e.target.value })} />
              <label className="flex items-center gap-2"><input type="checkbox" checked={currentModule.isPreview} onChange={(e) => setCurrentModule({ ...currentModule, isPreview: e.target.checked })} /><span className="text-sm text-grey-dark">Available as preview</span></label>
              <Button variant="secondary" onClick={addModule} leftIcon={<Plus size={14} />}>Add Module</Button>
            </CardContent>
          </Card>

          {modules.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle>Modules ({modules.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {modules.map((m, i) => (
                    <div key={m.id} className="flex items-center gap-3 p-3 bg-grey-light/50 rounded-lg">
                      <span className="text-sm font-medium text-navy w-6">{i + 1}.</span>
                      <div className="flex-1"><p className="text-sm font-medium text-navy">{m.title}</p><div className="flex items-center gap-2 mt-0.5"><Badge size="sm">{m.ContentType}</Badge>{m.isPreview && <Badge variant="success" size="sm">Preview</Badge>}</div></div>
                      <button onClick={() => removeModule(m.id)} className="text-grey-medium hover:text-red"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} leftIcon={<ArrowLeft size={14} />}>Back</Button>
            <Button variant="primary" onClick={() => setStep(3)} disabled={!canProceedStep2} rightIcon={<ArrowRight size={14} />}>Continue</Button>
          </div>
        </div>
      )}

      {/* Step 3: Pricing */}
      {step === 3 && (
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Course Pricing</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input label="Price (MWK)" type="number" placeholder="0 for free" value={courseData.price} onChange={(e) => setCourseData({ ...courseData, price: parseInt(e.target.value) || 0 })} helperText="Set 0 for free courses. Maximum MWK 50,000" />
            <div className="bg-blue-50 rounded-lg p-4"><p className="text-sm text-blue-800"><strong>Revenue Share:</strong> You'll earn 70% (MWK {Math.floor(courseData.price * 0.7).toLocaleString()}) per sale</p></div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} leftIcon={<ArrowLeft size={14} />}>Back</Button>
              <Button variant="primary" onClick={() => setStep(4)} rightIcon={<ArrowRight size={14} />}>Review</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Review & Publish</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-grey-light/50 rounded-lg p-4">
              <h3 className="font-semibold text-navy text-lg">{courseData.title || 'Untitled Course'}</h3>
              {courseData.description && <p className="text-sm text-grey-dark mt-1">{courseData.description}</p>}
              <div className="flex gap-2 mt-2">
                {courseData.subject && <Badge variant="info">{courseData.subject}</Badge>}
                {courseData.examBoard && <Badge variant="neutral">{courseData.examBoard}</Badge>}
                {courseData.grade && <Badge variant="neutral">{courseData.grade}</Badge>}
                <Badge variant="success">{courseData.price > 0 ? formatCurrency(courseData.price) : 'Free'}</Badge>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-navy mb-2">Modules ({modules.length})</h4>
              {modules.map((m, i) => (
                <div key={m.id} className="flex items-center gap-2 text-sm text-grey-dark py-1">
                  <span className="text-grey-medium w-6">{i + 1}.</span>
                  <span className="flex-1">{m.title}</span>
                  <Badge size="sm">{m.ContentType}</Badge>
                  {m.isPreview && <Badge variant="success" size="sm">Preview</Badge>}
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(3)} leftIcon={<ArrowLeft size={14} />}>Back</Button>
              <Button variant="primary" onClick={handleCreateCourse} loading={isLoading}>
                {isLoading ? 'Publishing...' : 'Publish Course'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// Missing BookOpen import
import { BookOpen } from 'lucide-react';