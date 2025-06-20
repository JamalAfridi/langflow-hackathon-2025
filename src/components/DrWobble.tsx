
import { useState, useEffect } from 'react';
import { Heart, Sparkles } from 'lucide-react';

interface DrWobbleProps {
  isListening?: boolean;
  mood?: 'happy' | 'thinking' | 'caring' | 'excited';
  size?: 'small' | 'medium' | 'large';
}

const DrWobble = ({ isListening = false, mood = 'happy', size = 'medium' }: DrWobbleProps) => {
  const [bounce, setBounce] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setBounce(true);
      setTimeout(() => setBounce(false), 500);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-32 h-32',
    large: 'w-40 h-40'
  };

  const moodColors = {
    happy: 'from-yellow-300 to-orange-400',
    thinking: 'from-blue-300 to-purple-400',
    caring: 'from-green-300 to-teal-400',
    excited: 'from-pink-300 to-red-400'
  };

  const moodExpressions = {
    happy: '😊',
    thinking: '🤔',
    caring: '🥰',
    excited: '🤩'
  };

  return (
    <div className="relative">
      <div className={`
        ${sizeClasses[size]} 
        bg-gradient-to-br ${moodColors[mood]} 
        rounded-full flex items-center justify-center shadow-2xl 
        transition-all duration-500
        ${bounce ? 'animate-bounce' : ''}
        ${isListening ? 'scale-110' : 'scale-100'}
      `}>
        <div className="text-6xl">
          {isListening ? '👂' : moodExpressions[mood]}
        </div>
      </div>

      {/* Listening Animation */}
      {isListening && (
        <>
          <div className="absolute inset-0 border-4 border-green-400 rounded-full animate-ping"></div>
          <div className="absolute inset-0 border-2 border-blue-400 rounded-full animate-pulse"></div>
        </>
      )}

      {/* Floating Hearts */}
      {mood === 'caring' && (
        <div className="absolute -top-2 -right-2">
          <Heart className="w-6 h-6 text-red-500 animate-pulse" />
        </div>
      )}

      {/* Sparkles for excited mood */}
      {mood === 'excited' && (
        <div className="absolute -top-1 -right-1">
          <Sparkles className="w-5 h-5 text-yellow-500 animate-spin" />
        </div>
      )}

      {/* Medical Badge */}
      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-blue-200">
        <div className="text-sm">🩺</div>
      </div>
    </div>
  );
};

export default DrWobble;
