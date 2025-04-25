import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import supabaseServer from '@/utils/supabase-server';

// GET: Retrieve progress data for a specific subtopic
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

    // Get all categories in this subtopic
    const { data: categories, error: categoriesError } = await supabaseServer
      .from('categories')
      .select('id')
      .eq('subtopic_id', subtopicId);

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    const totalCategories = categories?.length || 0;
    const categoryIds = categories?.map(cat => cat.id) || [];

    // If there are no categories, return empty data
    if (totalCategories === 0) {
      return NextResponse.json({
        categoriesCompleted: 0,
        totalCategories: 0,
        questionsCompleted: 0,
        totalQuestions: 0,
        completionPercentage: 0
      });
    }

    // Get the total number of questions in all categories of this subtopic
    const { count: totalQuestions, error: countError } = await supabaseServer
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .in('category_id', categoryIds);

    if (countError) {
      console.error('Error counting questions:', countError);
      return NextResponse.json({ error: 'Failed to count questions' }, { status: 500 });
    }

    // First get all question IDs in these categories
    const { data: questionIds, error: questionIdsError } = await supabaseServer
      .from('questions')
      .select('id')
      .in('category_id', categoryIds);

    if (questionIdsError) {
      console.error('Error fetching question IDs:', questionIdsError);
      return NextResponse.json({ error: 'Failed to fetch question IDs' }, { status: 500 });
    }

    // Extract just the IDs into an array
    const questionIdArray = questionIds.map(q => q.id);

    // If there are no questions in these categories, return zeros
    if (questionIdArray.length === 0) {
      return NextResponse.json({
        categoriesCompleted: 0,
        totalCategories,
        questionsCompleted: 0,
        totalQuestions: 0,
        completionPercentage: 0
      });
    }

    // Get the number of completed questions in all categories of this subtopic
    // We need to handle potential duplicates in the user_activity table
    const { data: completedQuestionData, error: completedError } = await supabaseServer
      .from('user_activity')
      .select('question_id')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .in('question_id', questionIdArray);

    // Count unique completed questions
    const uniqueCompletedQuestions = new Set();
    completedQuestionData?.forEach(item => {
      if (item.question_id) {
        uniqueCompletedQuestions.add(item.question_id);
      }
    });
    const questionsCompleted = uniqueCompletedQuestions.size;

    if (completedError) {
      console.error('Error counting completed questions:', completedError);
      return NextResponse.json({ error: 'Failed to count completed questions' }, { status: 500 });
    }

    // Calculate how many categories are "completed" (all questions completed)
    let categoriesCompleted = 0;

    // For each category, check if all questions are completed
    for (const categoryId of categoryIds) {
      // Get total questions in this category
      const { count: catTotalQuestions, error: catCountError } = await supabaseServer
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId);

      if (catCountError) {
        console.error(`Error counting questions for category ${categoryId}:`, catCountError);
        continue;
      }

      // First get all question IDs in this category
      const { data: catQuestionIds, error: catQuestionIdsError } = await supabaseServer
        .from('questions')
        .select('id')
        .eq('category_id', categoryId);

      if (catQuestionIdsError) {
        console.error(`Error fetching question IDs for category ${categoryId}:`, catQuestionIdsError);
        continue;
      }

      // Extract just the IDs into an array
      const catQuestionIdArray = catQuestionIds.map(q => q.id);

      // If there are no questions in this category, skip it
      if (catQuestionIdArray.length === 0) {
        continue;
      }

      // Get distinct completed question IDs in this category
      // We need to handle potential duplicates in the user_activity table
      const { data: completedQuestionData, error: catCompletedError } = await supabaseServer
        .from('user_activity')
        .select('question_id')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .in('question_id', catQuestionIdArray);

      if (catCompletedError) {
        console.error(`Error fetching completed questions for category ${categoryId}:`, catCompletedError);
        continue;
      }

      // Count unique completed questions
      const uniqueCompletedQuestions = new Set();
      completedQuestionData?.forEach(item => {
        if (item.question_id) {
          uniqueCompletedQuestions.add(item.question_id);
        }
      });
      const catCompletedQuestions = uniqueCompletedQuestions.size;

      console.log(`Category ${categoryId}: ${catCompletedQuestions}/${catTotalQuestions} questions completed`);

      // If all questions are completed, increment the counter
      if (catTotalQuestions > 0 && catCompletedQuestions === catTotalQuestions) {
        categoriesCompleted++;
        console.log(`Category ${categoryId} is fully completed`);
      }
    }

    // Calculate completion percentage
    const completionPercentage = totalQuestions ? Math.round((questionsCompleted / totalQuestions) * 100) : 0;

    console.log(`Subtopic ${subtopicId} progress: ${questionsCompleted}/${totalQuestions} questions, ${categoriesCompleted}/${totalCategories} categories, ${completionPercentage}% complete`);

    return NextResponse.json({
      categoriesCompleted,
      totalCategories,
      questionsCompleted: questionsCompleted || 0,
      totalQuestions: totalQuestions || 0,
      completionPercentage,
      timestamp: Date.now() // Add timestamp to prevent caching
    });

  } catch (error) {
    console.error('Error fetching subtopic progress:', error);
    return NextResponse.json({ error: 'Failed to fetch subtopic progress' }, { status: 500 });
  }
}
