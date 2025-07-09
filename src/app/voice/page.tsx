'use client';

import { useState } from 'react';
// import { useAuth } from '@/components/AuthProvider';
// import { useRouter } from 'next/navigation';
// import { useEffect } from 'react';
import { VoiceRecorder } from '@/components/voice/VoiceRecorder';
import { VoicePlayer } from '@/components/voice/VoicePlayer';

export default function VoicePage() {
  const [currentQuestion, setCurrentQuestion] = useState(
    "Welcome to your behavioral interview practice session! I'll ask you some common behavioral questions to help you prepare. Let's start with: Tell me about yourself and your background."
  );
  const [userResponse, setUserResponse] = useState('');
  const [conversationHistory, setConversationHistory] = useState<Array<{type: 'ai' | 'user', text: string}>>([]);
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiResponseKey, setAiResponseKey] = useState(0); // Force re-render of VoicePlayer
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  
  // const { user, loading } = useAuth();
  // const router = useRouter();

  // Generate AI response based on user input
  const generateAIResponse = async (userText: string, history: Array<{type: 'ai' | 'user', text: string}>) => {
    try {
      setIsProcessingAI(true);
      
      console.log('🤖 Generating AI response for:', userText.substring(0, 50) + '...');
      
      const response = await fetch('/api/voice/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userResponse: userText,
          conversationHistory: history,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate AI response');
      }

      const result = await response.json();
      
      if (result.success && result.aiResponse) {
        // Add AI response to conversation history first
        setConversationHistory(prev => [...prev, { type: 'ai' as const, text: result.aiResponse }]);
        
        // Update the current question with AI response
        setCurrentQuestion(result.aiResponse);
        
        // Force VoicePlayer to re-render and auto-play new question
        setAiResponseKey(prev => prev + 1);
        
        console.log('✅ AI response generated:', result.aiResponse.substring(0, 100) + '...');
      } else {
        throw new Error('No AI response received');
      }

    } catch (error: any) {
      console.error('❌ Failed to generate AI response:', error);
      // Fallback to a generic follow-up question
      const fallbackQuestion = "That's interesting. Can you tell me more about a specific challenge you faced and how you overcame it?";
      setConversationHistory(prev => [...prev, { type: 'ai' as const, text: fallbackQuestion }]);
      setCurrentQuestion(fallbackQuestion);
      setAiResponseKey(prev => prev + 1);
    } finally {
      setIsProcessingAI(false);
    }
  };

  // Redirect to sign-in if not authenticated (DISABLED FOR TESTING)
  // useEffect(() => {
  //   if (!loading && !user) {
  //     router.push('/signin?redirect=/voice');
  //   }
  // }, [user, loading, router]);

  // Show loading state while checking authentication (DISABLED FOR TESTING)
  // if (loading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  //     </div>
  //   );
  // }

  // Don't render anything if user is not authenticated (DISABLED FOR TESTING)
  // if (!user) {
  //   return null;
  // }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Voice Interview Practice
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Practice behavioral interviews with AI-powered voice conversations. 
            Get real-time feedback and improve your interview skills.
          </p>
        </div>

        {/* Main Interface */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            {/* Interview Status */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 rounded-full text-sm font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Ready to Start
              </div>
            </div>

            {/* Voice Recorder */}
            <div className="mb-8">
              <VoiceRecorder
                onRecordingComplete={(audioBlob) => {
                  console.log('Recording completed:', audioBlob);
                }}
                onTranscriptionReceived={async (text) => {
                  setUserResponse(text);
                  const newHistory = [...conversationHistory, { type: 'user' as const, text }];
                  setConversationHistory(newHistory);
                  
                  // Generate AI response
                  await generateAIResponse(text, newHistory);
                }}
                disabled={!isInterviewActive || isProcessingAI}
              />
            </div>

            {/* Interview Content */}
            <div className="space-y-6">
              {/* AI Question */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      AI Interviewer
                    </h3>
                    {isAISpeaking && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-blue-600 dark:text-blue-400">Speaking...</span>
                      </div>
                    )}
                  </div>
                  <VoicePlayer 
                    key={`${aiResponseKey}-${currentQuestion.length}`} // Force re-render when question changes
                    text={currentQuestion} 
                    autoPlay={isInterviewActive && !isProcessingAI}
                    className="ml-4"
                    onPlayStateChange={setIsAISpeaking}
                  />
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  {currentQuestion}
                </p>
              </div>

              {/* User Response Area */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Your Response
                </h3>
                {isProcessingAI ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <p className="text-blue-600 dark:text-blue-400 italic">
                      AI is thinking of a follow-up question...
                    </p>
                  </div>
                ) : userResponse ? (
                  <p className="text-gray-700 dark:text-gray-300">
                    {userResponse}
                  </p>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 italic">
                    Your response will appear here after recording...
                  </p>
                )}
              </div>
            </div>

            {/* Conversation History */}
            {conversationHistory.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Interview Conversation
                </h3>
                <div className="space-y-3 max-h-60 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  {conversationHistory.map((message, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${
                        message.type === 'ai'
                          ? 'bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500'
                          : 'bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                          {message.type === 'ai' ? '🤖 Interviewer' : '👤 You'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                        {message.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interview Controls */}
            <div className="mt-8 flex justify-center space-x-4">
              {!isInterviewActive ? (
                <button
                  onClick={() => setIsInterviewActive(true)}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  Start Interview
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsInterviewActive(false);
                    setUserResponse('');
                    setConversationHistory([]);
                    setIsProcessingAI(false);
                    setCurrentQuestion(
                      "Welcome to your behavioral interview practice session! I'll ask you some common behavioral questions to help you prepare. Let's start with: Tell me about yourself and your background."
                    );
                    setAiResponseKey(prev => prev + 1);
                  }}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  End Interview
                </button>
              )}
            </div>

            {/* Instructions */}
            <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-400 mb-2">
                How it works:
              </h4>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>• Click "Start Interview" to begin</li>
                <li>• Listen to the AI question (it will play automatically)</li>
                <li>• Click the microphone to record your response</li>
                <li>• Your speech will be converted to text automatically</li>
                <li>• Practice common behavioral interview scenarios</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
