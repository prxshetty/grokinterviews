import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET: Retrieve user progress statistics
export async function GET(_request: NextRequest) {
  const supabase = await createClient(); // Use the new server client
  let userId = null;

  // Get the user using Supabase auth
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser(); // Changed getSession to getUser
    if (userError) {
      console.error('User fetch Error:', userError.message);
      // It's often better not to throw here but let the code proceed to return default/empty stats
      // Or, if auth is strictly required for this endpoint even to show empty stats:
      // return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    } else if (user) {
      userId = user.id;
      console.log('Found user ID from auth for progress GET:', userId); // Updated log
    } else {
      console.log('No user found from auth for progress GET, returning empty stats.');
    }
  } catch (error) {
    console.error('Error getting user for progress GET:', error);
    // Allow to proceed to return default/empty stats if userId remains null
  }

  try {
    if (!userId) {
      return NextResponse.json({
        questionsCompleted: 0, questionsViewed: 0, totalQuestions: 0,
        completionPercentage: 0, domainsSolved: 0, totalDomains: 0
      });
    }

    const { count: totalQuestions, error: _countError } = await supabase // Use session client
      .from('questions')
      .select('*', { count: 'exact', head: true });
    // ... (handle countError)

    const { count: completedQuestions, error: _completedError } = await supabase // Use session client
      .from('user_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed');
    // ... (handle completedError)

    const { count: viewedQuestions, error: _viewedError } = await supabase // Use session client
      .from('user_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'viewed');
    // ... (handle viewedError)

    const { error: _progressError } = await supabase // Use session client
      .from('user_progress')
      .select('question_id')
      .eq('user_id', userId)
      .eq('status', 'completed');
    // ... (handle progressError)

    // Get all question IDs where user has any activity (viewed or completed) for domains explored
    const { data: allUserProgress, error: _allProgressError } = await supabase
      .from('user_progress')
      .select('question_id')
      .eq('user_id', userId)
      .in('status', ['viewed', 'completed']);

    const allQuestionIds = allUserProgress?.map((item: { question_id: number }) => item.question_id) || [];
    let domainsSolved = 0;

    // Calculate domains explored (any activity - viewed or completed)
    if (allQuestionIds.length > 0) {
      const { data: questionsData, error: _domainsError } = await supabase // Use session client
        .from('questions')
        .select('id, category_id')
        .in('id', allQuestionIds);
      // ... (handle domainsError)

      const categoryIds = questionsData?.map(q => q.category_id).filter(Boolean) || [];
      if (categoryIds.length > 0) {
        const { data: categoriesData, error: _categoriesError } = await supabase // Use session client
          .from('categories')
          .select('id, topic_id')
          .in('id', categoryIds);
        // ... (handle categoriesError)

        const topicIds = categoriesData?.map(c => c.topic_id).filter(Boolean) || [];
        if (topicIds.length > 0) {
          const { data: topicsData, error: _topicsError } = await supabase // Use session client
            .from('topics')
            .select('id, domain_id')
            .in('id', topicIds);
          // ... (handle topicsError)
          const uniqueDomains = new Set(topicsData?.map(topic => topic.domain_id).filter(Boolean));
          domainsSolved = uniqueDomains.size;
        }
      }
    }

    const { count: totalDomains, error: _allDomainsError } = await supabase // Use session client
      .from('domains')
      .select('*', { count: 'exact', head: true });
    // ... (handle allDomainsError)

    const completionPercentage = totalQuestions ? Math.round(((completedQuestions || 0) / totalQuestions) * 100) : 0;
    return NextResponse.json({
      questionsCompleted: completedQuestions || 0, questionsViewed: viewedQuestions || 0,
      totalQuestions: totalQuestions || 0, completionPercentage, domainsSolved, totalDomains: totalDomains || 0
    });

  } catch (error) {
    console.error('Error fetching user progress:', error);
    return NextResponse.json({ error: 'Failed to fetch user progress' }, { status: 500 });
  }
}

// POST: Update user progress
export async function POST(request: NextRequest) {
  const supabase = await createClient(); // Use the new server client
  let userId = null;

  // Get the user using Supabase auth
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser(); // Changed getSession to getUser
    if (userError) throw userError; // Throw if error fetching user
    if (!user) throw new Error('User not authenticated'); // Throw if no user
    userId = user.id;
    console.log('Found user ID from auth for progress POST:', userId); // Updated log
  } catch (error: any) {
    console.error('User fetch/authentication Error for progress POST:', error.message); // Updated log
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }

  try {
    const { questionId, status, topicId, categoryId, domain, section_name, difficulty_level, tags } = await request.json();
    // ... (validation) ...
    if (!questionId || !status || !topicId || !categoryId) {
        return NextResponse.json({ error: 'Question ID, status, Topic ID, and Category ID are required' }, { status: 400 });
    }

    const { error: _userProgressUpsertError } = await supabase // Use session client
      .from('user_progress')
      .upsert({
          user_id: userId, question_id: questionId, topic_id: topicId,
          category_id: categoryId, status: status, updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id, question_id' }
      );
    // ... (handle userProgressUpsertError) ...

    const { error: _activityInsertError } = await supabase // Use session client
      .from('user_activity')
      .insert({
          user_id: userId, activity_type: status === 'completed' ? 'question_completed' : 'question_viewed',
          question_id: questionId, topic_id: topicId, category_id: categoryId,
          domain, section_name, difficulty_level, tags
        }
      );
    // ... (handle activityInsertError) ...

    return NextResponse.json({ success: true, message: 'Progress updated successfully' });

  } catch (error: any) {
    console.error('Error updating user progress:', error);
    return NextResponse.json({ error: 'Failed to update progress', details: error.message }, { status: 500 });
  }
}
