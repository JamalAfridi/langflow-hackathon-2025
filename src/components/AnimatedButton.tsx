
import { ReactNode, ButtonHTMLAttributes } from 'react';
import { Button } from '@/components/ui/button';

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'emoji' | 'voice';
  size?: 'small' | 'medium' | 'large';
  isActive?: boolean;
}

const AnimatedButton = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  isActive = false,
  className = '',
  ...props 
}: AnimatedButtonProps) => {
  const variantStyles = {
    primary: 'bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white',
    secondary: 'bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 text-white',
    emoji: 'bg-white border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50',
    voice: isActive 
      ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
      : 'bg-green-500 hover:bg-green-600'
  };

  const sizeStyles = {
    small: 'h-10 px-4 text-sm',
    medium: 'h-12 px-6 text-base',
    large: 'h-16 px-8 text-xl'
  };

  return (
    <Button
      className={`
        rounded-2xl font-bold shadow-lg
        transform hover:scale-105 active:scale-95
        transition-all duration-200
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </Button>
  );
};

export default AnimatedButton;
