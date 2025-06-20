
import { ReactNode } from 'react';

interface SpeechBubbleProps {
  children: ReactNode;
  variant?: 'doctor' | 'child' | 'parent';
  size?: 'small' | 'medium' | 'large';
  position?: 'left' | 'right' | 'center';
}

const SpeechBubble = ({ 
  children, 
  variant = 'doctor', 
  size = 'medium', 
  position = 'center' 
}: SpeechBubbleProps) => {
  const variantStyles = {
    doctor: 'bg-white border-blue-200 text-gray-700',
    child: 'bg-yellow-100 border-yellow-300 text-gray-800',
    parent: 'bg-green-100 border-green-300 text-gray-800'
  };

  const sizeStyles = {
    small: 'p-3 text-sm max-w-xs',
    medium: 'p-4 text-base max-w-sm',
    large: 'p-6 text-lg max-w-md'
  };

  const positionStyles = {
    left: 'mr-auto',
    right: 'ml-auto',
    center: 'mx-auto'
  };

  const tailPositions = {
    left: 'left-6',
    right: 'right-6',
    center: 'left-1/2 transform -translate-x-1/2'
  };

  return (
    <div className={`
      relative rounded-3xl border-2 shadow-lg
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${positionStyles[position]}
    `}>
      {/* Speech bubble tail */}
      <div className={`
        absolute -top-3 w-6 h-6 rotate-45 border-l-2 border-t-2
        ${variantStyles[variant]}
        ${tailPositions[position]}
      `}></div>
      
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default SpeechBubble;
