'use client';

import { BookmarkButton } from './BookmarkButton';

interface QuestionHeaderProps {
  questionId: number;
  topicId: number | null;
  categoryId: number | null;
  questionText: string;
  questionIndex: number;
  isCompleted: boolean;
  isBookmarked: boolean;
  isExpanded: boolean;
  onToggleExpansion: () => void;
  onBookmarkChange: (isBookmarked: boolean) => void; // Callback for bookmark changes
}

export function QuestionHeader({
  questionId,
  topicId,
  categoryId,
  questionText,
  questionIndex,
  isCompleted,
  isBookmarked,
  isExpanded,
  onToggleExpansion,
  onBookmarkChange,
}: QuestionHeaderProps) {
  // Internal handler to prevent click propagation when interacting with the bookmark button
  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // The actual bookmark logic is handled within BookmarkButton,
    // but we need the onBookmarkChange callback for the parent.
  };

  return (
    <div
      className="flex items-start justify-between mb-2 cursor-pointer"
      onClick={onToggleExpansion}
      role="button"
      aria-expanded={isExpanded}
      aria-controls={`answer-content-q-${questionId}`} // Use actual question ID
    >
      {/* Left side: Completion status and Question Text */}
      <div className="flex items-start flex-1 pr-4"> {/* Use flex-1 to allow text to wrap */}
        {isCompleted ? (
          <div className="mr-2 text-green-600 dark:text-green-400 flex-shrink-0 mt-1"> {/* Adjusted margin/padding */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        ) : (
          <div className="mr-2 w-5 flex-shrink-0"></div> // Placeholder for alignment
        )}
        <h4 className="font-medium text-gray-900 dark:text-white"> {/* Removed pr-4, handled by parent div */}
          {questionText || 'Question text not available'}
        </h4>
      </div>

      {/* Right side: Actions and Index */}
      <div className="flex items-center flex-shrink-0 space-x-2"> {/* Use space-x for consistent spacing */}
        {/* Bookmark Button - Show if we have at least a categoryId */}
        {categoryId != null && (
          <div onClick={handleBookmarkClick}> {/* Stop propagation */}
            <BookmarkButton
              questionId={questionId}
              topicId={topicId}
              categoryId={categoryId}
              initialIsBookmarked={isBookmarked}
              onBookmarkChange={onBookmarkChange} // Pass the callback
            />
          </div>
        )}
        {/* Question Index */}
        <span className="text-xs text-gray-500 dark:text-gray-400">Q{questionIndex + 1}</span>
        {/* Expand/Collapse Icon */}
        <button
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
          aria-hidden="true"
          tabIndex={-1} // Not focusable, as the whole div is clickable
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform transition-transform" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
} 