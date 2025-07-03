import { NextRequest, NextResponse } from 'next/server';
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'; // Old import
// import { cookies } from 'next/headers'; // Old import
import { createClient } from '@/utils/supabase/server'; // New import for @supabase/ssr server client
// import supabaseServer from '@/utils/supabase-server'; // To be removed

// GET: Retrieve progress for all subtopics in a domain
export async function GET(request: NextRequest) {
  const supabase = await createClient(); // Use the new server client
  let userId = null;

  // Get the user using Supabase auth
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser(); // Changed getSession to getUser
    if (userError) throw userError;
    if (!user) throw new Error('User not authenticated');
    userId = user.id;
    console.log('Found user ID from auth for domain-subtopics:', userId); // Updated log
  } catch (error: any) {
    console.error('Domain-subtopics User/Auth Error:', error.message); // Updated log
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const domain = url.searchParams.get('domain');
    const topicId = url.searchParams.get('topicId');

    if (!domain) {
      return NextResponse.json({ error: 'Domain parameter is required' }, { status: 400 });
    }

    console.log(`Fetching progress for subtopics in domain ${domain}${topicId ? ` for topic ${topicId}` : ''}`);

    // First, get the domain ID from the domains table
    const { data: domainData, error: domainError } = await supabase
      .from('domains')
      .select('id')
      .eq('code', domain)
      .single();

    if (domainError || !domainData) {
      console.error(`Domain ${domain} not found:`, domainError);
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    const domainId = domainData.id;
    console.log(`Found domain ID ${domainId} for domain ${domain}`);

    // Get all topics for the domain
    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select('id, name, domain_id, section_id')
      .eq('domain_id', domainId);

    if (topicsError) {
      console.error(`Error fetching topics for domain ${domain}:`, topicsError);
      return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
    }

    if (!topics || topics.length === 0) {
      console.log(`No topics found for domain ${domain}`);
      return NextResponse.json({ subtopics: [] });
    }

    // Get section information for these topics
    const sectionIds = [...new Set(topics.map(t => t.section_id).filter(Boolean))];
    const { data: sections, error: sectionsError } = await supabase
      .from('sections')
      .select('id, name')
      .in('id', sectionIds);

    if (sectionsError) {
      console.error(`Error fetching sections:`, sectionsError);
      return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 });
    }

    // Create a section map for quick lookup
    const sectionMap = new Map((sections || []).map(s => [s.id, s.name]));

    console.log(`Found ${topics.length} topics for domain ${domain}`);

    // Filter topics based on query parameters
    let filteredTopics = topics;

    const sectionParam = url.searchParams.get('section');
    const mainTopicsOnly = url.searchParams.get('mainTopicsOnly') === 'true';

    if (topicId) {
      // Filter by specific topic ID
      const topicIdNum = parseInt(topicId);
      if (!isNaN(topicIdNum)) {
        filteredTopics = topics.filter(t => t.id === topicIdNum);
        console.log(`Filtered to topic ${topicId}: found ${filteredTopics.length} topics`);
      }
    } else if (sectionParam) {
      // Filter by section name
      filteredTopics = topics.filter(t => 
        t.section_id && sectionMap.get(t.section_id) === sectionParam
      );
      console.log(`Filtered by section "${sectionParam}": found ${filteredTopics.length} topics`);
    } else if (mainTopicsOnly) {
      // Get one representative topic per section (main topics)
      const sectionGroups = new Map<number, any>();
      topics.forEach(topic => {
        if (topic.section_id && !sectionGroups.has(topic.section_id)) {
          sectionGroups.set(topic.section_id, topic);
        }
      });
      filteredTopics = Array.from(sectionGroups.values());
      console.log(`Main topics only: found ${filteredTopics.length} main topics`);
    }

    // Prepare subtopics with section names
    const subtopics = filteredTopics.map(topic => ({
      id: topic.id,
      name: topic.name,
      section_name: topic.section_id ? sectionMap.get(topic.section_id) || null : null,
      section_id: topic.section_id
    }));

    console.log(`Processing ${subtopics.length} subtopics for domain ${domain}`);

    // Get all categories for these subtopics
    const subtopicIds = subtopics.map(subtopic => subtopic.id);

    if (subtopicIds.length === 0) {
      return NextResponse.json({ subtopics: [] });
    }

    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, topic_id, name')
      .in('topic_id', subtopicIds);

    if (categoriesError) {
      console.error(`Error fetching categories for subtopics in domain ${domain}:`, categoriesError);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    if (!categories || categories.length === 0) {
      console.log(`No categories found for subtopics in domain ${domain}`);
      return NextResponse.json({ subtopics: [] });
    }

    console.log(`Found ${categories.length} categories for subtopics in domain ${domain}`);

    // Group categories by topic_id
    const categoriesBySubtopic = new Map<number, any[]>();
    categories.forEach(category => {
      if (!categoriesBySubtopic.has(category.topic_id)) {
        categoriesBySubtopic.set(category.topic_id, []);
      }
      categoriesBySubtopic.get(category.topic_id)!.push(category);
    });

    // Get all questions for these categories
    const allCategoryIds = categories.map(category => category.id);
    const { data: questionsData, error: questionsError } = await supabase
      .from('questions')
      .select('id, category_id')
      .in('category_id', allCategoryIds);

    if (questionsError) {
      console.error(`Error fetching questions for categories in domain ${domain}:`, questionsError);
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    // Group questions by category
    const questionsByCategory = new Map<number, any[]>();
    (questionsData || []).forEach(question => {
      if (!questionsByCategory.has(question.category_id)) {
        questionsByCategory.set(question.category_id, []);
      }
      questionsByCategory.get(question.category_id)!.push(question);
    });

    // Get completed questions from user_progress (single source of truth)
    const allQuestionIds = (questionsData || []).map(q => q.id);
    let completedQuestionIds = new Set<number>();
    
    if (allQuestionIds.length > 0) {
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('question_id')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .in('question_id', allQuestionIds);
        
      if (progressError) {
        console.error(`Error fetching user progress for domain ${domain}:`, progressError);
      } else {
        completedQuestionIds = new Set((progressData || []).map(p => p.question_id));
      }
    }

    // Calculate progress for each subtopic
    const subtopicProgress = subtopics.map(subtopic => {
      const subtopicCategories = categoriesBySubtopic.get(subtopic.id) || [];
      let totalQuestions = 0;
      let completedQuestions = 0;
      
      subtopicCategories.forEach(category => {
        const categoryQuestions = questionsByCategory.get(category.id) || [];
        totalQuestions += categoryQuestions.length;
        categoryQuestions.forEach(question => {
          if (completedQuestionIds.has(question.id)) {
            completedQuestions++;
          }
        });
      });
      
      return {
        id: subtopic.id,
        name: subtopic.name,
        section_name: subtopic.section_name,
        totalQuestions,
        completedQuestions,
        completionPercentage: totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0,
      };
    });

    console.log(`Calculated progress for ${subtopicProgress.length} subtopics in domain ${domain}`);

    // Calculate section progress if this is a section-specific request
    let sectionProgress = null;
    if (sectionParam) {
      let completedSubtopics = 0;
      let partiallyCompletedSubtopics = 0;
      let totalQuestionsCompleted = 0;
      let totalQuestionsCount = 0;

      subtopicProgress.forEach(subtopic => {
        if (subtopic.completionPercentage === 100) {
          completedSubtopics++;
        } else if (subtopic.completionPercentage > 0) {
          partiallyCompletedSubtopics++;
        }

        totalQuestionsCompleted += subtopic.completedQuestions || 0;
        totalQuestionsCount += subtopic.totalQuestions || 0;
      });

      const totalSubtopics = subtopicProgress.length;
      let sectionCompletionPercentage = 0;

      if (totalSubtopics > 0) {
        if (completedSubtopics > 0) {
          sectionCompletionPercentage = Math.round((completedSubtopics / totalSubtopics) * 100);
          if (completedSubtopics === 1 && sectionCompletionPercentage < 25) {
            sectionCompletionPercentage = 25;
          }
        } else if (partiallyCompletedSubtopics > 0) {
          sectionCompletionPercentage = Math.round((partiallyCompletedSubtopics * 0.5 / totalSubtopics) * 100);
          if (partiallyCompletedSubtopics === 1 && sectionCompletionPercentage < 15) {
            sectionCompletionPercentage = 15;
          }
        }

        if (completedSubtopics === totalSubtopics) {
          sectionCompletionPercentage = 100;
        }
      }

      sectionProgress = {
        completionPercentage: sectionCompletionPercentage,
        subtopicsCompleted: completedSubtopics,
        partiallyCompletedSubtopics: partiallyCompletedSubtopics,
        totalSubtopics: totalSubtopics,
        questionsCompleted: totalQuestionsCompleted,
        totalQuestions: totalQuestionsCount
      };

      console.log(`Section ${sectionParam} progress:`, sectionProgress);
    }

    return NextResponse.json({
      subtopics: subtopicProgress,
      sectionProgress: sectionProgress,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Error fetching domain subtopics progress:', error);
    return NextResponse.json({ error: 'Failed to fetch domain subtopics progress' }, { status: 500 });
  }
}
