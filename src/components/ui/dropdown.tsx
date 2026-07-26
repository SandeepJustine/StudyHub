'use client';

import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { cn } from '@/utils/cn';

// ============================================
// Context for sharing state between components
// ============================================

interface DropdownContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
}

const DropdownContext = createContext<DropdownContextType>({
  open: false,
  setOpen: () => {},
  toggleOpen: () => {},
});

const useDropdown = () => useContext(DropdownContext);

// ============================================
// DropdownMenu (Main Container)
// ============================================

interface DropdownMenuProps {
  children: React.ReactNode;
  className?: string;
}

export function DropdownMenu({ children, className }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleOpen = () => setOpen(prev => !prev);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open]);

  return (
    <DropdownContext.Provider value={{ open, setOpen, toggleOpen }}>
      <div ref={containerRef} className={cn('relative inline-block', className)}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

// ============================================
// DropdownMenuTrigger
// ============================================

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
  disabled?: boolean;
}

export function DropdownMenuTrigger({ 
  children, 
  asChild = false, 
  className,
  disabled = false,
}: DropdownMenuTriggerProps) {
  const { toggleOpen, open } = useDropdown();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      toggleOpen();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (!disabled) {
        toggleOpen();
      }
    }
  };

  if (asChild) {
    // Clone the child element and add click handler
    const child = React.Children.only(children) as React.ReactElement;
    return React.cloneElement(child, {
      onClick: (e: React.MouseEvent) => {
        child.props.onClick?.(e);
        handleClick(e);
      },
      onKeyDown: (e: React.KeyboardEvent) => {
        child.props.onKeyDown?.(e);
        handleKeyDown(e);
      },
      'aria-expanded': open,
      'aria-haspopup': true,
      'data-state': open ? 'open' : 'closed',
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-expanded={open}
      aria-haspopup={true}
      data-state={open ? 'open' : 'closed'}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  );
}

// ============================================
// DropdownMenuContent
// ============================================

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'end' | 'center';
  sideOffset?: number;
}

export const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  DropdownMenuContentProps
>(({ className, children, align = 'end', sideOffset = 8, style, ...props }, ref) => {
  const { open, setOpen } = useDropdown();

  if (!open) return null;

  const alignClasses = {
    start: 'left-0',
    end: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'absolute z-50 min-w-[180px] rounded-lg bg-white shadow-lg border border-grey-light',
        'animate-scale origin-top-right',
        alignClasses[align],
        className
      )}
      style={{ 
        top: `calc(100% + ${sideOffset}px)`,
        ...style 
      }}
      role="menu"
      aria-orientation="vertical"
      data-state={open ? 'open' : 'closed'}
      {...props}
    >
      <div className="py-1">
        {children}
      </div>
    </div>
  );
});
DropdownMenuContent.displayName = 'DropdownMenuContent';

// ============================================
// DropdownMenuItem
// ============================================

interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
}

export const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  DropdownMenuItemProps
>(({ className, children, asChild = false, disabled = false, onSelect, onClick, ...props }, ref) => {
  const { setOpen } = useDropdown();

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    onClick?.(e as any);
    onSelect?.();
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!disabled) {
        onSelect?.();
        setOpen(false);
      }
    }
  };

  if (asChild) {
    const child = React.Children.only(children) as React.ReactElement;
    return React.cloneElement(child, {
      onClick: (e: React.MouseEvent) => {
        child.props.onClick?.(e);
        handleClick(e);
      },
      className: cn(child.props.className, disabled && 'opacity-50 pointer-events-none'),
    });
  }

  return (
    <div
      ref={ref}
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'block w-full text-left px-4 py-2.5 text-sm text-grey-dark hover:bg-grey-light cursor-pointer transition-colors',
        'focus:bg-grey-light focus:outline-none',
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
DropdownMenuItem.displayName = 'DropdownMenuItem';

// ============================================
// DropdownMenuSeparator
// ============================================

export const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    role="separator" 
    aria-orientation="horizontal"
    className={cn('my-1 border-t border-grey-light', className)} 
    {...props} 
  />
));
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

// ============================================
// DropdownMenuLabel
// ============================================

interface DropdownMenuLabelProps extends React.HTMLAttributes<HTMLDivElement> {}

export const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  DropdownMenuLabelProps
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('px-4 py-2 text-xs font-semibold text-grey-medium uppercase tracking-wider', className)}
    {...props}
  >
    {children}
  </div>
));
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

// ============================================
// DropdownMenuGroup
// ============================================

interface DropdownMenuGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

export const DropdownMenuGroup = React.forwardRef<
  HTMLDivElement,
  DropdownMenuGroupProps
>(({ className, children, ...props }, ref) => (
  <div ref={ref} role="group" className={cn('', className)} {...props}>
    {children}
  </div>
));
DropdownMenuGroup.displayName = 'DropdownMenuGroup';

// ============================================
// DropdownMenuShortcut
// ============================================

interface DropdownMenuShortcutProps extends React.HTMLAttributes<HTMLSpanElement> {}

export const DropdownMenuShortcut = React.forwardRef<
  HTMLSpanElement,
  DropdownMenuShortcutProps
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn('ml-auto text-xs tracking-widest text-grey-medium', className)}
    {...props}
  />
));
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';