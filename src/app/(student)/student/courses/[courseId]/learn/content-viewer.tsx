'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VideoPlayer } from '@/components/features/content/video-player';
import { AudioPlayer } from '@/components/features/content/audio-player';
import { PDFViewer } from '@/components/features/content/pdf-viewer';
import { SlidesViewer } from '@/components/features/content/slides-viewer';
import { EmbedViewer } from '@/components/features/content/embed-viewer';
import { isYouTubeUrl } from '@/utils/helpers';
import { formatDuration } from '@/utils/formatters';
import {
  CheckCircle,
  Play,
  FileText,
  Clock,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ModuleInfo {
  id: string;
  title: string;
  contentType: string;
  duration?: number;
  order: number;
}

interface CourseInfo {
  id: string;
  title: string;
  modules: ModuleInfo[];
}

interface CurrentModuleInfo {
  id: string;
  title: string;
  contentType: string;
  contentUrl?: string;
  contentData?: any;
  duration?: number;
  thumbnailUrl?: string;
  embedCode?: string;
  order: number;
  quiz?: {
    id: string;
    title: string;
    timeLimit?: number;
    passingScore?: number;
    questions?: any[];
  };
}

interface ModuleProgressInfo {
  completed: boolean;
  progress: number;
  timeSpent: number;
}

interface ContentViewerProps {
  course: CourseInfo;
  currentModule: CurrentModuleInfo;
  moduleProgress: ModuleProgressInfo | null;
  moduleContent: any;
  enrollmentId: string;
  courseId: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const contentTypeIcons: Record<string, JSX.Element> = {
  VIDEO: <Play size={16} />,
  AUDIO: <Play size={16} />,
  TEXT: <FileText size={16} />,
  PDF: <FileText size={16} />,
  QUIZ: <FileText size={16} />,
  SLIDES: <FileText size={16} />,
  LINK: <FileText size={16} />,
  EMBED: <FileText size={16} />,
};

const getContentTypeLabel = (type: string): string => {
  return type.charAt(0) + type.slice(1).toLowerCase();
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ContentViewer({
  course,
  currentModule,
  moduleProgress,
  moduleContent,
  enrollmentId,
  courseId,
}: ContentViewerProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const router = useRouter();

  // ------------------------------------------------------------------
  // Event handlers
  // ------------------------------------------------------------------

  const handleComplete = async () => {
    if (!currentModule || isCompleting) return;

    setIsCompleting(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: currentModule.id,
          completed: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to mark module as complete:', error);
      }

      router.refresh();
    } catch (err) {
      console.error('Failed to mark module as complete:', err);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleNavigateModule = (moduleId: string) => {
    router.push(`/student/courses/${courseId}/learn?module=${moduleId}`);
  };

  const handlePrevious = () => {
    const currentIndex = course.modules.findIndex((m) => m.id === currentModule.id);
    if (currentIndex > 0) {
      handleNavigateModule(course.modules[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    const currentIndex = course.modules.findIndex((m) => m.id === currentModule.id);
    if (currentIndex < course.modules.length - 1) {
      handleNavigateModule(course.modules[currentIndex + 1].id);
    }
  };

  // ------------------------------------------------------------------
  // Derived state
  // ------------------------------------------------------------------

  const currentIndex = course.modules.findIndex((m) => m.id === currentModule.id);
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < course.modules.length - 1;
  const isCurrentModuleCompleted = moduleProgress?.completed || false;

  // ------------------------------------------------------------------
  // Content rendering
  // ------------------------------------------------------------------

  const renderContent = () => {
    if (!moduleContent) {
      return (
        <div className="flex items-center justify-center h-96">
          <p className="text-grey-medium">No content available for this module.</p>
        </div>
      );
    }

    switch (moduleContent.type) {
      case 'VIDEO': {
        const isYouTube = moduleContent.url && isYouTubeUrl(moduleContent.url);

        return (
          <div className="w-full h-full">
            <VideoPlayer
              url={moduleContent.url}
              poster={moduleContent.thumbnail}
              onComplete={handleComplete}
            />
            {!isYouTube && (
              <div className="mt-4">
                <button
                  onClick={handleComplete}
                  disabled={isCompleting}
                  className="px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy-light transition-colors disabled:opacity-50"
                >
                  {isCompleting ? 'Completing...' : 'Mark as Complete'}
                </button>
              </div>
            )}
          </div>
        );
      }

      case 'AUDIO':
        return (
          <div className="w-full">
            <AudioPlayer
              url={moduleContent.url}
              duration={moduleContent.duration}
              thumbnail={moduleContent.thumbnail}
              onComplete={handleComplete}
            />
            <div className="mt-4">
              <button
                onClick={handleComplete}
                disabled={isCompleting}
                className="px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy-light transition-colors disabled:opacity-50"
              >
                {isCompleting ? 'Completing...' : 'Mark as Complete'}
              </button>
            </div>
          </div>
        );

      case 'TEXT':
        return (
          <div className="prose prose-lg max-w-none">
            {moduleContent.format === 'HTML' ? (
              <div dangerouslySetInnerHTML={{ __html: moduleContent.content || '' }} />
            ) : (
              <div>{moduleContent.content}</div>
            )}
            {moduleContent.estimatedReadTime && (
              <p className="text-sm text-grey-medium mt-4">
                📖 Estimated read time: {moduleContent.estimatedReadTime} minutes
              </p>
            )}
            <div className="mt-4">
              <button
                onClick={handleComplete}
                disabled={isCompleting}
                className="px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy-light transition-colors disabled:opacity-50"
              >
                {isCompleting ? 'Completing...' : 'Mark as Read'}
              </button>
            </div>
          </div>
        );

      case 'PDF':
        return (
          <div className="w-full">
            <PDFViewer
              url={moduleContent.url}
              downloadUrl={moduleContent.downloadUrl}
            />
            <div className="mt-4">
              <button
                onClick={handleComplete}
                disabled={isCompleting}
                className="px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy-light transition-colors disabled:opacity-50"
              >
                {isCompleting ? 'Completing...' : 'Mark as Complete'}
              </button>
            </div>
          </div>
        );

      case 'SLIDES':
        return (
          <div className="w-full">
            <SlidesViewer
              url={moduleContent.url}
              embedCode={moduleContent.embedCode}
            />
            <div className="mt-4">
              <button
                onClick={handleComplete}
                disabled={isCompleting}
                className="px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy-light transition-colors disabled:opacity-50"
              >
                {isCompleting ? 'Completing...' : 'Mark as Complete'}
              </button>
            </div>
          </div>
        );

      case 'LINK':
        return (
          <div className="bg-white rounded-xl p-6 shadow-md border border-grey-light">
            <h2 className="text-xl font-bold mb-2">
              {moduleContent.title || 'External Resource'}
            </h2>
            <p className="text-grey-dark mb-4">
              This content is hosted on an external website. Click the button below to
              access it.
            </p>
            <a
              href={moduleContent.url}
              target={moduleContent.isExternal ? '_blank' : '_self'}
              rel={moduleContent.isExternal ? 'noopener noreferrer' : undefined}
              className="inline-block px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy-light transition-colors"
            >
              Open Resource
            </a>
            <div className="mt-4">
              <button
                onClick={handleComplete}
                disabled={isCompleting}
                className="px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy-light transition-colors disabled:opacity-50"
              >
                {isCompleting ? 'Completing...' : 'Mark as Complete'}
              </button>
            </div>
          </div>
        );

      case 'EMBED':
        return (
          <div className="w-full">
            <EmbedViewer
              embedCode={moduleContent.embedCode || moduleContent.url}
              isResponsive={moduleContent.isResponsive}
            />
            <div className="mt-4">
              <button
                onClick={handleComplete}
                disabled={isCompleting}
                className="px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy-light transition-colors disabled:opacity-50"
              >
                {isCompleting ? 'Completing...' : 'Mark as Complete'}
              </button>
            </div>
          </div>
        );

      case 'QUIZ':
        return (
          <div className="bg-white rounded-xl p-6 shadow-md border border-grey-light">
            <h2 className="text-xl font-bold mb-2">
              {moduleContent.title || 'Quiz'}
            </h2>
            {moduleContent.timeLimit && (
              <p className="text-grey-dark mb-2">
                Time Limit: {moduleContent.timeLimit} minutes
              </p>
            )}
            {moduleContent.passingScore !== undefined && (
              <p className="text-grey-dark mb-4">
                Passing Score: {moduleContent.passingScore}%
              </p>
            )}
            <a
              href={`/student/courses/${courseId}/quiz/${moduleContent.quizId}`}
              className="inline-block px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy-light transition-colors"
            >
              Start Quiz
            </a>
          </div>
        );

      default:
        return (
          <div className="p-4">
            <p className="text-grey-medium">
              Unsupported content type: {moduleContent.type}
            </p>
          </div>
        );
    }
  };

  // ------------------------------------------------------------------
  // Guard: no modules
  // ------------------------------------------------------------------

  if (!currentModule) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-grey-medium">No modules available for this course.</p>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  return (
    <div className="flex h-screen bg-grey-light">
      {/* ── Sidebar ────────────────────────────────────────────── */}
      <div
        className={`${
          isSidebarOpen ? 'w-80' : 'w-0'
        } transition-all duration-300 overflow-hidden bg-white border-r border-grey-light flex flex-col`}
      >
        <div className="p-4 border-b border-grey-light flex items-center justify-between">
          <h3 className="font-semibold text-navy">Course Content</h3>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 hover:bg-grey-light/50 rounded"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-1">
            {course.modules.map((module, index) => {
              const isCurrent = module.id === currentModule.id;
              const isCompleted =
                moduleProgress?.completed && module.id === currentModule.id;

              return (
                <button
                  key={module.id}
                  onClick={() => handleNavigateModule(module.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                    isCurrent
                      ? 'bg-navy/10 border-l-2 border-navy'
                      : isCompleted
                      ? 'bg-green-50 hover:bg-green-100'
                      : 'hover:bg-grey-light/50'
                  }`}
                >
                  {/* Module number / check */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isCompleted
                        ? 'bg-green text-white'
                        : isCurrent
                        ? 'bg-navy text-white'
                        : 'bg-navy/10 text-navy'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle size={14} />
                    ) : (
                      <span className="text-xs font-medium">{index + 1}</span>
                    )}
                  </div>

                  {/* Module info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-medium truncate text-sm ${
                        isCompleted
                          ? 'text-green-800'
                          : isCurrent
                          ? 'text-navy'
                          : 'text-navy'
                      }`}
                    >
                      {module.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-grey-medium">
                      {contentTypeIcons[module.contentType] || (
                        <FileText size={16} />
                      )}
                      <span>{getContentTypeLabel(module.contentType)}</span>
                      {module.duration && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatDuration(module.duration)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Completion indicator */}
                  {isCompleted && (
                    <CheckCircle size={16} className="text-green flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-grey-light p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-1 hover:bg-grey-light/50 rounded"
              >
                <Menu size={20} />
              </button>
            )}
            <div>
              <h1 className="text-lg font-bold text-navy">{course.title}</h1>
              <p className="text-sm text-grey-medium">{currentModule.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isCurrentModuleCompleted ? (
              <span className="flex items-center gap-1 text-green text-sm">
                <CheckCircle size={16} />
                Completed
              </span>
            ) : (
              <button
                onClick={handleComplete}
                disabled={isCompleting}
                className="px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy-light transition-colors disabled:opacity-50"
              >
                {isCompleting ? 'Completing...' : 'Mark as Complete'}
              </button>
            )}
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6">{renderContent()}</div>

        {/* Footer navigation */}
        <div className="bg-white border-t border-grey-light p-4 flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={!canGoPrevious}
            className="px-4 py-2 flex items-center gap-2 text-navy hover:bg-grey-light/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={!canGoNext}
            className="px-4 py-2 flex items-center gap-2 bg-navy text-white rounded-lg hover:bg-navy-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
