'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  HelpCircle,
} from 'lucide-react';
import { formatDate } from '@/utils/formatters';

interface SupportResponse {
  id: string;
  message: string;
  isInternal: boolean;
  createdAt: string;
  user: {
    fullName: string;
    role: string;
  };
}

interface SupportTicket {
  id: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  responses: SupportResponse[];
}

export default function StudentSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showTicketDetail, setShowTicketDetail] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    category: 'general',
    subject: '',
    description: '',
    priority: 'normal',
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/support/tickets');
      if (!res.ok) throw new Error('Failed to fetch tickets');
      const data = await res.json();
      if (data.success) {
        setTickets(data.data || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!formData.subject || !formData.description) {
      setToast({ message: 'Subject and description are required', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create ticket');

      setToast({ message: 'Support ticket created successfully!', type: 'success' });
      setShowCreateModal(false);
      setFormData({ category: 'general', subject: '', description: '', priority: 'normal' });
      fetchTickets();
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyMessage }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send reply');

      setToast({ message: 'Reply sent successfully!', type: 'success' });
      setReplyMessage('');
      fetchTickets();
      if (selectedTicket) {
        setSelectedTicket({ ...selectedTicket, responses: [...selectedTicket.responses, data.data] });
      }
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
      open: 'info',
      in_progress: 'warning',
      resolved: 'success',
      closed: 'neutral',
    };
    return <Badge variant={variants[status] || 'neutral'}>{status.replace(/_/g, ' ')}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
      low: 'neutral',
      normal: 'info',
      high: 'warning',
      urgent: 'error',
    };
    return <Badge variant={variants[priority] || 'neutral'}>{priority}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle size={16} className="text-blue-600" />;
      case 'in_progress':
        return <Clock size={16} className="text-yellow-600" />;
      case 'resolved':
        return <CheckCircle size={16} className="text-green" />;
      case 'closed':
        return <XCircle size={16} className="text-grey-medium" />;
      default:
        return <HelpCircle size={16} className="text-grey-medium" />;
    }
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Support</h1>
          <p className="text-sm text-grey-medium">Get help with your account, courses, and payments</p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => setShowCreateModal(true)}>
          New Ticket
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-grey-medium">Total Tickets</p>
                <p className="text-xl font-bold text-navy">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="text-yellow-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-grey-medium">Open</p>
                <p className="text-xl font-bold text-navy">{stats.open}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="text-purple-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-grey-medium">In Progress</p>
                <p className="text-xl font-bold text-navy">{stats.inProgress}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="text-green" size={20} />
              </div>
              <div>
                <p className="text-xs text-grey-medium">Resolved</p>
                <p className="text-xl font-bold text-navy">{stats.resolved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-grey-medium">Loading tickets...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red">{error}</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8">
              <HelpCircle size={48} className="mx-auto text-grey-medium mb-3" />
              <p className="text-grey-dark mb-2">No support tickets yet</p>
              <p className="text-sm text-grey-medium mb-4">Create a ticket and our support team will help you</p>
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                Create Your First Ticket
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-4 bg-grey-light/50 rounded-lg cursor-pointer hover:bg-grey-light transition-colors"
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setShowTicketDetail(true);
                  }}
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(ticket.status)}
                    <div>
                      <h4 className="font-semibold text-navy text-sm">{ticket.subject}</h4>
                      <p className="text-xs text-grey-medium mt-1">
                        {ticket.category.replace(/_/g, ' ')} • {formatDate(ticket.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(ticket.priority)}
                    {getStatusBadge(ticket.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Support Ticket" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-grey-dark mb-1">Category</label>
            <select
              className="w-full px-4 py-3 border-2 border-grey-light rounded-lg"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="general">General Inquiry</option>
              <option value="payment">Payment Issue</option>
              <option value="account">Account Issue</option>
              <option value="technical">Technical Support</option>
              <option value="course">Course Content</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-grey-dark mb-1">Subject</label>
            <Input
              placeholder="Brief description of your issue"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-grey-dark mb-1">Priority</label>
            <select
              className="w-full px-4 py-3 border-2 border-grey-light rounded-lg"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-grey-dark mb-1">Description</label>
            <Textarea
              placeholder="Describe your issue in detail..."
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
              rows={5}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateTicket} loading={isSubmitting}>
              Create Ticket
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showTicketDetail} onClose={() => setShowTicketDetail(false)} title={selectedTicket?.subject} size="lg">
        {selectedTicket && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {getStatusBadge(selectedTicket.status)}
              {getPriorityBadge(selectedTicket.priority)}
              <span className="text-xs text-grey-medium">{selectedTicket.category.replace(/_/g, ' ')}</span>
            </div>
            <p className="text-sm text-grey-dark">{selectedTicket.description}</p>

            <div className="space-y-3">
              <h4 className="font-semibold text-navy text-sm">Responses</h4>
              {selectedTicket.responses.length === 0 ? (
                <p className="text-sm text-grey-medium">No responses yet. Our team will get back to you soon.</p>
              ) : (
                <div className="space-y-3">
                  {selectedTicket.responses.map((response) => (
                    <div key={response.id} className="p-3 bg-grey-light/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-navy">{response.user.fullName}</span>
                        <span className="text-xs text-grey-medium">{response.user.role}</span>
                        <span className="text-xs text-grey-medium ml-auto">{formatDate(response.createdAt)}</span>
                      </div>
                      <p className="text-sm text-grey-dark">{response.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Textarea
                placeholder="Write a reply..."
                value={replyMessage}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReplyMessage(e.target.value)}
                rows={3}
                className="flex-1"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowTicketDetail(false)}>Close</Button>
              <Button variant="primary" onClick={handleReply} loading={isSubmitting} leftIcon={<Send size={14} />}>
                Send Reply
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
