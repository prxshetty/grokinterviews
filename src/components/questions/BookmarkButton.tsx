'use client';

import { useState, KeyboardEvent, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
// Removed toggleQuestionBookmark import as progress tracking is disabled

interface BookmarkButtonProps {
  questionId: number;
  topicId: number | null;
  categoryId: number;
  initialIsBookmarked?: boolean;
  onBookmarkChange?: (isBookmarked: boolean) => void;
  asDiv?: boolean; // New prop to render as div instead of button
}

const animations = {
  icon: {
    initial: { scale: 1, rotate: 0 },
    tapActive: { scale: 0.85, rotate: -10 },
    tapCompleted: { scale: 1, rotate: 0 },
  },
  burst: {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: [0, 1.4, 1], opacity: [0, 0.4, 0] },
    transition: { duration: 0.7, ease: 'easeOut' as const },
  },
  particles: (index: number) => {
    const angle = (index / 5) * (2 * Math.PI);
    const radius = 18 + Math.random() * 8;
    const scale = 0.8 + Math.random() * 0.4;
    const duration = 0.6 + Math.random() * 0.1;

    return {
      initial: { scale: 0, opacity: 0.3, x: 0, y: 0 },
      animate: {
        scale: [0, scale, 0],
        opacity: [0.3, 0.8, 0],
        x: [0, Math.cos(angle) * radius],
        y: [0, Math.sin(angle) * radius * 0.75],
      },
      transition: { duration, delay: index * 0.04, ease: 'easeOut' as const },
    };
  },
};

export function BookmarkButton({
  questionId: _questionId,
  topicId: _topicId,
  categoryId: _categoryId,
  initialIsBookmarked = false,
  onBookmarkChange,
  asDiv = false,
}: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);

  // Handle bookmark toggle
  const handleToggleBookmark = () => {
    const newBookmarkState = !isBookmarked;
    setIsBookmarked(newBookmarkState); // Optimistic update

    // Notify parent component - let parent handle API calls
    if (onBookmarkChange) {
      onBookmarkChange(newBookmarkState);
    }
  };

  const handleClick = (e: MouseEvent<HTMLButtonElement | HTMLDivElement>) => {
    e.stopPropagation();
    handleToggleBookmark();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement | HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); // Prevent page scroll on spacebar
      e.stopPropagation();
      handleToggleBookmark();
    }
  };

  const Wrapper = asDiv ? 'div' : Button;
  const wrapperProps = asDiv
    ? {
        onClick: handleClick,
        onKeyDown: handleKeyDown,
        role: 'button',
        tabIndex: 0,
        'aria-pressed': isBookmarked,
        'aria-label': isBookmarked ? 'Remove bookmark' : 'Add bookmark',
        title: isBookmarked ? 'Remove bookmark' : 'Add bookmark',
        className: "h-8 w-8 flex items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors",
      }
    : {
        variant: "ghost" as const,
        size: "icon" as const,
        onClick: handleClick,
        onKeyDown: handleKeyDown,
        'aria-pressed': isBookmarked,
        'aria-label': isBookmarked ? 'Remove bookmark' : 'Add bookmark',
        title: isBookmarked ? 'Remove bookmark' : 'Add bookmark',
        className: "h-8 w-8",
      };

  return (
    <div className="relative flex items-center justify-center">
      <Wrapper {...wrapperProps}>
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: isBookmarked ? 1.1 : 1 }}
          whileTap={
            isBookmarked
              ? animations.icon.tapCompleted
              : animations.icon.tapActive
          }
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          className="relative flex items-center justify-center"
        >
          <Bookmark className="opacity-60" size={16} aria-hidden="true" />

          <Bookmark
            className="absolute inset-0 text-blue-500 fill-blue-500 transition-all duration-300"
            size={16}
            aria-hidden="true"
            style={{ opacity: isBookmarked ? 1 : 0 }}
          />

          <AnimatePresence>
            {isBookmarked && (
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    'radial-gradient(circle, rgba(59,130,246,0.4) 0%, rgba(59,130,246,0) 80%)',
                }}
                {...animations.burst}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </Wrapper>

      <AnimatePresence>
        {isBookmarked && (
          <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-blue-500"
                style={{
                  width: `${4 + Math.random() * 2}px`,
                  height: `${4 + Math.random() * 2}px`,
                  filter: 'blur(1px)',
                  transform: 'translate(-50%, -50%)',
                }}
                initial={animations.particles(i).initial}
                animate={animations.particles(i).animate}
                transition={animations.particles(i).transition}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
