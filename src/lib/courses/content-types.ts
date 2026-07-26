/**
 * Extended content type definitions for multimedia support
 */

export type ContentType = 
  | 'VIDEO' 
  | 'AUDIO' 
  | 'TEXT' 
  | 'PDF' 
  | 'SLIDES' 
  | 'LINK' 
  | 'EMBED' 
  | 'QUIZ' 
  | 'ASSIGNMENT'
  | 'PAST_PAPER';

export type VideoProvider = 
  | 'YOUTUBE' 
  | 'VIMEO' 
  | 'WISTIA' 
  | 'LOOM' 
  | 'DIRECT' 
  | 'UPLOAD';

export type AudioProvider = 
  | 'SOUNDCLOUD' 
  | 'SPOTIFY' 
  | 'DIRECT' 
  | 'UPLOAD';

export type EmbedProvider = 
  | 'GOOGLE_SLIDES' 
  | 'CANVA' 
  | 'FIGMA' 
  | 'NOTION' 
  | 'MIRO' 
  | 'GENIALLY' 
  | 'OTHER';

export interface VideoContent {
  type: 'VIDEO';
  provider: VideoProvider;
  url?: string;
  embedCode?: string;
  duration?: number; // seconds
  thumbnail?: string;
  captions?: Array<{
    language: string;
    url: string;
  }>;
  streamingUrl?: string;
  downloadUrl?: string;
}

export interface AudioContent {
  type: 'AUDIO';
  provider: AudioProvider;
  url?: string;
  embedCode?: string;
  duration?: number; // seconds
  thumbnail?: string;
  transcript?: string;
  downloadUrl?: string;
}

export interface TextContent {
  type: 'TEXT';
  format: 'PLAIN' | 'MARKDOWN' | 'HTML' | 'RICH_TEXT';
  content: string;
  wordCount?: number;
  estimatedReadTime?: number; // minutes
}

export interface PDFContent {
  type: 'PDF';
  url: string;
  downloadUrl?: string;
  pageCount?: number;
  embedUrl?: string;
  password?: string; // For protected PDFs
}

export interface SlidesContent {
  type: 'SLIDES';
  provider?: EmbedProvider;
  url?: string;
  embedCode?: string;
  slideCount?: number;
  downloadUrl?: string;
}

export interface LinkContent {
  type: 'LINK';
  url: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  isExternal: boolean;
  requiresLogin?: boolean;
}

export interface EmbedContent {
  type: 'EMBED';
  provider: EmbedProvider;
  embedCode: string;
  url?: string;
  width?: number;
  height?: number;
  isResponsive: boolean;
}

export interface QuizContent {
  type: 'QUIZ';
  quizId?: string;
  // Or inline quiz data
  questions?: Array<{
    question: string;
    type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
    options?: string[];
    correctAnswer: string | string[];
    explanation?: string;
  }>;
  timeLimit?: number;
  passingScore?: number;
}

export interface AssignmentContent {
  type: 'ASSIGNMENT';
  instructions: string;
  dueDate?: Date;
  maxScore: number;
  allowedFileTypes?: string[];
  maxFileSize?: number;
  rubric?: Array<{
    criteria: string;
    points: number;
    description: string;
  }>;
}

export interface PastPaperContent {
  type: 'PAST_PAPER';
  examBoard: string;
  year: number;
  paperNumber: number;
  subject: string;
  pdfUrl: string;
  markingSchemeUrl?: string;
  duration: number; // minutes
}

export type ModuleContent = 
  | VideoContent 
  | AudioContent 
  | TextContent 
  | PDFContent 
  | SlidesContent 
  | LinkContent 
  | EmbedContent 
  | QuizContent 
  | AssignmentContent 
  | PastPaperContent;

export interface ContentMetadata {
  type: ContentType;
  title: string;
  description?: string;
  tags?: string[];
  language?: string;
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  estimatedTime?: number; // minutes
  isDownloadable: boolean;
  isPreviewable: boolean;
  requiresSubscription: boolean;
  createdAt: Date;
  updatedAt: Date;
}