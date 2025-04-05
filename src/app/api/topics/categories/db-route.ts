import { NextRequest, NextResponse } from 'next/server';
import supabaseServer from '@/utils/supabase-server';
import { Category, Question } from '@/types/database';
import fs from 'fs';
import path from 'path';
import { parseMarkdown, extractStructuredTopicMap } from '@/utils/markdownParser';

// Helper function to convert database categories to the legacy format
function convertCategoriesToLegacyFormat(categories: Category[]) {
  return categories.map(category => ({
    id: category.slug,
    label: category.name
  }));
}

// Helper function to convert database questions to the legacy format
function convertQuestionsToLegacyFormat(questions: Question[], categoryName: string) {
  // Create a structure similar to the one expected by the frontend
  const result = {
    label: categoryName,
    subtopics: {}
  };

  // Add each question as a subtopic
  questions.forEach((question, index) => {
    const questionId = `question-${question.id}`;
    result.subtopics[questionId] = {
      id: questionId,
      label: question.question_text,
      content: question.answer_text || '',
      difficulty: question.difficulty,
      keywords: question.keywords
    };
  });

  return result;
}

// Helper function to get category details from markdown file
async function getCategoryFromMarkdown(topicId: string, categoryId: string) {
  try {
    const topicsDirectory = path.join(process.cwd(), 'topics');
    const filePath = path.join(topicsDirectory, `${topicId}.md`);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const parsedData = parseMarkdown(content);
    const contentMap = extractStructuredTopicMap(parsedData);

    // Try to find the category in the content map
    for (const key in contentMap) {
      const item = contentMap[key];
      const itemId = key.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      // Check if this is the category we're looking for
      if (itemId === categoryId || item.label.toLowerCase() === categoryId.toLowerCase()) {
        return {
          label: item.label,
          subtopics: item.subtopics || {},
          content: item.content || ''
        };
      }
    }

    return null;
  } catch (error) {
    console.error(`Error getting category from markdown for ${topicId}/${categoryId}:`, error);
    return null;
  }
}

// Helper function to merge database questions with markdown content
async function mergeQuestionsWithMarkdown(dbQuestions: any, topicId: string, categoryId: string) {
  try {
    // Get category details from markdown
    const markdownCategory = await getCategoryFromMarkdown(topicId, categoryId);

    if (!markdownCategory) {
      return dbQuestions;
    }

    // Create a merged result
    const mergedResult = {
      label: dbQuestions.label,
      subtopics: { ...dbQuestions.subtopics },
      content: markdownCategory.content || ''
    };

    // Add subtopics from markdown that aren't questions
    for (const key in markdownCategory.subtopics) {
      // Skip if it's already a question from the database
      if (!key.startsWith('question-')) {
        mergedResult.subtopics[key] = markdownCategory.subtopics[key];
      }
    }

    return mergedResult;
  } catch (error) {
    console.error(`Error merging questions with markdown for ${topicId}/${categoryId}:`, error);
    return dbQuestions;
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const categoryId = url.searchParams.get('categoryId');
    const topicId = url.searchParams.get('topicId');

    console.log(`API request - topicId: ${topicId}, categoryId: ${categoryId}`);

    // If categoryId and topicId are provided, return detailed questions for that category
    if (categoryId && topicId) {
      try {
        // We need both the database questions and the markdown content
        let dbQuestions: any = null;
        let markdownCategory: any = null;

        // 1. Try to get category with questions from the database
        try {
          // First, get the category details
          let category: Category | null = null;

          // Get the category
          if (typeof categoryId === 'number' || !isNaN(Number(categoryId))) {
            const { data, error } = await supabaseServer
              .from('categories')
              .select('*')
              .eq('id', categoryId)
              .single();

            if (error) throw error;
            category = data;
          } else {
            const { data, error } = await supabaseServer
              .from('categories')
              .select('*')
              .eq('slug', categoryId)
              .single();

            if (error) throw error;
            category = data;
          }

          if (category) {
            // Get the questions for this category
            const { data: questions, error: questionsError } = await supabaseServer
              .from('questions')
              .select('*')
              .eq('category_id', category.id)
              .order('difficulty');

            if (questionsError) throw questionsError;

            // Convert to the legacy format expected by the frontend
            dbQuestions = convertQuestionsToLegacyFormat(
              questions || [],
              category.name
            );
          }
        } catch (dbError) {
          console.error(`Error fetching category from database for ${topicId}/${categoryId}:`, dbError);
        }

        // 2. Get category details from markdown
        try {
          markdownCategory = await getCategoryFromMarkdown(topicId, categoryId);
        } catch (markdownError) {
          console.error(`Error fetching category from markdown for ${topicId}/${categoryId}:`, markdownError);
        }

        // 3. Merge the data sources
        if (dbQuestions && markdownCategory) {
          // We have both data sources, merge them
          const mergedResult = await mergeQuestionsWithMarkdown(dbQuestions, topicId, categoryId);

          return NextResponse.json(mergedResult, {
            headers: {
              'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour cache
            },
          });
        } else if (dbQuestions) {
          // Only have database data
          return NextResponse.json(dbQuestions, {
            headers: {
              'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour cache
            },
          });
        } else if (markdownCategory) {
          // Only have markdown data
          return NextResponse.json(markdownCategory, {
            headers: {
              'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour cache
            },
          });
        }

        // If we get here, we couldn't find the category in either source
        return NextResponse.json(
          {
            error: 'Category not found',
            categoryId,
            topicId,
            message: `Could not find category with ID ${categoryId} in topic ${topicId}`
          },
          { status: 404 }
        );
      } catch (error) {
        console.error(`Error loading questions for ${topicId}/${categoryId}:`, error);
        return NextResponse.json(
          {
            error: 'Failed to load questions',
            message: error instanceof Error ? error.message : String(error)
          },
          { status: 500 }
        );
      }
    }

    // If only topicId is provided or no parameters, return all categories
    try {
      // Get all topics from the database
      const { data: topics, error: topicsError } = await supabaseServer
        .from('topics')
        .select('*')
        .order('name');

      if (topicsError) throw topicsError;

      // Create a map of topic slug to categories
      const categoriesByTopic: Record<string, any[]> = {};

      // For each topic, get its categories
      for (const topic of topics || []) {
        const { data: categories, error: categoriesError } = await supabaseServer
          .from('categories')
          .select('*')
          .eq('topic_id', topic.id)
          .order('name');

        if (categoriesError) throw categoriesError;

        categoriesByTopic[topic.slug] = convertCategoriesToLegacyFormat(categories || []);
      }

      return NextResponse.json(categoriesByTopic, {
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour cache
        },
      });
    } catch (error) {
      console.error('Error fetching all categories:', error);
      return NextResponse.json(
        { error: 'Failed to load categories' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in categories API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
