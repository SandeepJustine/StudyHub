'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical, Upload, Link as LinkIcon, FileText, Video, Music, Presentation } from 'lucide-react';

const CONTENT_TYPES = [
  { type: 'VIDEO', label: 'Video', icon: <Video size={24} />, description: 'Upload or link to videos' },
  { type: 'AUDIO', label: 'Audio', icon: <Music size={24} />, description: 'Upload or link to audio' },
  { type: 'TEXT', label: 'Text', icon: <FileText size={24} />, description: 'Write rich text content' },
  { type: 'PDF', label: 'PDF', icon: <FileText size={24} />, description: 'Upload PDF documents' },
  { type: 'SLIDES', label: 'Slides', icon: <Presentation size={24} />, description: 'Upload presentations' },
  { type: 'LINK', label: 'Link', icon: <LinkIcon size={24} />, description: 'Add external resources' },
];

export default function NewCoursePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    subject: '',
    examBoard: '',
    grade: '',
    price: 0,
    thumbnail: null as File | null,
    tags: [] as string[],
  });
  const [modules, setModules] = useState<any[]>([]);
  const [currentModule, setCurrentModule] = useState<any>({
    title: '',
    contentType: 'VIDEO',
    contentUrl: '',
    contentFile: null,
    description: '',
    isPreview: false,
  });

  const addModule = () => {
    if (!currentModule.title) return;
    setModules([...modules, { ...currentModule, id: Date.now().toString(), order: modules.length + 1 }]);
    setCurrentModule({
      title: '',
      contentType: 'VIDEO',
      contentUrl: '',
      contentFile: null,
      description: '',
      isPreview: false,
    });
  };

  const removeModule = (id: string) => {
    setModules(modules.filter(m => m.id !== id));
  };

  const handleCreateCourse = async () => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', courseData.title);
      formData.append('description', courseData.description);
      formData.append('subject', courseData.subject);
      formData.append('price', courseData.price.toString());
      formData.append('modules', JSON.stringify(modules));
      if (courseData.thumbnail) {
        formData.append('thumbnail', courseData.thumbnail);
      }

      const response = await fetch('/api/courses', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        router.push('/instructor/courses');
      }
    } catch (error) {
      console.error('Failed to create course:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-4 mb-8">
        {['Course Details', 'Add Content', 'Pricing', 'Review'].map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step > i + 1 ? 'bg-green text-white' :
              step === i + 1 ? 'bg-navy text-white' :
              'bg-grey-light text-grey-medium'
            }`}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <span className={`text-sm ${step === i + 1 ? 'font-medium text-navy' : 'text-grey-medium'}`}>
              {s}
            </span>
            {i < 3 && <div className="w-8 h-0.5 bg-grey-light" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Course Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Course Title"
              placeholder="e.g., MSCE Mathematics Complete Course"
              value={courseData.title}
              onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
            />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-grey-dark">Description</label>
              <textarea
                className="w-full px-4 py-3 border-2 border-grey-light rounded-lg focus:border-navy focus:ring-2 focus:ring-navy/20 min-h-[120px]"
                placeholder="Describe your course..."
                value={courseData.description}
                onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-grey-dark">Subject</label>
                <select
                  className="w-full px-4 py-3 border-2 border-grey-light rounded-lg"
                  value={courseData.subject}
                  onChange={(e) => setCourseData({ ...courseData, subject: e.target.value })}
                >
                  <option value="">Select subject</option>
                  {['Mathematics', 'English', 'Physics', 'Biology', 'Chemistry'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-grey-dark">Exam Board</label>
                <select
                  className="w-full px-4 py-3 border-2 border-grey-light rounded-lg"
                  value={courseData.examBoard}
                  onChange={(e) => setCourseData({ ...courseData, examBoard: e.target.value })}
                >
                  <option value="">Select board</option>
                  {['MSCE', 'JCE', 'ICAM', 'TEVETA'].map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-grey-dark">Tags</label>
              <Input
                placeholder="Add tags (comma separated)"
                value={courseData.tags.join(', ')}
                onChange={(e) => setCourseData({ ...courseData, tags: e.target.value.split(',').map(t => t.trim()) })}
              />
            </div>
            <Button variant="primary" onClick={() => setStep(2)}>
              Continue to Content
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Module Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Module Title"
                placeholder="e.g., Introduction to Algebra"
                value={currentModule.title}
                onChange={(e) => setCurrentModule({ ...currentModule, title: e.target.value })}
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-grey-dark">Content Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {CONTENT_TYPES.map((ct) => (
                    <button
                      key={ct.type}
                      onClick={() => setCurrentModule({ ...currentModule, contentType: ct.type })}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        currentModule.contentType === ct.type
                          ? 'border-navy bg-navy/5'
                          : 'border-grey-light hover:border-navy/50'
                      }`}
                    >
                      <div className="flex justify-center mb-2 text-navy">{ct.icon}</div>
                      <p className="text-sm font-medium text-navy">{ct.label}</p>
                      <p className="text-xs text-grey-medium mt-1">{ct.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label="Content URL (or upload file)"
                placeholder="Paste YouTube link, audio URL, or upload file"
                value={currentModule.contentUrl}
                onChange={(e) => setCurrentModule({ ...currentModule, contentUrl: e.target.value })}
              />

              <div className="border-2 border-dashed border-grey-light rounded-lg p-8 text-center">
                <Upload size={32} className="mx-auto text-grey-medium mb-2" />
                <p className="text-sm text-grey-dark mb-2">Drag and drop your file here</p>
                <p className="text-xs text-grey-medium mb-4">or</p>
                <Button variant="outline" size="sm">Browse Files</Button>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={currentModule.isPreview}
                  onChange={(e) => setCurrentModule({ ...currentModule, isPreview: e.target.checked })}
                />
                <span className="text-sm text-grey-dark">Make this module available as preview</span>
              </label>

              <Button variant="secondary" onClick={addModule} leftIcon={<Plus size={16} />}>
                Add Module
              </Button>
            </CardContent>
          </Card>

          {/* Module List */}
          {modules.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Course Modules ({modules.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {modules.map((module, index) => (
                    <div key={module.id} className="flex items-center gap-3 p-4 bg-grey-light/50 rounded-lg">
                      <GripVertical size={20} className="text-grey-medium cursor-move" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-navy">{index + 1}. {module.title}</span>
                          <Badge size="sm">{module.contentType}</Badge>
                          {module.isPreview && <Badge variant="success" size="sm">Preview</Badge>}
                        </div>
                        {module.contentUrl && (
                          <p className="text-xs text-grey-medium mt-1 truncate">{module.contentUrl}</p>
                        )}
                      </div>
                      <button onClick={() => removeModule(module.id)} className="text-grey-medium hover:text-red">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button variant="primary" onClick={() => setStep(3)} disabled={modules.length === 0}>
              Continue to Pricing
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Course Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Price (MWK)"
              type="number"
              placeholder="Enter course price"
              value={courseData.price}
              onChange={(e) => setCourseData({ ...courseData, price: parseInt(e.target.value) || 0 })}
              helperText="Set 0 for free courses. Maximum MWK 50,000"
            />
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Revenue Share:</strong> You'll earn 70% of each sale (MWK {Math.floor(courseData.price * 0.7).toLocaleString()})
              </p>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button variant="primary" onClick={() => setStep(4)}>Review Course</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Publish</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-grey-light/50 rounded-lg p-4">
              <h3 className="font-semibold text-navy mb-2">{courseData.title}</h3>
              <p className="text-sm text-grey-dark">{courseData.description}</p>
              <div className="flex gap-2 mt-2">
                <Badge>{courseData.subject}</Badge>
                <Badge>{courseData.examBoard}</Badge>
                <Badge variant="success">{formatCurrency(courseData.price)}</Badge>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-navy mb-2">Modules ({modules.length})</h4>
              {modules.map((m, i) => (
                <div key={m.id} className="flex items-center gap-2 text-sm text-grey-dark py-1">
                  <span className="text-grey-medium">{i + 1}.</span>
                  <span>{m.title}</span>
                  <Badge size="sm">{m.contentType}</Badge>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
              <Button variant="primary" onClick={handleCreateCourse} loading={isLoading}>
                Publish Course
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}