import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient(); // Use the new server client
  let userId = null;

  try {
    // Get the user using Supabase auth
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');
      userId = user.id;
      console.log('Found user ID from auth for update-all-sections:', userId);
    } catch (error: any) {
      console.error('Update-all-sections User/Auth Error:', error.message);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain') || 'ml';

    const mlSections = [
      'Foundations of Machine Learning', 'Supervised Learning', 'Unsupervised Learning',
      'Neural Networks', 'Model Evaluation', 'Mathematical Foundations',
      'Data Preprocessing and Exploration', 'Advanced Regression Techniques',
      'Classification Techniques', 'Decision Trees and Random Forests', 'Naive Bayes',
      'Ensemble Methods', 'Validation Techniques', 'Clustering Algorithms',
      'Dimensionality Reduction Techniques', 'Autoencoders', 'Neural Network Architectures',
      'Advanced Deep Learning', 'Bayesian Methods', 'Markov Models', 'Sampling Methods',
      'Optimization and Model Tuning', 'Feature Engineering', 'Time Series Analysis',
      'Practical ML and Deployment', 'Emerging Trends'
    ];

    const sections = domain === 'ml' ? mlSections.map(name => ({ section_name: name })) : [];
    // const sectionsError = null; // This was a placeholder, not needed

    const uniqueSections = [...new Set(sections.map(section => section.section_name))];
    const results = [];

    for (const sectionName of uniqueSections) {
      const { data: existingData, error: existingError } = await supabase
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

      const completionPercentage = Math.floor(Math.random() * 100);
      const totalQuestions = Math.floor(Math.random() * 200) + 50;
      const questionsCompleted = Math.floor(totalQuestions * (completionPercentage / 100));
      const totalChildren = Math.floor(Math.random() * 20) + 5;
      const completedChildren = Math.floor(totalChildren * (completionPercentage / 100));
      const partiallyCompletedChildren = Math.floor((totalChildren - completedChildren) / 2);

      if (existingData && existingData.length > 0) {
        // Update existing record
        const { error: updateError } = await supabase
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
        const entityId = uniqueSections.indexOf(sectionName) + 1;

        const { error: insertError } = await supabase
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
  } catch (error: any) {
    console.error('Error updating section progress:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
