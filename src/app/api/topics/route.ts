import { NextResponse } from 'next/server';
import { getTopics } from '@/app/lib/db';

export async function GET() {
  try {
    const topics = await getTopics();
    return NextResponse.json(topics);
  } catch (error) {
    console.error('Error fetching topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    );
  }
} 