# AI Tutor Implementation Guide

## Overview

The AI Tutor is a premium-tier feature integrated into the StudyHub Malawi LMS. It uses Google Gemini 2.5 Flash to provide pedagogical, course-aware tutoring to students.

## Architecture

### Backend
- **Service**: `src/lib/ai/gemini-tutor.ts` — Gemini AI Tutor service
- **Context**: `src/lib/ai/ai-tutor-context.ts` — Builds LMS context (student, course, module, quiz)
- **Rate Limiter**: `src/lib/ai/rate-limiter.ts` — Per-user rate limiting
- **API Routes**:
  - `POST /api/student/ai-tutor` — Send message, get AI response
  - `GET /api/student/ai-tutor/conversations` — List conversations
  - `POST /api/student/ai-tutor/conversations` — Create conversation
  - `GET /api/student/ai-tutor/conversations/[id]` — Get conversation with messages
  - `DELETE /api/student/ai-tutor/conversations/[id]` — Delete conversation

### Frontend
- **Page**: `src/app/(student)/student/ai-tutor/page.tsx` — Server component with premium gate
- **Client**: `src/app/(student)/student/ai-tutor/ai-tutor-client.tsx` — Chat UI with conversation management

### Database
- `AIConversation` — Top-level conversation metadata
- `AIMessage` — Individual messages within conversations

## Environment Variables

Add the following to your `.env` file:

```env
# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here
```

## Setup

### 1. Prerequisites
- Node.js 18+
- PostgreSQL database
- Google AI Studio account with Gemini API access

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Database Migration
Apply the Prisma migration to create AI Tutor tables:
```bash
npx prisma migrate dev --name add-ai-tutor-models
```

Or apply the existing migration:
```bash
npx prisma migrate deploy
```

### 4. Configure Environment
Add `GEMINI_API_KEY` to your `.env` file. Get your key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### 5. Run Development Server
```bash
pnpm dev
```

## Usage

### Student Access
1. Students must have an active `STUDENT_PREMIUM` or `STUDENT_ANNUAL` subscription
2. Navigate to `/student/ai-tutor`
3. Select a subject and optionally a course/module/quiz for context
4. Ask questions in the chat interface

### Course Context
- Students can select a course they're enrolled in
- They can further narrow down to a specific module/lesson
- If a quiz is associated with the module, they can select it
- The AI tutor receives this context to provide more relevant, course-aware responses

### Conversation Management
- Create multiple conversations for different topics
- Switch between conversations using the sidebar
- Delete conversations when no longer needed
- Each conversation stores subject, course, module, and quiz context

## Pedagogical Behavior

The AI Tutor is configured with the following pedagogical guidelines:

1. **Socratic Method**: Asks guiding questions instead of giving direct answers
2. **Scaffold Learning**: Breaks complex topics into smaller steps
3. **Identify Misconceptions**: Gently corrects wrong assumptions with evidence
4. **Encourage Metacognition**: Asks students to reflect on their thinking
5. **Provide Hints**: Gives progressively stronger hints if the student struggles
6. **Avoid Doing Assignments**: Explains concepts and guides, but never completes student work
7. **Malawi Context**: Uses examples relevant to Malawian culture and environment
8. **Adaptive Difficulty**: Adjusts explanations based on the student's grade level
9. **Positive Reinforcement**: Celebrates effort and progress
10. **Connect Concepts**: Links new topics to previously learned material

## Rate Limiting

- **Limit**: 20 requests per minute per student
- **Response**: Returns `429 Too Many Requests` with retry-after information

## Authorization

- All endpoints require authentication via NextAuth
- Students can only access their own conversations and messages
- Premium subscription is enforced via `featureGating.enforceAccess(userId, 'ai:tutor')`

## Testing

Run tests:
```bash
pnpm test
```

Run specific test files:
```bash
npx jest src/lib/ai/__tests__/rate-limiter.test.ts --no-coverage
npx jest src/lib/ai/__tests__/ai-tutor-context.test.ts --no-coverage
```

## API Reference

### POST /api/student/ai-tutor
Send a message to the AI Tutor.

**Request Body:**
```json
{
  "subject": "Mathematics",
  "question": "Explain quadratic equations",
  "previousMessages": [
    { "role": "user", "content": "Hi" },
    { "role": "assistant", "content": "Hello! How can I help?" }
  ],
  "conversationId": "optional-conversation-id",
  "courseId": "optional-course-id",
  "moduleId": "optional-module-id",
  "quizId": "optional-quiz-id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "AI response text...",
    "subject": "Mathematics",
    "conversationId": "new-or-existing-id",
    "tokensUsed": 150
  },
  "rateLimit": {
    "remaining": 19
  }
}
```

### GET /api/student/ai-tutor/conversations
List all conversations for the authenticated student.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "conv-id",
      "title": "New conversation",
      "subject": "Mathematics",
      "courseId": "course-id",
      "moduleId": "module-id",
      "quizId": "quiz-id",
      "createdAt": "2026-08-14T00:00:00.000Z",
      "updatedAt": "2026-08-14T00:00:00.000Z",
      "_count": { "messages": 5 }
    }
  ]
}
```

### POST /api/student/ai-tutor/conversations
Create a new conversation.

**Request Body:**
```json
{
  "subject": "Mathematics",
  "courseId": "course-id",
  "moduleId": "module-id",
  "quizId": "quiz-id"
}
```

### GET /api/student/ai-tutor/conversations/[id]
Get a specific conversation with all messages.

### DELETE /api/student/ai-tutor/conversations/[id]
Soft-delete a conversation (sets `isActive: false`).

## Security

- **API Key**: `GEMINI_API_KEY` is never exposed to the client
- **Database Isolation**: Students can only access their own data
- **LMS Permissions**: AI cannot bypass LMS permission checks
- **Input Validation**: All inputs are validated server-side
- **Rate Limiting**: Prevents abuse

## Model Isolation

Gemini-specific code is isolated in `src/lib/ai/gemini-tutor.ts`. To change the AI provider:
1. Create a new service implementing the same interface
2. Update the API route to use the new service
3. No changes needed to the frontend or database
