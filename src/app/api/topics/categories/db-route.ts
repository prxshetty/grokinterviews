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
        console.time('category-query');
        // We need both the database questions and the markdown content
        let dbQuestions: any = null;
        let markdownCategory: any = null;

        // 1. Try to get category with questions from the database
        try {
          // First, get the category details
          let category: Category | null = null;
          let topicIdValue: string | number = topicId;

          // If topicId is not a number, try to get the numeric ID
          if (topicId !== 'any' && isNaN(Number(topicId))) {
            // Check if it's a domain
            const { data: topicData, error: topicError } = await supabaseServer
              .from('topics')
              .select('id')
              .eq('domain', topicId)
              .limit(1);

            if (!topicError && topicData && topicData.length > 0) {
              topicIdValue = topicData[0].id;
              console.log(`Resolved domain ${topicId} to topic ID ${topicIdValue}`);
            } else {
              // Try as a slug
              const { data: slugData, error: slugError } = await supabaseServer
                .from('topics')
                .select('id')
                .eq('slug', topicId)
                .limit(1);

              if (!slugError && slugData && slugData.length > 0) {
                topicIdValue = slugData[0].id;
                console.log(`Resolved slug ${topicId} to topic ID ${topicIdValue}`);
              }
            }
          }

          // Use a more efficient query to get the category and its questions in one go
          const { data: categoryWithQuestions, error: categoryError } = await supabaseServer
            .from('categories')
            .select(`
              *,
              questions:questions(*)
            `)
            .eq('topic_id', topicIdValue)
            .or(`id.eq.${!isNaN(Number(categoryId)) ? categoryId : -1},name.ilike.%${categoryId.replace(/-/g, ' ')}%`)
            .limit(1);

          if (!categoryError && categoryWithQuestions && categoryWithQuestions.length > 0) {
            category = categoryWithQuestions[0];
            console.log(`Found category: ${category.name} with ${category.questions?.length || 0} questions`);

            // Convert to the legacy format expected by the frontend
            dbQuestions = convertQuestionsToLegacyFormat(
              category.questions || [],
              category.name
            );
          } else {
            console.log(`No category found for ${topicId}/${categoryId} with error:`, categoryError);
          }
        } catch (dbError) {
          console.error(`Error fetching category from database for ${topicId}/${categoryId}:`, dbError);
        }
        console.timeEnd('category-query');

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
      console.time('categories-query');

      // If topicId is provided, only get categories for that topic
      if (topicId && topicId !== 'any') {
        console.log(`Fetching categories for specific topic: ${topicId}`);

        // Check if topicId is a number or a slug
        let topicIdCondition;
        if (!isNaN(Number(topicId))) {
          // It's a number, use it directly
          topicIdCondition = { topic_id: topicId };
        } else {
          // It's a slug, need to join with topics table
          // First, get the topic ID from the slug
          const { data: topic, error: topicError } = await supabaseServer
            .from('topics')
            .select('id')
            .eq('slug', topicId)
            .single();

          if (topicError) {
            console.error(`Error fetching topic ID for slug ${topicId}:`, topicError);
            // Try with domain instead
            const { data: topicByDomain, error: domainError } = await supabaseServer
              .from('topics')
              .select('id')
              .eq('domain', topicId)
              .limit(1);

            if (domainError || !topicByDomain || topicByDomain.length === 0) {
              console.error(`Error fetching topic ID for domain ${topicId}:`, domainError);
              return NextResponse.json(
                { error: `Topic not found: ${topicId}` },
                { status: 404 }
              );
            }

            topicIdCondition = { topic_id: topicByDomain[0].id };
          } else {
            topicIdCondition = { topic_id: topic.id };
          }
        }

        // Get categories for this topic
        const { data: categories, error: categoriesError } = await supabaseServer
          .from('categories')
          .select('*')
          .eq('topic_id', topicIdCondition.topic_id)
          .order('name');

        if (categoriesError) {
          console.error(`Error fetching categories for topic ${topicId}:`, categoriesError);
          throw categoriesError;
        }

        // Return categories for this topic
        const result = {};
        result[topicId] = convertCategoriesToLegacyFormat(categories || []);

        console.timeEnd('categories-query');
        return NextResponse.json(result, {
          headers: {
            'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour cache
          },
        });
      }

      // If no topicId, get all categories with a single efficient query
      console.log('Fetching all categories with a join query');

      // Use a join query to get all topics and their categories in one go
      const { data: joinData, error: joinError } = await supabaseServer
        .from('topics')
        .select(`
          id,
          slug,
          name,
          categories:categories(*)
        `)
        .order('name');

      if (joinError) {
        console.error('Error fetching topics with categories:', joinError);
        throw joinError;
      }

      // Process the joined data
      const categoriesByTopic: Record<string, any[]> = {};

      for (const topic of joinData || []) {
        categoriesByTopic[topic.slug] = convertCategoriesToLegacyFormat(topic.categories || []);
      }

      console.timeEnd('categories-query');
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
