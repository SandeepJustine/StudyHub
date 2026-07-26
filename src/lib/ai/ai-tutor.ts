import prisma from '@/lib/utils/prisma';
import { AppError } from '@/lib/utils/errors';
import { featureGating } from '@/lib/billing/feature-gating';

export class AITutorService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.baseUrl = 'https://api.openai.com/v1';
  }

  /**
   * Get AI tutor response
   */
  async getTutorResponse(userId: string, data: {
    subject: string;
    question: string;
    context?: string;
    previousMessages?: Array<{ role: 'user' | 'assistant'; content: string }>;
  }) {
    // Check premium access
    await featureGating.enforceAccess(userId, 'ai:tutor');

    // Get student's grade and exam board for context
    const student = await prisma.student.findFirst({
      where: { user: { id: userId } },
      select: { grade: true, examBoard: true, subjects: true },
    });

    const systemPrompt = this.buildSystemPrompt(
      data.subject,
      student?.grade,
      student?.examBoard
    );

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(data.previousMessages || []).slice(-5), // Keep last 5 messages for context
      { role: 'user', content: data.question },
    ];

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages,
          max_tokens: 500,
          temperature: 0.7,
          presence_penalty: 0.6,
          frequency_penalty: 0.3,
        }),
      });

      const result = await response.json();
      const aiResponse = result.choices[0]?.message?.content || '';

      return {
        response: aiResponse,
        subject: data.subject,
      };
    } catch (error) {
      console.error('AI Tutor error:', error);
      throw new AppError('AI Tutor is temporarily unavailable', 'AI_SERVICE_ERROR', 503);
    }
  }

  /**
   * AI-assisted assignment grading
   */
  async gradeAssignment(assignmentId: string, studentAnswer: string) {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        module: {
          include: { course: true },
        },
      },
    });

    if (!assignment) throw new AppError('Assignment not found', 'NOT_FOUND', 404);

    const prompt = `
      Grade the following student answer for the assignment:
      
      Assignment: ${assignment.title}
      Description: ${assignment.description}
      Subject: ${assignment.module.course.subject}
      Max Score: ${assignment.maxScore}
      
      Student Answer:
      ${studentAnswer}
      
      Provide:
      1. Score (0-${assignment.maxScore})
      2. Detailed feedback
      3. Areas for improvement
      
      Format as JSON: { score: number, feedback: string, improvements: string[] }
    `;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000,
          temperature: 0.3,
        }),
      });

      const result = await response.json();
      const grading = JSON.parse(result.choices[0]?.message?.content || '{}');

      return {
        score: grading.score || 0,
        feedback: grading.feedback || 'No feedback available',
        improvements: grading.improvements || [],
      };
    } catch (error) {
      console.error('AI Grading error:', error);
      return {
        score: 0,
        feedback: 'AI grading unavailable. Please try manual grading.',
        improvements: [],
      };
    }
  }

  private buildSystemPrompt(subject: string, grade?: string | null, examBoard?: string | null): string {
    return `You are an AI Tutor for StudyHub Malawi, helping students learn ${subject}.
      ${grade ? `The student is in ${grade}.` : ''}
      ${examBoard ? `They are preparing for ${examBoard} examinations.` : ''}
      
      Guidelines:
      - Explain concepts clearly and patiently
      - Use examples relevant to Malawi context
      - Encourage critical thinking
      - Provide step-by-step solutions for problems
      - Suggest additional practice areas
      - Keep responses concise and focused
      - Use simple language appropriate for the student's level
      - Always be encouraging and supportive`;
  }
}