import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET: Retrieve progress data for a specific topic
export async function GET(request: NextRequest) {
  const supabase = await createClient(); // Use the new server client
  let userId = null;

  // Get the user using Supabase auth
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser(); // Changed getSession to getUser
    if (userError) throw userError;
    if (!user) throw new Error('User not authenticated');
    userId = user.id;
    console.log('Found user ID from auth for progress/topic:', userId); // Updated log
  } catch (error: any) {
    console.error('Progress/topic User/Auth Error:', error.message); // Updated log
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const topicId = url.searchParams.get('topicId');

    if (!topicId) {
      return NextResponse.json({ error: 'Topic ID is required' }, { status: 400 });
    }

    const { data: categories, error: categoriesError } = await supabase // Use session client
      .from('categories')
      .select('id')
      .eq('topic_id', topicId);
    if (categoriesError) return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    const totalCategories = categories?.length || 0;
    const categoryIds = categories?.map(cat => cat.id) || [];
    if (totalCategories === 0) return NextResponse.json({ categoriesCompleted: 0, totalCategories: 0, questionsCompleted: 0, totalQuestions: 0, completionPercentage: 0 });


    const { count: totalQuestions, error: countError } = await supabase // Use session client
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .in('category_id', categoryIds);
    if (countError) return NextResponse.json({ error: 'Failed to count questions' }, { status: 500 });

    const { data: questionIdsData, error: questionIdsError } = await supabase // Use session client
      .from('questions')
      .select('id')
      .in('category_id', categoryIds);
    if (questionIdsError) return NextResponse.json({ error: 'Failed to fetch question IDs' }, { status: 500 });
    const questionIdArray = questionIdsData.map(q => q.id);
    if (questionIdArray.length === 0) return NextResponse.json({ categoriesCompleted: 0, totalCategories, questionsCompleted: 0, totalQuestions: 0, completionPercentage: 0 });


    const { count: questionsCompleted, error: completedError } = await supabase // Use session client
      .from('user_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed')
      .in('question_id', questionIdArray);
    if (completedError) return NextResponse.json({ error: 'Failed to count completed questions' }, { status: 500 });

    let categoriesCompleted = 0;
    for (const categoryId of categoryIds) {
      const { count: catTotalQuestions, error: catCountError } = await supabase // Use session client
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId);
      if (catCountError) continue;

      const { data: catQuestionIdsData, error: catQuestionIdsError } = await supabase // Use session client
        .from('questions')
        .select('id')
        .eq('category_id', categoryId);
      if (catQuestionIdsError) continue;
      const catQuestionIdArray = catQuestionIdsData.map(q => q.id);
      if (catQuestionIdArray.length === 0) continue;

      const { count: catCompletedQuestions, error: catCompletedError } = await supabase // Use session client
        .from('user_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed')
        .in('question_id', catQuestionIdArray);
      if (catCompletedError) continue;

      if (catTotalQuestions !== null && catTotalQuestions > 0 && catCompletedQuestions === catTotalQuestions) {
        categoriesCompleted++;
      }
    }

    const completionPercentage = totalQuestions ? Math.round(((questionsCompleted || 0) / totalQuestions) * 100) : 0;

    return NextResponse.json({
      categoriesCompleted,
      totalCategories,
      questionsCompleted: questionsCompleted || 0,
      totalQuestions: totalQuestions || 0,
      completionPercentage
    });

  } catch (error: any) {
    console.error('Error fetching topic progress:', error.message);
    return NextResponse.json({ error: 'Failed to fetch topic progress' }, { status: 500 });
  }
}
