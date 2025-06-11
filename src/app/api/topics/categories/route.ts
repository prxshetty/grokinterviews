import { NextRequest, NextResponse } from 'next/server';
import { GET as dbGet } from './db-route';
import supabaseServer from '@/utils/supabase-server';

// Define type for category items
type CategoryItem = {
  id: string;
  label: string;
};

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const categoryId = url.searchParams.get('categoryId');
  const getTopicOnly = url.searchParams.get('getTopicOnly');

  // Handle the simple case: just return topic_id for a specific category_id
  if (categoryId && getTopicOnly === 'true') {
    try {
      const { data: category, error } = await supabaseServer
        .from('categories')
        .select('topic_id')
        .eq('id', categoryId)
        .single();

      if (error || !category) {
        return NextResponse.json(
          { error: `Category ${categoryId} not found` },
          { status: 404 }
        );
      }

      return NextResponse.json({
        categoryId: parseInt(categoryId),
        topicId: category.topic_id,
        success: true
      });
    } catch (error) {
      console.error(`Error fetching topic for category ${categoryId}:`, error);
      return NextResponse.json(
        { error: 'Failed to fetch category topic' },
        { status: 500 }
      );
    }
  }

  // Forward all other requests to the database route
  return dbGet(request);
}
