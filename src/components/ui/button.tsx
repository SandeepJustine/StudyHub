import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-poppins font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95',
  {
    variants: {
      variant: {
        primary: 'bg-red text-white hover:bg-red-700 focus:ring-red shadow-md hover:shadow-lg',
        secondary: 'bg-green text-white hover:bg-green-700 focus:ring-green shadow-md hover:shadow-lg',
        outline: 'border-2 border-navy text-navy hover:bg-navy hover:text-white focus:ring-navy',
        ghost: 'text-grey-dark hover:bg-grey-light focus:ring-grey-dark',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red',
        success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green',
        navy: 'bg-navy text-white hover:bg-navy-light focus:ring-navy',
      },
      size: {
        xs: 'h-8 px-3 text-xs rounded-md',
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-6 text-base',
        lg: 'h-12 px-8 text-lg',
        xl: 'h-14 px-10 text-xl',
      },
      fullWidth: {
        true: 'w-full',
      },
      loading: {
        true: 'cursor-wait opacity-75',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
      loading: false,
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, loading, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : leftIcon ? (
          <span className="mr-2">{leftIcon}</span>
        ) : null}
        {children}
        {rightIcon && !loading && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };