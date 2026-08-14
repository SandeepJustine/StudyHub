import { GoogleGenerativeAI, Part, GenerateContentStreamResult, EnhancedGenerateContentResponse } from '@google/generative-ai';
import { AppError } from '@/lib/utils/errors';
import { featureGating } from '@/lib/billing/feature-gating';

export interface AITutorContext {
  studentId: string;
  grade?: string | null;
  examBoard?: string | null;
  subjects: string[];
  courseId?: string;
  courseTitle?: string;
  moduleId?: string;
  moduleTitle?: string;
  quizId?: string;
  quizTitle?: string;
  recentPerformance?: {
    score?: number;
    passed?: boolean;
  };
}

export interface TutorMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface TutorResponse {
  response: string;
  subject: string;
  conversationId?: string;
  tokensUsed?: number;
}

export class GeminiTutorService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private readonly MODEL_NAME = 'gemini-2.5-flash';

  private getModel(): any {
    if (!this.model) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new AppError('GEMINI_API_KEY is not configured', 'CONFIG_ERROR', 500);
      }

      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: this.MODEL_NAME });
    }
    return this.model;
  }

  async getTutorResponse(
    userId: string,
    context: AITutorContext,
    data: {
      question: string;
      previousMessages?: TutorMessage[];
      conversationId?: string;
    }
  ): Promise<TutorResponse> {
    await featureGating.enforceAccess(userId, 'ai:tutor');

    const model = this.getModel();

    const systemPrompt = this.buildPedagogicalPrompt(context);
    const history = this.buildHistory(data.previousMessages || []);
    const chat = model.startChat({ history });

    let fullResponse = '';
    let tokensUsed = 0;

    try {
      const streamResult: GenerateContentStreamResult = await chat.sendMessageStream(data.question);

      for await (const chunk of streamResult.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;
      }

      const aggregatedResponse: EnhancedGenerateContentResponse = await streamResult.response;
      const usageMetadata = aggregatedResponse.usageMetadata;
      tokensUsed = usageMetadata?.totalTokenCount || 0;

      return {
        response: fullResponse.trim() || aggregatedResponse.text() || 'I apologize, but I could not generate a response. Please try again.',
        subject: context.subjects[0] || 'General',
        conversationId: data.conversationId,
        tokensUsed,
      };
    } catch (error: any) {
      console.error('Gemini AI Tutor error:', error);
      throw new AppError('AI Tutor is temporarily unavailable', 'AI_SERVICE_ERROR', 503);
    }
  }

  private buildPedagogicalPrompt(context: AITutorContext): string {
    const gradeInfo = context.grade ? `Grade: ${context.grade}` : '';
    const examBoardInfo = context.examBoard ? `Exam Board: ${context.examBoard}` : '';
    const courseInfo = context.courseTitle ? `Current Course: ${context.courseTitle}` : '';
    const moduleInfo = context.moduleTitle ? `Current Lesson: ${context.moduleTitle}` : '';
    const quizInfo = context.quizTitle ? `Recent Assessment: ${context.quizTitle}` : '';
    const performanceInfo = context.recentPerformance
      ? `Recent Performance: ${context.recentPerformance.passed ? 'Passed' : 'Needs Improvement'} (${context.recentPerformance.score}%)`
      : '';

    return `You are an AI Tutor for StudyHub Malawi, helping students learn effectively.

Student Profile:
- ${gradeInfo}
- ${examBoardInfo}
- Subjects: ${context.subjects.join(', ')}
- ${courseInfo}
- ${moduleInfo}
- ${quizInfo}
- ${performanceInfo}

Pedagogical Guidelines:
1. Socratic Method: Ask guiding questions instead of giving direct answers
2. Scaffold Learning: Break complex topics into smaller, manageable steps
3. Identify Misconceptions: Gently correct wrong assumptions with evidence
4. Encourage Metacognition: Ask students to reflect on their thinking
5. Provide Hints: Give progressively stronger hints if the student struggles
6. Avoid Doing Assignments: Explain concepts and guide, but never complete student work
7. Malawi Context: Use examples relevant to Malawian culture and environment
8. Adaptive Difficulty: Adjust explanations based on student's grade level
9. Positive Reinforcement: Celebrate effort and progress
10. Connect Concepts: Link new topics to previously learned material

CRITICAL RULES:
- NEVER provide complete answers to exam questions or assignments
- If asked to solve a problem, guide the student through the first step
- For direct "give me the answer" requests, politely decline and offer to explain the concept
- Keep responses concise but thorough
- Use simple language appropriate for the student's level
- Always be encouraging and supportive`;
  }

  private buildHistory(messages: TutorMessage[]): any[] {
    return messages.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));
  }
}

export const geminiTutorService = new GeminiTutorService();
