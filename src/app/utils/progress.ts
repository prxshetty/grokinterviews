/**
 * Utility functions for tracking user progress
 */

/**
 * Marks a question as viewed
 * @param questionId The ID of the viewed question
 * @param topicId The ID of the topic (will be fetched from category if not provided)
 * @param categoryId The ID of the category
 * @returns Promise resolving to boolean indicating success
 */
export const markQuestionAsViewed = async (
  questionId: number,
  topicId: number | null | undefined,
  categoryId: number | null | undefined
): Promise<boolean> => {
  try {
    // Validate that we have the required IDs
    if (!questionId || !categoryId) {
      console.error('Missing required fields: questionId and categoryId are required');
      return false;
    }

    let finalTopicId = topicId;

    // If topicId is missing, null, or 0, fetch it from the category
    if (!finalTopicId || finalTopicId === 0) {
      console.log(`Topic ID missing (${finalTopicId}), fetching from category ${categoryId}`);
      
      try {
        const response = await fetch('/api/topics/categories', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Find the category and get its topic_id
          if (data.categories && Array.isArray(data.categories)) {
            const category = data.categories.find((cat: { id: number; topic_id: number }) => cat.id === categoryId);
            if (category && category.topic_id) {
              finalTopicId = category.topic_id;
              console.log(`Found topic ID ${finalTopicId} for category ${categoryId}`);
            }
          }
        }
      } catch (fetchError) {
        console.error('Failed to fetch topic ID from category:', fetchError);
      }

      // If we still don't have a topic ID, try a different approach
      if (!finalTopicId || finalTopicId === 0) {
        console.log(`Still missing topic ID, trying direct category lookup for category ${categoryId}`);
        try {
          // Use the simple endpoint to get topic_id for this category
          const categoryResponse = await fetch(`/api/topics/categories?categoryId=${categoryId}&getTopicOnly=true`);
          if (categoryResponse.ok) {
            const categoryData = await categoryResponse.json();
            if (categoryData && categoryData.topicId) {
              finalTopicId = categoryData.topicId;
              console.log(`Found topic ID ${finalTopicId} via direct category lookup`);
            }
          }
        } catch (directFetchError) {
          console.error('Failed direct category lookup:', directFetchError);
        }
      }
    }

    // Final validation - ensure we have all required fields
    if (!finalTopicId || finalTopicId === 0) {
      console.error(`Unable to determine topic ID for category ${categoryId}. Cannot proceed with marking question as viewed.`);
      return false;
    }

    console.log(`Calling API to mark question ${questionId} (Topic: ${finalTopicId}, Cat: ${categoryId}) as viewed`);
    const response = await fetch('/api/user/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        questionId,
        status: 'viewed',
        topicId: finalTopicId,     // Now guaranteed to be valid
        categoryId: categoryId     // Now guaranteed to be valid
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API returned status ${response.status}:`, errorText);
      throw new Error(`API returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log(`API response for marking question ${questionId} as viewed:`, data);
    return true;
  } catch (error) {
    console.error('Failed to mark question as viewed:', error);
    return false;
  }
};

/**
 * Marks a question as completed in user progress
 * @param questionId The ID of the question to mark as completed
 * @param topicId The ID of the topic (will be fetched from category if not provided)
 * @param categoryId The ID of the category
 * @returns Promise resolving to boolean indicating success
 */
export const markQuestionAsCompleted = async (
  questionId: number, 
  topicId: number | null | undefined, 
  categoryId: number | null | undefined
): Promise<boolean> => {
  try {
    // Validate that we have the required IDs
    if (!questionId || !categoryId) {
      console.error('Missing required fields: questionId and categoryId are required');
      return false;
    }

    let finalTopicId = topicId;

    // If topicId is missing, null, or 0, fetch it from the category
    if (!finalTopicId || finalTopicId === 0) {
      console.log(`Topic ID missing (${finalTopicId}), fetching from category ${categoryId}`);
      
      try {
        const response = await fetch('/api/topics/categories', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Find the category and get its topic_id
          if (data.categories && Array.isArray(data.categories)) {
            const category = data.categories.find((cat: { id: number; topic_id: number }) => cat.id === categoryId);
            if (category && category.topic_id) {
              finalTopicId = category.topic_id;
              console.log(`Found topic ID ${finalTopicId} for category ${categoryId}`);
            }
          }
        }
      } catch (fetchError) {
        console.error('Failed to fetch topic ID from category:', fetchError);
      }

      // If we still don't have a topic ID, try a different approach
      if (!finalTopicId || finalTopicId === 0) {
        console.log(`Still missing topic ID, trying direct category lookup for category ${categoryId}`);
        try {
          // Use the simple endpoint to get topic_id for this category
          const categoryResponse = await fetch(`/api/topics/categories?categoryId=${categoryId}&getTopicOnly=true`);
          if (categoryResponse.ok) {
            const categoryData = await categoryResponse.json();
            if (categoryData && categoryData.topicId) {
              finalTopicId = categoryData.topicId;
              console.log(`Found topic ID ${finalTopicId} via direct category lookup`);
            }
          }
        } catch (directFetchError) {
          console.error('Failed direct category lookup:', directFetchError);
        }
      }
    }

    // Final validation - ensure we have all required fields
    if (!finalTopicId || finalTopicId === 0) {
      console.error(`Unable to determine topic ID for category ${categoryId}. Cannot proceed with progress update.`);
      return false;
    }

    console.log(`Calling API to mark question ${questionId} (Topic: ${finalTopicId}, Cat: ${categoryId}) as completed`);
    const response = await fetch('/api/user/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        questionId,
        status: 'completed',
        topicId: finalTopicId,     // Now guaranteed to be valid
        categoryId: categoryId     // Now guaranteed to be valid
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
 * @param topicId The ID of the topic this question belongs to
 * @param categoryId The ID of the category this question belongs to
 * @returns Promise resolving to the success status
 */
export const toggleQuestionBookmark = async (
  questionId: number,
  isBookmarked: boolean,
  topicId: number,
  categoryId: number
): Promise<boolean> => {
  try {
    const response = await fetch('/api/user/bookmarks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        questionId,
        isBookmarked: isBookmarked,
        topicId,
        categoryId,
      }),
    });

    if (!response.ok) {
      let errorDetails = 'Unknown error';
      try {
        const errorData = await response.json();
        errorDetails = errorData.details || errorData.error || JSON.stringify(errorData);
      } catch (e) {
        errorDetails = response.statusText;
      }
      throw new Error(`Failed to update bookmark status: ${response.status} - ${errorDetails}`);
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

/**
 * Fetches progress data for a specific section
 * @param domain The domain (e.g., 'ml', 'ai')
 * @param sectionName The name of the section
 * @param forceRefresh Whether to force a fresh fetch (bypass cache)
 * @returns Promise resolving to section progress data
 */
export const fetchSectionProgress = async (
  domain: string,
  sectionName: string,
  forceRefresh: boolean = false
): Promise<{
  subtopicsCompleted: number;
  partiallyCompletedSubtopics?: number;
  totalSubtopics: number;
  questionsCompleted: number;
  totalQuestions: number;
  completionPercentage: number;
}> => {
  try {
    console.log(`Fetching progress for section ${sectionName} in domain ${domain}${forceRefresh ? ' (forced refresh)' : ''}`);

    // Try to get progress from the progress summary API first
    try {
      const summaryData = await fetchProgressSummary('section', 0, domain, sectionName, forceRefresh);
      if (summaryData && typeof summaryData.completion_percentage === 'number') {
        console.log(`Using progress summary data for section ${sectionName}:`, summaryData);
        return {
          subtopicsCompleted: summaryData.completed_children || 0,
          partiallyCompletedSubtopics: summaryData.partially_completed_children || 0,
          totalSubtopics: summaryData.total_children || 0,
          questionsCompleted: summaryData.questions_completed || 0,
          totalQuestions: summaryData.total_questions || 0,
          completionPercentage: summaryData.completion_percentage
        };
      }
    } catch (summaryError) {
      console.warn(`Failed to fetch progress summary for section ${sectionName}:`, summaryError);
      // Continue with the fallback approach
    }

    // Fallback to the section-progress API
    // Add cache-busting parameter if forceRefresh is true
    const cacheBuster = forceRefresh ? `&_t=${Date.now()}` : '';
    const response = await fetch(
      `/api/user/progress/section-progress?domain=${domain}&section=${encodeURIComponent(sectionName)}${cacheBuster}`,
      { headers: forceRefresh ? { 'Cache-Control': 'no-cache' } : {} }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch section progress data: ${response.status}`);
    }
    const data = await response.json();
    console.log(`Progress data for section ${sectionName}:`, data);

    // Ensure the completionPercentage is a number
    if (data && typeof data.completionPercentage !== 'number') {
      console.warn(`Invalid completionPercentage for section ${sectionName}:`, data.completionPercentage);
      data.completionPercentage = 0;
    }

    return data;
  } catch (error) {
    console.error(`Failed to fetch progress data for section ${sectionName}:`, error);
    return {
      subtopicsCompleted: 0,
      totalSubtopics: 0,
      questionsCompleted: 0,
      totalQuestions: 0,
      completionPercentage: 0
    };
  }
};

/**
 * Fetches progress data from the progress summary API
 * @param entityType The type of entity ('domain', 'section', 'topic', 'category')
 * @param entityId The ID of the entity (0 for domain and section)
 * @param domain The domain (e.g., 'ml', 'ai')
 * @param sectionName The name of the section (optional)
 * @param forceRefresh Whether to force a fresh fetch (bypass cache)
 * @returns Promise resolving to progress summary data
 */
export const fetchProgressSummary = async (
  entityType: string,
  entityId: number,
  domain: string,
  sectionName?: string,
  forceRefresh: boolean = false
): Promise<{
  completion_percentage: number;
  questions_completed: number;
  total_questions: number;
  completed_children: number;
  partially_completed_children: number;
  total_children: number;
  timestamp: number;
}> => {
  try {
    console.log(`Fetching progress summary for ${entityType} ${entityId} in domain ${domain}${sectionName ? `, section ${sectionName}` : ''}${forceRefresh ? ' (forced refresh)' : ''}`);

    // Build the URL
    let url = `/api/user/progress/summary?entityType=${entityType}&domain=${domain}`;

    if (entityId > 0) {
      url += `&entityId=${entityId}`;
    }

    if (sectionName) {
      url += `&section=${encodeURIComponent(sectionName)}`;
    }

    // Add cache-busting parameter if forceRefresh is true
    if (forceRefresh) {
      url += `&_t=${Date.now()}`;
    }

    const response = await fetch(url, {
      headers: forceRefresh ? { 'Cache-Control': 'no-cache' } : {}
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch progress summary data: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Progress summary data for ${entityType} ${entityId}:`, data);

    return data;
  } catch (error) {
    console.error(`Failed to fetch progress summary data for ${entityType} ${entityId}:`, error);
    return {
      completion_percentage: 0,
      questions_completed: 0,
      total_questions: 0,
      completed_children: 0,
      partially_completed_children: 0,
      total_children: 0,
      timestamp: Date.now()
    };
  }
};

/**
 * Fetches progress data for all subtopics in a domain
 * @param domain The domain (e.g., 'ml', 'ai', 'dsa')
 * @param topicId Optional topic ID to filter by specific topic/section
 * @param forceRefresh Whether to force a fresh fetch (bypass cache)
 * @returns Promise resolving to domain subtopics progress data
 */
export const fetchDomainProgress = async (
  domain: string,
  topicId?: string,
  forceRefresh: boolean = false
): Promise<{
  subtopics: Record<string, {
    categoriesCompleted: number;
    totalCategories: number;
    questionsCompleted: number;
    totalQuestions: number;
    completionPercentage: number;
    name: string;
    section_name: string;
  }>;
  sectionProgress?: {
    completionPercentage: number;
    subtopicsCompleted: number;
    partiallyCompletedSubtopics: number;
    totalSubtopics: number;
    questionsCompleted: number;
    totalQuestions: number;
  };
  timestamp: number;
}> => {
  try {
    console.log(`Fetching domain progress for ${domain}${topicId ? ` with topic ${topicId}` : ''}${forceRefresh ? ' (forced refresh)' : ''}`);

    // Build the URL
    let url = `/api/user/progress/domain-subtopics?domain=${domain}`;

    if (topicId) {
      url += `&topicId=${topicId}`;
    }

    // Add cache-busting parameter if forceRefresh is true
    if (forceRefresh) {
      url += `&_t=${Date.now()}`;
    }

    const response = await fetch(url, {
      headers: forceRefresh ? { 'Cache-Control': 'no-cache' } : {}
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch domain progress data: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Domain progress data for ${domain}:`, data);

    return {
      subtopics: data.subtopics || {},
      sectionProgress: data.sectionProgress,
      timestamp: data.timestamp || Date.now()
    };
  } catch (error) {
    console.error(`Failed to fetch domain progress data for ${domain}:`, error);
    return {
      subtopics: {},
      sectionProgress: undefined,
      timestamp: Date.now()
    };
  }
};
