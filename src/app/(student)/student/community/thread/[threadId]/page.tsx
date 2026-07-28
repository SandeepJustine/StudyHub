'use client';

import { useState } from 'react';
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

// Mock thread data
const MOCK_THREAD = {
  id: '1',
  title: 'Tips for MSCE Mathematics Paper 1',
  content: 'I wanted to share some strategies that helped me score well on the MSCE Math Paper 1. First, always start with the questions you\'re most confident about. Don\'t spend too much time on one problem - mark it and come back later.\n\nFor multiple choice, eliminate obviously wrong answers first. This increases your chances significantly. For the structured questions, show ALL your working - you can get partial credit even if the final answer is wrong.\n\nPractice past papers under timed conditions. This helps you manage your time better during the actual exam. I recommend doing at least 5 past papers before the exam.\n\nWhat strategies have worked for you? Share below! 👇',
  subject: 'Mathematics',
  tags: ['MSCE', 'Mathematics', 'Exam Tips', 'Study Strategy'],
  viewsCount: 156,
  postsCount: 4,
  isPinned: true,
  isLocked: false,
  createdAt: new Date(Date.now() - 3600000),
  author: { fullName: 'John Phiri', role: 'STUDENT' },
  forum: { id: '1', name: 'MSCE Mathematics', slug: 'msce-math' },
  posts: [
    { id: 'p1', content: 'Great tips! I also find that drawing diagrams for geometry problems helps a lot.', createdAt: new Date(Date.now() - 1800000), likes: 5, isDeleted: false, author: { fullName: 'Mary Banda', role: 'STUDENT' } },
    { id: 'p2', content: 'I agree with the past papers strategy. I did 10 past papers and my score improved by 20%!', createdAt: new Date(Date.now() - 900000), likes: 3, isDeleted: false, author: { fullName: 'Peter Kamanga', role: 'STUDENT' } },
    { id: 'p3', content: 'For algebra questions, always check your answer by plugging it back into the original equation. Saved me many times!', createdAt: new Date(Date.now() - 360000), likes: 8, isDeleted: false, author: { fullName: 'Dr. Sarah Mwenda', role: 'INSTRUCTOR' } },
    { id: 'p4', content: 'Does anyone have recommendations for good math past paper books?', createdAt: new Date(Date.now() - 120000), likes: 1, isDeleted: false, author: { fullName: 'Grace Mwale', role: 'STUDENT' } },
  ],
};

export default function ThreadPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);

  if (status === 'loading') {
    return <div className="p-6 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-navy" /></div>;
  }
  if (status === 'unauthenticated') { router.push('/auth/login'); return null; }

  const thread = MOCK_THREAD;

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    setIsSubmitting(true);
    try {
      await new Promise(r => setTimeout(r, 500));
      setToast({ message: 'Reply posted!', type: 'success' });
      setReplyContent('');
    } catch {
      setToast({ message: 'Failed to post reply', type: 'error' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const toggleLike = (postId: string) => {
    setLikedPosts(prev => prev.includes(postId) ? prev.filter(p => p !== postId) : [...prev, postId]);
  };

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