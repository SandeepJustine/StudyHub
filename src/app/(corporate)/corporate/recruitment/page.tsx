'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Plus, Search, Filter, Briefcase, MapPin, Clock, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

export default function RecruitmentPage() {
  const [showNewPosting, setShowNewPosting] = useState(false);
  const [postings, setPostings] = useState([
    {
      id: '1',
      title: 'Graduate Trainee - Finance',
      type: 'Full-time',
      location: 'Lilongwe',
      salary: 'MWK 500,000 - 800,000',
      deadline: '2026-07-30',
      applications: 12,
      status: 'active',
      price: 50000,
      description: 'We are looking for ambitious graduates to join our finance team...',
      requirements: '• Bachelor\'s degree in Finance, Accounting, or related field\n• Strong analytical skills\n• Proficiency in Microsoft Excel',
    },
    {
      id: '2',
      title: 'IT Intern',
      type: 'Internship',
      location: 'Blantyre',
      salary: 'MWK 200,000 - 300,000',
      deadline: '2026-08-15',
      applications: 8,
      status: 'active',
      price: 50000,
      description: 'Join our IT department as an intern and gain hands-on experience...',
      requirements: '• Currently pursuing IT or Computer Science degree\n• Basic programming knowledge\n• Good problem-solving skills',
    },
  ]);

  const [newPosting, setNewPosting] = useState({
    title: '',
    type: 'Full-time',
    location: '',
    salary: '',
    deadline: '',
    description: '',
    requirements: '',
    qualifications: '',
    featured: false,
    urgent: false,
  });

  const calculatePrice = () => {
    let price = 50000;
    if (newPosting.featured) price += 100000;
    if (newPosting.urgent) price += 50000;
    return price;
  };

  const handleCreatePosting = async () => {
    // In production, call API
    const posting = {
      id: Date.now().toString(),
      ...newPosting,
      applications: 0,
      status: 'active',
      price: calculatePrice(),
    };
    setPostings([posting, ...postings]);
    setShowNewPosting(false);
    setNewPosting({
      title: '',
      type: 'Full-time',
      location: '',
      salary: '',
      deadline: '',
      description: '',
      requirements: '',
      qualifications: '',
      featured: false,
      urgent: false,
    });
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

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search postings..."
              leftIcon={<Search size={18} className="text-grey-medium" />}
            />
          </div>
          <select className="px-4 py-2 border-2 border-grey-light rounded-lg text-sm">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            <option value="draft">Draft</option>
          </select>
          <Button variant="outline" leftIcon={<Filter size={16} />}>
            Filters
          </Button>
        </div>
      </div>

      {/* Job Postings List */}
      <div className="space-y-4">
        {postings.map((posting) => (
          <Card key={posting.id} padding="lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-navy">{posting.title}</h3>
                  <Badge variant="success">{posting.status}</Badge>
                  {posting.type === 'Internship' && (
                    <Badge variant="info">Internship</Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-grey-medium mb-3">
                  <span className="flex items-center gap-1">
                    <MapPin size={14} /> {posting.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign size={14} /> {posting.salary}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} /> Deadline: {new Date(posting.deadline).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-sm text-grey-dark mb-3">{posting.description}</p>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-sm">
                    <Briefcase size={14} className="text-navy" />
                    <span className="font-medium">{posting.applications}</span>
                    <span className="text-grey-medium">applications</span>
                  </div>
                  <Badge variant="neutral">{formatCurrency(posting.price)}</Badge>
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                <Button variant="outline" size="sm">Edit</Button>
                <Button variant="ghost" size="sm">View Applications</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

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
            <Button variant="primary" onClick={handleCreatePosting}>
              Post Job - {formatCurrency(calculatePrice())}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}