/**
 * Utility functions for tracking user progress
 */

/**
 * Marks a question as viewed
 * @param questionId The ID of the viewed question
 */
export const markQuestionAsViewed = async (questionId: number): Promise<void> => {
  try {
    await fetch('/api/user/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        questionId,
        status: 'viewed',
      }),
    });
  } catch (error) {
    console.error('Failed to mark question as viewed:', error);
  }
};

/**
 * Marks a question as completed
 * @param questionId The ID of the completed question
 */
export const markQuestionAsCompleted = async (questionId: number): Promise<void> => {
  try {
    await fetch('/api/user/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        questionId,
        status: 'completed',
      }),
    });
  } catch (error) {
    console.error('Failed to mark question as completed:', error);
  }
};

/**
 * Fetches the user's progress data
 * @returns Progress data with completion statistics
 */
export const fetchUserProgress = async (): Promise<{
  questionsCompleted: number;
  questionsViewed: number;
  totalQuestions: number;
  completionPercentage: number;
  domainsSolved: number;
  totalDomains: number;
}> => {
  try {
    const response = await fetch('/api/user/progress');
    if (!response.ok) {
      throw new Error('Failed to fetch progress data');
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch progress data:', error);
    return {
      questionsCompleted: 0,
      questionsViewed: 0,
      totalQuestions: 0,
      completionPercentage: 0,
      domainsSolved: 0,
      totalDomains: 0
    };
  }
};
