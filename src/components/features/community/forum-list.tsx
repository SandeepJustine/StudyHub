'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  MessageSquare, 
  Eye, 
  Clock, 
  User,
  Pin,
  Lock,
  Search,
  Plus,
} from 'lucide-react';
import { formatRelativeTime } from '@/utils/formatters';

interface Thread {
  id: string;
  title: string;
  authorName: string;
  content: string;
  createdAt: Date;
  postsCount: number;
  viewsCount: number;
  isPinned?: boolean;
  isLocked?: boolean;
  tags?: string[];
  subject?: string;
}

interface ForumListProps {
  threads: Thread[];
  onViewThread: (threadId: string) => void;
  onCreateThread?: () => void;
  onSearch?: (query: string) => void;
}

export function ForumList({ threads, onViewThread, onCreateThread, onSearch }: ForumListProps) {
  // Separate pinned threads
  const pinnedThreads = threads.filter(t => t.isPinned);
  const regularThreads = threads.filter(t => !t.isPinned);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-navy">Discussion Forum</h2>
        {onCreateThread && (
          <Button variant="primary" leftIcon={<Plus size={16} />} onClick={onCreateThread}>
            New Thread
          </Button>
        )}
      </div>

      {/* Search */}
      {onSearch && (
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-medium" />
          <Input
            placeholder="Search discussions..."
            className="pl-10"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      )}

      {/* Pinned Threads */}
      {pinnedThreads.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-navy flex items-center gap-2">
            <Pin size={14} className="text-yellow-600" />
            Pinned Discussions
          </h3>
          {pinnedThreads.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} onClick={() => onViewThread(thread.id)} />
          ))}
        </div>
      )}

      {/* Regular Threads */}
      <div className="space-y-2">
        {regularThreads.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare size={48} className="mx-auto text-grey-medium mb-3" />
            <p className="text-grey-dark">No discussions yet. Start a new thread!</p>
          </div>
        ) : (
          regularThreads.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} onClick={() => onViewThread(thread.id)} />
          ))
        )}
      </div>
    </div>
  );
}

function ThreadCard({ thread, onClick }: { thread: Thread; onClick: () => void }) {
  return (
    <Card
      padding="md"
      hover
      onClick={onClick}
      className={thread.isPinned ? 'border-l-4 border-yellow-500' : ''}
    >
      <div className="flex items-start gap-4">
        {/* Author Avatar */}
        <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center flex-shrink-0">
          <User size={20} className="text-navy" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-navy truncate">{thread.title}</h4>
            {thread.isLocked && <Lock size={14} className="text-red flex-shrink-0" />}
          </div>
          <p className="text-sm text-grey-dark line-clamp-2 mb-2">{thread.content}</p>

          <div className="flex items-center gap-4 text-xs text-grey-medium">
            <span className="flex items-center gap-1">
              <User size={12} />
              {thread.authorName}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {formatRelativeTime(thread.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare size={12} />
              {thread.postsCount} replies
            </span>
            <span className="flex items-center gap-1">
              <Eye size={12} />
              {thread.viewsCount} views
            </span>
          </div>

          {/* Tags */}
          {thread.tags && thread.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {thread.tags.map(tag => (
                <Badge key={tag} variant="neutral" size="sm">{tag}</Badge>
              ))}
            </div>
          )}
        </div>

        {/* Subject Badge */}
        {thread.subject && (
          <Badge variant="info" size="sm" className="flex-shrink-0">
            {thread.subject}
          </Badge>
        )}
      </div>
    </Card>
  );
}