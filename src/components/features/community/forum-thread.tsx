'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  MessageSquare, 
  Heart, 
  Flag, 
  Share2, 
  User,
  Clock,
  Pin,
  Lock,
  Send,
  MoreVertical,
} from 'lucide-react';
import { formatRelativeTime } from '@/utils/formatters';

interface Post {
  id: string;
  authorName: string;
  authorAvatar?: string;
  authorRole: string;
  content: string;
  createdAt: Date;
  likes: number;
  isLiked?: boolean;
  isPinned?: boolean;
}

interface ForumThreadProps {
  thread: {
    id: string;
    title: string;
    authorName: string;
    authorRole: string;
    content: string;
    createdAt: Date;
    isPinned?: boolean;
    isLocked?: boolean;
    tags?: string[];
    views: number;
  };
  posts: Post[];
  onReply: (threadId: string, content: string) => void;
  onLike: (postId: string) => void;
  onFlag: (postId: string) => void;
  onShare?: (threadId: string) => void;
}

export function ForumThread({
  thread,
  posts,
  onReply,
  onLike,
  onFlag,
  onShare,
}: ForumThreadProps) {
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    setIsSubmitting(true);
    await onReply(thread.id, replyContent);
    setReplyContent('');
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Original Post */}
      <Card padding="lg">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center flex-shrink-0">
            <User size={20} className="text-navy" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-navy">{thread.authorName}</span>
              <Badge size="sm" variant="neutral">{thread.authorRole}</Badge>
              {thread.isPinned && (
                <Badge size="sm" variant="warning">
                  <Pin size={10} className="mr-1" /> Pinned
                </Badge>
              )}
              {thread.isLocked && (
                <Badge size="sm" variant="error">
                  <Lock size={10} className="mr-1" /> Locked
                </Badge>
              )}
            </div>
            <p className="text-xs text-grey-medium">
              <Clock size={10} className="inline mr-1" />
              {formatRelativeTime(thread.createdAt)}
              <span className="mx-2">•</span>
              {thread.views} views
            </p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-navy mb-3">{thread.title}</h2>
        <p className="text-grey-dark leading-relaxed whitespace-pre-line">{thread.content}</p>

        {thread.tags && thread.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {thread.tags.map(tag => (
              <Badge key={tag} variant="neutral" size="sm">{tag}</Badge>
            ))}
          </div>
        )}
      </Card>

      {/* Replies */}
      <div className="space-y-4">
        <h3 className="font-semibold text-navy">
          Replies ({posts.length})
        </h3>

        {posts.map((post) => (
          <Card key={post.id} padding="md" className={post.isPinned ? 'border-l-4 border-yellow-500' : ''}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-navy" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-navy">{post.authorName}</span>
                  <Badge size="sm" variant="neutral">{post.authorRole}</Badge>
                  <span className="text-xs text-grey-medium">
                    {formatRelativeTime(post.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-grey-dark whitespace-pre-line">{post.content}</p>

                <div className="flex items-center gap-4 mt-3">
                  <button
                    onClick={() => onLike(post.id)}
                    className={`flex items-center gap-1 text-xs transition-colors ${
                      post.isLiked ? 'text-red' : 'text-grey-medium hover:text-red'
                    }`}
                  >
                    <Heart size={14} fill={post.isLiked ? 'currentColor' : 'none'} />
                    {post.likes > 0 && post.likes}
                  </button>
                  <button
                    onClick={() => onFlag(post.id)}
                    className="flex items-center gap-1 text-xs text-grey-medium hover:text-yellow-600"
                  >
                    <Flag size={14} />
                    Report
                  </button>
                  {onShare && (
                    <button
                      onClick={() => onShare(post.id)}
                      className="flex items-center gap-1 text-xs text-grey-medium hover:text-navy"
                    >
                      <Share2 size={14} />
                      Share
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Reply Form */}
      {!thread.isLocked && (
        <Card padding="lg">
          <h4 className="font-semibold text-navy mb-3">Post a Reply</h4>
          <textarea
            className="w-full px-4 py-3 border-2 border-grey-light rounded-lg focus:border-navy focus:ring-2 focus:ring-navy/20 min-h-[100px] text-sm"
            placeholder="Write your reply..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
          />
          <div className="flex justify-end mt-3">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Send size={14} />}
              onClick={handleReply}
              loading={isSubmitting}
              disabled={!replyContent.trim()}
            >
              Post Reply
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}