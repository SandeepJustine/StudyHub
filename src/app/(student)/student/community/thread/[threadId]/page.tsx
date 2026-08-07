'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Toast } from '@/components/ui/toast';
import { 
  MessageSquare, User, Clock, Pin, Lock, Send, ArrowLeft, Eye, Heart, Flag, Share2, Loader2 
} from 'lucide-react';
import { formatRelativeTime } from '@/utils/formatters';
import Link from 'next/link';

interface Post {
  id: string;
  content: string;
  likes: number;
  isDeleted: boolean;
  createdAt: string;
  author: {
    fullName: string;
    role: string;
  };
}

interface Thread {
  id: string;
  title: string;
  content: string;
  subject: string;
  tags: string[];
  viewsCount: number;
  postsCount: number;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  author: {
    fullName: string;
    role: string;
  };
  forum: {
    id: string;
    name: string;
  };
  posts: Post[];
}

export default function ThreadPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [thread, setThread] = useState<Thread | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchThread() {
      if (!params.threadId) return;
      
      try {
        setLoading(true);
        const res = await fetch(`/api/community/threads/${params.threadId}`);
        if (!res.ok) {
          throw new Error('Failed to fetch thread');
        }
        const result = await res.json();
        if (result.success) {
          setThread(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch thread');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchThread();
  }, [params.threadId]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !thread) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/community/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: thread.id,
          content: replyContent,
        }),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Failed to post reply');
      }

      const result = await res.json();
      
      // Add the new post to the thread
      const newPost: Post = {
        id: result.data.id,
        content: replyContent,
        likes: 0,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        author: {
          fullName: session?.user?.name || 'You',
          role: session?.user?.role || 'STUDENT',
        },
      };

      setThread(prev => prev ? {
        ...prev,
        posts: [...prev.posts, newPost],
        postsCount: prev.postsCount + 1,
      } : null);

      setToast({ message: 'Reply posted!', type: 'success' });
      setReplyContent('');
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to post reply', type: 'error' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const toggleLike = (postId: string) => {
    setLikedPosts(prev => prev.includes(postId) ? prev.filter(p => p !== postId) : [...prev, postId]);
  };

  if (status === 'loading') {
    return <div className="p-6 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-navy" /></div>;
  }
  if (status === 'unauthenticated') {
    router.push('/auth/login');
    return null;
  }

  if (loading) {
    return <div className="p-6 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-navy" /></div>;
  }

  if (error || !thread) {
    return (
      <div className="p-6 max-w-4xl">
        <Link href="/student/community" className="text-grey-medium hover:text-navy flex items-center gap-1 text-sm mb-4">
          <ArrowLeft size={16} /> Back to Community
        </Link>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center">
            <MessageSquare size={48} className="mx-auto text-grey-medium mb-4" />
            <h2 className="text-xl font-bold text-navy mb-2">Thread Not Found</h2>
            <p className="text-grey-dark">{error || 'This discussion could not be loaded.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Back Navigation */}
      <Link href={thread.forum ? `/student/community/forum/${thread.forum.id}` : '/student/community'} 
        className="text-grey-medium hover:text-navy flex items-center gap-1 text-sm">
        <ArrowLeft size={16} /> {thread.forum ? `Back to ${thread.forum.name}` : 'Back to Community'}
      </Link>

      {/* Thread Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          {thread.isPinned && <Badge variant="warning" size="sm"><Pin size={10} className="mr-0.5" />Pinned</Badge>}
          {thread.isLocked && <Badge variant="error" size="sm"><Lock size={10} className="mr-0.5" />Locked</Badge>}
          {thread.forum && <Badge variant="neutral" size="sm">{thread.forum.name}</Badge>}
        </div>
        <h1 className="text-2xl font-bold text-navy mb-2">{thread.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-xs text-grey-medium">
          <span className="flex items-center gap-1"><User size={12} />{thread.author?.fullName}</span>
          <span className="flex items-center gap-1"><Clock size={12} />{formatRelativeTime(thread.createdAt)}</span>
          <span className="flex items-center gap-1"><Eye size={12} />{thread.viewsCount} views</span>
          <span className="flex items-center gap-1"><MessageSquare size={12} />{thread.posts.length} replies</span>
        </div>
      </div>

      {/* Tags */}
      {thread.tags && (
        <div className="flex flex-wrap gap-1.5">
          {thread.tags.map((tag: string) => <Badge key={tag} size="sm" variant="neutral">{tag}</Badge>)}
        </div>
      )}

      {/* Original Post */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center flex-shrink-0">
              <User size={20} className="text-navy" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-navy text-sm">{thread.author?.fullName}</span>
                <Badge size="sm" variant="neutral">{thread.author?.role}</Badge>
              </div>
              <p className="text-xs text-grey-medium">{formatRelativeTime(thread.createdAt)}</p>
            </div>
          </div>
          <p className="text-grey-dark text-sm leading-relaxed whitespace-pre-line">{thread.content}</p>
        </CardContent>
      </Card>

      {/* Replies */}
      <div>
        <h3 className="font-semibold text-navy text-sm mb-3">Replies ({thread.posts.length})</h3>
        <div className="space-y-3">
          {thread.posts.map((post) => (
            <Card key={post.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center flex-shrink-0">
                    <User size={16} className="text-navy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-navy">{post.author?.fullName}</span>
                      <Badge size="sm" variant="neutral">{post.author?.role}</Badge>
                      <span className="text-xs text-grey-medium">{formatRelativeTime(post.createdAt)}</span>
                    </div>
                    {post.isDeleted ? (
                      <p className="text-sm text-grey-medium italic">This post has been deleted</p>
                    ) : (
                      <p className="text-sm text-grey-dark whitespace-pre-line">{post.content}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <button onClick={() => toggleLike(post.id)} 
                        className={`flex items-center gap-1 text-xs transition-colors ${likedPosts.includes(post.id) ? 'text-red' : 'text-grey-medium hover:text-red'}`}>
                        <Heart size={12} fill={likedPosts.includes(post.id) ? 'currentColor' : 'none'} />
                        {post.likes + (likedPosts.includes(post.id) ? 1 : 0)}
                      </button>
                      <button className="flex items-center gap-1 text-xs text-grey-medium hover:text-yellow-600">
                        <Flag size={12} />Report
                      </button>
                      <button className="flex items-center gap-1 text-xs text-grey-medium hover:text-navy">
                        <Share2 size={12} />Share
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Reply Form */}
      {!thread.isLocked && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h4 className="font-semibold text-navy text-sm mb-3">Post a Reply</h4>
            <form onSubmit={handleReply}>
              <textarea
                className="w-full px-4 py-3 border-2 border-grey-light rounded-lg focus:border-navy focus:ring-2 focus:ring-navy/20 min-h-[100px] text-sm resize-y"
                placeholder="Write your reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                required
              />
              <div className="flex justify-end mt-3">
                <Button variant="primary" size="sm" type="submit" disabled={isSubmitting || !replyContent.trim()}>
                  {isSubmitting ? <Loader2 size={14} className="animate-spin mr-1" /> : <Send size={14} className="mr-1" />}
                  Post Reply
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
