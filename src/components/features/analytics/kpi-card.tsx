import { Card } from '@/components/ui/card';
import { cn } from '@/utils/cn';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

export function KPICard({
  title,
  value,
  change,
  changeLabel,
  icon,
  variant = 'default',
  className,
}: KPICardProps) {
  const variantStyles = {
    default: 'border-l-navy',
    success: 'border-l-green',
    warning: 'border-l-yellow-500',
    error: 'border-l-red',
  };

  return (
    <Card className={cn('border-l-4', variantStyles[variant], className)} padding="md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-grey-dark">{title}</h3>
        {icon && <div className="text-grey-medium">{icon}</div>}
      </div>
      
      <div className="text-2xl font-bold text-navy mb-1">{value}</div>
      
      {change !== undefined && (
        <div className="flex items-center gap-1 text-sm">
          {change >= 0 ? (
            <TrendingUp size={16} className="text-green" />
          ) : (
            <TrendingDown size={16} className="text-red" />
          )}
          <span className={change >= 0 ? 'text-green font-medium' : 'text-red font-medium'}>
            {Math.abs(change)}%
          </span>
          {changeLabel && (
            <span className="text-grey-medium">{changeLabel}</span>
          )}
        </div>
      )}
    </Card>
  );
}