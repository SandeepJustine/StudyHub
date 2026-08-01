'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import { Plus, Users, Calendar, DollarSign, BookOpen, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

interface Contract {
  id: string;
  title: string;
  description?: string;
  employees: number;
  courses: Array<{ courseId: string; title: string; price: number; quantity: number; total: number }>;
  totalAmount: number;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

interface Course {
  id: string;
  title: string;
  subject: string;
  price: number;
  duration: string;
}

export default function TrainingPage() {
  const [showBuilder, setShowBuilder] = useState(false);
  const [step, setStep] = useState(1);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [contractData, setContractData] = useState({
    title: '',
    description: '',
    employees: 0,
    startDate: '',
    endDate: '',
  });
  const [selectedCourses, setSelectedCourses] = useState<any[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);

  useEffect(() => {
    loadContracts();
    loadAvailableCourses();
  }, []);

  const loadContracts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/corporate/training');
      const result = await response.json();
      if (response.ok && result.success) {
        setContracts(result.data || []);
      } else {
        setToast({ message: result.error || 'Failed to load contracts', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to load contracts', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableCourses = async () => {
    try {
      const response = await fetch('/api/courses?limit=20');
      const result = await response.json();
      if (response.ok && result.success) {
        setAvailableCourses(result.data.map((c: any) => ({
          id: c.id,
          title: c.title,
          subject: c.subject,
          price: c.price,
          duration: `${Math.floor(c.duration / 60)}h ${c.duration % 60}m`,
        })));
      }
    } catch (err) {
      console.error('Failed to load courses', err);
    }
  };

  const toggleCourse = (course: Course) => {
    if (selectedCourses.find(c => c.id === course.id)) {
      setSelectedCourses(selectedCourses.filter(c => c.id !== course.id));
    } else {
      setSelectedCourses([...selectedCourses, { ...course, quantity: 1 }]);
    }
  };

  const updateQuantity = (courseId: string, quantity: number) => {
    setSelectedCourses(selectedCourses.map(c => 
      c.id === courseId ? { ...c, quantity: Math.max(1, quantity) } : c
    ));
  };

  const calculateTotal = () => {
    const subtotal = selectedCourses.reduce((sum, c) => sum + (c.price * c.quantity), 0);
    const discount = selectedCourses.length >= 10 ? 0.15 : selectedCourses.length >= 5 ? 0.10 : 0;
    return Math.floor(subtotal * (1 - discount));
  };

  const handleCreateContract = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/corporate/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: contractData.title,
          description: contractData.description,
          employees: contractData.employees,
          courses: selectedCourses.map(c => ({ courseId: c.id, quantity: c.quantity })),
          startDate: new Date(contractData.startDate).toISOString(),
          endDate: new Date(contractData.endDate).toISOString(),
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setToast({ message: 'Training package created successfully!', type: 'success' });
        setShowBuilder(false);
        setStep(1);
        setContractData({ title: '', description: '', employees: 0, startDate: '', endDate: '' });
        setSelectedCourses([]);
        loadContracts();
      } else {
        setToast({ message: result.error || 'Failed to create package', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to create package', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Training Packages</h1>
          <p className="text-grey-dark mt-1">Create and manage corporate training contracts</p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => setShowBuilder(true)}>
          Create Package
        </Button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Active Contracts */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-navy" />
        </div>
      ) : contracts.length === 0 ? (
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
          {contracts.map((contract) => (
            <Card key={contract.id} padding="lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-navy">{contract.title}</h3>
                  <Badge variant={contract.status === 'active' ? 'success' : 'warning'} size="sm" className="mt-1">
                    {contract.status}
                  </Badge>
                </div>
                <p className="text-xl font-bold text-green">{formatCurrency(contract.totalAmount)}</p>
              </div>
              {contract.description && (
                <p className="text-sm text-grey-medium mb-3">{contract.description}</p>
              )}
              <div className="space-y-2 text-sm text-grey-dark">
                <div className="flex items-center gap-2">
                  <Users size={14} />
                  <span>{contract.employees} employees</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} />
                  <span>{new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen size={14} />
                  <span>{contract.courses?.length || 0} courses included</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm">View Details</Button>
                {contract.status === 'draft' && (
                  <Button variant="ghost" size="sm">Activate</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Training Package Builder Modal */}
      <Modal
        isOpen={showBuilder}
        onClose={() => setShowBuilder(false)}
        title="Create Training Package"
        size="xl"
      >
        {step === 1 ? (
          <div className="space-y-6">
            <Input
              label="Package Name"
              placeholder="e.g., Q3 Finance Team Training"
              value={contractData.title}
              onChange={(e) => setContractData({ ...contractData, title: e.target.value })}
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-grey-dark">Description</label>
              <textarea
                className="w-full px-4 py-3 border-2 border-grey-light rounded-lg min-h-[80px]"
                placeholder="Describe the training package..."
                value={contractData.description}
                onChange={(e) => setContractData({ ...contractData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Number of Employees"
                type="number"
                value={contractData.employees || ''}
                onChange={(e) => setContractData({ ...contractData, employees: parseInt(e.target.value) || 0 })}
              />
              <Input
                label="Start Date"
                type="date"
                value={contractData.startDate}
                onChange={(e) => setContractData({ ...contractData, startDate: e.target.value })}
              />
              <Input
                label="End Date"
                type="date"
                value={contractData.endDate}
                onChange={(e) => setContractData({ ...contractData, endDate: e.target.value })}
              />
            </div>

            <div>
              <h3 className="font-semibold text-navy mb-3">Select Courses</h3>
              {availableCourses.length === 0 ? (
                <p className="text-sm text-grey-medium">No courses available</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {availableCourses.map((course) => {
                    const isSelected = selectedCourses.find(c => c.id === course.id);
                    return (
                      <button
                        key={course.id}
                        onClick={() => toggleCourse(course)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? 'border-navy bg-navy/5'
                            : 'border-grey-light hover:border-navy/50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-navy text-sm">{course.title}</h4>
                          <Badge variant="neutral" size="sm">{course.subject}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-grey-medium">{course.duration}</span>
                          <span className="font-medium text-green">{formatCurrency(course.price)}</span>
                        </div>
                        {isSelected && (
                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-sm text-grey-medium">Quantity:</span>
                            <input
                              type="number"
                              min="1"
                              value={isSelected.quantity}
                              onChange={(e) => updateQuantity(course.id, parseInt(e.target.value) || 1)}
                              className="w-20 px-2 py-1 border border-grey-light rounded text-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={() => setStep(2)}
                disabled={selectedCourses.length === 0 || !contractData.title}
              >
                Continue to Review ({selectedCourses.length} courses)
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-grey-light/50 rounded-lg p-4">
              <h3 className="font-semibold text-navy mb-2">{contractData.title}</h3>
              {contractData.description && (
                <p className="text-sm text-grey-dark mb-2">{contractData.description}</p>
              )}
              <div className="text-sm text-grey-dark space-y-1">
                <p>{contractData.employees} employees</p>
                <p>{contractData.startDate} to {contractData.endDate}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-navy mb-3">Selected Courses</h3>
              <div className="space-y-2">
                {selectedCourses.map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-3 bg-grey-light/50 rounded-lg">
                    <div>
                      <p className="font-medium text-navy">{course.title}</p>
                      <p className="text-sm text-grey-medium">{course.duration}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-grey-medium">{course.quantity}x {formatCurrency(course.price)}</p>
                      <p className="font-semibold text-green">{formatCurrency(course.price * course.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-navy/5 rounded-lg p-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Subtotal</span>
                <span>{formatCurrency(selectedCourses.reduce((sum, c) => sum + (c.price * c.quantity), 0))}</span>
              </div>
              {selectedCourses.length >= 5 && (
                <div className="flex justify-between text-sm mb-2 text-green">
                  <span>Bulk Discount ({selectedCourses.length >= 10 ? '15%' : '10%'})</span>
                  <span>-{formatCurrency(selectedCourses.reduce((sum, c) => sum + (c.price * c.quantity), 0) * (selectedCourses.length >= 10 ? 0.15 : 0.10))}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-navy pt-2 border-t border-grey-light">
                <span>Total</span>
                <span>{formatCurrency(calculateTotal())}</span>
              </div>
            </div>

            <div className="flex gap-3 justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowBuilder(false)}>Save as Draft</Button>
                <Button variant="primary" onClick={handleCreateContract} loading={isSubmitting}>
                  {isSubmitting ? 'Creating...' : `Create Contract - ${formatCurrency(calculateTotal())}`}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
