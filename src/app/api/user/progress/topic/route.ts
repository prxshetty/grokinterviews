import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import supabaseServer from '@/utils/supabase-server';

// GET: Retrieve progress data for a specific topic
export async function GET(request: NextRequest) {
  // Use the Next.js route handler client for authentication
  const supabase = createRouteHandlerClient({ cookies });
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
    // Get the topic ID from the query parameters
    const url = new URL(request.url);
    const topicId = url.searchParams.get('topicId');

    if (!topicId) {
      return NextResponse.json({ error: 'Topic ID is required' }, { status: 400 });
    }

    // Get all categories in this topic
    const { data: categories, error: categoriesError } = await supabaseServer
      .from('categories')
      .select('id')
      .eq('topic_id', topicId);

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

    // Get the total number of questions in all categories of this topic
    const { count: totalQuestions, error: countError } = await supabaseServer
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .in('category_id', categoryIds);

    if (countError) {
      console.error('Error counting questions:', countError);
      return NextResponse.json({ error: 'Failed to count questions' }, { status: 500 });
    }

    // Get the number of completed questions in all categories of this topic
    const { count: questionsCompleted, error: completedError } = await supabaseServer
      .from('user_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed')
      .in('question_id', 
        supabaseServer
          .from('questions')
          .select('id')
          .in('category_id', categoryIds)
      );

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
      
      // Get completed questions in this category
      const { count: catCompletedQuestions, error: catCompletedError } = await supabaseServer
        .from('user_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed')
        .in('question_id', 
          supabaseServer
            .from('questions')
            .select('id')
            .eq('category_id', categoryId)
        );
      
      if (catCompletedError) {
        console.error(`Error counting completed questions for category ${categoryId}:`, catCompletedError);
        continue;
      }
      
      // If all questions are completed, increment the counter
      if (catTotalQuestions > 0 && catCompletedQuestions === catTotalQuestions) {
        categoriesCompleted++;
      }
    }

    // Calculate completion percentage
    const completionPercentage = totalQuestions ? Math.round((questionsCompleted / totalQuestions) * 100) : 0;

    return NextResponse.json({
      categoriesCompleted,
      totalCategories,
      questionsCompleted: questionsCompleted || 0,
      totalQuestions: totalQuestions || 0,
      completionPercentage
    });

  } catch (error) {
    console.error('Error fetching topic progress:', error);
    return NextResponse.json({ error: 'Failed to fetch topic progress' }, { status: 500 });
  }
}
