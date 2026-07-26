import { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type = 'info', duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="text-green" size={20} />,
    error: <AlertCircle className="text-red" size={20} />,
    warning: <AlertTriangle className="text-yellow-600" size={20} />,
    info: <Info className="text-blue-600" size={20} />,
  };

  const bgColors = {
    success: 'bg-green-50 border-green',
    error: 'bg-red-50 border-red',
    warning: 'bg-yellow-50 border-yellow-600',
    info: 'bg-blue-50 border-blue-600',
  };

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 max-w-sm w-full rounded-lg border-l-4 shadow-lg p-4 transition-all duration-300',
        bgColors[type],
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      <div className="flex items-start gap-3">
        {icons[type]}
        <p className="flex-1 text-sm text-grey-dark">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="text-grey-medium hover:text-grey-dark"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}