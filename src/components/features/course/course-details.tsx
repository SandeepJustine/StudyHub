'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Star,
  Clock,
  Users,
  BookOpen,
  Play,
  FileText,
  Award,
  Calendar,
  Globe,
  BarChart3,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Download,
  Share2,
  Heart,
  Send,
} from 'lucide-react';
import { formatCurrency, formatDuration, formatDate } from '@/utils/formatters';

interface Module {
  id: string;
  title: string;
  contentType: 'VIDEO' | 'AUDIO' | 'TEXT' | 'PDF' | 'QUIZ' | 'ASSIGNMENT';
  duration?: number;
  isPreview: boolean;
}

interface Review {
  id: string;
  studentName: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

interface CourseDetailsProps {
  course: {
    id: string;
    title: string;
    description?: string;
    subject: string;
    examBoard?: string;
    grade?: string;
    price: number;
    thumbnail?: string;
    rating: number;
    reviewsCount: number;
    studentsCount: number;
    duration: number;
    modulesCount: number;
    language: string;
    tags?: string[];
    publishedAt?: Date;
    instructor: {
      id: string;
      user: {
        fullName: string;
        avatar?: string;
        bio?: string;
      };
      rating: number;
      studentsCount: number;
      coursesCount: number;
    };
    modules: Module[];
    reviews?: Review[];
  };
  enrollmentStatus?: 'not_enrolled' | 'enrolled' | 'completed' | 'payment_pending';
  enrollmentProgress?: number;
  onEnroll: (courseId: string) => void;
  onContinue?: (courseId: string) => void;
  onStartModule?: (moduleId: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (courseId: string) => void;
  onSubmitReview?: (rating: number, comment: string, isAnonymous: boolean) => Promise<void>;
  hasReviewed?: boolean;
}

export function CourseDetails({
  course,
  enrollmentStatus,
  enrollmentProgress = 0,
  onEnroll,
  onContinue,
  onStartModule,
  isFavorite = false,
  onToggleFavorite,
  onSubmitReview,
  hasReviewed = false,
}: CourseDetailsProps) {
  const [expandedModules, setExpandedModules] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const contentTypeIcons: Record<string, React.ReactNode> = {
    VIDEO: <Play size={14} />,
    AUDIO: <Play size={14} />,
    TEXT: <FileText size={14} />,
    PDF: <FileText size={14} />,
    QUIZ: <FileText size={14} />,
    ASSIGNMENT: <FileText size={14} />,
  };

  const handleSubmitReview = async () => {
    if (!onSubmitReview || reviewRating === 0) return;
    setIsSubmittingReview(true);
    try {
      await onSubmitReview(reviewRating, reviewComment, false);
      setReviewSubmitted(true);
      setReviewRating(0);
      setReviewComment('');
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const showReviewForm = (enrollmentStatus === 'enrolled' || enrollmentStatus === 'completed') && !hasReviewed;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Course Header */}
        <Card padding="lg">
          {/* Thumbnail */}
          {course.thumbnail && (
            <div className="relative h-64 -mx-6 -mt-6 mb-6 rounded-t-xl overflow-hidden bg-navy/5">
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-full object-cover"
              />
              {course.price > 0 && (
                <Badge variant="info" className="absolute top-4 right-4 text-lg px-4 py-2">
                  {formatCurrency(course.price)}
                </Badge>
              )}
            </div>
          )}

          {/* Title & Meta */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="info">{course.subject}</Badge>
                {course.examBoard && <Badge variant="neutral">{course.examBoard}</Badge>}
                {course.grade && <Badge variant="neutral">{course.grade}</Badge>}
              </div>
              <h1 className="text-2xl font-bold text-navy">{course.title}</h1>
            </div>
            {onToggleFavorite && (
              <button
                onClick={() => onToggleFavorite(course.id)}
                className={`p-2 rounded-lg transition-colors ${
                  isFavorite ? 'text-red bg-red-50' : 'text-grey-medium hover:text-red hover:bg-red-50'
                }`}
              >
                <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-1 text-sm">
              <Star size={16} className="text-yellow-500 fill-yellow-500" />
              <span className="font-medium">{course.rating.toFixed(1)}</span>
              <span className="text-grey-medium">({course.reviewsCount} reviews)</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-grey-medium">
              <Users size={16} />
              <span>{course.studentsCount} students</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-grey-medium">
              <Clock size={16} />
              <span>{formatDuration(course.duration)}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-grey-medium">
              <BookOpen size={16} />
              <span>{course.modulesCount} modules</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-grey-medium">
              <Globe size={16} />
              <span>{course.language === 'en' ? 'English' : course.language}</span>
            </div>
          </div>

          {/* Enrollment Status */}
          {enrollmentStatus === 'payment_pending' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <Clock size={24} className="text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">Payment Pending</p>
                  <p className="text-sm text-yellow-700">
                    Your payment is being processed. You will be able to access the course content once payment is confirmed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {enrollmentStatus === 'enrolled' && (
            <div className="bg-navy/5 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-navy">Your Progress</span>
                <span className="text-sm font-bold text-navy">{Math.round(enrollmentProgress)}%</span>
              </div>
              <Progress value={enrollmentProgress} size="md" variant="success" />
              <Button variant="primary" size="sm" className="mt-3" onClick={() => onContinue?.(course.id)}>
                Continue Learning
              </Button>
            </div>
          )}

          {enrollmentStatus === 'completed' && (
            <div className="bg-green-50 rounded-xl p-4 mb-6 flex items-center gap-3">
              <Award size={24} className="text-green" />
              <div>
                <p className="font-medium text-green-800">Course Completed!</p>
                <p className="text-sm text-green-700">You've successfully completed this course.</p>
              </div>
            </div>
          )}

          {/* Tags */}
          {course.tags && course.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {course.tags.map(tag => (
                <Badge key={tag} variant="neutral" size="sm">{tag}</Badge>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {enrollmentStatus === 'not_enrolled' && (
              <Button variant="primary" size="lg" onClick={() => onEnroll(course.id)}>
                {course.price > 0 ? `Enroll Now - ${formatCurrency(course.price)}` : 'Enroll Free'}
              </Button>
            )}
            {enrollmentStatus === 'payment_pending' && (
              <Button variant="outline" size="lg" disabled>
                Payment Pending
              </Button>
            )}
            <Button variant="outline" size="lg" leftIcon={<Share2 size={16} />}>
              Share
            </Button>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full border-b border-grey-light pb-0">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({course.reviewsCount})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="pt-6">
            <Card padding="lg">
              <h3 className="text-lg font-semibold text-navy mb-4">About This Course</h3>
              <p className="text-grey-dark leading-relaxed whitespace-pre-line">
                {course.description || 'No description available.'}
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="curriculum" className="pt-6">
            <Card padding="lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-navy">
                  Course Curriculum ({course.modules.length} modules)
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedModules(!expandedModules)}
                >
                  {expandedModules ? 'Collapse All' : 'Expand All'}
                </Button>
              </div>

              <div className="space-y-1">
                {course.modules.map((module, index) => (
                  <div key={module.id} className="border border-grey-light rounded-lg overflow-hidden">
                    <div
                      onClick={() => setExpandedModules(!expandedModules)}
                      className="w-full flex items-center gap-3 p-4 hover:bg-grey-light/30 transition-colors text-left"
                    > {/* Changed from <button> to <div> */}
                      <span className="text-sm text-grey-medium font-mono">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-navy text-sm">{module.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="flex items-center gap-1 text-xs text-grey-medium">
                            {contentTypeIcons[module.contentType]}
                            {module.contentType}
                          </span>
                          {module.duration && (
                            <span className="text-xs text-grey-medium">
                              • {formatDuration(module.duration)}
                            </span>
                          )}
                        </div>
                      </div>
                      {module.isPreview && (
                        <Badge variant="success" size="sm">
                          Preview
                        </Badge>
                      )}
                      <div className="flex items-center gap-2 ml-auto">
                        {onStartModule && (module.isPreview || enrollmentStatus === 'enrolled' || enrollmentStatus === 'completed') && enrollmentStatus !== 'payment_pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); onStartModule(module.id); }}
                            className="text-red hover:bg-red/10 hover:text-red"
                          >
                            {module.isPreview && enrollmentStatus === 'not_enrolled' ? 'Preview' : 'Start'}
                          </Button>
                        )}
                        {expandedModules ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div> {/* Changed from </button> to </div> */}
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="pt-6">
            <Card padding="lg">
              {showReviewForm && !reviewSubmitted && (
                <div className="mb-6 p-4 bg-navy/5 rounded-xl">
                  <h4 className="font-semibold text-navy mb-3">Write a Review</h4>
                  <div className="flex items-center gap-2 mb-3">
                    {[1, 2, 3, 4, 5].map(i => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setReviewRating(i)}
                        className="p-1 transition-colors"
                      >
                        <Star
                          size={24}
                          className={i <= reviewRating ? 'text-yellow-500 fill-yellow-500' : 'text-grey-light hover:text-yellow-400'}
                        />
                      </button>
                    ))}
                    <span className="text-sm text-grey-medium ml-2">
                      {reviewRating > 0 ? `${reviewRating} / 5` : 'Select a rating'}
                    </span>
                  </div>
                  <Textarea
                    placeholder="Share your experience with this course..."
                    value={reviewComment}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReviewComment(e.target.value)}
                    className="mb-3"
                    rows={3}
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSubmitReview}
                    loading={isSubmittingReview}
                    disabled={reviewRating === 0}
                    leftIcon={<Send size={14} />}
                  >
                    Submit Review
                  </Button>
                </div>
              )}

              {reviewSubmitted && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-sm text-green-800 font-medium">Thank you for your review!</p>
                </div>
              )}

              <div className="flex items-center gap-4 mb-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-navy">{course.rating.toFixed(1)}</p>
                  <div className="flex gap-0.5 justify-center my-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star
                        key={i}
                        size={14}
                        className={i <= Math.round(course.rating) ? 'text-yellow-500 fill-yellow-500' : 'text-grey-light'}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-grey-medium">{course.reviewsCount} reviews</p>
                </div>
                <div className="flex-1 space-y-1">
                  {[5, 4, 3, 2, 1].map(star => (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs text-grey-medium w-8">{star} ★</span>
                      <Progress
                        value={course.reviews?.filter(r => r.rating === star).length || 0}
                        max={course.reviewsCount || 1}
                        size="sm"
                        variant={star >= 4 ? 'success' : star === 3 ? 'warning' : 'default'}
                        className="flex-1"
                      />
                      <span className="text-xs text-grey-medium w-8">
                        {course.reviews?.filter(r => r.rating === star).length || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {course.reviews?.map((review) => (
                  <div key={review.id} className="border-b border-grey-light pb-4 last:border-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-navy">
                          {review.studentName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-navy">{review.studentName}</p>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star
                              key={i}
                              size={12}
                              className={i <= review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-grey-light'}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-grey-medium ml-auto">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-grey-dark">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Instructor Card */}
        <Card padding="lg">
          <h3 className="font-semibold text-navy mb-4">Instructor</h3>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-navy/10 flex items-center justify-center">
              <span className="text-lg font-bold text-navy">
                {course.instructor.user.fullName.charAt(0)}
              </span>
            </div>
            <div>
              <p className="font-medium text-navy">{course.instructor.user.fullName}</p>
              <p className="text-xs text-grey-medium">{course.instructor.user.bio?.substring(0, 60)}...</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="font-bold text-navy">{course.instructor.coursesCount}</p>
              <p className="text-xs text-grey-medium">Courses</p>
            </div>
            <div>
              <p className="font-bold text-navy">{course.instructor.studentsCount}</p>
              <p className="text-xs text-grey-medium">Students</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1">
                <Star size={12} className="text-yellow-500 fill-yellow-500" />
                <span className="font-bold text-navy">{course.instructor.rating.toFixed(1)}</span>
              </div>
              <p className="text-xs text-grey-medium">Rating</p>
            </div>
          </div>
        </Card>

        {/* Course Stats */}
        <Card padding="lg">
          <h3 className="font-semibold text-navy mb-4">Course Stats</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <BarChart3 size={16} className="text-grey-medium" />
              <span className="text-grey-dark">{course.studentsCount} enrolled</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MessageSquare size={16} className="text-grey-medium" />
              <span className="text-grey-dark">{course.reviewsCount} reviews</span>
            </div>
            {course.publishedAt && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={16} className="text-grey-medium" />
                <span className="text-grey-dark">Published {formatDate(course.publishedAt)}</span>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}