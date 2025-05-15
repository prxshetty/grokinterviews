import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import supabaseServer from '@/utils/supabase-server';

export async function GET(request: NextRequest) {
  try {
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

    // Get the domain from the query parameters
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain') || 'ml';

    // Define the sections for the ML domain
    const mlSections = [
      'Foundations of Machine Learning',
      'Supervised Learning',
      'Unsupervised Learning',
      'Neural Networks',
      'Model Evaluation',
      'Mathematical Foundations',
      'Data Preprocessing and Exploration',
      'Advanced Regression Techniques',
      'Classification Techniques',
      'Decision Trees and Random Forests',
      'Naive Bayes',
      'Ensemble Methods',
      'Validation Techniques',
      'Clustering Algorithms',
      'Dimensionality Reduction Techniques',
      'Autoencoders',
      'Neural Network Architectures',
      'Advanced Deep Learning',
      'Bayesian Methods',
      'Markov Models',
      'Sampling Methods',
      'Optimization and Model Tuning',
      'Feature Engineering',
      'Time Series Analysis',
      'Practical ML and Deployment',
      'Emerging Trends'
    ];

    // Use the hardcoded sections for ML domain, or an empty array for other domains
    const sections = domain === 'ml' ? mlSections.map(name => ({ section_name: name })) : [];
    const sectionsError = null;

    if (sectionsError) {
      console.error('Error fetching sections:', sectionsError);
      return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 });
    }

    // Get unique section names
    const uniqueSections = [...new Set(sections.map(section => section.section_name))];
    console.log(`Found ${uniqueSections.length} unique sections for domain ${domain}:`, uniqueSections);

    // Update progress for each section
    const results = [];
    for (const sectionName of uniqueSections) {
      // Check if the user has a record for this section
      const { data: existingData, error: existingError } = await supabaseServer
        .from('user_progress_summary')
        .select('*')
        .eq('user_id', userId)
        .eq('entity_type', 'section')
        .eq('domain', domain)
        .eq('section_name', sectionName);

      if (existingError) {
        console.error(`Error checking existing progress for ${sectionName}:`, existingError);
        results.push({ section: sectionName, status: 'error', message: existingError.message });
        continue;
      }

      // Generate random progress data for testing
      const completionPercentage = Math.floor(Math.random() * 100);
      const totalQuestions = Math.floor(Math.random() * 200) + 50;
      const questionsCompleted = Math.floor(totalQuestions * (completionPercentage / 100));
      const totalChildren = Math.floor(Math.random() * 20) + 5;
      const completedChildren = Math.floor(totalChildren * (completionPercentage / 100));
      const partiallyCompletedChildren = Math.floor((totalChildren - completedChildren) / 2);

      if (existingData && existingData.length > 0) {
        // Update existing record
        const { data: updateData, error: updateError } = await supabaseServer
          .from('user_progress_summary')
          .update({
            completion_percentage: completionPercentage,
            questions_completed: questionsCompleted,
            total_questions: totalQuestions,
            completed_children: completedChildren,
            partially_completed_children: partiallyCompletedChildren,
            total_children: totalChildren,
            last_updated: new Date().toISOString()
          })
          .eq('id', existingData[0].id);

        if (updateError) {
          console.error(`Error updating progress for ${sectionName}:`, updateError);
          results.push({ section: sectionName, status: 'error', message: updateError.message });
        } else {
          console.log(`Updated progress for ${sectionName} to ${completionPercentage}%`);
          results.push({
            section: sectionName,
            status: 'updated',
            progress: completionPercentage,
            questionsCompleted,
            totalQuestions
          });
        }
      } else {
        // Create new record
        // Use the index in the array as the entity_id to avoid unique constraint violations
        const entityId = uniqueSections.indexOf(sectionName) + 1;

        const { data: insertData, error: insertError } = await supabaseServer
          .from('user_progress_summary')
          .insert({
            user_id: userId,
            entity_type: 'section',
            entity_id: entityId,
            entity_name: sectionName,
            domain: domain,
            section_name: sectionName,
            completion_percentage: completionPercentage,
            questions_completed: questionsCompleted,
            total_questions: totalQuestions,
            completed_children: completedChildren,
            partially_completed_children: partiallyCompletedChildren,
            total_children: totalChildren,
            last_updated: new Date().toISOString()
          });

        if (insertError) {
          console.error(`Error inserting progress for ${sectionName}:`, insertError);
          results.push({ section: sectionName, status: 'error', message: insertError.message });
        } else {
          console.log(`Created progress for ${sectionName} with ${completionPercentage}%`);
          results.push({
            section: sectionName,
            status: 'created',
            progress: completionPercentage,
            questionsCompleted,
            totalQuestions
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated progress for ${results.length} sections in domain ${domain}`,
      results
    });
  } catch (error) {
    console.error('Error updating section progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
