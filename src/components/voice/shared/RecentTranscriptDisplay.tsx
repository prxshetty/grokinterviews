import React, { useRef, useEffect, useMemo, memo, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { InlineLoadingSpinner } from '@/components/ui/LoadingSpinner';
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
  showChat?: boolean;
}

const RecentTranscriptDisplay = memo(function RecentTranscriptDisplay({
  allTranscripts,
  isInterviewActive,
  isLoadingTranscripts,
  showChat = true
}: RecentTranscriptDisplayProps) {
  const { user, profile } = useAuth();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastTranscriptCountRef = useRef(0);
  
  // Memoize processed transcripts to prevent unnecessary recalculations
  const processedTranscripts = useMemo(() => {
    if (!allTranscripts || allTranscripts.length === 0) return [];
    
    // Sort by conversation_order first, then by created_at as fallback
    return [...allTranscripts].sort((a, b) => {
      if (a.conversation_order !== undefined && b.conversation_order !== undefined) {
        return a.conversation_order - b.conversation_order;
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  }, [allTranscripts]);
  
  // Optimized scroll effect - only scroll when new transcripts are added
  useEffect(() => {
    const currentCount = processedTranscripts.length;
    
    if (scrollContainerRef.current && currentCount > lastTranscriptCountRef.current) {
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
      });
    }
    
    lastTranscriptCountRef.current = currentCount;
  }, [processedTranscripts.length]); // Only depend on length
  
  // Memoize time formatting to prevent recalculation
  const formatTime = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);
  
  if (!isInterviewActive || !showChat) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto mb-8">
      <div 
        ref={scrollContainerRef}
        className="space-y-4 max-h-96 overflow-y-auto scroll-smooth"
      >
        {processedTranscripts.map((transcript) => (
          <div
            key={`${transcript.id}-${transcript.conversation_order}`}
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
                {formatTime(transcript.created_at)}
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
                <InlineLoadingSpinner size="sm" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default RecentTranscriptDisplay;