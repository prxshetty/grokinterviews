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
export const markQuestionAsCompleted = async (questionId: number): Promise<boolean> => {
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
      const errorText = await response.text();
      console.error(`API returned status ${response.status}:`, errorText);
      throw new Error(`API returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log(`API response for marking question ${questionId} as completed:`, data);
    return true;
  } catch (error) {
    console.error('Failed to mark question as completed:', error);
    return false;
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
    // Add cache-busting parameter to prevent caching
    const cacheBuster = `&_t=${Date.now()}`;
    const response = await fetch(`/api/user/progress/status?questionId=${questionId}${cacheBuster}`, {
      headers: { 'Cache-Control': 'no-cache' }
    });

    if (!response.ok) {
      console.error(`Error checking bookmark status for question ${questionId}:`, response.status);
      return false;
    }

    const data = await response.json();
    console.log(`Bookmark status for question ${questionId}:`, data);
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
    console.log(`isQuestionCompleted called for question ${questionId}`);
    // Add cache-busting parameter to prevent caching
    const cacheBuster = `&_t=${Date.now()}`;
    const response = await fetch(`/api/user/progress/status?questionId=${questionId}${cacheBuster}`, {
      headers: { 'Cache-Control': 'no-cache' }
    });

    if (!response.ok) {
      console.error(`Error checking completion status for question ${questionId}:`, response.status);
      return false;
    }

    const data = await response.json();
    console.log(`Completion status API response for question ${questionId}:`, data);
    const isCompleted = data.status === 'completed';
    console.log(`Question ${questionId} is ${isCompleted ? 'completed' : 'not completed'}`);
    return isCompleted;
  } catch (error) {
    console.error('Failed to check completion status:', error);
    return false;
  }
};

/**
 * Fetches progress data for a specific category
 * @param categoryId The ID of the category
 * @param forceRefresh Whether to force a fresh fetch (bypass cache)
 * @returns Promise resolving to category progress data
 */
export const fetchCategoryProgress = async (categoryId: number, forceRefresh: boolean = false): Promise<{
  questionsCompleted: number;
  totalQuestions: number;
  completionPercentage: number;
}> => {
  try {
    console.log(`Fetching progress for category ${categoryId}${forceRefresh ? ' (forced refresh)' : ''}`);

    // Add cache-busting parameter if forceRefresh is true
    const cacheBuster = forceRefresh ? `&_t=${Date.now()}` : '';
    const response = await fetch(`/api/user/progress/category?categoryId=${categoryId}${cacheBuster}`, {
      headers: forceRefresh ? { 'Cache-Control': 'no-cache' } : {}
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch category progress data: ${response.status}`);
    }
    const data = await response.json();
    console.log(`Progress data for category ${categoryId}:`, data);
    return data;
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
 * Fetches progress data for a specific subtopic
 * @param subtopicId The ID of the subtopic
 * @param forceRefresh Whether to force a fresh fetch (bypass cache)
 * @returns Promise resolving to subtopic progress data
 */
export const fetchSubtopicProgress = async (subtopicId: number, forceRefresh: boolean = false): Promise<{
  categoriesCompleted: number;
  totalCategories: number;
  questionsCompleted: number;
  totalQuestions: number;
  completionPercentage: number;
}> => {
  try {
    console.log(`Fetching progress for subtopic ${subtopicId}${forceRefresh ? ' (forced refresh)' : ''}`);

    // Use the new optimized endpoint
    // Add cache-busting parameter if forceRefresh is true
    const cacheBuster = forceRefresh ? `&_t=${Date.now()}` : '';
    const response = await fetch(`/api/user/progress/subtopic-progress?subtopicId=${subtopicId}${cacheBuster}`, {
      headers: forceRefresh ? { 'Cache-Control': 'no-cache' } : {}
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch subtopic progress data: ${response.status}`);
    }
    const data = await response.json();
    console.log(`Progress data for subtopic ${subtopicId}:`, data);
    return data;
  } catch (error) {
    console.error('Failed to fetch subtopic progress data:', error);
    return {
      categoriesCompleted: 0,
      totalCategories: 0,
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
