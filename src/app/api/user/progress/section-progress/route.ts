import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import supabaseServer from '@/utils/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    const sectionName = searchParams.get('section');

    if (!domain) {
      return NextResponse.json({ error: 'Domain parameter is required' }, { status: 400 });
    }

    if (!sectionName) {
      return NextResponse.json({ error: 'Section parameter is required' }, { status: 400 });
    }

    // Get the user ID from the session
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

    console.log(`Calculating section progress for domain ${domain}, section ${sectionName}`);

    // Get all topics for this section
    let subtopics = null;
    let subtopicsError = null;

    // Special handling for "Core Concepts" which might be both a section_name and a name
    if (sectionName === "Core Concepts") {
      // For Core Concepts, check both section_name and name fields
      const response = await supabaseServer
        .from('topics')
        .select('id, name, section_name, domain')
        .eq('domain', domain)
        .or('section_name.eq."Core Concepts",name.eq."Core Concepts"');

      subtopics = response.data;
      subtopicsError = response.error;
    } else {
      // For other sections, just check section_name
      const response = await supabaseServer
        .from('topics')
        .select('id, name, section_name, domain')
        .eq('domain', domain)
        .eq('section_name', sectionName);

      subtopics = response.data;
      subtopicsError = response.error;
    }

    // We've already assigned subtopics and subtopicsError above

    if (subtopicsError) {
      console.error(`Error fetching subtopics for section ${sectionName}:`, subtopicsError);
      return NextResponse.json({ error: 'Failed to fetch subtopics' }, { status: 500 });
    }

    if (!subtopics || subtopics.length === 0) {
      console.log(`No subtopics found for section ${sectionName}`);
      return NextResponse.json({
        completionPercentage: 0,
        subtopicsCompleted: 0,
        totalSubtopics: 0,
        questionsCompleted: 0,
        totalQuestions: 0
      });
    }

    console.log(`Found ${subtopics.length} subtopics for section ${sectionName}`);

    // Get all categories for these subtopics
    const subtopicIds = subtopics.map(subtopic => subtopic.id);
    const { data: categories, error: categoriesError } = await supabaseServer
      .from('categories')
      .select('id, topic_id, name')
      .in('topic_id', subtopicIds);

    if (categoriesError) {
      console.error(`Error fetching categories for section ${sectionName}:`, categoriesError);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    if (!categories || categories.length === 0) {
      console.log(`No categories found for section ${sectionName}`);
      return NextResponse.json({
        completionPercentage: 0,
        subtopicsCompleted: 0,
        totalSubtopics: subtopics.length,
        questionsCompleted: 0,
        totalQuestions: 0
      });
    }

    console.log(`Found ${categories.length} categories for section ${sectionName}`);

    // Group categories by subtopic
    const categoriesBySubtopic = {};
    categories.forEach(category => {
      if (!categoriesBySubtopic[category.topic_id]) {
        categoriesBySubtopic[category.topic_id] = [];
      }
      categoriesBySubtopic[category.topic_id].push(category.id);
    });

    // Get all category IDs
    const categoryIds = categories.map(category => category.id);

    // Get all questions for these categories
    const { data: questions, error: questionsError } = await supabaseServer
      .from('questions')
      .select('id, category_id')
      .in('category_id', categoryIds);

    if (questionsError) {
      console.error(`Error fetching questions for section ${sectionName}:`, questionsError);
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    const totalQuestions = questions?.length || 0;
    console.log(`Found ${totalQuestions} questions for section ${sectionName}`);

    // Group questions by category
    const questionsByCategory = {};
    questions?.forEach(question => {
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
      console.error(`Error fetching completed questions for section ${sectionName}:`, completedError);
      return NextResponse.json({ error: 'Failed to fetch completed questions' }, { status: 500 });
    }

    // Create a set of unique completed question IDs
    const uniqueCompletedQuestions = new Set(completedData?.map(item => item.question_id) || []);
    const questionsCompleted = uniqueCompletedQuestions.size;

    console.log(`User has completed ${questionsCompleted}/${totalQuestions} questions in section ${sectionName}`);

    // Calculate how many categories are "completed" (all questions completed)
    const completedCategories = new Set();

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

      // If all questions are completed, add to completed categories
      if (categoryCompletedCount === categoryQuestions.length) {
        completedCategories.add(categoryId);
      }
    }

    // Calculate how many subtopics are "completed" (all categories completed)
    let subtopicsCompleted = 0;
    let partiallyCompletedSubtopics = 0;

    // For each subtopic, check if all categories are completed
    for (const subtopicId of subtopicIds) {
      const subtopicCategories = categoriesBySubtopic[subtopicId] || [];

      if (subtopicCategories.length === 0) continue;

      // Check if all categories in this subtopic are completed
      const allCategoriesCompleted = subtopicCategories.every(categoryId =>
        completedCategories.has(categoryId)
      );

      if (allCategoriesCompleted) {
        subtopicsCompleted++;
      } else {
        // Check if at least one category is completed
        const atLeastOneCompleted = subtopicCategories.some(categoryId =>
          completedCategories.has(categoryId)
        );

        if (atLeastOneCompleted) {
          partiallyCompletedSubtopics++;
        }
      }
    }

    // Calculate completion percentage based on subtopic completion
    const totalSubtopics = subtopics.length;

    console.log(`Section ${sectionName}: ${subtopicsCompleted} fully completed subtopics, ${partiallyCompletedSubtopics} partially completed subtopics out of ${totalSubtopics} total`);

    // Calculate completion percentage
    let completionPercentage = 0;

    if (totalSubtopics > 0) {
      // For sections, we want to show progress based on completed subtopics
      // If at least one subtopic is completed, show 25% progress
      if (subtopicsCompleted > 0) {
        // Calculate progress based on completed subtopics
        completionPercentage = Math.round((subtopicsCompleted / totalSubtopics) * 100);

        // Ensure it shows at least 25% if one subtopic is completed
        if (subtopicsCompleted === 1 && completionPercentage < 25) {
          completionPercentage = 25;
          console.log(`Adjusted completion percentage to 25% for section ${sectionName} with 1 completed subtopic`);
        }
      }
      // If no subtopics are fully completed but some are partially completed
      else if (partiallyCompletedSubtopics > 0) {
        // Calculate progress based on partially completed subtopics (count as 50%)
        completionPercentage = Math.round((partiallyCompletedSubtopics * 0.5 / totalSubtopics) * 100);

        // Ensure it shows at least 15% if one subtopic is partially completed
        if (partiallyCompletedSubtopics === 1 && completionPercentage < 15) {
          completionPercentage = 15;
          console.log(`Adjusted completion percentage to 15% for section ${sectionName} with 1 partially completed subtopic`);
        }
      }
      // If no subtopics are completed or partially completed but some questions are, show some progress
      else if (questionsCompleted > 0) {
        const questionBasedPercentage = Math.round((questionsCompleted / totalQuestions) * 100);
        completionPercentage = Math.min(10, questionBasedPercentage);
        console.log(`Using question-based percentage for section ${sectionName}: ${completionPercentage}%`);
      }

      // If all subtopics are completed, ensure it shows 100%
      if (subtopicsCompleted === totalSubtopics && totalSubtopics > 0) {
        completionPercentage = 100;
        console.log(`All subtopics completed for section ${sectionName}, setting to 100%`);
      }

      // Log the calculation details
      console.log(`Section ${sectionName} progress calculation:`, {
        subtopicsCompleted,
        partiallyCompletedSubtopics,
        totalSubtopics,
        questionsCompleted,
        totalQuestions,
        completionPercentage
      });
    }

    console.log(`Section ${sectionName} progress: ${subtopicsCompleted}/${totalSubtopics} subtopics, ${questionsCompleted}/${totalQuestions} questions, ${completionPercentage}% complete`);

    return NextResponse.json({
      completionPercentage,
      subtopicsCompleted,
      partiallyCompletedSubtopics,
      totalSubtopics,
      questionsCompleted,
      totalQuestions,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Error calculating section progress:', error);

    // Provide more detailed error information
    let errorMessage = 'Failed to calculate section progress';
    if (error instanceof Error) {
      errorMessage = `${errorMessage}: ${error.message}`;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
