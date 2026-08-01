'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import {
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Send,
  Loader2,
  FileText,
  User,
} from 'lucide-react';
import { formatDate } from '@/utils/formatters';

interface PendingEssay {
  attemptId: string;
  studentName: string;
  courseTitle: string;
  quizTitle: string;
  question: {
    id: string;
    text: string;
    points: number;
    type: string;
  };
  answer: any;
  submittedAt: string;
}

export default function GradingQueuePage() {
  const [pendingItems, setPendingItems] = useState<PendingEssay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<PendingEssay | null>(null);
  const [gradePoints, setGradePoints] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadPendingGrading();
  }, []);

  const loadPendingGrading = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/instructor/grading');
      const data = await response.json();
      if (response.ok) {
        setPendingItems(data.data || []);
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to load grading queue', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrade = async () => {
    if (!selectedItem) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/instructor/grading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: selectedItem.attemptId,
          questionId: selectedItem.question.id,
          points: gradePoints,
          feedback,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setToast({ message: 'Grade submitted successfully!', type: 'success' });
        setSelectedItem(null);
        setGradePoints(0);
        setFeedback('');
        loadPendingGrading();
      } else {
        setToast({ message: data.error || 'Failed to submit grade', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to submit grade', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openGradeModal = (item: PendingEssay) => {
    setSelectedItem(item);
    setGradePoints(item.question.points);
    setFeedback('');
  };

  const filteredItems = pendingItems.filter(item =>
    item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.quizTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-yellow-100 rounded-xl">
            <Clock size={22} className="text-yellow-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy">Grading Queue</h1>
            <p className="text-sm text-grey-medium">
              Review and grade essay questions from student exams
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={loadPendingGrading}>
          <Clock size={16} className="mr-2" />
          Refresh
        </Button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-grey-medium">Pending Review</p>
              <p className="text-xl font-bold text-navy">{pendingItems.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-grey-medium">Auto-graded</p>
              <p className="text-xl font-bold text-navy">
                {pendingItems.filter(i => !i.question.type.includes('ESSAY')).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FileText size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-grey-medium">Essay Review</p>
              <p className="text-xl font-bold text-navy">
                {pendingItems.filter(i => i.question.type === 'ESSAY').length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-medium" />
            <Input
              placeholder="Search by student, course, or exam..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Pending Items */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Pending Essays ({filteredItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-navy" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
              <p className="text-grey-dark">All caught up! No pending essays to grade.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-grey-light rounded-lg hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <FileText size={20} className="text-yellow-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-navy">{item.studentName}</span>
                        <Badge variant="warning" size="sm">Essay</Badge>
                      </div>
                      <p className="text-sm text-grey-dark">{item.courseTitle}</p>
                      <p className="text-xs text-grey-medium">Exam: {item.quizTitle}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-grey-medium">
                        <span className="flex items-center gap-1">
                          <User size={12} />
                          {item.studentName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatDate(item.submittedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => openGradeModal(item)}
                    leftIcon={<Eye size={14} />}
                  >
                    Grade
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grade Modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title="Grade Essay Question"
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="bg-grey-light/50 rounded-lg p-4">
              <h4 className="font-semibold text-navy mb-2">Question</h4>
              <p className="text-sm text-grey-dark">{selectedItem.question.text}</p>
              <p className="text-xs text-grey-medium mt-2">Max Points: {selectedItem.question.points}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-navy mb-2">Student Answer</h4>
              <p className="text-sm text-grey-dark whitespace-pre-wrap">
                {typeof selectedItem.answer === 'object' ? selectedItem.answer?.answer || selectedItem.answer : selectedItem.answer}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-grey-dark mb-1.5">
                Points Awarded (Max: {selectedItem.question.points})
              </label>
              <Input
                type="number"
                min="0"
                max={selectedItem.question.points}
                value={gradePoints}
                onChange={(e) => setGradePoints(parseInt(e.target.value) || 0)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-grey-dark mb-1.5">
                Feedback (optional)
              </label>
              <textarea
                className="w-full px-4 py-3 border-2 border-grey-light rounded-lg focus:border-navy min-h-[120px] text-sm"
                placeholder="Provide feedback to the student..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setSelectedItem(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleGrade} loading={isSubmitting}>
                <Send size={16} className="mr-2" />
                Submit Grade
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
