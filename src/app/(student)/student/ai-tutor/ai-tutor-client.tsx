'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import {
  Send,
  Sparkles,
  User,
  Loader2,
  Trash2,
  GraduationCap,
  BookOpen,
  ChevronDown,
  Plus,
  MessageSquare,
  X,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  subject: string;
  createdAt: Date;
  tokensUsed?: number;
  isError?: boolean;
}

interface Conversation {
  id: string;
  title: string | null;
  subject: string | null;
  courseId: string | null;
  moduleId: string | null;
  quizId: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    messages: number;
  };
}

interface CourseWithModules {
  id: string;
  title: string;
  subject: string;
  modules: Array<{
    id: string;
    title: string;
    contentType: string;
    quiz?: {
      id: string;
      title: string;
    } | null;
  }>;
}

interface StudentData {
  id: string;
  grade: string | null;
  examBoard: string | null;
  subjects: string[];
}

interface AITutorClientProps {
  student: StudentData;
  courses: CourseWithModules[];
}

export function AITutorClient({ student, courses }: AITutorClientProps) {
  const [subject, setSubject] = useState<string>(student.subjects[0] || '');
  const [courseId, setCourseId] = useState<string>('');
  const [moduleId, setModuleId] = useState<string>('');
  const [quizId, setQuizId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showConversations, setShowConversations] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedCourse = courses.find((c) => c.id === courseId);
  const selectedModule = selectedCourse?.modules.find((m) => m.id === moduleId);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/student/ai-tutor/conversations');
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setConversations(result.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  const createConversation = async () => {
    try {
      const res = await fetch('/api/student/ai-tutor/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          courseId: courseId || undefined,
          moduleId: moduleId || undefined,
          quizId: quizId || undefined,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setActiveConversationId(result.data.id);
          setMessages([]);
          fetchConversations();
        }
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/student/ai-tutor/conversations/${conversationId}`);
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setActiveConversationId(result.data.id);
          setSubject(result.data.subject || student.subjects[0] || '');
          setCourseId(result.data.courseId || '');
          setModuleId(result.data.moduleId || '');
          setQuizId(result.data.quizId || '');

          const loadedMessages: Message[] = result.data.messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
            subject: msg.subject || subject,
            createdAt: new Date(msg.createdAt),
            tokensUsed: msg.tokensUsed,
            isError: msg.isError,
          }));

          setMessages(loadedMessages);
          setShowConversations(false);
        }
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/student/ai-tutor/conversations/${conversationId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        if (activeConversationId === conversationId) {
          setActiveConversationId(null);
          setMessages([]);
        }
        fetchConversations();
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    if (!activeConversationId) {
      await createConversation();
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      subject,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const previousMessages = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/student/ai-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          question: userMessage.content,
          previousMessages,
          conversationId: activeConversationId || undefined,
          courseId: courseId || undefined,
          moduleId: moduleId || undefined,
          quizId: quizId || undefined,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment before sending another message.');
        }
        throw new Error(result.error || 'Failed to get response');
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.data.response,
        subject: result.data.subject,
        createdAt: new Date(),
        tokensUsed: result.data.tokensUsed,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (result.data.conversationId && !activeConversationId) {
        setActiveConversationId(result.data.conversationId);
        fetchConversations();
      }
    } catch (error: any) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message || 'Unknown error'}. Please try again.`,
        subject,
        createdAt: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setActiveConversationId(null);
    setShowClearModal(false);
  };

  const handleNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
    setCourseId('');
    setModuleId('');
    setQuizId('');
    setShowConversations(false);
  };

  const availableModules = selectedCourse?.modules || [];

  return (
    <div className="min-h-screen bg-grey-light p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar - Conversations */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-sm">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-navy">Conversations</h2>
                <Button
                  variant="ghost"
                  size="xs"
                  leftIcon={<Plus size={14} />}
                  onClick={handleNewConversation}
                >
                  New
                </Button>
              </div>

              <div className="space-y-2">
                {conversations.length === 0 ? (
                  <p className="text-xs text-grey-medium text-center py-4">No conversations yet</p>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                        activeConversationId === conv.id
                          ? 'bg-navy text-white'
                          : 'bg-grey-light hover:bg-grey-medium/50 text-navy'
                      }`}
                      onClick={() => loadConversation(conv.id)}
                    >
                      <MessageSquare size={14} className="flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {conv.title || 'New conversation'}
                        </p>
                        <p className="text-[10px] opacity-70 truncate">
                          {conv._count.messages} messages
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                        }}
                        className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                          activeConversationId === conv.id ? 'text-white hover:text-red-200' : 'text-grey-dark hover:text-red'
                        }`}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Main Chat Area */}
        <div className="lg:col-span-3 space-y-4">
          {/* Header */}
          <Card className="border-0 shadow-sm">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-100 rounded-xl">
                    <Sparkles className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-navy">AI Tutor</h1>
                    <p className="text-sm text-grey-dark">
                      Ask me anything about your subjects
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="px-3 py-2 border-2 border-grey-light rounded-lg text-sm text-navy focus:outline-none focus:border-navy"
                  >
                    {student.subjects.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Trash2 size={16} />}
                    onClick={() => setShowClearModal(true)}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              {/* Context Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                <div>
                  <label className="block text-xs font-medium text-grey-dark mb-1">
                    <BookOpen size={12} className="inline mr-1" />
                    Course
                  </label>
                  <select
                    value={courseId}
                    onChange={(e) => {
                      setCourseId(e.target.value);
                      setModuleId('');
                      setQuizId('');
                    }}
                    className="w-full px-3 py-2 border-2 border-grey-light rounded-lg text-sm text-navy focus:outline-none focus:border-navy"
                  >
                    <option value="">General</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-grey-dark mb-1">Module / Lesson</label>
                  <select
                    value={moduleId}
                    onChange={(e) => {
                      setModuleId(e.target.value);
                      setQuizId('');
                    }}
                    disabled={!courseId}
                    className="w-full px-3 py-2 border-2 border-grey-light rounded-lg text-sm text-navy focus:outline-none focus:border-navy disabled:bg-grey-light disabled:cursor-not-allowed"
                  >
                    <option value="">Select module</option>
                    {availableModules.map((module) => (
                      <option key={module.id} value={module.id}>
                        {module.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-grey-dark mb-1">Quiz / Assessment</label>
                  <select
                    value={quizId}
                    onChange={(e) => setQuizId(e.target.value)}
                    disabled={!moduleId}
                    className="w-full px-3 py-2 border-2 border-grey-light rounded-lg text-sm text-navy focus:outline-none focus:border-navy disabled:bg-grey-light disabled:cursor-not-allowed"
                  >
                    <option value="">Select quiz</option>
                    {availableModules
                      .filter((m) => m.quiz)
                      .map((m) => (
                        <option key={m.quiz!.id} value={m.quiz!.id}>
                          {m.quiz!.title}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Chat Messages */}
          <Card className="border-0 shadow-sm">
            <div className="p-4 h-[calc(100vh-420px)] overflow-y-auto space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <GraduationCap size={32} className="text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-navy mb-2">
                    How can I help you learn today?
                  </h3>
                  <p className="text-sm text-grey-dark max-w-md">
                    Select a subject and ask any question. I will explain concepts,
                    solve problems, and guide you through your studies.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2 justify-center">
                    {[
                      'Explain photosynthesis',
                      'Solve this equation',
                      'What is the French Revolution?',
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setInput(suggestion)}
                        className="px-3 py-1.5 bg-grey-light hover:bg-grey-medium/50 rounded-full text-xs text-grey-dark transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl p-4 ${
                        message.role === 'user'
                          ? 'bg-navy text-white'
                          : message.isError
                          ? 'bg-red-50 border border-red-200'
                          : 'bg-white border border-grey-light shadow-sm'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles size={14} className="text-purple-600" />
                          <span className="text-xs font-medium text-purple-600">
                            AI Tutor
                          </span>
                          <Badge variant="neutral" size="sm">
                            {message.subject}
                          </Badge>
                          {message.tokensUsed && (
                            <span className="text-[10px] text-grey-medium">
                              {message.tokensUsed} tokens
                            </span>
                          )}
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-line leading-relaxed">
                        {message.content}
                      </p>
                      <p
                        className={`text-xs mt-2 ${
                          message.role === 'user' ? 'text-slate-300' : 'text-grey-medium'
                        }`}
                      >
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-grey-light rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin text-purple-600" />
                      <span className="text-sm text-grey-dark">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </Card>

          {/* Input Area */}
          <Card className="border-0 shadow-sm">
            <div className="p-4">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Ask me anything about ${subject}...`}
                    rows={2}
                    className="resize-none"
                  />
                </div>
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<Send size={16} />}
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  loading={loading}
                >
                  Send
                </Button>
              </div>
              <p className="text-xs text-grey-medium mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        title="Clear Chat"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-grey-dark">
            Are you sure you want to clear the current conversation? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowClearModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleClearChat}>
              Clear Chat
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
