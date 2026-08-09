import prisma from '@/lib/utils/prisma';
import { AppError, ValidationError } from '@/lib/utils/errors';
import { 
  ModuleContent, 
  ContentType, 
  VideoProvider, 
  AudioProvider, 
  EmbedProvider,
  VideoContent,
  AudioContent,
  TextContent,
  PDFContent,
  SlidesContent,
  LinkContent,
  QuizContent,
  AssignmentContent,
  PastPaperContent
} from './content-types';

export class MultimediaService {
  // Supported file upload configurations
  private supportedFormats = {
    VIDEO: {
      extensions: ['.mp4', '.webm', '.mov', '.avi', '.mkv'],
      maxSize: 500 * 1024 * 1024, // 500MB
      mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
    },
    AUDIO: {
      extensions: ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'],
      maxSize: 100 * 1024 * 1024, // 100MB
      mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac'],
    },
    PDF: {
      extensions: ['.pdf'],
      maxSize: 50 * 1024 * 1024, // 50MB
      mimeTypes: ['application/pdf'],
    },
    SLIDES: {
      extensions: ['.ppt', '.pptx', '.pdf', '.key'],
      maxSize: 100 * 1024 * 1024, // 100MB
      mimeTypes: [
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      ],
    },
    IMAGE: {
      extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
      maxSize: 10 * 1024 * 1024, // 10MB
      mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    },
  };

  /**
   * Validate and process content based on type
   */
  async processContent(contentData: any, contentType: ContentType): Promise<ModuleContent> {
    switch (contentType) {
      case 'VIDEO':
        return this.processVideoContent(contentData);
      case 'AUDIO':
        return this.processAudioContent(contentData);
      case 'TEXT':
        return this.processTextContent(contentData);
      case 'PDF':
        return this.processPDFContent(contentData);
      case 'SLIDES':
        return this.processSlidesContent(contentData);
      case 'LINK':
        return this.processLinkContent(contentData);
      case 'EMBED':
        return this.processEmbedContent(contentData);
      case 'QUIZ':
        return this.processQuizContent(contentData);
      case 'ASSIGNMENT':
        return this.processAssignmentContent(contentData);
      case 'PAST_PAPER':
        return this.processPastPaperContent(contentData);
      default:
        throw new ValidationError('Unsupported content type', {
          contentType: [`Type ${contentType} is not supported`],
        });
    }
  }

  /**
   * Process video content (upload or link)
   */
  private async processVideoContent(data: any): Promise<VideoContent> {
    const { provider, url, file, embedCode } = data;

    // Handle direct upload
    if (provider === 'UPLOAD' && file) {
      this.validateFile(file, 'VIDEO');
      
      // In production, upload to cloud storage (S3, Cloudinary, etc.)
      const uploadResult = await this.uploadToStorage(file, 'videos');
      
      return {
        type: 'VIDEO',
        provider: 'UPLOAD',
        url: uploadResult.url,
        downloadUrl: uploadResult.downloadUrl,
        duration: file.duration || 0,
        thumbnail: uploadResult.thumbnail,
      };
    }

    // Handle YouTube/Vimeo/other links
    if (url) {
      const processedUrl = await this.processVideoUrl(url, provider);
      
      return {
        type: 'VIDEO',
        provider: processedUrl.provider,
        url: processedUrl.url,
        embedCode: processedUrl.embedCode,
        duration: processedUrl.duration,
        thumbnail: processedUrl.thumbnail,
        captions: processedUrl.captions,
      };
    }

    // Handle embed code
    if (embedCode) {
      return {
        type: 'VIDEO',
        provider: provider || 'DIRECT',
        embedCode: this.sanitizeEmbedCode(embedCode),
      };
    }

    throw new ValidationError('Invalid video content', {
      video: ['Must provide either file upload, URL, or embed code'],
    });
  }

  /**
   * Process audio content
   */
  private async processAudioContent(data: any): Promise<AudioContent> {
    const { provider, url, file, embedCode } = data;

    // Handle direct upload
    if (provider === 'UPLOAD' && file) {
      this.validateFile(file, 'AUDIO');
      
      const uploadResult = await this.uploadToStorage(file, 'audio');
      
      return {
        type: 'AUDIO',
        provider: 'UPLOAD',
        url: uploadResult.url,
        downloadUrl: uploadResult.downloadUrl,
        duration: file.duration || 0,
      };
    }

    // Handle external links
    if (url) {
      const processedUrl = await this.processAudioUrl(url);
      
      return {
        type: 'AUDIO',
        provider: provider || 'DIRECT',
        url: processedUrl.url,
        embedCode: processedUrl.embedCode,
        duration: processedUrl.duration,
        transcript: processedUrl.transcript,
      };
    }

    // Handle embed code (SoundCloud, Spotify, etc.)
    if (embedCode) {
      return {
        type: 'AUDIO',
        provider: provider || 'DIRECT',
        embedCode: this.sanitizeEmbedCode(embedCode),
      };
    }

    throw new ValidationError('Invalid audio content', {
      audio: ['Must provide either file upload, URL, or embed code'],
    });
  }

  /**
   * Process text content
   */
  private async processTextContent(data: any): Promise<TextContent> {
    const { format, content } = data;

    if (!content) {
      throw new ValidationError('Text content is required', {
        content: ['Content cannot be empty'],
      });
    }

    let processedContent = content;
    let wordCount = 0;

    switch (format) {
      case 'MARKDOWN':
        // Process markdown (remove HTML tags, count words)
        wordCount = this.countWords(content);
        break;
      case 'HTML':
        // Sanitize HTML
        processedContent = this.sanitizeHTML(content);
        wordCount = this.countWords(this.stripHTML(content));
        break;
      case 'RICH_TEXT':
        // Rich text processing
        processedContent = this.sanitizeHTML(content);
        wordCount = this.countWords(this.stripHTML(content));
        break;
      default:
        wordCount = this.countWords(content);
    }

    const estimatedReadTime = Math.ceil(wordCount / 200); // 200 words per minute

    return {
      type: 'TEXT',
      format: format || 'PLAIN',
      content: processedContent,
      wordCount,
      estimatedReadTime,
    };
  }

  /**
   * Process PDF content
   */
  private async processPDFContent(data: any): Promise<PDFContent> {
    const { url, file } = data;

    if (file) {
      this.validateFile(file, 'PDF');
      
      const uploadResult = await this.uploadToStorage(file, 'documents');
      
      return {
        type: 'PDF',
        url: uploadResult.url,
        downloadUrl: uploadResult.downloadUrl,
        pageCount: file.pageCount,
        embedUrl: uploadResult.embedUrl,
      };
    }

    if (url) {
      // Validate URL
      if (!this.isValidUrl(url)) {
        throw new ValidationError('Invalid PDF URL', {
          url: ['Must be a valid URL'],
        });
      }

      return {
        type: 'PDF',
        url,
        downloadUrl: url,
        embedUrl: this.generatePDFEmbedUrl(url),
      };
    }

    throw new ValidationError('Invalid PDF content', {
      pdf: ['Must provide either file upload or URL'],
    });
  }

  /**
   * Process slides content
   */
  async processSlidesContent(data: any): Promise<SlidesContent> {
    const { provider, url, embedCode, file } = data;
    
    // Handle direct upload
    if (file) {
      this.validateFile(file, 'SLIDES');
      
      const uploadResult = await this.uploadToStorage(file, 'slides');
      
      return {
        type: 'SLIDES',
        provider: 'DIRECT' as any,
        url: uploadResult.url,
        downloadUrl: uploadResult.downloadUrl,
      };
    }
    
    // Handle embed providers (Google Slides, Canva, etc.)
    if (embedCode) {
      return {
        type: 'SLIDES',
        provider: provider || 'OTHER',
        embedCode: this.sanitizeEmbedCode(embedCode),
      };
    }
    
    // Handle direct URLs
    if (url) {
      const detectedProvider = this.detectEmbedProvider(url);
      
      return {
        type: 'SLIDES',
        provider: detectedProvider || provider,
        url,
        embedCode: detectedProvider ? this.generateEmbedFromUrl(url, detectedProvider) : undefined,
      };
    }
    
    throw new ValidationError('Invalid slides content', {
      slides: ['Must provide file, URL, or embed code'],
    });
  }


  /**
   * Process link content
   */
  private async processLinkContent(data: any): Promise<LinkContent> {
    const { url, title } = data;

    if (!url || !this.isValidUrl(url)) {
      throw new ValidationError('Invalid URL', {
        url: ['Must be a valid URL'],
      });
    }

    // Fetch metadata for the link
    const metadata = await this.fetchLinkMetadata(url);

    return {
      type: 'LINK',
      url,
      title: title || metadata.title,
      description: metadata.description,
      thumbnail: metadata.thumbnail,
      isExternal: !url.includes(process.env.NEXT_PUBLIC_URL || 'studyhub.mw'),
      requiresLogin: false,
    };
  }

  /**
   * Process embed content
   */
  private async processEmbedContent(data: any): Promise<any> {
    const { provider, embedCode, url } = data;

    // If URL provided, try to extract embed code
    if (url && !embedCode) {
      const extractedEmbed = await this.extractEmbedFromUrl(url, provider);
      return {
        type: 'EMBED',
        provider,
        embedCode: extractedEmbed,
        url,
        isResponsive: true,
      };
    }

    if (embedCode) {
      return {
        type: 'EMBED',
        provider,
        embedCode: this.sanitizeEmbedCode(embedCode),
        url,
        isResponsive: true,
      };
    }

    throw new ValidationError('Invalid embed content', {
      embed: ['Must provide URL or embed code'],
    });
  }

  /**
   * Process quiz content
   */
  private async processQuizContent(data: any): Promise<QuizContent> {
    if (!data.questions || data.questions.length === 0) {
      throw new ValidationError('Quiz must have questions', {
        questions: ['At least one question is required'],
      });
    }

    // Validate each question
    for (const [index, question] of data.questions.entries()) {
      if (!question.question) {
        throw new ValidationError(`Question ${index + 1} is empty`, {
          [`question_${index}`]: ['Question text is required'],
        });
      }

      if (question.type === 'MULTIPLE_CHOICE' && (!question.options || question.options.length < 2)) {
        throw new ValidationError(`Question ${index + 1} needs options`, {
          [`question_${index}`]: ['Multiple choice questions need at least 2 options'],
        });
      }

      if (!question.correctAnswer) {
        throw new ValidationError(`Question ${index + 1} missing answer`, {
          [`question_${index}`]: ['Correct answer is required'],
        });
      }
    }

    return {
      type: 'QUIZ',
      questions: data.questions,
      timeLimit: data.timeLimit,
      passingScore: data.passingScore || 60,
    };
  }

  /**
   * Process assignment content
   */
  private async processAssignmentContent(data: any): Promise<AssignmentContent> {
    if (!data.instructions) {
      throw new ValidationError('Assignment instructions required', {
        instructions: ['Instructions are required'],
      });
    }

    return {
      type: 'ASSIGNMENT',
      instructions: data.instructions,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      maxScore: data.maxScore || 100,
      allowedFileTypes: data.allowedFileTypes || ['.pdf', '.doc', '.docx', '.txt'],
      maxFileSize: data.maxFileSize || 10 * 1024 * 1024, // 10MB default
      rubric: data.rubric,
    };
  }

  /**
   * Process past paper content
   */
  private async processPastPaperContent(data: any): Promise<PastPaperContent> {
    const { examBoard, year, paperNumber, subject, file } = data;

    if (!examBoard || !year || !subject) {
      throw new ValidationError('Past paper metadata required', {
        metadata: ['Exam board, year, and subject are required'],
      });
    }

    let pdfUrl = data.pdfUrl;
    let markingSchemeUrl = data.markingSchemeUrl;

    // Handle file upload
    if (file) {
      this.validateFile(file, 'PDF');
      const uploadResult = await this.uploadToStorage(file, 'past-papers');
      pdfUrl = uploadResult.url;
    }

    return {
      type: 'PAST_PAPER',
      examBoard,
      year: parseInt(year),
      paperNumber: paperNumber || 1,
      subject,
      pdfUrl,
      markingSchemeUrl,
      duration: data.duration || 180, // Default 3 hours
    };
  }

  /**
   * Validate file upload
   */
  private validateFile(file: any, type: keyof typeof this.supportedFormats) {
    const config = this.supportedFormats[type];
    
    if (!file) {
      throw new ValidationError('File is required', { file: ['No file provided'] });
    }

    // Check file size
    if (file.size > config.maxSize) {
      throw new ValidationError('File too large', {
        file: [`Maximum size is ${config.maxSize / (1024 * 1024)}MB`],
      });
    }

    // Check file extension
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!config.extensions.includes(ext)) {
      throw new ValidationError('Invalid file type', {
        file: [`Allowed types: ${config.extensions.join(', ')}`],
      });
    }

    // Check MIME type
    if (file.type && !config.mimeTypes.includes(file.type)) {
      throw new ValidationError('Invalid file format', {
        file: [`Invalid MIME type: ${file.type}`],
      });
    }
  }

  /**
   * Upload file to storage (S3, Cloudinary, etc.)
   */
  private async uploadToStorage(file: any, folder: string): Promise<any> {
    // In production, upload to cloud storage
    // This is a placeholder - implement actual upload logic
    
    const timestamp = Date.now();
    const filename = `${timestamp}-${this.sanitizeFilename(file.name)}`;
    
    // Example: Upload to S3
    // const uploadResult = await s3.upload({
    //   Bucket: process.env.S3_BUCKET,
    //   Key: `${folder}/${filename}`,
    //   Body: file.buffer,
    //   ContentType: file.type,
    // }).promise();

    return {
      url: `${process.env.NEXT_PUBLIC_CDN_URL}/${folder}/${filename}`,
      downloadUrl: `${process.env.NEXT_PUBLIC_CDN_URL}/${folder}/${filename}?download=1`,
      thumbnail: folder === 'videos' ? `${process.env.NEXT_PUBLIC_CDN_URL}/thumbnails/${filename}.jpg` : undefined,
      embedUrl: folder === 'documents' ? `${process.env.NEXT_PUBLIC_URL}/embed/pdf/${filename}` : undefined,
      filename,
      size: file.size,
    };
  }

  /**
   * Process video URL (YouTube, Vimeo, etc.)
   */
  private async processVideoUrl(url: string, provider?: VideoProvider): Promise<any> {
    const detectedProvider = provider || this.detectVideoProvider(url);

    switch (detectedProvider) {
      case 'YOUTUBE':
        const youtubeId = this.extractYouTubeId(url);
        return {
          provider: 'YOUTUBE',
          url: `https://www.youtube.com/watch?v=${youtubeId}`,
          embedCode: `<iframe src="https://www.youtube.com/embed/${youtubeId}" frameborder="0" allowfullscreen></iframe>`,
          thumbnail: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
        };

      case 'VIMEO':
        const vimeoId = this.extractVimeoId(url);
        return {
          provider: 'VIMEO',
          url: `https://vimeo.com/${vimeoId}`,
          embedCode: `<iframe src="https://player.vimeo.com/video/${vimeoId}" frameborder="0" allowfullscreen></iframe>`,
        };

      case 'LOOM':
        const loomId = this.extractLoomId(url);
        return {
          provider: 'LOOM',
          url,
          embedCode: `<iframe src="https://www.loom.com/embed/${loomId}" frameborder="0" allowfullscreen></iframe>`,
        };

      default:
        return {
          provider: 'DIRECT',
          url,
          embedCode: `<video src="${url}" controls></video>`,
        };
    }
  }

  /**
   * Process audio URL
   */
  private async processAudioUrl(url: string): Promise<any> {
    // Detect if it's SoundCloud, Spotify, or direct audio
    if (url.includes('soundcloud.com')) {
      return {
        url,
        embedCode: `<iframe src="https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}" frameborder="0"></iframe>`,
      };
    }

    if (url.includes('spotify.com')) {
      const spotifyId = this.extractSpotifyId(url);
      return {
        url,
        embedCode: `<iframe src="https://open.spotify.com/embed/track/${spotifyId}" frameborder="0"></iframe>`,
      };
    }

    return {
      provider: 'DIRECT',
      url,
      embedCode: `<audio src="${url}" controls></audio>`,
    };
  }

  /**
   * Fetch metadata for a link
   */
  private async fetchLinkMetadata(url: string): Promise<any> {
    try {
      // In production, use a metadata scraper
      const response = await fetch(url);
      const html = await response.text();
      
      // Extract Open Graph metadata
      const title = this.extractMetaTag(html, 'og:title') || '';
      const description = this.extractMetaTag(html, 'og:description') || '';
      const thumbnail = this.extractMetaTag(html, 'og:image') || '';

      return { title, description, thumbnail };
    } catch (error) {
      return { title: '', description: '', thumbnail: '' };
    }
  }

  /**
   * Extract YouTube video ID from URL
   */
  private extractYouTubeId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  }

  /**
   * Extract Vimeo video ID
   */
  private extractVimeoId(url: string): string | null {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : null;
  }

  /**
   * Extract Loom video ID
   */
  private extractLoomId(url: string): string | null {
    const match = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }

  /**
   * Extract Spotify track ID
   */
  private extractSpotifyId(url: string): string | null {
    const match = url.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }

  /**
   * Detect video provider from URL
   */
  private detectVideoProvider(url: string): VideoProvider {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YOUTUBE';
    if (url.includes('vimeo.com')) return 'VIMEO';
    if (url.includes('wistia.com')) return 'WISTIA';
    if (url.includes('loom.com')) return 'LOOM';
    return 'DIRECT';
  }

  /**
   * Detect embed provider from URL
   */
  private detectEmbedProvider(url: string): EmbedProvider | null {
    if (url.includes('docs.google.com/presentation')) return 'GOOGLE_SLIDES';
    if (url.includes('canva.com')) return 'CANVA';
    if (url.includes('figma.com')) return 'FIGMA';
    if (url.includes('notion.so')) return 'NOTION';
    if (url.includes('miro.com')) return 'MIRO';
    if (url.includes('genial.ly')) return 'GENIALLY';
    return null;
  }

  /**
   * Generate embed code from URL
   */
  private generateEmbedFromUrl(url: string, provider: EmbedProvider): string {
    switch (provider) {
      case 'GOOGLE_SLIDES':
        const slidesId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
        return `<iframe src="https://docs.google.com/presentation/d/${slidesId}/embed" frameborder="0"></iframe>`;
      
      case 'CANVA':
        return `<iframe src="${url}?embed" frameborder="0"></iframe>`;
      
      default:
        return `<iframe src="${url}" frameborder="0"></iframe>`;
    }
  }

  /**
   * Extract embed code from URL
   */
  private async extractEmbedFromUrl(url: string, provider: EmbedProvider): Promise<string> {
    try {
      const response = await fetch(url);
      const html = await response.text();
      
      // Try to find oembed link
      const oembedMatch = html.match(/<link[^>]+type="application\/json\+oembed"[^>]+href="([^"]+)"/);
      if (oembedMatch) {
        const oembedResponse = await fetch(oembedMatch[1]);
        const oembedData = await oembedResponse.json();
        return oembedData.html || '';
      }

      return this.generateEmbedFromUrl(url, provider);
    } catch (error) {
      return this.generateEmbedFromUrl(url, provider);
    }
  }

  /**
   * Sanitize embed code
   */
  private sanitizeEmbedCode(code: string): string {
    // Remove script tags for security
    code = code.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Ensure responsive iframe
    if (code.includes('<iframe')) {
      code = code.replace(/<iframe/, '<iframe loading="lazy"');
    }

    return code;
  }

  /**
   * Sanitize HTML content
   */
  private sanitizeHTML(html: string): string {
    // Remove potentially dangerous tags/attributes
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/g, '')
      .replace(/javascript:/gi, '');
  }

  /**
   * Generate PDF embed URL
   */
  private generatePDFEmbedUrl(pdfUrl: string): string {
    return `${process.env.NEXT_PUBLIC_URL}/embed/pdf?url=${encodeURIComponent(pdfUrl)}`;
  }

  /**
   * Utility functions
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  private stripHTML(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '-')
      .replace(/-+/g, '-');
  }

  private extractMetaTag(html: string, property: string): string {
    const match = html.match(new RegExp(`<meta[^>]+property="${property}"[^>]+content="([^"]+)"`));
    return match ? match[1] : '';
  }
}

export const multimediaService = new MultimediaService();