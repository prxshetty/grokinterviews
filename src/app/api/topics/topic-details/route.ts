import { NextRequest, NextResponse } from 'next/server';
import supabaseServer from '@/utils/supabase-server';

// Function to get categories for a specific topic ID
async function getCategoriesForTopic(topicId: number) {
  console.log(`API - Direct query for categories with topic_id = ${topicId}`);

  try {
    const { data, error } = await supabaseServer
      .from('categories')
      .select('*')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`API - Error fetching categories: ${error.message}`);
      return [];
    }

    console.log(`API - Found ${data?.length || 0} categories for topic ID ${topicId}`);
    if (data && data.length > 0) {
      console.log(`API - First category: ${JSON.stringify(data[0])}`);
    }

    return data || [];
  } catch (error) {
    console.error(`API - Error in getCategoriesForTopic: ${error}`);
    return [];
  }
}

// Function to get questions for a category
async function getQuestionsForCategory(categoryId: number) {
  console.log(`API - Fetching questions for category ID ${categoryId}`);

  try {
    // Direct SQL query to get questions for this category
    const { data, error } = await supabaseServer
      .from('questions')
      .select('*')
      .eq('category_id', categoryId)
      .order('difficulty');

    if (error) {
      console.error(`API - Error fetching questions: ${error.message}`);
      return [];
    }

    console.log(`API - Found ${data?.length || 0} questions for category ID ${categoryId}`);
    if (data && data.length > 0) {
      console.log(`API - First question: ${data[0].question_text}`);
    } else {
      // If no questions found, try a direct database query
      console.log(`API - No questions found, trying direct database query`);

      // Try a different approach - direct SQL query
      const { data: directData, error: directError } = await supabaseServer
        .from('questions')
        .select('*')
        .filter('category_id', 'eq', categoryId)
        .order('difficulty');

      if (directError) {
        console.error(`API - Error in direct query: ${directError.message}`);
      } else {
        console.log(`API - Direct query found ${directData?.length || 0} questions`);
        if (directData && directData.length > 0) {
          console.log(`API - First question from direct query: ${directData[0].question_text}`);
          return directData;
        }
      }

      // Generate adaptive placeholder questions based on the category name and ID
      // This ensures we always have something to show for any category
      console.log(`API - Generating adaptive questions for category ID ${categoryId}`);

      // Try to get the category name from the database
      try {
        const { data: categoryData, error: categoryError } = await supabaseServer
          .from('categories')
          .select('name, description')
          .eq('id', categoryId)
          .single();

        if (!categoryError && categoryData) {
          const categoryName = categoryData.name;
          // Use the description to generate more specific questions if needed
          const categoryDesc = categoryData.description || '';

          console.log(`API - Found category name: ${categoryName}`);

          // Generate questions based on the category name and description
          const questions = [];

          // First question - beginner level using name
          questions.push({
            id: 1000000 + categoryId, // Generate a unique ID
            category_id: categoryId,
            question_text: `Explain the key concepts and principles of ${categoryName} and how they relate to the broader field.`,
            keywords: [categoryName.toLowerCase(), "concepts", "principles", "fundamentals"],
            difficulty: "beginner",
            created_at: new Date().toISOString()
          });

          // Second question - intermediate level using description if available
          if (categoryDesc && categoryDesc.length > 10) {
            // Extract key terms from the description
            const descriptionTerms = categoryDesc
              .split(/\s+/)
              .filter((word: string) => word.length > 5)
              .slice(0, 3)
              .map((word: string) => word.replace(/[^a-zA-Z]/g, ''))
              .filter((word: string) => word.length > 0);

            if (descriptionTerms.length > 0) {
              const topicTerms = descriptionTerms.join(", ");
              questions.push({
                id: 2000000 + categoryId,
                category_id: categoryId,
                question_text: `Describe how ${topicTerms} are applied in ${categoryName}. What are the practical implications and best practices?`,
                keywords: [...descriptionTerms, categoryName.toLowerCase(), "applications"],
                difficulty: "intermediate",
                created_at: new Date().toISOString()
              });
            }
          }

          // Third question - advanced level
          questions.push({
            id: 3000000 + categoryId,
            category_id: categoryId,
            question_text: `Discuss advanced techniques and methodologies in ${categoryName}. What are the current challenges and future directions in this area?`,
            keywords: [categoryName.toLowerCase(), "advanced", "techniques", "challenges"],
            difficulty: "advanced",
            created_at: new Date().toISOString()
          });

          return questions;
        }
      } catch (categoryError) {
        console.error(`API - Error fetching category details: ${categoryError}`);
      }

      // If we couldn't get the category name, generate generic questions
      return [
        {
          id: 1000000 + categoryId,
          category_id: categoryId,
          question_text: `Explain the fundamental concepts and principles related to this category. What are the key ideas that practitioners should understand?`,
          keywords: ["fundamentals", "concepts", "principles", "key ideas"],
          difficulty: "beginner",
          created_at: new Date().toISOString()
        },
        {
          id: 2000000 + categoryId,
          category_id: categoryId,
          question_text: `Discuss the advanced techniques and current research directions in this field. What are the challenges that researchers are trying to solve?`,
          keywords: ["advanced", "research", "challenges", "techniques"],
          difficulty: "advanced",
          created_at: new Date().toISOString()
        }
      ];
    }

    return data || [];
  } catch (error) {
    console.error(`API - Error in getQuestionsForCategory: ${error}`);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const topicId = url.searchParams.get('topicId');

    if (!topicId) {
      return NextResponse.json(
        { error: 'Topic ID parameter is required' },
        { status: 400 }
      );
    }

    console.log(`API - Fetching details for topic ID: ${topicId}`);

    // First, get the topic details
    // Handle 'topic-123' format by extracting the numeric part
    let queryTopicId = topicId;
    if (topicId.startsWith('topic-')) {
      queryTopicId = topicId.replace('topic-', '');
      console.log(`API - Extracted numeric ID ${queryTopicId} from ${topicId} for topic query`);
    }

    const { data: topic, error: topicError } = await supabaseServer
      .from('topics')
      .select('*')
      .eq('id', queryTopicId)
      .single();

    if (topicError) {
      console.error(`Error fetching topic with ID ${topicId}:`, topicError);
      return NextResponse.json(
        { error: 'Failed to fetch topic details' },
        { status: 500 }
      );
    }

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Next, get all categories for this topic
    console.log(`API - Fetching categories for topic ID: ${topicId}`);

    // Try to get categories for this topic
    console.log(`API - Fetching categories for topic ID ${topicId}`);

    // Get categories directly using the numeric ID
    // Handle 'topic-123' format by extracting the numeric part
    let numericId;
    if (topicId.startsWith('topic-')) {
      numericId = parseInt(topicId.replace('topic-', ''), 10);
      console.log(`API - Extracted numeric ID ${numericId} from ${topicId}`);
    } else {
      numericId = parseInt(topicId, 10);
    }

    try {
      // Get categories
      const categories = await getCategoriesForTopic(numericId);

      if (categories && categories.length > 0) {
        console.log(`API - Found ${categories.length} categories for topic ID ${topicId}`);

        // For each category, get its questions
        const categoriesWithQuestions = await Promise.all(
          categories.map(async (category) => {
            const questions = await getQuestionsForCategory(category.id);

            return {
              ...category,
              questions: questions || []
            };
          })
        );

        // Return the result
        return NextResponse.json(
          {
            topic,
            categories: categoriesWithQuestions
          },
          {
            headers: {
              'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour cache
            },
          }
        );
      }
    } catch (error) {
      console.error(`API - Error fetching categories: ${error}`);
    }

    // If no categories were found, generate generic categories based on the topic name
    console.log(`API - No categories found, generating generic categories for topic: ${topic.name}`);

    // Generate generic categories based on the topic name
    const genericCategories = [
      {
        id: 1000000 + numericId,
        topic_id: numericId,
        name: "Fundamentals",
        description: `Basic concepts and principles of ${topic.name}.`,
        created_at: new Date().toISOString(),
        questions: [
          {
            id: 1000000,
            category_id: 1000000 + numericId,
            question_text: `Explain the key concepts and principles of ${topic.name}. What are the fundamental ideas that someone new to this field should understand?`,
            keywords: ["fundamentals", "concepts", "principles"],
            difficulty: "beginner",
            created_at: new Date().toISOString()
          },
          {
            id: 1000001,
            category_id: 1000000 + numericId,
            question_text: `What are the historical developments that led to the current understanding of ${topic.name}? How has this field evolved over time?`,
            keywords: ["history", "evolution", "development"],
            difficulty: "beginner",
            created_at: new Date().toISOString()
          }
        ]
      },
      {
        id: 2000000 + numericId,
        topic_id: numericId,
        name: "Applications",
        description: `Practical applications and use cases of ${topic.name}.`,
        created_at: new Date().toISOString(),
        questions: [
          {
            id: 2000000,
            category_id: 2000000 + numericId,
            question_text: `Describe the most common applications of ${topic.name} in industry. What real-world problems does it solve?`,
            keywords: ["applications", "industry", "real-world"],
            difficulty: "intermediate",
            created_at: new Date().toISOString()
          },
          {
            id: 2000001,
            category_id: 2000000 + numericId,
            question_text: `How is ${topic.name} applied in different domains? Compare and contrast its application across at least two different fields.`,
            keywords: ["domains", "fields", "comparison"],
            difficulty: "intermediate",
            created_at: new Date().toISOString()
          }
        ]
      },
      {
        id: 3000000 + numericId,
        topic_id: numericId,
        name: "Advanced Topics",
        description: `Cutting-edge research and future directions in ${topic.name}.`,
        created_at: new Date().toISOString(),
        questions: [
          {
            id: 3000000,
            category_id: 3000000 + numericId,
            question_text: `What are the current research frontiers in ${topic.name}? Discuss the challenges and open problems in this field.`,
            keywords: ["research", "challenges", "open problems"],
            difficulty: "advanced",
            created_at: new Date().toISOString()
          },
          {
            id: 3000001,
            category_id: 3000000 + numericId,
            question_text: `How might ${topic.name} evolve in the next 5-10 years? What emerging technologies or methodologies might impact this field?`,
            keywords: ["future", "evolution", "emerging technologies"],
            difficulty: "advanced",
            created_at: new Date().toISOString()
          }
        ]
      }
    ];

    // Return the result with generic categories
    return NextResponse.json(
      {
        topic,
        categories: genericCategories
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour cache
        },
      }
    );
  } catch (error: any) {
    console.error('Error in topic details API route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
