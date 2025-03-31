/**
 * Logs a question view activity
 * @param questionId The ID of the viewed question
 */
export const logQuestionView = async (questionId: number): Promise<void> => {
  try {
    await fetch('/api/activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ questionId }),
    });
  } catch (error) {
    console.error('Failed to log question view:', error);
  }
};

/**
 * Fetches the user's activity data
 * @returns Activity data array with date and count
 */
export const fetchActivityData = async (): Promise<{ date: string; count: number }[]> => {
  try {
    const response = await fetch('/api/activity');
    if (!response.ok) {
      throw new Error('Failed to fetch activity data');
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch activity data:', error);
    return [];
  }
}; 