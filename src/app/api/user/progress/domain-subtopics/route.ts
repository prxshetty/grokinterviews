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

    // In this database structure:
    // - The "topics" table contains both topics and subtopics
    // - Topics have section_name values
    // - Subtopics are individual rows with a section_name that matches a topic
    // - Categories have a topic_id that refers to a subtopic

    // First, get all topics (section headers) for this domain
    const { data: sectionHeaders, error: sectionHeadersError } = await supabase // Use session client
      .from('topics')
      .select('id, name, section_name')
      .eq('domain', domain)
      .order('created_at');

    if (sectionHeadersError) {
      console.error(`Error fetching section headers for domain ${domain}:`, sectionHeadersError);
      return NextResponse.json({ error: 'Failed to fetch section headers' }, { status: 500 });
    }

    if (!sectionHeaders || sectionHeaders.length === 0) {
      console.log(`No section headers found for domain ${domain}`);
      return NextResponse.json({ subtopics: [] });
    }

    // Group topics by section_name to identify subtopics
    const topicsBySection: Record<string, any[]> = {};
    sectionHeaders.forEach(topic => {
      if (topic.section_name) {
        if (!topicsBySection[topic.section_name]) {
          topicsBySection[topic.section_name] = [];
        }
        topicsBySection[topic.section_name].push(topic);
      }
    });

    // Get all subtopics (individual topics within sections)
    let subtopics: any[] = [];
    Object.values(topicsBySection).forEach((topics: any[]) => {
      if (topics.length > 0) {
        // Add each topic as a subtopic
        topics.forEach(topic => {
          subtopics.push({
            id: topic.id,
            name: topic.name,
            section_name: topic.section_name
          });
        });
      }
    });

    // Check if we should filter by section or get main topics only
    const sectionParam = url.searchParams.get('section');
    const mainTopicsOnly = url.searchParams.get('mainTopicsOnly') === 'true';

    if (mainTopicsOnly) {
      // Get the main topics for this domain
      console.log(`Filtering to include only main topics for domain ${domain}`);

      // Get all unique section_names for this domain
      const uniqueSectionNames = [...new Set(subtopics.map(s => s.section_name).filter(Boolean))];
      console.log(`Found ${uniqueSectionNames.length} unique section_names for domain ${domain}: ${uniqueSectionNames.join(', ')}`);

      // For each section_name, find the first topic (which is the main topic)
      const mainTopicIds: any[] = [];
      for (const sectionName of uniqueSectionNames) {
        const topicsInSection = subtopics.filter(s => s.section_name === sectionName);
        if (topicsInSection.length > 0) {
          // Sort by ID to get the first one (assuming lower IDs are main topics)
          topicsInSection.sort((a, b) => a.id - b.id);
          mainTopicIds.push(topicsInSection[0].id);
        }
      }

      console.log(`Found ${mainTopicIds.length} main topics for domain ${domain}: ${mainTopicIds.join(', ')}`);
      subtopics = subtopics.filter(s => mainTopicIds.includes(s.id));
    } else if (sectionParam) {
      // Filter by specific section name
      console.log(`Filtering subtopics by section name: ${sectionParam}`);

      // Get all subtopics with this section name
      const sectionSubtopics = subtopics.filter(s => s.section_name === sectionParam);
      console.log(`Found ${sectionSubtopics.length} subtopics with section_name "${sectionParam}"`);

      // Log the subtopics for debugging
      sectionSubtopics.forEach(s => {
        console.log(`- Subtopic in section ${sectionParam}: ${s.id} (${s.name})`);
      });

      // Keep all subtopics with this section name
      subtopics = sectionSubtopics;
    } else if (topicId) {
      // First, try to find the topic directly
      const topic = sectionHeaders.find(t => t.id.toString() === topicId);

      if (topic) {
        // If we found the topic, check if it has a section_name
        if (topic.section_name) {
          // This is a main topic with a section_name, filter subtopics by section_name
          console.log(`Filtering subtopics for topic ${topicId} with section_name "${topic.section_name}"`);
          subtopics = subtopics.filter(s => s.section_name === topic.section_name);
        } else {
          // This is a subtopic itself, only include this specific subtopic
          console.log(`Topic ${topicId} is a subtopic itself, only including this subtopic`);
          subtopics = subtopics.filter(s => s.id.toString() === topicId);
        }
      } else if (topicId === domain) {
        // This is a domain-level request (like 'ml', 'ai', etc.)
        // For domain-level requests, get the main topics for each section
        console.log(`Domain-level request for ${domain}, getting main topics for each section`);

        // Get all unique section_names for this domain
        const uniqueSectionNames = [...new Set(subtopics.map(s => s.section_name).filter(Boolean))];
        console.log(`Found ${uniqueSectionNames.length} unique section_names for domain ${domain}: ${uniqueSectionNames.join(', ')}`);

        // For each section_name, find the first topic (which is the main topic)
        const mainTopicIds: any[] = [];
        for (const sectionName of uniqueSectionNames) {
          const topicsInSection = subtopics.filter(s => s.section_name === sectionName);
          if (topicsInSection.length > 0) {
            // Sort by ID to get the first one (assuming lower IDs are main topics)
            topicsInSection.sort((a, b) => a.id - b.id);
            mainTopicIds.push(topicsInSection[0].id);
          }
        }

        console.log(`Found ${mainTopicIds.length} main topics for domain ${domain}: ${mainTopicIds.join(', ')}`);
        subtopics = subtopics.filter(s => mainTopicIds.includes(s.id));
      } else {
        // Topic not found, check if it's a section name
        console.log(`Topic ${topicId} not found directly, checking if it's a section name`);

        // Try to filter by the topicId as a section name
        const matchingSubtopics = subtopics.filter(s => s.section_name === topicId);

        if (matchingSubtopics.length > 0) {
          console.log(`Found ${matchingSubtopics.length} subtopics with section_name "${topicId}"`);
          subtopics = matchingSubtopics;
        } else {
          console.log(`No subtopics found with section_name "${topicId}", using all subtopics`);
        }
      }
    } else {
      // No filtering parameters provided, get the main topics for each section
      console.log(`No filtering parameters provided, getting main topics for domain ${domain}`);

      // Get all unique section_names for this domain
      const uniqueSectionNames = [...new Set(subtopics.map(s => s.section_name).filter(Boolean))];
      console.log(`Found ${uniqueSectionNames.length} unique section_names for domain ${domain}: ${uniqueSectionNames.join(', ')}`);

      // For each section_name, find the first topic (which is the main topic)
      const mainTopicIds: any[] = [];
      for (const sectionName of uniqueSectionNames) {
        const topicsInSection = subtopics.filter(s => s.section_name === sectionName);
        if (topicsInSection.length > 0) {
          // Sort by ID to get the first one (assuming lower IDs are main topics)
          topicsInSection.sort((a, b) => a.id - b.id);
          mainTopicIds.push(topicsInSection[0].id);
        }
      }

      console.log(`Found ${mainTopicIds.length} main topics for domain ${domain}: ${mainTopicIds.join(', ')}`);
      subtopics = subtopics.filter(s => mainTopicIds.includes(s.id));
    }

    console.log(`Found ${subtopics.length} subtopics for domain ${domain}${topicId ? ` and topic ${topicId}` : ''}`);

    // Log the count of subtopics
    console.log(`Processing ${subtopics.length} subtopics for domain ${domain}`);

    // Get all categories for these subtopics
    const subtopicIds = subtopics.map(subtopic => subtopic.id);

    // Log the subtopics we're querying categories for
    console.log(`Querying categories for ${subtopicIds.length} subtopics`);

    const { data: categories, error: categoriesError } = await supabase // Use session client
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

    // Log the categories we found
    console.log(`Found ${categories.length} categories for subtopics in domain ${domain}`);

    // Group categories by topic_id for debugging
    const categoriesByTopicDebug: Record<string, any[]> = {};
    categories.forEach(c => {
      if (!categoriesByTopicDebug[c.topic_id]) {
        categoriesByTopicDebug[c.topic_id] = [];
      }
      categoriesByTopicDebug[c.topic_id].push(c);
    });

    // Log a summary instead of individual topics
    console.log(`Found categories for ${Object.keys(categoriesByTopicDebug).length} topics`);

    // Group categories by topic_id (which is the subtopic id)
    const categoriesBySubtopic: Record<string, any[]> = {};
    categories.forEach(category => {
      if (!categoriesBySubtopic[category.topic_id]) {
        categoriesBySubtopic[category.topic_id] = [];
      }
      categoriesBySubtopic[category.topic_id].push(category);
    });

    const allCategoryIds = categories.map(category => category.id);
    const { data: questionsData, error: questionsError } = await supabase // Use session client
      .from('questions')
      .select('id, category_id')
      .in('category_id', allCategoryIds);

    if (questionsError) {
      console.error(`Error fetching questions for categories in domain ${domain}:`, questionsError);
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    // Define questionsByCategory with explicit types
    const questionsByCategory: Record<string, { id: any; category_id: any }[]> = {};
    (questionsData || []).forEach((question: { id: any; category_id: any }) => { // Typed question parameter
      if (!questionsByCategory[question.category_id]) {
        questionsByCategory[question.category_id] = [];
      }
      questionsByCategory[question.category_id].push(question);
    });

    // Define completedQuestionIds
    const allQuestionIds = (questionsData || []).map(q => q.id);
    let completedQuestionIds = new Set();
    if (allQuestionIds.length > 0) {
      const { data: activityData, error: activityError } = await supabase // Use session client
        .from('user_activity')
        .select('question_id')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .in('question_id', allQuestionIds);
      if (activityError) {
        console.error(`Error fetching user activity for domain ${domain}:`, activityError);
        // Continue, completedQuestionIds will be empty or partially filled based on previous successful fetches if any
      } else {
        completedQuestionIds = new Set((activityData || []).map(a => a.question_id));
      }
    }

    const subtopicProgress = subtopics.map(subtopic => {
      const subtopicCategories = categoriesBySubtopic[subtopic.id] || [];
      let totalQuestions = 0;
      let completedQuestions = 0;
      subtopicCategories.forEach(category => {
        const categoryQuestions = questionsByCategory[category.id] || []; // Should find questionsByCategory
        totalQuestions += categoryQuestions.length;
        categoryQuestions.forEach((question: { id: any }) => { // Typed question parameter
          if (completedQuestionIds.has(question.id)) { // Should find completedQuestionIds (the Set)
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

    // If this is a section-specific request, calculate section progress
    let sectionProgress = null;
    if (sectionParam) {
      // Calculate section progress based on subtopics
      let completedSubtopics = 0;
      let partiallyCompletedSubtopics = 0;
      let totalQuestionsCompleted = 0;
      let totalQuestionsCount = 0;

      // Count completed and partially completed subtopics
      subtopicProgress.forEach((subtopic: any) => {
        if (subtopic.completionPercentage === 100) {
          completedSubtopics++;
        } else if (subtopic.completionPercentage > 0) {
          partiallyCompletedSubtopics++;
        }

        totalQuestionsCompleted += subtopic.completedQuestions || 0;
        totalQuestionsCount += subtopic.totalQuestions || 0;
      });

      // Calculate section completion percentage
      let sectionCompletionPercentage = 0;
      const totalSubtopics = subtopicProgress.length;

      if (totalSubtopics > 0) {
        // If at least one subtopic is completed, calculate percentage
        if (completedSubtopics > 0) {
          sectionCompletionPercentage = Math.round((completedSubtopics / totalSubtopics) * 100);

          // Ensure it shows at least 25% if one subtopic is completed
          if (completedSubtopics === 1 && sectionCompletionPercentage < 25) {
            sectionCompletionPercentage = 25;
          }
        }
        // If no subtopics are fully completed but some are partially completed
        else if (partiallyCompletedSubtopics > 0) {
          sectionCompletionPercentage = Math.round((partiallyCompletedSubtopics * 0.5 / totalSubtopics) * 100);

          // Ensure it shows at least 15% if one subtopic is partially completed
          if (partiallyCompletedSubtopics === 1 && sectionCompletionPercentage < 15) {
            sectionCompletionPercentage = 15;
          }
        }

        // If all subtopics are completed, ensure it shows 100%
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
