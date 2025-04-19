import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET: Retrieve user domain completion statistics
export async function GET(_request: NextRequest) {
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
      console.log('Found user ID from session for domain stats:', userId);
    } else {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Initialize domain stats
    const domainStats = [];

    // Try to get domain stats directly from user_activity first
    console.log('Trying to get domain stats directly from user_activity');
    // Use PostgreSQL query directly for grouping
    const { data: userActivityDomains, error: userActivityError } = await supabase
      .rpc('get_domain_counts', { user_id_param: userId });

    if (!userActivityError && userActivityDomains && userActivityDomains.length > 0) {
      console.log('Found domain data in user_activity:', userActivityDomains);

      // Get all available domains for reference
      const { data: allDomainsData, error: allDomainsError } = await supabase
        .from('topics')
        .select('domain')
        .not('domain', 'is', null);

      if (allDomainsError) {
        console.error('Error fetching all domains:', allDomainsError);
        return NextResponse.json({ error: 'Failed to fetch all domains' }, { status: 500 });
      }

      const allDomains = [...new Set(allDomainsData.map(item => item.domain))].filter(Boolean);
      console.log('All available domains:', allDomains);

      // Process each domain from user_activity
      for (const domainData of userActivityDomains) {
        const domain = domainData.domain;
        const activityCount = parseInt(domainData.count);

        try {
          // Get all topic IDs for this domain
          const { data: domainTopics, error: domainTopicsError } = await supabase
            .from('topics')
            .select('id')
            .eq('domain', domain);

          if (domainTopicsError) {
            console.error(`Error fetching topics for domain ${domain}:`, domainTopicsError);
            continue;
          }

          if (!domainTopics || domainTopics.length === 0) {
            continue;
          }

          const domainTopicIds = domainTopics.map(t => t.id);

          // Get all category IDs for these topics
          const { data: categoriesData, error: categoriesError } = await supabase
            .from('categories')
            .select('id')
            .in('topic_id', domainTopicIds);

          if (categoriesError) {
            console.error(`Error fetching categories for domain ${domain}:`, categoriesError);
            continue;
          }

          if (!categoriesData || categoriesData.length === 0) {
            continue;
          }

          const categoryIds = categoriesData.map(c => c.id);

          // Get total questions count for this domain
          let totalQuestions = 0;

          // Process in batches if needed
          if (categoryIds.length > 100) {
            for (let i = 0; i < categoryIds.length; i += 100) {
              const batchIds = categoryIds.slice(i, i + 100);
              const { count, error } = await supabase
                .from('questions')
                .select('*', { count: 'exact', head: true })
                .in('category_id', batchIds);

              if (error) {
                console.error(`Error counting questions for domain ${domain} batch:`, error);
                continue;
              }

              totalQuestions += count || 0;
            }
          } else {
            const { count, error } = await supabase
              .from('questions')
              .select('*', { count: 'exact', head: true })
              .in('category_id', categoryIds);

            if (error) {
              console.error(`Error counting questions for domain ${domain}:`, error);
              continue;
            }

            totalQuestions = count || 0;
          }

          // Get a friendly name for the domain
          let domainName = getDomainFriendlyName(domain);

          // Add domain stats
          domainStats.push({
            domain,
            domainName,
            totalQuestions,
            completedQuestions: activityCount,
            completionPercentage: totalQuestions > 0
              ? Math.round((activityCount / totalQuestions) * 100)
              : 0,
            color: getDomainColor(domain)
          });

          console.log(`Domain ${domain}: ${activityCount}/${totalQuestions}`);

        } catch (error) {
          console.error(`Error processing domain ${domain}:`, error);
        }
      }

      // Sort domains by completion percentage (descending)
      domainStats.sort((a, b) => b.completionPercentage - a.completionPercentage);

      return NextResponse.json({
        domains: domainStats,
        totalDomains: allDomains.length
      });
    }

    // If we couldn't get domain data from user_activity, fall back to the original method
    console.log('No domain data in user_activity, falling back to original method');

    // 1. Get all user activity for completed questions
    console.log('Fetching user activity for completed questions');
    const { data: userProgress, error: progressError } = await supabase
      .from('user_progress')
      .select(`
        id,
        topic_id,
        category_id,
        question_id,
        status
      `)
      .eq('user_id', userId)
      .in('status', ['completed', 'viewed']);  // Include both completed and viewed questions

    if (progressError) {
      console.error('Error fetching user progress:', progressError);
      return NextResponse.json({ error: 'Failed to fetch user progress' }, { status: 500 });
    }

    if (!userProgress || userProgress.length === 0) {
      console.log('No completed questions found for user');
      return NextResponse.json({
        domains: [],
        totalDomains: 0
      });
    }

    console.log(`Found ${userProgress.length} completed questions`);

    // 2. Get all topic IDs from user progress
    console.log('Raw user progress:', userProgress);

    // Check if we have topic_ids directly
    const directTopicIds = userProgress
      .filter(item => item.topic_id)
      .map(item => item.topic_id);

    console.log('Direct topic IDs:', directTopicIds);

    // If we don't have topic_ids, try to get them from category_ids
    let categoryIds = [];
    if (directTopicIds.length === 0) {
      categoryIds = userProgress
        .filter(item => item.category_id)
        .map(item => item.category_id);

      console.log('Using category IDs instead:', categoryIds);
    }

    // Get unique topic IDs
    const topicIds = [...new Set(directTopicIds)].filter(Boolean);

    if (topicIds.length === 0 && categoryIds.length === 0) {
      console.log('No topic or category IDs found in user progress');

      // As a fallback, try to get topics from question IDs
      const questionIds = userProgress
        .filter(item => item.question_id)
        .map(item => item.question_id);

      if (questionIds.length === 0) {
        console.log('No question IDs found either');
        return NextResponse.json({
          domains: [],
          totalDomains: 0
        });
      }

      console.log('Using question IDs as fallback:', questionIds);

      // Get categories from questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('category_id')
        .in('id', questionIds);

      if (questionsError || !questionsData || questionsData.length === 0) {
        console.log('Could not get categories from questions');
        return NextResponse.json({
          domains: [],
          totalDomains: 0
        });
      }

      categoryIds = questionsData.map(q => q.category_id).filter(Boolean);
      console.log('Got category IDs from questions:', categoryIds);
    }

    // If we have category IDs but no topic IDs, get topics from categories
    if (topicIds.length === 0 && categoryIds.length > 0) {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('topic_id')
        .in('id', categoryIds);

      if (!categoriesError && categoriesData && categoriesData.length > 0) {
        const topicIdsFromCategories = categoriesData.map(c => c.topic_id).filter(Boolean);
        topicIds.push(...topicIdsFromCategories);
        console.log('Got topic IDs from categories:', topicIdsFromCategories);
      }
    }

    // Final check for topic IDs
    if (topicIds.length === 0) {
      console.log('Still no topic IDs found after all attempts');
      return NextResponse.json({
        domains: [],
        totalDomains: 0
      });
    }

    console.log(`Found ${topicIds.length} unique topic IDs:`, topicIds);

    // 3. Get domain information for these topics
    const { data: topicsData, error: topicsError } = await supabase
      .from('topics')
      .select('id, domain, section_name')
      .in('id', topicIds);

    if (topicsError) {
      console.error('Error fetching topics:', topicsError);
      return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
    }

    if (!topicsData || topicsData.length === 0) {
      console.log('No topics found for the given topic IDs');
      return NextResponse.json({
        domains: [],
        totalDomains: 0
      });
    }

    // 4. Create a map of topic ID to domain
    const topicToDomain = new Map();
    console.log('Topics data:', topicsData);

    topicsData.forEach(topic => {
      if (topic.domain) {
        topicToDomain.set(topic.id, topic.domain);
        console.log(`Mapped topic ${topic.id} to domain ${topic.domain}`);
      } else {
        console.log(`Topic ${topic.id} has no domain`);
      }
    });

    console.log('Topic to domain map:', Object.fromEntries(topicToDomain));

    // 5. Count completed questions by domain
    const domainCompletedCounts = new Map();
    let mappedCount = 0;

    userProgress.forEach(progress => {
      if (progress.topic_id && topicToDomain.has(progress.topic_id)) {
        const domain = topicToDomain.get(progress.topic_id);
        domainCompletedCounts.set(domain, (domainCompletedCounts.get(domain) || 0) + 1);
        mappedCount++;
        console.log(`Mapped question with topic_id ${progress.topic_id} to domain ${domain}`);
      } else if (progress.topic_id) {
        console.log(`Could not map topic_id ${progress.topic_id} to any domain`);
      }
    });

    console.log(`Mapped ${mappedCount} out of ${userProgress.length} questions to domains`);
    console.log('Domain completed counts:', Object.fromEntries(domainCompletedCounts));

    // 6. Get all available domains for reference
    const { data: allDomainsData, error: allDomainsError } = await supabase
      .from('topics')
      .select('domain')
      .not('domain', 'is', null);

    if (allDomainsError) {
      console.error('Error fetching all domains:', allDomainsError);
      return NextResponse.json({ error: 'Failed to fetch all domains' }, { status: 500 });
    }

    const allDomains = [...new Set(allDomainsData.map(item => item.domain))].filter(Boolean);
    console.log('All available domains:', allDomains);

    // If no domains with completed questions, use all domains
    if (domainCompletedCounts.size === 0) {
      console.log('No domains with completed questions, using all domains');
      allDomains.forEach(domain => {
        if (domain) {
          domainCompletedCounts.set(domain, 0);
        }
      });
    }

    console.log('Domains to process:', [...domainCompletedCounts.keys()]);

    // 7. For each domain with completed questions, get total questions count
    for (const domain of domainCompletedCounts.keys()) {
      try {
        // Get all topic IDs for this domain
        const { data: domainTopics, error: domainTopicsError } = await supabase
          .from('topics')
          .select('id')
          .eq('domain', domain);

        if (domainTopicsError) {
          console.error(`Error fetching topics for domain ${domain}:`, domainTopicsError);
          continue;
        }

        if (!domainTopics || domainTopics.length === 0) {
          continue;
        }

        const domainTopicIds = domainTopics.map(t => t.id);

        // Get all category IDs for these topics
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('id')
          .in('topic_id', domainTopicIds);

        if (categoriesError) {
          console.error(`Error fetching categories for domain ${domain}:`, categoriesError);
          continue;
        }

        if (!categoriesData || categoriesData.length === 0) {
          continue;
        }

        const categoryIds = categoriesData.map(c => c.id);

        // Get total questions count for this domain
        let totalQuestions = 0;

        // Process in batches if needed
        if (categoryIds.length > 100) {
          for (let i = 0; i < categoryIds.length; i += 100) {
            const batchIds = categoryIds.slice(i, i + 100);
            const { count, error } = await supabase
              .from('questions')
              .select('*', { count: 'exact', head: true })
              .in('category_id', batchIds);

            if (error) {
              console.error(`Error counting questions for domain ${domain} batch:`, error);
              continue;
            }

            totalQuestions += count || 0;
          }
        } else {
          const { count, error } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true })
            .in('category_id', categoryIds);

          if (error) {
            console.error(`Error counting questions for domain ${domain}:`, error);
            continue;
          }

          totalQuestions = count || 0;
        }

        const completedQuestions = domainCompletedCounts.get(domain) || 0;
        const completionPercentage = totalQuestions > 0
          ? Math.round((completedQuestions / totalQuestions) * 100)
          : 0;

        // Get a friendly name for the domain
        let domainName = getDomainFriendlyName(domain);

        // Add domain stats
        domainStats.push({
          domain,
          domainName,
          totalQuestions,
          completedQuestions,
          completionPercentage,
          color: getDomainColor(domain)
        });

        console.log(`Domain ${domain}: ${completedQuestions}/${totalQuestions} (${completionPercentage}%)`);

      } catch (error) {
        console.error(`Error processing domain ${domain}:`, error);
      }
    }

    // Sort domains by completion percentage (descending)
    domainStats.sort((a, b) => b.completionPercentage - a.completionPercentage);

    return NextResponse.json({
      domains: domainStats,
      totalDomains: allDomains.length
    });

  } catch (error) {
    console.error('Error in domain stats API:', error);
    return NextResponse.json({ error: 'Failed to fetch domain stats' }, { status: 500 });
  }
}

// Helper function to get a color for each domain
function getDomainColor(domain: string): string {
  const colorMap: Record<string, string> = {
    'dsa': '#8B5CF6', // Purple
    'ml': '#EC4899', // Pink
    'sdesign': '#3B82F6', // Blue
    'ai': '#10B981', // Green
    'backend': '#F59E0B', // Amber
    'frontend': '#EF4444', // Red
    'devops': '#6366F1', // Indigo
    'mobile': '#14B8A6', // Teal
    'security': '#F97316', // Orange
    'cloud': '#8B5CF6', // Purple
  };

  return colorMap[domain] || '#8B5CF6'; // Default to purple
}

// Helper function to get a friendly name for each domain
function getDomainFriendlyName(domain: string): string {
  const nameMap: Record<string, string> = {
    'dsa': 'Data Structures & Algorithms',
    'ml': 'Machine Learning',
    'sdesign': 'System Design',
    'ai': 'Artificial Intelligence',
    'backend': 'Backend Development',
    'frontend': 'Frontend Development',
    'devops': 'DevOps',
    'mobile': 'Mobile Development',
    'security': 'Security',
    'cloud': 'Cloud Computing',
  };

  if (nameMap[domain]) {
    return nameMap[domain];
  }

  // Capitalize first letter of each word
  return domain.split('_')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
