import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import supabaseServer from '@/utils/supabase-server';

// GET: Retrieve progress for all subtopics in a domain
export async function GET(request: NextRequest) {
  // Use the Next.js route handler client for authentication
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
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
    // Get the domain and optional topic from the query parameters
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
    const { data: sectionHeaders, error: sectionHeadersError } = await supabaseServer
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
    const topicsBySection = {};
    sectionHeaders.forEach(topic => {
      if (topic.section_name) {
        if (!topicsBySection[topic.section_name]) {
          topicsBySection[topic.section_name] = [];
        }
        topicsBySection[topic.section_name].push(topic);
      }
    });

    // Get all subtopics (individual topics within sections)
    let subtopics = [];
    Object.values(topicsBySection).forEach(topics => {
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
      const mainTopicIds = [];
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
        const mainTopicIds = [];
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
      const mainTopicIds = [];
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


    const { data: categories, error: categoriesError } = await supabaseServer
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
    const categoriesByTopicDebug = {};
    categories.forEach(c => {
      if (!categoriesByTopicDebug[c.topic_id]) {
        categoriesByTopicDebug[c.topic_id] = [];
      }
      categoriesByTopicDebug[c.topic_id].push(c);
    });

    // Log a summary instead of individual topics
    console.log(`Found categories for ${Object.keys(categoriesByTopicDebug).length} topics`);

    // Group categories by topic_id (which is the subtopic id)
    const categoriesBySubtopic = {};
    categories.forEach(category => {
      if (!categoriesBySubtopic[category.topic_id]) {
        categoriesBySubtopic[category.topic_id] = [];
      }
      categoriesBySubtopic[category.topic_id].push(category.id);
    });

    const subtopicIdsWithCategories = Object.keys(categoriesBySubtopic);
    console.log(`Found ${subtopicIdsWithCategories.length} unique subtopics with categories for domain ${domain}`);

    // For each subtopic, calculate progress
    const subtopicProgress = {};

    // Initialize progress data for all subtopics, even if they don't have categories
    // This ensures all subtopics will have progress data in the response
    console.log(`Initializing progress for ${subtopics.length} subtopics`);
    subtopics.forEach(subtopic => {
      // Convert ID to string to ensure consistent key format
      const subtopicIdStr = subtopic.id.toString();

      // Only log the count, not each individual subtopic
      // This reduces console noise

      subtopicProgress[subtopicIdStr] = {
        categoriesCompleted: 0,
        totalCategories: 0,
        questionsCompleted: 0,
        totalQuestions: 0,
        completionPercentage: 0,
        name: subtopic.name, // Include name for easier debugging
        section_name: subtopic.section_name // Include section_name for easier debugging
      };
    });

    console.log(`Calculating progress for ${subtopicIdsWithCategories.length} subtopics with categories`);

    for (const subtopicId of subtopicIdsWithCategories) {
      // Convert to string for consistent comparison
      const subtopicIdStr = subtopicId.toString();
      const categoryIds = categoriesBySubtopic[subtopicId];
      const totalCategories = categoryIds.length;

      // Find the subtopic name for better logging
      const subtopicInfo = subtopics.find(s => s.id.toString() === subtopicIdStr);
      const subtopicName = subtopicInfo ? subtopicInfo.name : `Subtopic ${subtopicIdStr}`;

      // Get all questions for these categories
      const { data: questions, error: questionsError } = await supabaseServer
        .from('questions')
        .select('id, category_id')
        .in('category_id', categoryIds);

      if (questionsError) {
        console.error(`Error fetching questions for categories in subtopic ${subtopicIdStr}:`, questionsError);
        continue;
      }

      // Group questions by category
      const questionsByCategory = {};
      questions.forEach(question => {
        if (!questionsByCategory[question.category_id]) {
          questionsByCategory[question.category_id] = [];
        }
        questionsByCategory[question.category_id].push(question.id);
      });

      // Get all completed questions for this user
      const { data: completedData, error: completedError } = await supabaseServer
        .from('user_activity')
        .select('question_id, category_id')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .in('category_id', categoryIds);

      if (completedError) {
        console.error(`Error fetching completed questions for subtopic ${subtopicIdStr}:`, completedError);
        continue;
      }

      // Create a set of unique completed question IDs
      const uniqueCompletedQuestions = new Set(completedData.map(item => item.question_id));
      const totalQuestions = questions.length;
      const questionsCompleted = uniqueCompletedQuestions.size;

      // Calculate how many categories are "completed" (all questions completed)
      let categoriesCompleted = 0;

      // For each category, check if all questions are completed
      for (const categoryId of categoryIds) {
        const categoryQuestions = questionsByCategory[categoryId] || [];

        if (categoryQuestions.length === 0) continue;

        // Count how many questions in this category are completed
        let categoryCompletedCount = 0;
        categoryQuestions.forEach(questionId => {
          if (uniqueCompletedQuestions.has(questionId)) {
            categoryCompletedCount++;
          }
        });

        // If all questions are completed, increment the counter
        if (categoryCompletedCount === categoryQuestions.length) {
          categoriesCompleted++;
        }
      }

      // Calculate completion percentage based on category completion
      let completionPercentage = 0;

      // For all subtopics, use the same consistent logic
      if (totalCategories > 0) {
        // If there are categories, always calculate progress based on completed categories
        if (categoriesCompleted > 0) {
          // Calculate progress based on the number of completed categories
          completionPercentage = Math.round((categoriesCompleted / totalCategories) * 100);
          // Detailed logging removed to reduce console noise

          // Ensure it shows at least 25% if one category is completed
          if (categoriesCompleted === 1 && completionPercentage < 25) {
            completionPercentage = 25;
            // Detailed logging removed to reduce console noise
          }
        } else if (questionsCompleted > 0) {
          // If no categories are completed but some questions are, show some progress
          // Calculate a percentage that's proportional to questions completed but capped at 20%
          const questionBasedPercentage = Math.round((questionsCompleted / totalQuestions) * 100);
          completionPercentage = Math.min(20, questionBasedPercentage);
          // Detailed logging removed to reduce console noise
        } else {
          // No categories or questions completed
          completionPercentage = 0;
          // Detailed logging removed to reduce console noise
        }

        // If all categories are completed, ensure it shows 100%
        if (categoriesCompleted === totalCategories && totalCategories > 0) {
          completionPercentage = 100;
          // Detailed logging removed to reduce console noise
        }
      } else if (totalQuestions > 0) {
        // Fallback to question-based progress if no categories are defined
        completionPercentage = Math.round((questionsCompleted / totalQuestions) * 100);
        // Detailed logging removed to reduce console noise
      }

      // Store the progress data for this subtopic
      subtopicProgress[subtopicIdStr] = {
        categoriesCompleted,
        totalCategories,
        questionsCompleted,
        totalQuestions,
        completionPercentage,
        name: subtopicName, // Include name for easier debugging
        section_name: subtopicInfo?.section_name // Include section_name for easier debugging
      };
    }

    console.log(`Calculated progress for ${Object.keys(subtopicProgress).length} subtopics in domain ${domain}`);

    // If this is a section-specific request, calculate section progress
    let sectionProgress = null;
    if (sectionParam) {
      // Calculate section progress based on subtopics
      let completedSubtopics = 0;
      let partiallyCompletedSubtopics = 0;
      let totalQuestionsCompleted = 0;
      let totalQuestionsCount = 0;

      // Count completed and partially completed subtopics
      Object.values(subtopicProgress).forEach((subtopic: any) => {
        if (subtopic.completionPercentage === 100) {
          completedSubtopics++;
        } else if (subtopic.completionPercentage > 0) {
          partiallyCompletedSubtopics++;
        }

        totalQuestionsCompleted += subtopic.questionsCompleted || 0;
        totalQuestionsCount += subtopic.totalQuestions || 0;
      });

      // Calculate section completion percentage
      let sectionCompletionPercentage = 0;
      const totalSubtopics = Object.keys(subtopicProgress).length;

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
