import { NextRequest, NextResponse } from 'next/server';
import supabaseServer from '@/utils/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const questionId = url.searchParams.get('questionId');

    if (!questionId) {
      return NextResponse.json(
        { error: 'Question ID parameter is required' },
        { status: 400 }
      );
    }

    console.log(`API - Fetching answer for question ID: ${questionId}`);

    // Query for the question data (without answer - it will be generated)
    const { data: question, error } = await supabaseServer
      .from('questions')
      .select(`
        id,
        question_text
      `)
      .eq('id', questionId)
      .single();

    if (error) {
      console.error('Error fetching question data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch question data' },
        { status: 500 }
      );
    }

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Transform the data to match expected frontend format
    const transformedQuestion = {
      id: question.id,
      question_text: question.question_text,
      answer_text: null
    };

    // Return the question with needs_generation flag
    console.log(`Question ${questionId} found - returning for generation`);
    return NextResponse.json({
      id: transformedQuestion.id,
      question_text: transformedQuestion.question_text,
      answer_text: null,
      needs_generation: true
    });
    
  } catch (error: any) {
    console.error('Error in question answer API route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 