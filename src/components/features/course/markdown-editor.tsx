'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Write your lesson content here...',
  rows = 12,
}: MarkdownEditorProps) {
  const [textareaRef, setTextareaRef] = useState<HTMLTextAreaElement | null>(null);

  const insertAtCursor = (before: string, after: string = '') => {
    if (!textareaRef) return;
    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    const text = textareaRef.value;
    const newText = text.substring(0, start) + before + text.substring(start, end) + after + text.substring(end);
    onChange(newText);
    setTimeout(() => {
      textareaRef.focus();
      textareaRef.setSelectionRange(start + before.length, start + before.length + (end - start));
    }, 0);
  };

  const toolbarButtons = [
    {
      label: 'H1',
      title: 'Heading 1',
      onClick: () => insertAtCursor('# ', '\n'),
      variant: 'outline' as const,
      size: 'sm' as const,
    },
    {
      label: 'H2',
      title: 'Heading 2',
      onClick: () => insertAtCursor('## ', '\n'),
      variant: 'outline' as const,
      size: 'sm' as const,
    },
    {
      label: 'H3',
      title: 'Heading 3',
      onClick: () => insertAtCursor('### ', '\n'),
      variant: 'outline' as const,
      size: 'sm' as const,
    },
    {
      label: 'B',
      title: 'Bold',
      onClick: () => insertAtCursor('**', '**'),
      variant: 'outline' as const,
      size: 'sm' as const,
    },
    {
      label: 'I',
      title: 'Italic',
      onClick: () => insertAtCursor('*', '*'),
      variant: 'outline' as const,
      size: 'sm' as const,
    },
    {
      label: 'S',
      title: 'Strikethrough',
      onClick: () => insertAtCursor('~~', '~~'),
      variant: 'outline' as const,
      size: 'sm' as const,
    },
    {
      label: '•',
      title: 'Bullet list',
      onClick: () => insertAtCursor('- ', '\n'),
      variant: 'outline' as const,
      size: 'sm' as const,
    },
    {
      label: '1.',
      title: 'Numbered list',
      onClick: () => insertAtCursor('1. ', '\n'),
      variant: 'outline' as const,
      size: 'sm' as const,
    },
    {
      label: '¶',
      title: 'Paragraph',
      onClick: () => insertAtCursor('\n\n'),
      variant: 'outline' as const,
      size: 'sm' as const,
    },
    {
      label: 'Quote',
      title: 'Quote',
      onClick: () => insertAtCursor('> ', '\n'),
      variant: 'outline' as const,
      size: 'sm' as const,
    },
    {
      label: 'Code',
      title: 'Inline code',
      onClick: () => insertAtCursor('`', '`'),
      variant: 'outline' as const,
      size: 'sm' as const,
    },
    {
      label: 'Link',
      title: 'Insert link',
      onClick: () => insertAtCursor('[link text](https://)'),
      variant: 'outline' as const,
      size: 'sm' as const,
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1 p-2 bg-grey-light/50 rounded-lg border border-grey-light">
        {toolbarButtons.map((btn) => (
          <Button
            key={btn.label}
            type="button"
            variant={btn.variant}
            size={btn.size}
            title={btn.title}
            onClick={btn.onClick}
            className="h-7 px-2 text-xs font-semibold"
          >
            {btn.label}
          </Button>
        ))}
      </div>
      <Textarea
        ref={(el) => setTextareaRef(el)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="font-mono text-sm"
      />
      <p className="text-xs text-grey-medium">
        Supports Markdown formatting. Select text to apply formatting to selection.
      </p>
    </div>
  );
}