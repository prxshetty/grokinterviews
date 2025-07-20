import React, { useRef, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DEFAULT_AVATAR_URL } from '@/config';
import CompanyLogo from './CompanyLogo';

interface Transcript {
  id: string;
  transcript_text: string;
  interaction_type: 'ai_response' | 'user_response';
  created_at: string;
  conversation_order?: number;
}

interface RecentTranscriptDisplayProps {
  allTranscripts: Transcript[];
  isInterviewActive: boolean;
  isLoadingTranscripts: boolean;
}

export default function RecentTranscriptDisplay({
  allTranscripts,
  isInterviewActive,
  isLoadingTranscripts
}: RecentTranscriptDisplayProps) {
  const { user, profile } = useAuth();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new transcripts are added
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [allTranscripts, isLoadingTranscripts]);
  
  if (!isInterviewActive) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto mb-8">
      <div 
        ref={scrollContainerRef}
        className="space-y-4 max-h-96 overflow-y-auto scroll-smooth"
      >
        {allTranscripts.map((transcript) => (
          <div
            key={transcript.id}
            className={`flex gap-3 ${
              transcript.interaction_type === 'user_response' ? 'justify-end' : 'justify-start'
            }`}
          >
            {transcript.interaction_type === 'ai_response' && (
              <div className="flex-shrink-0">
                <CompanyLogo className="text-blue-600 dark:text-blue-400" size="sm" />
              </div>
            )}
            
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                transcript.interaction_type === 'user_response'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              }`}
            >
              <p className="text-sm">{transcript.transcript_text}</p>
              <p className="text-xs opacity-70 mt-1">
                {new Date(transcript.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            
            {transcript.interaction_type === 'user_response' && (
              <div className="flex-shrink-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={user?.user_metadata?.avatar_url || profile?.avatar_url || DEFAULT_AVATAR_URL} 
                    alt={profile?.full_name || user?.email || 'User'} 
                  />
                  <AvatarFallback>
                    {profile?.full_name?.[0] || user?.email?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>
        ))}
        
        {isLoadingTranscripts && (
          <div className="flex justify-start gap-3">
            <div className="flex-shrink-0">
              <CompanyLogo className="text-blue-600 dark:text-blue-400" size="sm" />
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-2xl">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}