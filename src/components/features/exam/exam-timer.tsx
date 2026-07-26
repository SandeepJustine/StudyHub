'use client';

import { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface ExamTimerProps {
  duration: number; // in minutes
  onTimeUp: () => void;
  isRunning: boolean;
  onPause?: () => void;
}

export function ExamTimer({ duration, onTimeUp, isRunning, onPause }: ExamTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeUp();
          return 0;
        }
        
        // Warning at 5 minutes remaining
        if (prev === 300) {
          setIsWarning(true);
        }
        
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = (timeLeft / (duration * 60)) * 100;

  return (
    <div className={`flex items-center gap-3 px-4 py-2 rounded-lg ${
      isWarning ? 'bg-red-50 animate-pulse' : 'bg-navy/5'
    }`}>
      <Clock size={20} className={isWarning ? 'text-red' : 'text-navy'} />
      
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-lg font-mono font-bold ${
            isWarning ? 'text-red' : 'text-navy'
          }`}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
          {isWarning && (
            <AlertTriangle size={16} className="text-red" />
          )}
        </div>
        <div className="w-full bg-grey-light rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-1000 ${
              isWarning ? 'bg-red' : progress > 50 ? 'bg-green' : 'bg-yellow-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}