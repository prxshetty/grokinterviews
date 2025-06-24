import { NextRequest, NextResponse } from 'next/server';
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'; // Old import
// import { cookies } from 'next/headers'; // Old import
import { createClient } from '@/utils/supabase/server'; // New import for @supabase/ssr server client
// import supabaseServer from '@/utils/supabase-server'; // To be removed

// GET: Retrieve progress for a specific subtopic
export async function GET(request: NextRequest) {
  const supabase = await createClient(); // Use the new server client
  let userId = null;

  // Get the user using Supabase auth
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser(); // Changed getSession to getUser
    if (userError) throw userError;
    if (!user) throw new Error('User not authenticated');
    userId = user.id;
    console.log('Found user ID from auth for subtopic-progress:', userId); // Updated log
  } catch (error: any) {
    console.error('Subtopic-progress User/Auth Error:', error.message); // Updated log
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const subtopicId = url.searchParams.get('subtopicId');

    if (!subtopicId) {
      return NextResponse.json({ error: 'Subtopic ID is required' }, { status: 400 });
    }

    console.log(`Fetching progress for subtopic ${subtopicId}`);

    const { data: categories, error: categoriesError } = await supabase // Use session client
      .from('categories')
      .select('id')
      .eq('topic_id', subtopicId);

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    const categoryIds = categories.map(category => category.id);
    const totalCategories = categoryIds.length;

    if (totalCategories === 0) {
      console.log(`No categories found for subtopic ${subtopicId}`);
      return NextResponse.json({ error: 'No categories found for this subtopic' }, { status: 404 });
    }

    console.log(`Found ${totalCategories} categories for subtopic ${subtopicId}:`, categoryIds);

    const { data: questions, error: questionsError } = await supabase // Use session client
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

    const questionIds = questions.map(q => q.id);

    const { data: completedProgress, error: completedError } = await supabase // Use session client
      .from('user_progress')
      .select('question_id, category_id')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .in('question_id', questionIds);

    if (completedError) {
      console.error('Error fetching completed questions from user_progress:', completedError);
      return NextResponse.json({ error: 'Failed to fetch completed questions' }, { status: 500 });
    }

    const uniqueCompletedQuestionIds = new Set<number>();
    completedProgress?.forEach(item => { if (item.question_id) uniqueCompletedQuestionIds.add(item.question_id); });
    const questionsCompleted = uniqueCompletedQuestionIds.size;

    console.log(`User has completed ${questionsCompleted}/${totalQuestions} questions in subtopic ${subtopicId} (from user_progress)`);

    const questionsByCategory: { [key: number]: number[] } = {};
    questions.forEach(q => {
      if (!questionsByCategory[q.category_id]) questionsByCategory[q.category_id] = [];
      questionsByCategory[q.category_id]?.push(q.id);
    });

    let categoriesCompleted = 0;
    for (const categoryIdStr of Object.keys(questionsByCategory)) {
        const categoryId = parseInt(categoryIdStr, 10);
        if (isNaN(categoryId)) continue;
        const categoryQuestionIds = questionsByCategory[categoryId] || [];
        const totalQuestionsInCategory = categoryQuestionIds.length;
        if (totalQuestionsInCategory === 0) continue;
        let categoryCompletedCount = 0;
        categoryQuestionIds.forEach(questionId => { if (uniqueCompletedQuestionIds.has(questionId)) categoryCompletedCount++; });
        if (categoryCompletedCount === totalQuestionsInCategory) categoriesCompleted++;
    }

    const completionPercentage = totalQuestions > 0 ? Math.round((questionsCompleted / totalQuestions) * 100) : 0;
    
    console.log(`Subtopic ${subtopicId} progress (calculated live): ${questionsCompleted}/${totalQuestions} questions, ${categoriesCompleted}/${totalCategories} categories, ${completionPercentage}% complete`);

    return NextResponse.json({
      categoriesCompleted, totalCategories, questionsCompleted, totalQuestions, completionPercentage,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Error fetching subtopic progress:', error);
    return NextResponse.json({ error: 'Failed to fetch subtopic progress' }, { status: 500 });
  }
}
