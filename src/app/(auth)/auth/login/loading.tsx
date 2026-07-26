import React from 'react';

interface LoadingProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * Loading component for displaying a loading indicator during registration
 * @param message - Optional custom message to display
 * @param size - Size of the loading indicator (default: 'medium')
 * @param className - Additional CSS classes for styling
 */
const RegisterLoading: React.FC<LoadingProps> = ({ 
  message = 'Processing your registration...', 
  size = 'medium',
  className = '' 
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };
  
  return (
    <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
      <div className="relative">
        <div className={`animate-spin rounded-full border-t-2 border-b-2 border-blue-500 ${sizeClasses[size]}`}></div>
        <div className={`absolute top-0 left-0 animate-ping rounded-full bg-blue-500 opacity-20 ${sizeClasses[size]}`}></div>
      </div>
      {message && (
        <p className="mt-4 text-gray-600 text-center">{message}</p>
      )}
    </div>
  );
};

export default RegisterLoading;
