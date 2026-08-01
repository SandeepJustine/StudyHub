'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import { Plus, Search, Filter, Briefcase, MapPin, Clock, DollarSign, Users, Eye, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

interface JobPosting {
  id: string;
  title: string;
  description: string;
  requirements?: string;
  qualifications?: string;
  salary?: string;
  location?: string;
  type?: string;
  deadline?: string;
  status: string;
  price: number;
  featured: boolean;
  urgent: boolean;
  applications: number;
  createdAt: string;
}

interface Application {
  id: string;
  applicantName: string;
  position: string;
  appliedAt: string;
  status: string;
}

export default function RecruitmentPage() {
  const [showNewPosting, setShowNewPosting] = useState(false);
  const [showApplications, setShowApplications] = useState(false);
  const [selectedPosting, setSelectedPosting] = useState<JobPosting | null>(null);
  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [newPosting, setNewPosting] = useState({
    title: '',
    description: '',
    requirements: '',
    qualifications: '',
    salary: '',
    location: '',
    type: 'Full-time',
    deadline: '',
    featured: false,
    urgent: false,
  });

  const calculatePrice = () => {
    let price = 50000;
    if (newPosting.featured) price += 100000;
    if (newPosting.urgent) price += 50000;
    return price;
  };

  useEffect(() => {
    loadPostings();
  }, []);

  const loadPostings = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (searchQuery) params.set('query', searchQuery);

      const response = await fetch(`/api/corporate/recruitment?${params.toString()}`);
      const result = await response.json();
      if (response.ok && result.success) {
        setPostings(result.data || []);
      } else {
        setToast({ message: result.error || 'Failed to load postings', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to load postings', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePosting = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/corporate/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPosting,
          deadline: newPosting.deadline ? new Date(newPosting.deadline).toISOString() : undefined,
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setToast({ message: 'Job posting created successfully!', type: 'success' });
        setShowNewPosting(false);
        setNewPosting({
          title: '',
          description: '',
          requirements: '',
          qualifications: '',
          salary: '',
          location: '',
          type: 'Full-time',
          deadline: '',
          featured: false,
          urgent: false,
        });
        loadPostings();
      } else {
        setToast({ message: result.error || 'Failed to create posting', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to create posting', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewApplications = async (posting: JobPosting) => {
    setSelectedPosting(posting);
    setShowApplications(true);
    try {
      const response = await fetch(`/api/corporate/applications?postingId=${posting.id}`);
      const result = await response.json();
      if (response.ok && result.success) {
        setApplications(result.data || []);
      } else {
        setToast({ message: result.error || 'Failed to load applications', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to load applications', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Recruitment</h1>
          <p className="text-grey-dark mt-1">Manage job postings and applications</p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => setShowNewPosting(true)}>
          Post New Job
        </Button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Search and Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search postings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search size={18} className="text-grey-medium" />}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border-2 border-grey-light rounded-lg text-sm"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
              <option value="draft">Draft</option>
            </select>
            <Button variant="outline" leftIcon={<Filter size={16} />} onClick={loadPostings}>
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Job Postings List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-navy" />
        </div>
      ) : postings.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Briefcase size={48} className="mx-auto text-grey-medium mb-4" />
            <p className="text-grey-dark">No job postings found</p>
            <Button variant="primary" size="sm" className="mt-3" onClick={() => setShowNewPosting(true)}>
              Post your first job
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {postings.map((posting) => (
            <Card key={posting.id} padding="lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-navy">{posting.title}</h3>
                    <Badge variant={posting.status === 'active' ? 'success' : 'warning'}>{posting.status}</Badge>
                    {posting.type === 'Internship' && (
                      <Badge variant="info">Internship</Badge>
                    )}
                    {posting.featured && (
                      <Badge variant="purple">Featured</Badge>
                    )}
                    {posting.urgent && (
                      <Badge variant="red">Urgent</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-grey-medium mb-3 flex-wrap">
                    {posting.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={14} /> {posting.location}
                      </span>
                    )}
                    {posting.salary && (
                      <span className="flex items-center gap-1">
                        <DollarSign size={14} /> {posting.salary}
                      </span>
                    )}
                    {posting.deadline && (
                      <span className="flex items-center gap-1">
                        <Clock size={14} /> Deadline: {new Date(posting.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-grey-dark mb-3 line-clamp-2">{posting.description}</p>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-sm">
                      <Users size={14} className="text-navy" />
                      <span className="font-medium">{posting.applications}</span>
                      <span className="text-grey-medium">applications</span>
                    </div>
                    <Badge variant="neutral">{formatCurrency(posting.price)}</Badge>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm" onClick={() => viewApplications(posting)} leftIcon={<Eye size={14} />}>
                    Applications
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* New Job Posting Modal */}
      <Modal
        isOpen={showNewPosting}
        onClose={() => setShowNewPosting(false)}
        title="Post New Job"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Job Title"
            placeholder="e.g., Graduate Trainee - Finance"
            value={newPosting.title}
            onChange={(e) => setNewPosting({ ...newPosting, title: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-grey-dark">Job Type</label>
              <select
                className="w-full px-4 py-3 border-2 border-grey-light rounded-lg"
                value={newPosting.type}
                onChange={(e) => setNewPosting({ ...newPosting, type: e.target.value })}
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </div>

            <Input
              label="Location"
              placeholder="e.g., Lilongwe"
              value={newPosting.location}
              onChange={(e) => setNewPosting({ ...newPosting, location: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Salary Range"
              placeholder="e.g., MWK 500,000 - 800,000"
              value={newPosting.salary}
              onChange={(e) => setNewPosting({ ...newPosting, salary: e.target.value })}
            />

            <Input
              label="Application Deadline"
              type="date"
              value={newPosting.deadline}
              onChange={(e) => setNewPosting({ ...newPosting, deadline: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-grey-dark">Description</label>
            <textarea
              className="w-full px-4 py-3 border-2 border-grey-light rounded-lg min-h-[100px]"
              placeholder="Describe the role and responsibilities..."
              value={newPosting.description}
              onChange={(e) => setNewPosting({ ...newPosting, description: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-grey-dark">Requirements</label>
            <textarea
              className="w-full px-4 py-3 border-2 border-grey-light rounded-lg min-h-[100px]"
              placeholder="List the requirements..."
              value={newPosting.requirements}
              onChange={(e) => setNewPosting({ ...newPosting, requirements: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-grey-dark">Qualifications</label>
            <textarea
              className="w-full px-4 py-3 border-2 border-grey-light rounded-lg min-h-[80px]"
              placeholder="List required qualifications..."
              value={newPosting.qualifications}
              onChange={(e) => setNewPosting({ ...newPosting, qualifications: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newPosting.featured}
                onChange={(e) => setNewPosting({ ...newPosting, featured: e.target.checked })}
                className="rounded border-grey-light"
              />
              <span className="text-sm">
                Feature this posting (+MWK 100,000) - Gets highlighted and appears at top of listings
              </span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newPosting.urgent}
                onChange={(e) => setNewPosting({ ...newPosting, urgent: e.target.checked })}
                className="rounded border-grey-light"
              />
              <span className="text-sm">
                Mark as urgent (+MWK 50,000) - Gets "Urgent" badge and priority placement
              </span>
            </label>
          </div>

          {/* Price Summary */}
          <div className="bg-navy/5 rounded-lg p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-grey-dark">Base Price</span>
              <span className="font-medium">MWK 50,000</span>
            </div>
            {newPosting.featured && (
              <div className="flex justify-between text-sm mb-2">
                <span className="text-grey-dark">Featured</span>
                <span className="font-medium">+MWK 100,000</span>
              </div>
            )}
            {newPosting.urgent && (
              <div className="flex justify-between text-sm mb-2">
                <span className="text-grey-dark">Urgent</span>
                <span className="font-medium">+MWK 50,000</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-navy pt-2 border-t border-grey-light">
              <span>Total</span>
              <span>{formatCurrency(calculatePrice())}</span>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowNewPosting(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreatePosting} loading={isSubmitting}>
              {isSubmitting ? 'Posting...' : `Post Job - ${formatCurrency(calculatePrice())}`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Applications Modal */}
      <Modal
        isOpen={showApplications}
        onClose={() => setShowApplications(false)}
        title={`Applications - ${selectedPosting?.title}`}
        size="lg"
      >
        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-grey-medium">No applications yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {applications.map((app) => (
                <div key={app.id} className="flex items-center justify-between p-4 bg-grey-light/50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-navy">{app.applicantName}</h3>
                    <p className="text-sm text-grey-medium">{app.position}</p>
                    <p className="text-xs text-grey-medium mt-1">
                      Applied {new Date(app.appliedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant={
                      app.status === 'shortlisted' ? 'success' :
                      app.status === 'reviewed' ? 'info' : 'warning'
                    }
                  >
                    {app.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
