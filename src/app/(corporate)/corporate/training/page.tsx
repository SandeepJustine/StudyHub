'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import {
  Plus, Users, Calendar, DollarSign, BookOpen, Loader2, MapPin,
  Clock, Award, Monitor, Video, Building2, ChevronRight, Link2, QrCode,
  Copy, Check,
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import type {
  CorporateTrainingPackage,
  TrainingCategory,
  TrainingMode,
  TrainingLevel,
  TrainingStatus,
  TrainingModule,
} from '@/hooks/types/corporate';

const CATEGORIES: TrainingCategory[] = [
  'EXCEL', 'LEADERSHIP', 'CYBERSECURITY', 'DATA_ANALYSIS',
  'PROJECT_MANAGEMENT', 'COMMUNICATION', 'FINANCE', 'MARKETING',
  'HR_MANAGEMENT', 'CUSTOMER_SERVICE', 'SALES', 'CODING',
  'DESIGN', 'COMPLIANCE', 'OTHER',
];

const MODES: { value: TrainingMode; label: string; icon: any }[] = [
  { value: 'ONLINE', label: 'Online', icon: Monitor },
  { value: 'IN_PERSON', label: 'In-Person', icon: Building2 },
  { value: 'HYBRID', label: 'Hybrid', icon: Video },
];

const LEVELS: { value: TrainingLevel; label: string }[] = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
  { value: 'ALL_LEVELS', label: 'All Levels' },
];

const ONLINE_PLATFORMS: { value: 'ZOOM' | 'GOOGLE_MEET' | 'TEAMS' | 'STUDYHUB'; label: string; placeholder: string }[] = [
  { value: 'ZOOM', label: 'Zoom', placeholder: 'https://zoom.us/j/XXXXXXXXXX' },
  { value: 'GOOGLE_MEET', label: 'Google Meet', placeholder: 'https://meet.google.com/xxx-xxxx-xxx' },
  { value: 'TEAMS', label: 'Microsoft Teams', placeholder: 'https://teams.microsoft.com/l/meetup-join/...' },
  { value: 'STUDYHUB', label: 'StudyHub Meet', placeholder: 'https://meet.studyhubmw.com/...' },
];

function generateQRCodeUrl(data: string, size = 200): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
}

function QRCodeDisplay({ url, title }: { url: string; title?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!url) return null;

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-grey-light/30 rounded-lg">
      {title && <p className="text-sm font-medium text-navy">{title}</p>}
      <img
        src={generateQRCodeUrl(url, 180)}
        alt="Meeting QR Code"
        className="w-[180px] h-[180px] border border-grey-light rounded-lg"
      />
      <div className="flex items-center gap-2 w-full">
        <input
          type="text"
          value={url}
          readOnly
          className="flex-1 px-3 py-1.5 text-xs border border-grey-light rounded bg-white truncate"
        />
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? <Check size={14} className="text-green" /> : <Copy size={14} />}
        </Button>
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<TrainingStatus, string> = {
  DRAFT: 'neutral',
  PENDING_APPROVAL: 'warning',
  ACTIVE: 'success',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  CANCELLED: 'error',
  ARCHIVED: 'neutral',
};

export default function TrainingPage() {
  const [showBuilder, setShowBuilder] = useState(false);
  const [step, setStep] = useState(1);
  const [packages, setPackages] = useState<CorporateTrainingPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [statusFilter, setStatusFilter] = useState<TrainingStatus | ''>('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'OTHER' as TrainingCategory,
    mode: 'ONLINE' as TrainingMode,
    level: 'ALL_LEVELS' as TrainingLevel,
    pricePerParticipant: 0,
    minimumParticipants: 1,
    maximumParticipants: 50,
    currency: 'MWK',
    startDate: '',
    endDate: '',
    durationDays: 1,
    schedule: { days: [] as string[], time: '', timezone: 'Africa/Blantyre' },
    curriculum: [] as TrainingModule[],
    prerequisites: [] as string[],
    learningOutcomes: [] as string[],
    materialsProvided: [] as string[],
    certificationIncluded: false,
    instructorName: '',
    instructorBio: '',
    location: { venue: '', address: '', city: '', country: 'Malawi', capacity: 50 },
    onlinePlatform: 'STUDYHUB' as 'ZOOM' | 'GOOGLE_MEET' | 'TEAMS' | 'STUDYHUB',
    meetingLink: '',
    requirements: { minEducation: '', minExperience: '', requiredSkills: [] as string[] },
  });

  useEffect(() => {
    loadPackages();
  }, [statusFilter]);

  const loadPackages = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);

      const response = await fetch(`/api/corporate/training?${params.toString()}`);
      const result = await response.json();
      if (response.ok && result.success) {
        setPackages(result.data || []);
      } else {
        setToast({ message: result.error || 'Failed to load packages', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to load packages', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePackage = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/corporate/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
          totalBudget: formData.pricePerParticipant * formData.maximumParticipants,
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setToast({ message: 'Training package created successfully!', type: 'success' });
        setShowBuilder(false);
        setStep(1);
        resetForm();
        loadPackages();
      } else {
        setToast({ message: result.error || 'Failed to create package', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to create package', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'OTHER',
      mode: 'ONLINE',
      level: 'ALL_LEVELS',
      pricePerParticipant: 0,
      minimumParticipants: 1,
      maximumParticipants: 50,
      currency: 'MWK',
      startDate: '',
      endDate: '',
      durationDays: 1,
      schedule: { days: [], time: '', timezone: 'Africa/Blantyre' },
      curriculum: [],
      prerequisites: [],
      learningOutcomes: [],
      materialsProvided: [],
      certificationIncluded: false,
      instructorName: '',
      instructorBio: '',
      location: { venue: '', address: '', city: '', country: 'Malawi', capacity: 50 },
      onlinePlatform: 'STUDYHUB',
      meetingLink: '',
      requirements: { minEducation: '', minExperience: '', requiredSkills: [] },
    });
  };

  const addModule = () => {
    setFormData({
      ...formData,
      curriculum: [
        ...formData.curriculum,
        { id: crypto.randomUUID(), title: '', description: '', durationHours: 1, topics: [] },
      ],
    });
  };

  const updateModule = (index: number, field: keyof TrainingModule, value: any) => {
    const updated = [...formData.curriculum];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, curriculum: updated });
  };

  const removeModule = (index: number) => {
    setFormData({ ...formData, curriculum: formData.curriculum.filter((_, i) => i !== index) });
  };

  const addOutcome = (outcome: string) => {
    if (outcome.trim()) {
      setFormData({ ...formData, learningOutcomes: [...formData.learningOutcomes, outcome.trim()] });
    }
  };

  const removeOutcome = (index: number) => {
    setFormData({ ...formData, learningOutcomes: formData.learningOutcomes.filter((_, i) => i !== index) });
  };

  const totalBudget = formData.pricePerParticipant * formData.maximumParticipants;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Corporate Training</h1>
          <p className="text-grey-dark mt-1">Create and manage training packages for your team</p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => setShowBuilder(true)}>
          Create Package
        </Button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-4 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TrainingStatus | '')}
              className="px-4 py-2 border-2 border-grey-light rounded-lg text-sm"
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="ACTIVE">Active</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-navy" />
        </div>
      ) : packages.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <BookOpen size={48} className="mx-auto text-grey-medium mb-4" />
            <p className="text-grey-dark">No training packages yet</p>
            <Button variant="primary" size="sm" className="mt-3" onClick={() => setShowBuilder(true)}>
              Create your first package
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {packages.map((pkg) => (
            <Card key={pkg.id} padding="lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-navy">{pkg.title}</h3>
                    <Badge variant={STATUS_COLORS[pkg.status] as any} size="sm">{pkg.status}</Badge>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="info" size="sm">{pkg.category.replace('_', ' ')}</Badge>
                    <Badge variant="neutral" size="sm">{pkg.mode.replace('_', ' ')}</Badge>
                    <Badge variant="neutral" size="sm">{pkg.level.replace('_', ' ')}</Badge>
                  </div>
                </div>
                <p className="text-lg font-bold text-green">{formatCurrency(pkg.totalBudget)}</p>
              </div>

              {pkg.description && (
                <p className="text-sm text-grey-medium mb-3 line-clamp-2">{pkg.description}</p>
              )}

              <div className="space-y-2 text-sm text-grey-dark">
                <div className="flex items-center gap-2">
                  <Users size={14} />
                  <span>{pkg.minimumParticipants}-{pkg.maximumParticipants} participants</span>
                  <span className="text-grey-medium">({pkg.enrolledCount} enrolled)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} />
                  <span>{new Date(pkg.startDate).toLocaleDateString()} - {new Date(pkg.endDate).toLocaleDateString()}</span>
                  <span className="text-grey-medium">({pkg.durationDays} days)</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign size={14} />
                  <span>{formatCurrency(pkg.pricePerParticipant)}/person</span>
                </div>
                {pkg.instructorName && (
                  <div className="flex items-center gap-2">
                    <Award size={14} />
                    <span>{pkg.instructorName}</span>
                  </div>
                )}
                {pkg.mode !== 'ONLINE' && pkg.location && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} />
                    <span>{pkg.location.venue}, {pkg.location.city}</span>
                  </div>
                )}
                {pkg.meetingLink && (
                  <div className="flex items-center gap-2">
                    <Link2 size={14} className="text-navy" />
                    <a
                      href={pkg.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-xs truncate max-w-[200px]"
                    >
                      {pkg.onlinePlatform?.replace('_', ' ')} Meeting Link
                    </a>
                  </div>
                )}
              </div>

              {pkg.meetingLink && (
                <div className="mt-3">
                  <QRCodeDisplay url={pkg.meetingLink} title={`${pkg.onlinePlatform?.replace('_', ' ')} QR Code`} />
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm">View Details</Button>
                {pkg.status === 'DRAFT' && (
                  <Button variant="primary" size="sm">Submit for Approval</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={showBuilder}
        onClose={() => { setShowBuilder(false); setStep(1); resetForm(); }}
        title="Create Training Package"
        size="xl"
      >
        {step === 1 ? (
          <div className="space-y-6">
            <Input
              label="Package Title"
              placeholder="e.g., Leadership Development Program"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-grey-dark">Description</label>
              <textarea
                className="w-full px-4 py-3 border-2 border-grey-light rounded-lg min-h-[80px]"
                placeholder="Describe the training package..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-grey-dark mb-1.5">Category</label>
                <select
                  className="w-full px-4 py-3 border-2 border-grey-light rounded-lg"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as TrainingCategory })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-grey-dark mb-1.5">Mode</label>
                <select
                  className="w-full px-4 py-3 border-2 border-grey-light rounded-lg"
                  value={formData.mode}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value as TrainingMode })}
                >
                  {MODES.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-grey-dark mb-1.5">Level</label>
                <select
                  className="w-full px-4 py-3 border-2 border-grey-light rounded-lg"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value as TrainingLevel })}
                >
                  {LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Price per Participant (MWK)"
                type="number"
                value={formData.pricePerParticipant || ''}
                onChange={(e) => setFormData({ ...formData, pricePerParticipant: parseInt(e.target.value) || 0 })}
              />
              <Input
                label="Min Participants"
                type="number"
                value={formData.minimumParticipants || ''}
                onChange={(e) => setFormData({ ...formData, minimumParticipants: parseInt(e.target.value) || 1 })}
              />
              <Input
                label="Max Participants"
                type="number"
                value={formData.maximumParticipants || ''}
                onChange={(e) => setFormData({ ...formData, maximumParticipants: parseInt(e.target.value) || 50 })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
              <Input
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
              <Input
                label="Duration (Days)"
                type="number"
                value={formData.durationDays || ''}
                onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={() => setStep(2)}
                disabled={!formData.title || !formData.description || !formData.startDate || !formData.endDate}
              >
                Continue <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        ) : step === 2 ? (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-navy">Curriculum / Modules</h3>
                <Button variant="outline" size="sm" onClick={addModule}>
                  <Plus size={14} /> Add Module
                </Button>
              </div>
              {formData.curriculum.length === 0 ? (
                <p className="text-sm text-grey-medium">No modules added yet. Add at least one module.</p>
              ) : (
                <div className="space-y-3">
                  {formData.curriculum.map((mod, index) => (
                    <div key={mod.id} className="p-4 bg-grey-light/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Module {index + 1}</span>
                        <Button variant="ghost" size="sm" onClick={() => removeModule(index)}>Remove</Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          placeholder="Module title"
                          value={mod.title}
                          onChange={(e) => updateModule(index, 'title', e.target.value)}
                        />
                        <Input
                          placeholder="Duration (hours)"
                          type="number"
                          value={mod.durationHours || ''}
                          onChange={(e) => updateModule(index, 'durationHours', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <Input
                        placeholder="Description"
                        value={mod.description}
                        onChange={(e) => updateModule(index, 'description', e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-navy mb-3">Learning Outcomes</h3>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add a learning outcome and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addOutcome((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.learningOutcomes.map((outcome, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 cursor-pointer"
                    onClick={() => removeOutcome(index)}
                  >
                    {outcome} <span className="text-blue-600">&times;</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Instructor Name"
                value={formData.instructorName}
                onChange={(e) => setFormData({ ...formData, instructorName: e.target.value })}
              />
              <Input
                label="Certification Included"
                type="checkbox"
                checked={formData.certificationIncluded}
                onChange={(e) => setFormData({ ...formData, certificationIncluded: e.target.checked })}
              />
            </div>

            {formData.mode !== 'ONLINE' && (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Venue"
                  value={formData.location.venue}
                  onChange={(e) => setFormData({ ...formData, location: { ...formData.location, venue: e.target.value } })}
                />
                <Input
                  label="City"
                  value={formData.location.city}
                  onChange={(e) => setFormData({ ...formData, location: { ...formData.location, city: e.target.value } })}
                />
              </div>
            )}

            {(formData.mode === 'ONLINE' || formData.mode === 'HYBRID') && (
              <div className="space-y-4">
                <h3 className="font-semibold text-navy flex items-center gap-2">
                  <Link2 size={18} />
                  Online Meeting Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-grey-dark mb-1.5">Platform</label>
                    <select
                      className="w-full px-4 py-3 border-2 border-grey-light rounded-lg"
                      value={formData.onlinePlatform}
                      onChange={(e) => setFormData({ ...formData, onlinePlatform: e.target.value as any })}
                    >
                      {ONLINE_PLATFORMS.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="Meeting Link"
                    placeholder={ONLINE_PLATFORMS.find(p => p.value === formData.onlinePlatform)?.placeholder}
                    value={formData.meetingLink}
                    onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                  />
                </div>
                {formData.meetingLink && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <QRCodeDisplay url={formData.meetingLink} title={`${formData.onlinePlatform} Meeting QR Code`} />
                    <div className="flex flex-col justify-center text-sm text-grey-dark space-y-2">
                      <p className="font-medium text-navy">Meeting Access Instructions:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Scan the QR code to join on mobile</li>
                        <li>Copy the link to share with participants</li>
                        <li>Platform: {formData.onlinePlatform?.replace('_', ' ')}</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-navy/5 rounded-lg p-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Price per participant</span>
                <span>{formatCurrency(formData.pricePerParticipant)}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span>Max participants</span>
                <span>{formData.maximumParticipants}</span>
              </div>
              <div className="flex justify-between font-semibold text-navy pt-2 border-t border-grey-light">
                <span>Total Budget</span>
                <span>{formatCurrency(totalBudget)}</span>
              </div>
            </div>

            <div className="flex gap-3 justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowBuilder(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleCreatePackage} loading={isSubmitting}>
                  {isSubmitting ? 'Creating...' : `Create Package - ${formatCurrency(totalBudget)}`}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
