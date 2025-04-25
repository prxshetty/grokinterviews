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
    console.log(`Calling API to mark question ${questionId} as completed`);
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
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();
    console.log(`API response for marking question ${questionId} as completed:`, data);
  } catch (error) {
    console.error('Failed to mark question as completed:', error);
  }
};

/**
 * Toggles bookmark status for a question
 * @param questionId The ID of the question to bookmark/unbookmark
 * @param isBookmarked Whether to bookmark (true) or unbookmark (false)
 * @returns Promise resolving to the success status
 */
export const toggleQuestionBookmark = async (questionId: number, isBookmarked: boolean): Promise<boolean> => {
  try {
    const response = await fetch('/api/user/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        questionId,
        status: isBookmarked ? 'bookmarked' : 'viewed', // Set to 'bookmarked' or back to 'viewed'
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update bookmark status');
    }

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('Failed to toggle bookmark status:', error);
    return false;
  }
};

/**
 * Checks if a question is bookmarked by the user
 * @param questionId The ID of the question to check
 * @returns Promise resolving to boolean indicating bookmark status
 */
export const isQuestionBookmarked = async (questionId: number): Promise<boolean> => {
  try {
    const response = await fetch(`/api/user/progress/status?questionId=${questionId}`);
    if (!response.ok) {
      return false;
    }
    const data = await response.json();
    return data.status === 'bookmarked';
  } catch (error) {
    console.error('Failed to check bookmark status:', error);
    return false;
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

/**
 * Checks if a question is completed by the user
 * @param questionId The ID of the question to check
 * @returns Promise resolving to boolean indicating completion status
 */
export const isQuestionCompleted = async (questionId: number): Promise<boolean> => {
  try {
    const response = await fetch(`/api/user/progress/status?questionId=${questionId}`);
    if (!response.ok) {
      return false;
    }
    const data = await response.json();
    return data.status === 'completed';
  } catch (error) {
    console.error('Failed to check completion status:', error);
    return false;
  }
};

/**
 * Fetches progress data for a specific category
 * @param categoryId The ID of the category
 * @returns Promise resolving to category progress data
 */
export const fetchCategoryProgress = async (categoryId: number): Promise<{
  questionsCompleted: number;
  totalQuestions: number;
  completionPercentage: number;
}> => {
  try {
    const response = await fetch(`/api/user/progress/category?categoryId=${categoryId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch category progress data');
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch category progress data:', error);
    return {
      questionsCompleted: 0,
      totalQuestions: 0,
      completionPercentage: 0
    };
  }
};

/**
 * Fetches progress data for a specific topic
 * @param topicId The ID of the topic
 * @returns Promise resolving to topic progress data
 */
export const fetchTopicProgress = async (topicId: number): Promise<{
  categoriesCompleted: number;
  totalCategories: number;
  questionsCompleted: number;
  totalQuestions: number;
  completionPercentage: number;
}> => {
  try {
    console.log(`Fetching progress for topic ${topicId}`);
    const response = await fetch(`/api/user/progress/topic?topicId=${topicId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch topic progress data: ${response.status}`);
    }
    const data = await response.json();
    console.log(`Progress data for topic ${topicId}:`, data);
    return data;
  } catch (error) {
    console.error('Failed to fetch topic progress data:', error);
    return {
      categoriesCompleted: 0,
      totalCategories: 0,
      questionsCompleted: 0,
      totalQuestions: 0,
      completionPercentage: 0
    };
  }
};
