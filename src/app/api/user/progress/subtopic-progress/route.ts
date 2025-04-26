import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import supabaseServer from '@/utils/supabase-server';

// GET: Retrieve progress for a specific subtopic
export async function GET(request: NextRequest) {
  // Use the Next.js route handler client for authentication
  const cookieStore = await cookies();
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

    // Get all completed questions for this user
    const { data: completedData, error: completedError } = await supabaseServer
      .from('user_activity')
      .select('question_id, category_id')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .in('question_id', questionIds);

    if (completedError) {
      console.error('Error fetching completed questions:', completedError);
      return NextResponse.json({ error: 'Failed to fetch completed questions' }, { status: 500 });
    }

    // Count unique completed questions
    const uniqueCompletedQuestions = new Set();
    completedData?.forEach(item => {
      if (item.question_id) {
        uniqueCompletedQuestions.add(item.question_id);
      }
    });
    const questionsCompleted = uniqueCompletedQuestions.size;

    console.log(`User has completed ${questionsCompleted}/${totalQuestions} questions in subtopic ${subtopicId}`);

    // Group questions by category
    const questionsByCategory = {};
    questions.forEach(q => {
      if (!questionsByCategory[q.category_id]) {
        questionsByCategory[q.category_id] = [];
      }
      questionsByCategory[q.category_id].push(q.id);
    });

    // Calculate how many categories are "completed" (all questions completed)
    let categoriesCompleted = 0;

    // For each category, check if all questions are completed
    for (const categoryId of categoryIds) {
      const categoryQuestions = questionsByCategory[categoryId] || [];

      if (categoryQuestions.length === 0) continue;

      // Count how many questions in this category are completed
      let categoryCompletedCount = 0;
      categoryQuestions.forEach(questionId => {
        if (uniqueCompletedQuestions.has(questionId)) {
          categoryCompletedCount++;
        }
      });

      // If all questions are completed, increment the counter
      if (categoryCompletedCount === categoryQuestions.length) {
        categoriesCompleted++;
        // Category is fully completed
      } else {
        // Category is partially completed
      }
    }

    // Calculate completion percentage based primarily on category completion
    let completionPercentage = 0;

    if (totalCategories > 0) {
      // For other subtopics, calculate progress based on the number of completed categories
      completionPercentage = Math.round((categoriesCompleted / totalCategories) * 100);
      // Calculate progress based on completed categories

      // If all categories are completed, ensure it shows 100%
      if (categoriesCompleted === totalCategories) {
        completionPercentage = 100;
        // All categories are completed
      }
    } else if (totalQuestions > 0) {
      // Fallback to question-based progress if no categories are defined
      completionPercentage = Math.round((questionsCompleted / totalQuestions) * 100);
      // Using question-based progress as fallback
    }

    // Log a summary instead of detailed information
    console.log(`Subtopic ${subtopicId} progress: ${questionsCompleted}/${totalQuestions} questions, ${categoriesCompleted}/${totalCategories} categories, ${completionPercentage}% complete`);

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
