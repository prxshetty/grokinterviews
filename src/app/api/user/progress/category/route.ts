import { NextRequest, NextResponse } from 'next/server';
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'; // Old import
// import { cookies } from 'next/headers'; // Old import
import { createClient } from '@/utils/supabase/server'; // New import for @supabase/ssr server client
// import supabaseServer from '@/utils/supabase-server'; // To be removed

// GET: Retrieve progress data for a specific category
export async function GET(request: NextRequest) {
  const supabase = await createClient(); // Use the new server client
  let userId = null;

  // Get the user using Supabase auth
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser(); // Changed getSession to getUser
    if (userError) throw userError;
    if (!user) throw new Error('User not authenticated');
    userId = user.id;
    console.log('Found user ID from auth for progress/category:', userId); // Updated log
  } catch (error: any) {
    console.error('Progress/category User/Auth Error:', error.message); // Updated log
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const categoryId = url.searchParams.get('categoryId');

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const { count: totalQuestions, error: countError } = await supabase // Use session client
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId);

    if (countError) {
      console.error('Error counting questions:', countError);
      return NextResponse.json({ error: 'Failed to count questions' }, { status: 500 });
    }

    const { data: questionIds, error: questionIdsError } = await supabase // Use session client
      .from('questions')
      .select('id')
      .eq('category_id', categoryId);

    if (questionIdsError) {
      console.error('Error fetching question IDs:', questionIdsError);
      return NextResponse.json({ error: 'Failed to fetch question IDs' }, { status: 500 });
    }

    const questionIdArray = questionIds.map(q => q.id);

    if (questionIdArray.length === 0) {
      return NextResponse.json({
        questionsCompleted: 0,
        totalQuestions: 0,
        completionPercentage: 0
      });
    }

    const { data: completedQuestionData, error: completedError } = await supabase // Use session client
      .from('user_activity')
      .select('question_id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'completed')
      .in('question_id', questionIdArray);
      
    if (completedError) {
      console.error('Error counting completed questions:', completedError);
      return NextResponse.json({ error: 'Failed to count completed questions' }, { status: 500 });
    }

    const uniqueCompletedIds = new Set(completedQuestionData?.map(item => item.question_id).filter(id => id !== null));
    const questionsCompleted = uniqueCompletedIds.size;
    
    const finalTotalQuestions = totalQuestions ?? 0;
    const completionPercentage = finalTotalQuestions > 0 
      ? Math.round((questionsCompleted / finalTotalQuestions) * 100) 
      : 0;

    return NextResponse.json({
      questionsCompleted: questionsCompleted,
      totalQuestions: finalTotalQuestions,
      completionPercentage,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Error fetching category progress:', error);
    return NextResponse.json({ error: 'Failed to fetch category progress' }, { status: 500 });
  }
}
