'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Clock, 
  Heart, 
  Flag, 
  Share2, 
  MoreVertical,
} from 'lucide-react';
import { formatRelativeTime } from '@/utils/formatters';

interface PostAuthor {
  fullName: string;
  avatar?: string;
  role?: string;
}

interface ForumPostProps {
  post: {
    id: string;
    content: string;
    createdAt: Date;
    likes: number;
    isDeleted?: boolean;
    isPinned?: boolean;
    author: PostAuthor;
  };
  onLike?: (postId: string) => void;
  onFlag?: (postId: string) => void;
  onShare?: (postId: string) => void;
  isOwnPost?: boolean;
}

export function ForumPost({ 
  post, 
  onLike, 
  onFlag, 
  onShare,
  isOwnPost = false,
}: ForumPostProps) {
  if (post.isDeleted) {
    return (
      <Card padding="md" className="opacity-60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center flex-shrink-0">
            <User size={16} className="text-navy" />
          </div>
          <div className="flex-1">
            <span className="text-sm text-grey-medium italic">
              This post has been deleted
            </span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      padding="md" 
      className={post.isPinned ? 'border-l-4 border-yellow-500' : ''}
    >
      <div className="flex items-start gap-3">
        {/* Author Avatar */}
        <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center flex-shrink-0">
          {post.author.avatar ? (
            <img 
              src={post.author.avatar} 
              alt={post.author.fullName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <User size={16} className="text-navy" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Author Info */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-navy">
              {post.author.fullName}
            </span>
            {post.author.role && (
              <Badge size="sm" variant="neutral">
                {post.author.role}
              </Badge>
            )}
            {post.isPinned && (
              <Badge size="sm" variant="warning">
                Pinned
              </Badge>
            )}
            <span className="text-xs text-grey-medium">
              <Clock size={10} className="inline mr-1" />
              {formatRelativeTime(post.createdAt)}
            </span>
          </div>

          {/* Content */}
          <p className="text-sm text-grey-dark whitespace-pre-line mb-3">
            {post.content}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {onLike && (
              <button
                onClick={() => onLike(post.id)}
                className="flex items-center gap-1 text-xs text-grey-medium hover:text-red transition-colors"
              >
                <Heart size={14} />
                {post.likes > 0 && <span>{post.likes}</span>}
              </button>
            )}
            {onFlag && (
              <button
                onClick={() => onFlag(post.id)}
                className="flex items-center gap-1 text-xs text-grey-medium hover:text-yellow-600 transition-colors"
              >
                <Flag size={14} />
                Report
              </button>
            )}
            {onShare && (
              <button
                onClick={() => onShare(post.id)}
                className="flex items-center gap-1 text-xs text-grey-medium hover:text-navy transition-colors"
              >
                <Share2 size={14} />
                Share
              </button>
            )}
            {isOwnPost && (
              <button className="text-grey-medium hover:text-navy transition-colors">
                <MoreVertical size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
