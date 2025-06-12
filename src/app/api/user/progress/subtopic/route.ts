import { NextRequest, NextResponse } from 'next/server';
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'; // Old import
// import { cookies } from 'next/headers'; // Old import
import { createClient } from '@/utils/supabase/server'; // New import for @supabase/ssr server client
// import supabaseServer from '@/utils/supabase-server'; // To be removed

// GET: Retrieve progress data for a specific subtopic
export async function GET(request: NextRequest) {
  const supabase = await createClient(); // Use the new server client
  let userId = null;

  // Get the user using Supabase auth
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser(); // Changed getSession to getUser
    if (userError) throw userError;
    if (!user) throw new Error('User not authenticated');
    userId = user.id;
    console.log('Found user ID from auth for progress/subtopic:', userId); // Updated log
  } catch (error: any) {
    console.error('Progress/subtopic User/Auth Error:', error.message); // Updated log
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const subtopicId = url.searchParams.get('subtopicId');

    if (!subtopicId) {
      return NextResponse.json({ error: 'Subtopic ID is required' }, { status: 400 });
    }

    const { data: categories, error: categoriesError } = await supabase // Use session client
      .from('categories')
      .select('id')
      .eq('subtopic_id', subtopicId); // Corrected from topic_id to subtopic_id if this is truly for subtopics
                                     // If 'subtopic_id' is not the correct column name, adjust as needed.
                                     // Assuming 'topic_id' was intended as per previous logic for subtopics.
      // .eq('topic_id', subtopicId); // If subtopicId actually refers to a topic_id

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    const totalCategories = categories?.length || 0;
    const categoryIds = categories?.map(cat => cat.id) || [];

    if (totalCategories === 0) {
      return NextResponse.json({
        categoriesCompleted: 0,
        totalCategories: 0,
        questionsCompleted: 0,
        totalQuestions: 0,
        completionPercentage: 0
      });
    }

    const { count: totalQuestions, error: countError } = await supabase // Use session client
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .in('category_id', categoryIds);

    if (countError) {
      console.error('Error counting questions:', countError);
      return NextResponse.json({ error: 'Failed to count questions' }, { status: 500 });
    }

    const { data: questionIdsData, error: questionIdsError } = await supabase // Use session client
      .from('questions')
      .select('id')
      .in('category_id', categoryIds);

    if (questionIdsError) {
      console.error('Error fetching question IDs:', questionIdsError);
      return NextResponse.json({ error: 'Failed to fetch question IDs' }, { status: 500 });
    }

    const questionIdArray = questionIdsData.map(q => q.id);

    if (questionIdArray.length === 0) {
      return NextResponse.json({
        categoriesCompleted: 0,
        totalCategories,
        questionsCompleted: 0,
        totalQuestions: 0,
        completionPercentage: 0
      });
    }

    const { data: completedQuestionData, error: completedError } = await supabase // Use session client
      .from('user_activity')
      .select('question_id')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .in('question_id', questionIdArray);

    if (completedError) {
      console.error('Error counting completed questions:', completedError);
      return NextResponse.json({ error: 'Failed to count completed questions' }, { status: 500 });
    }

    const uniqueCompletedQuestionsGlobal = new Set();
    completedQuestionData?.forEach(item => { if (item.question_id) uniqueCompletedQuestionsGlobal.add(item.question_id); });
    const questionsCompleted = uniqueCompletedQuestionsGlobal.size;

    let categoriesCompleted = 0;
    for (const categoryId of categoryIds) {
      const { count: catTotalQuestions, error: catCountError } = await supabase // Use session client
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId);

      if (catCountError) {
        console.error(`Error counting questions for category ${categoryId}:`, catCountError);
        continue;
      }

      const { data: catQuestionIdsData, error: catQuestionIdsError } = await supabase // Use session client
        .from('questions')
        .select('id')
        .eq('category_id', categoryId);

      if (catQuestionIdsError) {
        console.error(`Error fetching question IDs for category ${categoryId}:`, catQuestionIdsError);
        continue;
      }

      const catQuestionIdArray = catQuestionIdsData.map(q => q.id);

      if (catQuestionIdArray.length === 0) {
        continue;
      }

      const { data: catCompletedQuestionData, error: catCompletedError } = await supabase // Use session client
        .from('user_activity')
        .select('question_id')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .in('question_id', catQuestionIdArray);

      if (catCompletedError) {
        console.error(`Error fetching completed questions for category ${categoryId}:`, catCompletedError);
        continue;
      }

      const uniqueCatCompletedQuestions = new Set();
      catCompletedQuestionData?.forEach(item => { if (item.question_id) uniqueCatCompletedQuestions.add(item.question_id); });
      const catCompletedQuestionsCount = uniqueCatCompletedQuestions.size;

      console.log(`Category ${categoryId}: ${catCompletedQuestionsCount}/${catTotalQuestions} questions completed`);

      if (catTotalQuestions !== null && catTotalQuestions > 0 && catCompletedQuestionsCount === catTotalQuestions) {
        categoriesCompleted++;
        console.log(`Category ${categoryId} is fully completed`);
      }
    }

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
