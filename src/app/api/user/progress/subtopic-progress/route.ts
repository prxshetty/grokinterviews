import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import supabaseServer from '@/utils/supabase-server';

// GET: Retrieve progress for a specific subtopic
export async function GET(request: NextRequest) {
  // Await cookies() first, then pass a function returning the store
  const cookieStore = await cookies();
  // @ts-ignore - Supabase helper type expects Promise, but runtime needs resolved store with Next 15 async cookies
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  let userId = null;

  // Get the user session using Supabase auth
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session Error:', sessionError.message);
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    } else if (session?.user) {
      userId = session.user.id;
    } else {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error getting user session:', error);
    return NextResponse.json({ error: 'Session error' }, { status: 500 });
  }

  try {
    // Get the subtopic ID from the query parameters
    const url = new URL(request.url);
    const subtopicId = url.searchParams.get('subtopicId');

    if (!subtopicId) {
      return NextResponse.json({ error: 'Subtopic ID is required' }, { status: 400 });
    }

    console.log(`Fetching progress for subtopic ${subtopicId}`);

    // Get all categories in this subtopic
    const { data: categories, error: categoriesError } = await supabaseServer
      .from('categories')
      .select('id')
      .eq('topic_id', subtopicId);

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    // Extract category IDs
    const categoryIds = categories.map(category => category.id);
    const totalCategories = categoryIds.length;

    if (totalCategories === 0) {
      console.log(`No categories found for subtopic ${subtopicId}`);
      return NextResponse.json({ error: 'No categories found for this subtopic' }, { status: 404 });
    }

    console.log(`Found ${totalCategories} categories for subtopic ${subtopicId}:`, categoryIds);

    // Get all questions in these categories
    const { data: questions, error: questionsError } = await supabaseServer
      .from('questions')
      .select('id, category_id')
      .in('category_id', categoryIds);

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    const totalQuestions = questions.length;

    if (totalQuestions === 0) {
      console.log(`No questions found for subtopic ${subtopicId}`);
      return NextResponse.json({ error: 'No questions found for this subtopic' }, { status: 404 });
    }

    console.log(`Found ${totalQuestions} questions for subtopic ${subtopicId}`);

    // Get all question IDs
    const questionIds = questions.map(q => q.id);

    // Get all completed questions for this user within the specific subtopic's questions
    // Querying user_progress instead of user_activity for potentially more canonical state
    const { data: completedProgress, error: completedError } = await supabaseServer
      .from('user_progress') // Changed from user_activity
      .select('question_id, category_id') // Ensure category_id is selected if needed later
      .eq('user_id', userId)
      .eq('status', 'completed')
      .in('question_id', questionIds); // Filter by questions in this subtopic

    if (completedError) {
      console.error('Error fetching completed questions from user_progress:', completedError);
      return NextResponse.json({ error: 'Failed to fetch completed questions' }, { status: 500 });
    }

    // Count unique completed questions from the fetched progress data
    const uniqueCompletedQuestionIds = new Set<number>(); // Explicitly type the set
    completedProgress?.forEach(item => {
      if (item.question_id) {
        uniqueCompletedQuestionIds.add(item.question_id);
      }
    });
    const questionsCompleted = uniqueCompletedQuestionIds.size;

    // Log the count accurately based on user_progress
    console.log(`User has completed ${questionsCompleted}/${totalQuestions} questions in subtopic ${subtopicId} (from user_progress)`);

    // Group questions by category ID
    const questionsByCategory: { [key: number]: number[] } = {}; // Type the index signature
    questions.forEach(q => {
      if (!questionsByCategory[q.category_id]) {
        questionsByCategory[q.category_id] = [];
      }
      questionsByCategory[q.category_id].push(q.id);
    });

    // Calculate how many categories are "completed" (all questions completed)
    let categoriesCompleted = 0;

    // For each category ID associated with the subtopic
    for (const categoryIdStr in questionsByCategory) {
        const categoryId = parseInt(categoryIdStr, 10);
        if (isNaN(categoryId)) continue; // Skip if parsing fails

        const categoryQuestionIds = questionsByCategory[categoryId] || [];
        const totalQuestionsInCategory = categoryQuestionIds.length;

        // Skip empty categories
        if (totalQuestionsInCategory === 0) {
            console.log(`Skipping category ${categoryId}: No questions found.`);
            continue;
        }

        // Count how many questions in this category are in the completed set
      let categoryCompletedCount = 0;
        categoryQuestionIds.forEach(questionId => {
            if (uniqueCompletedQuestionIds.has(questionId)) {
          categoryCompletedCount++;
        }
      });

        console.log(`Category ${categoryId}: ${categoryCompletedCount}/${totalQuestionsInCategory} questions completed.`);

        // If all questions in the category are completed, increment the category counter
        if (categoryCompletedCount === totalQuestionsInCategory) {
        categoriesCompleted++;
            console.log(`Category ${categoryId} is fully completed.`);
      }
    }

    // Calculate completion percentage based primarily on category completion
    let completionPercentage = 0;
    if (totalCategories > 0) {
      // Use category completion for percentage
      completionPercentage = Math.round((categoriesCompleted / totalCategories) * 100);
      console.log(`Calculating percentage based on categories: ${categoriesCompleted}/${totalCategories}`);
    } else if (totalQuestions > 0) {
      // Fallback to question-based progress if no categories exist
      completionPercentage = Math.round((questionsCompleted / totalQuestions) * 100);
      console.log(`Calculating percentage based on questions (fallback): ${questionsCompleted}/${totalQuestions}`);
    }
    
    // Ensure 100% if all categories are done (and there are categories)
    if (totalCategories > 0 && categoriesCompleted === totalCategories) {
      completionPercentage = 100;
      console.log("Setting percentage to 100% as all categories are complete.");
    }

    // Log a summary with updated calculation source
    console.log(`Subtopic ${subtopicId} progress (calculated live): ${questionsCompleted}/${totalQuestions} questions, ${categoriesCompleted}/${totalCategories} categories, ${completionPercentage}% complete`);

    return NextResponse.json({
      categoriesCompleted,
      totalCategories,
      questionsCompleted,
      totalQuestions,
      completionPercentage,
      timestamp: Date.now() // Add timestamp to prevent caching
    });

  } catch (error) {
    console.error('Error fetching subtopic progress:', error);
    return NextResponse.json({ error: 'Failed to fetch subtopic progress' }, { status: 500 });
  }
}
