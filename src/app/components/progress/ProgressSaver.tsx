'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Component that saves completed questions to the database when the user navigates away
 */
export default function ProgressSaver() {
  const pathname = usePathname();
  const [lastSaveTime, setLastSaveTime] = useState<number>(0);

  // Save completed questions when the component unmounts or path changes
  useEffect(() => {
    // Function to save completed questions
    const saveCompletedQuestions = async () => {
      try {
        // Get completed questions from sessionStorage
        const completedQuestions = JSON.parse(sessionStorage.getItem('completedQuestions') || '[]');

        if (completedQuestions.length === 0) return;

        console.log('Saving completed questions:', completedQuestions);

        // Save each completed question to the database
        for (const questionId of completedQuestions) {
          try {
            console.log(`Saving question ${questionId} as completed...`);
            const response = await fetch('/api/user/progress', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                questionId,
                status: 'completed',
              }),
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error(`Error saving question ${questionId}:`, response.status, errorText);
              continue; // Skip to the next question
            }

            const result = await response.json();
            console.log(`Successfully saved question ${questionId} result:`, result);
          } catch (err) {
            console.error(`Exception saving question ${questionId}:`, err);
          }
        }

        // Clear completed questions from sessionStorage
        sessionStorage.removeItem('completedQuestions');
        setLastSaveTime(Date.now());
      } catch (error) {
        console.error('Error saving completed questions:', error);
      }
    };

    // Save completed questions periodically (every 30 seconds) and when unmounting
    const intervalId = setInterval(() => {
      saveCompletedQuestions();
    }, 30000); // 30 seconds

    // Also save when pathname changes
    if (lastSaveTime < Date.now() - 5000) { // Don't save too frequently
      saveCompletedQuestions();
    }

    // Clean up interval and save one last time when unmounting
    return () => {
      clearInterval(intervalId);
      saveCompletedQuestions();
    };
  }, [pathname, lastSaveTime]); // Re-run when pathname changes

  // This component doesn't render anything
  return null;
}
