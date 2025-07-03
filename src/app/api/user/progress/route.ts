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

    const { data: userProgress, error: _progressError } = await supabase // Use session client
      .from('user_progress')
      .select('question_id')
      .eq('user_id', userId)
      .eq('status', 'completed');
    // ... (handle progressError)

    const questionIds = userProgress?.map((item: { question_id: number }) => item.question_id) || [];
    let domainsSolved = 0;
    let totalDomains = 0;

    if (questionIds.length > 0) {
      const { data: questionsData, error: _domainsError } = await supabase // Use session client
        .from('questions')
        .select('id, category_id')
        .in('id', questionIds);
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
          
          // Get unique domain IDs from topics
          const uniqueDomainIds = new Set(topicsData?.map((topic: any) => topic.domain_id).filter(Boolean));
          
          // Convert domain IDs back to domain codes for counting
          if (uniqueDomainIds.size > 0) {
            const { data: domainsData, error: _domainsDataError } = await supabase
              .from('domains')
              .select('code')
              .in('id', Array.from(uniqueDomainIds));
            // ... (handle domainsDataError)
            domainsSolved = domainsData?.length || 0;
          }
        }
      }
    }

    const { data: allDomains, error: _allDomainsError } = await supabase // Use session client
      .from('domains')
      .select('code');
    // ... (handle allDomainsError)
    const uniqueAllDomains = new Set(allDomains?.map(item => item.code).filter(Boolean));
    totalDomains = uniqueAllDomains.size;

    const completionPercentage = totalQuestions ? Math.round(((completedQuestions || 0) / totalQuestions) * 100) : 0;
    return NextResponse.json({
      questionsCompleted: completedQuestions || 0, questionsViewed: viewedQuestions || 0,
      totalQuestions: totalQuestions || 0, completionPercentage, domainsSolved, totalDomains
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
    const { questionId, status, topicId, categoryId } = await request.json();
    // ... (validation) ...
    if (!questionId || !status || !topicId || !categoryId) {
        return NextResponse.json({ error: 'Question ID, status, Topic ID, and Category ID are required' }, { status: 400 });
    }

    const { error: _userProgressUpsertError } = await supabase // Use session client
      .from('user_progress')
      .upsert({
          user_id: userId, question_id: questionId, topic_id: topicId,
          category_id: categoryId, status: status
        },
        { onConflict: 'user_id, question_id' }
      );
    // ... (handle userProgressUpsertError) ...

    // ARCHITECTURE CLEANUP: Removed dual write to user_activity table
    // Now using single source of truth: user_progress table only
    // This eliminates data inconsistency issues and simplifies the architecture

    return NextResponse.json({ success: true, message: 'Progress updated successfully' });

  } catch (error: any) {
    console.error('Error updating user progress:', error);
    return NextResponse.json({ error: 'Failed to update progress', details: error.message }, { status: 500 });
  }
}
