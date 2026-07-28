'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Send, 
  User, 
  Clock,
  Paperclip,
  Smile,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { formatRelativeTime } from '@/utils/formatters';

interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  createdAt: Date;
  isOwn: boolean;
}

interface ChatWindowProps {
  messages?: ChatMessage[];
  onSendMessage?: (content: string) => void;
  onFileUpload?: (file: File) => void;
  placeholder?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ChatWindow({ 
  messages = [], 
  onSendMessage,
  onFileUpload,
  placeholder = 'Type a message...',
  collapsed = false,
  onToggleCollapse,
}: ChatWindowProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSendMessage?.(inputValue.trim());
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload?.(file);
    }
  };

  if (collapsed) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="navy"
          size="sm"
          leftIcon={<Maximize2 size={16} />}
          onClick={onToggleCollapse}
        >
          Chat
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card padding="none" className="shadow-xl">
        {/* Header */}
        <div className="bg-navy text-white p-3 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <div>
              <p className="font-medium">Community Chat</p>
              <p className="text-xs text-slate-300">2 online</p>
            </div>
          </div>
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="xs"
              leftIcon={<Minimize2 size={14} />}
              onClick={onToggleCollapse}
              className="text-white hover:bg-navy-light"
            />
          )}
        </div>

        {/* Messages */}
        <div className="h-64 overflow-y-auto p-3 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <Clock size={32} className="mx-auto text-grey-medium mb-2" />
              <p className="text-sm text-grey-dark">No messages yet</p>
              <p className="text-xs text-grey-medium">
                Start the conversation!
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg p-2 ${
                    message.isOwn
                      ? 'bg-navy text-white'
                      : 'bg-grey-light text-grey-dark'
                  }`}
                >
                  {!message.isOwn && (
                    <p className="text-xs font-medium mb-1">
                      {message.senderName}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-line">
                    {message.content}
                  </p>
                  <p className="text-xs opacity-70 mt-1 text-right">
                    {formatRelativeTime(message.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-grey-light">
          <div className="flex items-center gap-2">
            <label className="cursor-pointer text-grey-medium hover:text-navy">
              <input
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
              <Paperclip size={16} />
            </label>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              className="flex-1"
            />
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Send size={14} />}
              onClick={handleSend}
              disabled={!inputValue.trim()}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
