'use client';

import React, { useState, useEffect } from 'react';
import { ModuleContent } from './content-types';
import { VideoPlayer } from '@/components/features/content/video-player';
import { AudioPlayer } from '@/components/features/content/audio-player';
import { PDFViewer } from '@/components/features/content/pdf-viewer';
import { SlidesViewer } from '@/components/features/content/slides-viewer';
import { EmbedViewer } from '@/components/features/content/embed-viewer';
import { ExamTaking } from '@/components/features/exam/exam-taking';
import { ExamResults } from '@/components/features/exam/exam-results';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, CheckCircle, FileText, Upload } from 'lucide-react';

interface ContentRendererProps {
  content: ModuleContent;
  isPreview?: boolean;
  onComplete?: () => void;
  // Quiz-specific props
  quizId?: string;
  quizTitle?: string;
  timeLimit?: number;
  passingScore?: number;
  questions?: any[];
  // Exam attempt props
  attemptId?: string;
  examResult?: any;
  onTakeQuiz?: () => void;
  onRetryQuiz?: () => void;
}

export function ContentRenderer({
  content,
  isPreview = false,
  onComplete,
  quizId,
  quizTitle,
  timeLimit,
  passingScore,
  questions,
  attemptId,
  examResult,
  onTakeQuiz,
  onRetryQuiz,
}: ContentRendererProps) {
  switch (content.type) {
    case 'VIDEO':
      return (
        <VideoPlayer
          url={content.url || ''}
          onComplete={onComplete}
        />
      );

    case 'AUDIO':
      return (
        <AudioPlayer
          url={content.url || ''}
          transcript={content.transcript}
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
          {onComplete && (
            <Button variant="outline" onClick={onComplete} className="mt-4">
              <CheckCircle size={16} className="mr-2" />
              Mark as Read
            </Button>
          )}
        </div>
      );

    case 'PDF':
      return (
        <PDFViewer
          url={content.url}
        />
      );

    case 'SLIDES':
      return (
        <SlidesViewer
          provider={content.provider}
          url={content.url}
          embedCode={content.embedCode}
          downloadUrl={content.downloadUrl}
          slideCount={content.slideCount}
        />
      );

    case 'LINK':
      return (
        <div className="bg-white rounded-xl p-6 shadow-md border border-grey-light">
          {content.thumbnail && (
            <img
              src={content.thumbnail}
              alt={content.title || 'Link thumbnail'}
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
          )}
          <h3 className="text-lg font-semibold text-navy mb-2">
            {content.title || 'External Resource'}
          </h3>
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
          url={content.url}
          isResponsive={content.isResponsive}
        />
      );

    case 'QUIZ':
      return (
        <QuizRenderer
          content={content}
          isPreview={isPreview}
          onComplete={onComplete}
          quizId={quizId}
          quizTitle={quizTitle}
          timeLimit={timeLimit}
          passingScore={passingScore}
          questions={questions}
          attemptId={attemptId}
          examResult={examResult}
          onTakeQuiz={onTakeQuiz}
          onRetryQuiz={onRetryQuiz}
        />
      );

    case 'ASSIGNMENT':
      return (
        <AssignmentRenderer content={content} isPreview={isPreview} />
      );

    case 'PAST_PAPER':
      return <PastPaperRenderer content={content} />;

    default:
      return (
        <div className="text-center py-12 text-grey-medium">
          Unsupported content type
        </div>
      );
  }
}

// --- Sub-components ---

function MarkdownRenderer({ content }: { content: string }) {
  // In production, use react-markdown with plugins
  return <div className="markdown-content">{content}</div>;
}

interface QuizRendererProps {
  content: any;
  isPreview: boolean;
  onComplete?: () => void;
  quizId?: string;
  quizTitle?: string;
  timeLimit?: number;
  passingScore?: number;
  questions?: any[];
  attemptId?: string;
  examResult?: any;
  onTakeQuiz?: () => void;
  onRetryQuiz?: () => void;
}

function QuizRenderer({
  content,
  isPreview,
  onComplete,
  quizId,
  quizTitle,
  timeLimit,
  passingScore,
  questions,
  attemptId,
  examResult,
  onTakeQuiz,
  onRetryQuiz,
}: QuizRendererProps) {
  // If we have exam results, show them
  if (examResult) {
    return (
      <div className="max-w-3xl mx-auto">
        <ExamResults
          result={{
            score: examResult.score,
            totalPoints: examResult.result?.totalPoints || 0,
            earnedPoints: examResult.result?.earnedPoints || 0,
            percentage: examResult.result?.percentage || 0,
            passed: examResult.result?.passed || false,
            passingScore: examResult.result?.passingScore || 60,
            timeSpent: examResult.attempt?.timeSpent || 0,
            completedAt: examResult.attempt?.completedAt || new Date(),
            questions: examResult.result?.details?.map((d: any) => ({
              questionId: d.questionId,
              questionText: '',
              correct: d.correct,
              points: d.points,
              maxPoints: d.maxPoints,
              correctAnswer: d.correctAnswer,
              studentAnswer: d.studentAnswer,
            })) || [],
          }}
          examTitle={quizTitle || 'Quiz'}
          courseTitle=""
          subject=""
          onRetry={onRetryQuiz}
          onReview={() => {}}
        />
      </div>
    );
  }

  // If we have questions and an attempt ID, show the exam taking interface
  if (questions && questions.length > 0 && attemptId && onTakeQuiz) {
    return (
      <ExamTaking
        examId={quizId || attemptId}
        examTitle={quizTitle || 'Quiz'}
        questions={questions}
        duration={timeLimit || 30}
        passingScore={passingScore || 60}
        onTimeUp={() => {}}
        onSubmit={async (answers) => {
          // Submit via API
          const response = await fetch(`/api/exams/${attemptId}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers }),
          });
          const result = await response.json();
          if (response.ok) {
            // Redirect to results page
            window.location.href = `/student/courses/${content.courseId || ''}/quiz/${quizId}/results?attempt=${attemptId}`;
          }
        }}
      />
    );
  }

  // Default: show quiz start screen
  const quizContent = content as any;
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-navy/10 rounded-xl flex items-center justify-center">
            <Play size={24} className="text-navy" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-navy">
              {quizContent.quizId ? 'Quiz' : 'Assessment'}
            </h3>
            <p className="text-sm text-grey-medium">
              Test your knowledge with this interactive quiz
            </p>
          </div>
        </div>

        {quizContent.questions && quizContent.questions.length > 0 && (
          <div className="space-y-2 mb-4">
            <Badge variant="info">
              {quizContent.questions.length} questions
            </Badge>
            {quizContent.timeLimit && (
              <Badge variant="neutral">
                {quizContent.timeLimit} min
              </Badge>
            )}
            <Badge variant="success">
              Passing: {quizContent.passingScore || 60}%
            </Badge>
          </div>
        )}

        {!isPreview && onTakeQuiz && (
          <Button variant="primary" onClick={onTakeQuiz}>
            Start Quiz
          </Button>
        )}

        {isPreview && (
          <p className="text-sm text-grey-medium">
            Quiz preview mode - students will be able to take this quiz when the course is published.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function AssignmentRenderer({ content, isPreview }: { content: any; isPreview: boolean }) {
  return (
    <div className="space-y-4">
      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content.instructions }} />
      {content.dueDate && (
        <p className="text-sm text-grey-medium">
          Due: {new Date(content.dueDate).toLocaleDateString()}
        </p>
      )}
      {!isPreview && (
        <div className="border-2 border-dashed border-grey-light rounded-lg p-8 text-center">
          <Upload size={32} className="mx-auto text-grey-medium mb-4" />
          <p className="text-grey-medium mb-4">Upload your assignment</p>
          <input
            type="file"
            accept={content.allowedFileTypes?.join(',')}
            className="hidden"
            id="assignment-upload"
          />
          <label
            htmlFor="assignment-upload"
            className="inline-block bg-navy text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-navy-light transition-colors"
          >
            Choose File
          </label>
          <p className="text-xs text-grey-medium mt-2">
            Max file size: {Math.round(content.maxFileSize / (1024 * 1024))}MB
          </p>
        </div>
      )}
    </div>
  );
}

function PastPaperRenderer({ content }: { content: any }) {
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
