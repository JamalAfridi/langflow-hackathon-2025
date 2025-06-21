'use client'
import ConversationComponent, { ConversationHandle } from '@/components/Conversation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, Mic, Phone, Settings } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';

const IndexPage = () => {
  const [currentPage, setCurrentPage] = useState('welcome');
  const [isListening, setIsListening] = useState(false);
  const [childName, setChildName] = useState('');
  const convoRef = useRef<ConversationHandle>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const { user } = useAuth();
  console.log(user)
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
  console.log('SUPABASE_ANON_KEY:', !!process.env.SUPABASE_ANON_KEY);

  const handleMicToggle = async () => {
    const connected = convoRef.current?.status === 'connected';

    if (connected) {
      await convoRef.current?.stop();
    } else {
      await convoRef.current?.start();
    }

    // flip the UI state
    setIsListening(!isListening);
    setIsListening(!connected);
  };


  const WelcomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-sky-200 via-purple-100 to-yellow-100 flex flex-col gap-40 items p-6">
      <div className="flex justify-between items-center mb-8">
        <div>

        </div>
        <h2 className="text-2xl font-bold text-purple-800">{user && (<span>{user.user_metadata.full_name}</span>)}</h2>
        {user ? (
          // Show Settings button when user is signed in
          <Link href="/settings">
            <Button className="text-purple-600 bg-transparent transition-all duration-300">
              <Settings className="w-5 h-5" />
            </Button>
          </Link>
        ) : (
          // Show Login/Sign up button when user is not signed in
          <div className="flex gap-2">
            <Link href="/auth?mode=login">
              <Button variant="outline" size="sm" className="text-purple-600">
                Login
              </Button>
            </Link>
            <Link href="/auth?mode=signup">
              <Button size="sm" className="bg-purple-600 text-white">
                Sign Up
              </Button>
            </Link>
          </div>
        )}
      </div>
      <div className="text-center space-y-8 max-w-md mx-auto">
        {/* Animated Avatar */}
        <div className="relative">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center shadow-2xl animate-bounce">
            <div className="text-6xl">🩺</div>
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
            <Heart className="w-4 h-4 text-red-500" />
          </div>
        </div>

        {/* App Title */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-purple-800 drop-shadow-sm">
            ToonDoc
          </h1>
          <p className="text-xl text-blue-700 font-medium">
            Talk to Dr. Wobble! 🎈
          </p>
          <p className="text-gray-600 text-sm">
            Tell me how you're feeling today
          </p>
        </div>

        {/* Main Action Button */}
        <Button
          onClick={() => setCurrentPage('talk')}
          className="w-full h-16 text-xl font-bold bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white rounded-3xl shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          <Mic className="w-6 h-6 mr-3" />
          Start Check-In
        </Button>

        {/* Parent Section */}
        <div className="pt-8 border-t border-purple-200">
          <Button
            variant="ghost"
            onClick={() => setCurrentPage('summary')}
            className="text-purple-600 hover:text-purple-800 text-sm"
          >
            👨‍👩‍👧‍👦 View Past Reports
          </Button>
        </div>
      </div>
    </div>
  );

  const TalkPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-mint-200 via-blue-100 to-purple-100 flex flex-col p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <Button
          variant="ghost"
          onClick={() => setCurrentPage('welcome')}
          className="text-purple-600"
        >
          ← Back
        </Button>
        <h2 className="text-2xl font-bold text-purple-800">Dr. Wobble</h2>
        <div className="w-16"></div>
      </div>

      {/* Dr. Wobble Avatar */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-8">
        <div className={`relative transition-all duration-500 ${isListening ? 'scale-110' : 'scale-100'}`}>
          <div className="w-40 h-40 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full flex items-center justify-center shadow-2xl">
            <div className="text-8xl animate-bounce">🥼</div>
          </div>
          {isListening && (
            <div className="absolute inset-0 border-4 border-green-400 rounded-full animate-ping"></div>
          )}
        </div>

        {/* Speech Bubble */}
        <ConversationComponent ref={convoRef} />
        <div className="bg-white rounded-3xl p-6 shadow-lg max-w-sm mx-auto relative">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white rotate-45"></div>
          <p className="text-lg text-gray-700 text-center font-medium">
            {isListening
              ? "I'm listening carefully... 👂"
              : "Hi there! How are you feeling today? Tap the button and tell me!"
            }
          </p>
        </div>

        {/* Microphone Button */}
        <Button
          onClick={handleMicToggle}
          className={`w-24 h-24 rounded-full shadow-xl transition-all duration-300 ${isListening
            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
            : 'bg-green-500 hover:bg-green-600'
            }`}
        >
          <Mic className="w-8 h-8 text-white" />
        </Button>

        {/* Emoji Buttons */}
        <div className="grid grid-cols-4 gap-4 mt-8">
          {['😊', '😢', '🤢', '😴', '🤒', '😰', '😡', '🤕'].map((emoji, index) => (
            <Button
              key={index}
              variant="outline"
              className="w-16 h-16 text-2xl rounded-2xl border-2 border-purple-200 hover:border-purple-400 hover:scale-110 transition-all duration-200"
              onClick={() => {
                setSymptoms(prev => [...prev, `Feeling ${emoji}`]);
                setCurrentPage('summary');
              }}
            >
              {emoji}
            </Button>
          ))}
        </div>

        {/* Continue Button */}
        {symptoms.length > 0 && (
          <Button
            onClick={() => setCurrentPage('summary')}
            className="w-full max-w-sm h-12 bg-purple-500 hover:bg-purple-600 text-white rounded-2xl font-bold"
          >
            Continue to Summary
          </Button>
        )}
      </div>
    </div>
  );

  const SummaryPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <Button
          variant="ghost"
          onClick={() => setCurrentPage('talk')}
          className="text-purple-600"
        >
          ← Back
        </Button>
        <h2 className="text-2xl font-bold text-purple-800">Health Summary</h2>
        <Link href="/settings">
          <Button className="text-purple-600 bg-transparent transition-all duration-300">
            <Settings className="w-5 h-5" />
          </Button>
        </Link>
      </div>

      {/* Summary Card */}
      <div className="max-w-md mx-auto space-y-6">
        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="text-3xl">📋</div>
            </div>
            <h3 className="text-xl font-bold text-gray-800">Check-up Complete!</h3>
          </div>

          {/* Summary Details */}
          <div className="space-y-4">
            <div className="bg-purple-50 rounded-2xl p-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">👶</span>
                <div>
                  <p className="font-semibold text-gray-800">Child Age</p>
                  <p className="text-gray-600">6 years old</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-2xl p-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">😷</span>
                <div>
                  <p className="font-semibold text-gray-800">Symptoms</p>
                  <p className="text-gray-600">
                    {symptoms.length > 0 ? symptoms.join(', ') : 'Tummy ache, feeling tired'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-2xl p-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📤</span>
                <div>
                  <p className="font-semibold text-gray-800">Sent to</p>
                  <p className="text-gray-600">Mom's phone via SMS</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button
            onClick={() => {
              setSymptoms([]);
              setCurrentPage('talk');
            }}
            className="w-full h-14 bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white rounded-2xl font-bold text-lg"
          >
            <Phone className="w-5 h-5 mr-3" />
            Send Another Report
          </Button>

          <Button
            variant="outline"
            onClick={() => setCurrentPage('welcome')}
            className="w-full h-12 border-2 border-purple-300 text-purple-700 rounded-2xl font-medium hover:bg-purple-50"
          >
            Back to Home
          </Button>
        </div>

        {/* QR Code Placeholder */}
        <div className="bg-white rounded-2xl p-6 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <div className="text-4xl">📱</div>
          </div>
          <p className="text-sm text-gray-600">
            Scan to view full report on your phone
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="font-sans">
      {currentPage === 'welcome' && <WelcomePage />}
      {currentPage === 'talk' && <TalkPage />}
      {currentPage === 'summary' && <SummaryPage />}
    </div>
  );
};

export default IndexPage;
