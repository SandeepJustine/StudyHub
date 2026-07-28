'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import {
  Search,
  RefreshCw,
  Eye,
  MessageSquare,
  Clock,
  AlertCircle,
  Mail,
  User,
  Tag,
  ChevronRight,
} from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/utils/formatters';

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  useEffect(() => {
    fetchTickets();
  }, [searchQuery, statusFilter, categoryFilter, pagination.page]);

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (statusFilter) params.append('status', statusFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await fetch(`/api/admin/support?${params}`);
      if (!response.ok) throw new Error('Failed to fetch tickets');
      
      const data = await response.json();
      if (data.success) {
        setTickets(data.data || []);
        setStats(data.stats || { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 });
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
      }
    } catch (err: any) {
      console.error('Failed to fetch tickets:', err);
      setError(err.message);
      
      // Mock data fallback
      setTickets([
        { id: '1', subject: 'Payment not reflecting', description: 'I paid via Airtel Money but my subscription is not active', category: 'PAYMENT', priority: 'high', status: 'open', user: { name: 'John Phiri', email: 'john@email.com', role: 'STUDENT' }, responseCount: 0, createdAt: new Date(Date.now() - 3600000) },
        { id: '2', subject: 'Cannot access course videos', description: 'Getting error when trying to play videos', category: 'TECHNICAL', priority: 'normal', status: 'in_progress', user: { name: 'Mary Banda', email: 'mary@email.com', role: 'STUDENT' }, responseCount: 2, createdAt: new Date(Date.now() - 86400000) },
        { id: '3', subject: 'Instructor payout request', description: 'Requesting payout for July earnings', category: 'ACCOUNT', priority: 'normal', status: 'open', user: { name: 'Prof. Michael', email: 'michael@email.com', role: 'INSTRUCTOR' }, responseCount: 1, createdAt: new Date(Date.now() - 172800000) },
        { id: '4', subject: 'Inappropriate content report', description: 'Found inappropriate content in course comments', category: 'CONTENT', priority: 'urgent', status: 'open', user: { name: 'Grace Student', email: 'grace@email.com', role: 'STUDENT' }, responseCount: 0, createdAt: new Date(Date.now() - 7200000) },
        { id: '5', subject: 'School registration help', description: 'Need assistance with registering our school', category: 'OTHER', priority: 'low', status: 'resolved', user: { name: 'Lilongwe Secondary', email: 'admin@lilongwesec.mw', role: 'SCHOOL_ADMIN' }, responseCount: 3, createdAt: new Date(Date.now() - 259200000), resolvedAt: new Date() },
      ]);
      setStats({ total: 5, open: 3, inProgress: 1, resolved: 1, closed: 0 });
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetail = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/admin/support/${ticketId}`);
      if (!response.ok) throw new Error('Failed to fetch ticket');
      const data = await response.json();
      if (data.success) {
        setSelectedTicket(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch ticket detail:', err);
    }
  };

  const handleViewTicket = async (ticket: any) => {
    setSelectedTicket(ticket);
    setShowDetail(true);
    await fetchTicketDetail(ticket.id);
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;
    
    setIsSending(true);
    try {
      const response = await fetch(`/api/admin/support/${selectedTicket.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyMessage }),
      });

      if (!response.ok) throw new Error('Failed to send reply');

      setToast({ message: 'Reply sent successfully', type: 'success' });
      setReplyMessage('');
      await fetchTicketDetail(selectedTicket.id);
      fetchTickets();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to send reply', type: 'error' });
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, status: string) => {
    try {
      const response = await fetch('/api/admin/support', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, action: 'update_status', data: { status } }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      setToast({ message: `Ticket ${status}`, type: 'success' });
      fetchTickets();
      if (selectedTicket) await fetchTicketDetail(ticketId);
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge variant="warning">Open</Badge>;
      case 'in_progress': return <Badge variant="info">In Progress</Badge>;
      case 'resolved': return <Badge variant="success">Resolved</Badge>;
      case 'closed': return <Badge variant="neutral">Closed</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent': return <Badge variant="error">Urgent</Badge>;
      case 'high': return <Badge variant="error">High</Badge>;
      case 'normal': return <Badge variant="info">Normal</Badge>;
      case 'low': return <Badge variant="neutral">Low</Badge>;
      default: return <Badge>{priority}</Badge>;
    }
  };

  const columns = [
    {
      key: 'ticket',
      header: 'Ticket',
      accessor: (ticket: any) => (
        <div>
          <p className="font-medium text-navy">{ticket.subject}</p>
          <p className="text-xs text-grey-medium line-clamp-1">{ticket.description}</p>
        </div>
      ),
    },
    {
      key: 'user',
      header: 'User',
      accessor: (ticket: any) => (
        <div>
          <p className="text-sm font-medium">{ticket.user?.name}</p>
          <p className="text-xs text-grey-medium">{ticket.user?.email}</p>
          <Badge size="sm" variant="neutral">{ticket.user?.role}</Badge>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      accessor: (ticket: any) => (
        <Badge variant={
          ticket.category === 'PAYMENT' ? 'warning' :
          ticket.category === 'TECHNICAL' ? 'info' :
          ticket.category === 'CONTENT' ? 'error' :
          'neutral'
        }>
          {ticket.category}
        </Badge>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      accessor: (ticket: any) => getPriorityBadge(ticket.priority),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (ticket: any) => getStatusBadge(ticket.status),
    },
    {
      key: 'date',
      header: 'Date',
      accessor: (ticket: any) => (
        <div className="text-sm">
          <p>{formatRelativeTime(ticket.createdAt)}</p>
          {ticket.responseCount > 0 && (
            <p className="text-xs text-grey-medium">{ticket.responseCount} replies</p>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (ticket: any) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleViewTicket(ticket)}
        >
          <Eye size={14} className="mr-1" />
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Support Tickets</h1>
          <p className="text-grey-dark mt-1">Manage user support requests</p>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchTickets}>
          <RefreshCw size={16} />
        </Button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-sm text-yellow-800">
          <AlertCircle size={16} />
          <span>Using mock data - API unavailable: {error}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'bg-navy/10 text-navy' },
          { label: 'Open', value: stats.open, color: 'bg-yellow-100 text-yellow-800' },
          { label: 'In Progress', value: stats.inProgress, color: 'bg-blue-100 text-blue-800' },
          { label: 'Resolved', value: stats.resolved, color: 'bg-green-100 text-green-800' },
          { label: 'Closed', value: stats.closed, color: 'bg-grey-light text-grey-dark' },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color.split(' ')[1]}`}>{stat.value}</p>
              <p className="text-xs text-grey-medium mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={18} className="text-grey-medium" />}
            />
          </div>
          <select
            className="px-4 py-2 border-2 border-grey-light rounded-lg text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select
            className="px-4 py-2 border-2 border-grey-light rounded-lg text-sm"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="PAYMENT">Payment</option>
            <option value="ACCOUNT">Account</option>
            <option value="CONTENT">Content</option>
            <option value="TECHNICAL">Technical</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <Card>
        <CardContent className="p-0">
          <Table
            data={tickets}
            columns={columns}
            isLoading={loading}
            emptyMessage="No support tickets found"
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-grey-medium">
            Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={pagination.page === 1} onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}>Previous</Button>
            <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}>Next</Button>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      <Modal
        isOpen={showDetail}
        onClose={() => { setShowDetail(false); setSelectedTicket(null); }}
        title={`Ticket: ${selectedTicket?.subject || ''}`}
        size="lg"
      >
        {selectedTicket && (
          <div className="space-y-6">
            {/* Ticket Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-grey-light/50 rounded-lg">
                <p className="text-xs text-grey-medium">Status</p>
                {getStatusBadge(selectedTicket.status)}
              </div>
              <div className="p-3 bg-grey-light/50 rounded-lg">
                <p className="text-xs text-grey-medium">Priority</p>
                {getPriorityBadge(selectedTicket.priority)}
              </div>
              <div className="p-3 bg-grey-light/50 rounded-lg">
                <p className="text-xs text-grey-medium">Category</p>
                <Badge>{selectedTicket.category}</Badge>
              </div>
              <div className="p-3 bg-grey-light/50 rounded-lg">
                <p className="text-xs text-grey-medium">User</p>
                <p className="text-sm font-medium">{selectedTicket.user?.name}</p>
                <p className="text-xs text-grey-medium">{selectedTicket.user?.email}</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="font-semibold text-navy mb-2">Description</h4>
              <div className="p-4 bg-grey-light/50 rounded-lg text-sm text-grey-dark">
                {selectedTicket.description}
              </div>
            </div>

            {/* Responses */}
            {selectedTicket.responses && selectedTicket.responses.length > 0 && (
              <div>
                <h4 className="font-semibold text-navy mb-3">Responses ({selectedTicket.responses.length})</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {selectedTicket.responses.map((resp: any, i: number) => (
                    <div key={i} className={`p-4 rounded-lg ${resp.isInternal ? 'bg-yellow-50 border border-yellow-200' : 'bg-blue-50 border border-blue-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-navy/10 flex items-center justify-center">
                            <span className="text-xs font-medium text-navy">
                              {resp.user?.fullName?.charAt(0) || 'S'}
                            </span>
                          </div>
                          <span className="text-sm font-medium">{resp.user?.fullName}</span>
                          <Badge size="sm" variant="neutral">{resp.user?.role}</Badge>
                          {resp.isInternal && <Badge size="sm" variant="warning">Internal Note</Badge>}
                        </div>
                        <span className="text-xs text-grey-medium">{formatRelativeTime(resp.createdAt)}</span>
                      </div>
                      <p className="text-sm text-grey-dark ml-8">{resp.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reply Form */}
            {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
              <div>
                <h4 className="font-semibold text-navy mb-2">Reply</h4>
                <textarea
                  className="w-full px-4 py-3 border-2 border-grey-light rounded-lg min-h-[100px] text-sm"
                  placeholder="Type your reply..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                />
                <div className="flex justify-between mt-3">
                  <div className="flex gap-2">
                    {selectedTicket.status === 'open' && (
                      <Button variant="outline"size="sm" onClick={() => handleUpdateStatus(selectedTicket.id, 'in_progress')}>
                        Mark In Progress
                      </Button>
                    )}
                    <Button variant="success" size="sm" onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')}>
                      Resolve
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(selectedTicket.id, 'closed')}>
                      Close
                    </Button>
                  </div>
                  <Button variant="primary" size="sm" onClick={handleSendReply} disabled={isSending || !replyMessage.trim()}>
                    {isSending ? 'Sending...' : 'Send Reply'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}