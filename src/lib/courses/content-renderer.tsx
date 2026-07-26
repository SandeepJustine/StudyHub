'use client';

import React from 'react';
import { ModuleContent } from './content-types';
import dynamic from 'next/dynamic';

// Dynamically import heavy components
const VideoPlayer = dynamic(() => import('@/components/features/content/video-player'), {
  loading: () => <div className="animate-pulse bg-grey-light h-96 rounded-lg" />,
});

const AudioPlayer = dynamic(() => import('@/components/features/content/audio-player'), {
  loading: () => <div className="animate-pulse bg-grey-light h-24 rounded-lg" />,
});

const PDFViewer = dynamic(() => import('@/components/features/content/pdf-viewer'), {
  loading: () => <div className="animate-pulse bg-grey-light h-96 rounded-lg" />,
});

const SlidesViewer = dynamic(() => import('@/components/features/content/slides-viewer'), {
  loading: () => <div className="animate-pulse bg-grey-light h-96 rounded-lg" />,
});

const EmbedViewer = dynamic(() => import('@/components/features/content/embed-viewer'), {
  loading: () => <div className="animate-pulse bg-grey-light h-96 rounded-lg" />,
});

interface ContentRendererProps {
  content: ModuleContent;
  isPreview?: boolean;
  onComplete?: () => void;
}

export function ContentRenderer({ content, isPreview = false, onComplete }: ContentRendererProps) {
  switch (content.type) {
    case 'VIDEO':
      return (
        <VideoPlayer
          url={content.url}
          provider={content.provider}
          embedCode={content.embedCode}
          thumbnail={content.thumbnail}
          duration={content.duration}
          captions={content.captions}
          onComplete={onComplete}
        />
      );

    case 'AUDIO':
      return (
        <AudioPlayer
          url={content.url}
          provider={content.provider}
          embedCode={content.embedCode}
          transcript={content.transcript}
          downloadUrl={content.downloadUrl}
          onComplete={onComplete}
        />
      );

    case 'TEXT':
      return (
        <div className="prose prose-lg max-w-none">
          {content.format === 'MARKDOWN' ? (
            <MarkdownRenderer content={content.content} />
          ) : (
            <div dangerouslySetInnerHTML={{ __html: content.content }} />
          )}
          {content.estimatedReadTime && (
            <p className="text-sm text-grey-medium mt-4">
              📖 Estimated read time: {content.estimatedReadTime} minutes
            </p>
          )}
        </div>
      );

    case 'PDF':
      return (
        <PDFViewer
          url={content.url}
          downloadUrl={content.downloadUrl}
          embedUrl={content.embedUrl}
          pageCount={content.pageCount}
        />
      );

    case 'SLIDES':
      return (
        <SlidesViewer
          provider={content.provider}
          url={content.url}
          embedCode={content.embedCode}
          downloadUrl={content.downloadUrl}
        />
      );

    case 'LINK':
      return (
        <div className="bg-white rounded-xl p-6 shadow-md">
          {content.thumbnail && (
            <img
              src={content.thumbnail}
              alt={content.title}
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
          )}
          <h3 className="text-lg font-semibold text-navy mb-2">{content.title}</h3>
          {content.description && (
            <p className="text-grey-dark mb-4">{content.description}</p>
          )}
          <a
            href={content.url}
            target={content.isExternal ? '_blank' : '_self'}
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-red hover:text-red-700 font-medium"
          >
            {content.isExternal ? 'Open Link ↗' : 'View Content →'}
          </a>
        </div>
      );

    case 'EMBED':
      return (
        <EmbedViewer
          embedCode={content.embedCode}
          provider={content.provider}
          isResponsive={content.isResponsive}
        />
      );

    case 'QUIZ':
      return (
        <QuizRenderer
          content={content}
          isPreview={isPreview}
          onComplete={onComplete}
        />
      );

    case 'ASSIGNMENT':
      return (
        <AssignmentRenderer
          content={content}
          isPreview={isPreview}
        />
      );

    case 'PAST_PAPER':
      return (
        <PastPaperRenderer content={content} />
      );

    default:
      return (
        <div className="text-center py-12 text-grey-medium">
          Unsupported content type
        </div>
      );
  }
}

// Sub-components for different content types
function MarkdownRenderer({ content }: { content: string }) {
  // In production, use react-markdown with plugins
  return <div className="markdown-content">{content}</div>;
}

function QuizRenderer({ content, isPreview, onComplete }: any) {
  // Quiz rendering logic (reuse existing quiz components)
  return <div>Quiz Component (reuse from exam engine)</div>;
}

function AssignmentRenderer({ content, isPreview }: any) {
  return (
    <div className="space-y-4">
      <div className="prose" dangerouslySetInnerHTML={{ __html: content.instructions }} />
      {content.dueDate && (
        <p className="text-sm text-grey-medium">
          Due: {new Date(content.dueDate).toLocaleDateString()}
        </p>
      )}
      {!isPreview && (
        <AssignmentSubmissionForm assignment={content} />
      )}
    </div>
  );
}

function AssignmentSubmissionForm({ assignment }: any) {
  return (
    <div className="border-2 border-dashed border-grey-light rounded-lg p-8 text-center">
      <p className="text-grey-medium mb-4">Upload your assignment</p>
      <input type="file" accept={assignment.allowedFileTypes?.join(',')} />
      <p className="text-xs text-grey-medium mt-2">
        Max file size: {Math.round(assignment.maxFileSize / (1024 * 1024))}MB
      </p>
    </div>
  );
}

function PastPaperRenderer({ content }: any) {
  return (
    <div>
      <div className="bg-navy/5 rounded-lg p-4 mb-4">
        <p><strong>Exam Board:</strong> {content.examBoard}</p>
        <p><strong>Year:</strong> {content.year}</p>
        <p><strong>Subject:</strong> {content.subject}</p>
        <p><strong>Duration:</strong> {content.duration} minutes</p>
      </div>
      <PDFViewer url={content.pdfUrl} />
      {content.markingSchemeUrl && (
        <a
          href={content.markingSchemeUrl}
          className="text-red hover:text-red-700 mt-4 inline-block"
        >
          Download Marking Scheme
        </a>
      )}
    </div>
  );
}