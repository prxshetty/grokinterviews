// This script backfills the topic_id, category_id, and domain fields in the user_activity table
// Run with: node scripts/backfill-user-activity.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backfillUserActivity() {
  console.log('Starting backfill of user_activity table...');

  try {
    // 1. Get all user_activity records that have question_id but missing topic_id, category_id, or domain
    const { data: activities, error: activitiesError } = await supabase
      .from('user_activity')
      .select('id, question_id')
      .is('topic_id', null)
      .not('question_id', 'is', null);

    if (activitiesError) {
      throw new Error(`Error fetching activities: ${activitiesError.message}`);
    }

    console.log(`Found ${activities.length} activities to update`);

    // 2. Process each activity
    let successCount = 0;
    let errorCount = 0;

    for (const activity of activities) {
      try {
        // Get question data to find category_id
        const { data: questionData, error: questionError } = await supabase
          .from('questions')
          .select('category_id')
          .eq('id', activity.question_id)
          .single();

        if (questionError) {
          console.error(`Error fetching question data for activity ${activity.id}: ${questionError.message}`);
          errorCount++;
          continue;
        }

        // Get category data to find topic_id
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('topic_id')
          .eq('id', questionData.category_id)
          .single();

        if (categoryError) {
          console.error(`Error fetching category data for activity ${activity.id}: ${categoryError.message}`);
          errorCount++;
          continue;
        }

        // Get topic data to find domain
        const { data: topicData, error: topicError } = await supabase
          .from('topics')
          .select('domain')
          .eq('id', categoryData.topic_id)
          .single();

        if (topicError) {
          console.error(`Error fetching topic data for activity ${activity.id}: ${topicError.message}`);
          errorCount++;
          continue;
        }

        // Update the activity record
        const { error: updateError } = await supabase
          .from('user_activity')
          .update({
            topic_id: categoryData.topic_id,
            category_id: questionData.category_id,
            domain: topicData.domain
          })
          .eq('id', activity.id);

        if (updateError) {
          console.error(`Error updating activity ${activity.id}: ${updateError.message}`);
          errorCount++;
        } else {
          successCount++;
          if (successCount % 10 === 0) {
            console.log(`Updated ${successCount} activities so far...`);
          }
        }
      } catch (err) {
        console.error(`Unexpected error processing activity ${activity.id}: ${err.message}`);
        errorCount++;
      }
    }

    console.log(`Backfill complete. Updated ${successCount} activities. Errors: ${errorCount}`);
  } catch (error) {
    console.error(`Backfill failed: ${error.message}`);
  }
}

// Run the backfill
backfillUserActivity();
