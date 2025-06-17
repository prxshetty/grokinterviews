import { NextRequest, NextResponse } from 'next/server';
import supabaseServer from '@/utils/supabase-server';
import { Category, CategoryWithQuestions } from '@/types/database';

// Removed convertCategoriesToLegacyFormat (will be fully removed if not used elsewhere after refactor)
// Removed convertQuestionsToLegacyFormat (will be fully removed if not used elsewhere after refactor)

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const categoryId = url.searchParams.get('categoryId');
    const topicId = url.searchParams.get('topicId');

    console.log(`API request - topicId: ${topicId}, categoryId: ${categoryId}`);

    // Path 1: categoryId and topicId are provided
    if (categoryId && topicId) {
      try {
        console.time('category-with-questions-query');
        
        const topicIdValue: string | number = topicId;
        // Simplified topicId resolution, assuming topicId from client is numeric or a valid slug/name for direct use if needed
        // For this path, we primarily need topicId for the categories.topic_id match.
        // If topicId is 'any', it's problematic for a specific category query. Assume valid topicId.

        const { data: categoryData, error: categoryError } = await supabaseServer
          .from('categories')
          .select(`
            *,
            questions:questions(*)
          `)
          // Ensure topicIdValue is numeric if topic_id is an integer in DB.
          // Adjust if topicId can be a slug directly used in a join with topics table.
          .eq('topic_id', !isNaN(Number(topicIdValue)) ? Number(topicIdValue) : -1) // Fallback to -1 if topicId not numeric, adjust as needed
          .or(`id.eq.${!isNaN(Number(categoryId)) ? categoryId : -1},slug.eq.${categoryId},name.ilike.%${categoryId.replace(/-/g, ' ')}%`)
          .maybeSingle(); // Use maybeSingle to get one or null

        console.timeEnd('category-with-questions-query');

        if (categoryError) {
          console.error(`Error fetching category with questions from database for ${topicId}/${categoryId}:`, categoryError);
          // throw categoryError; // Or handle more gracefully
        }
        
        if (categoryData) {
          // Ensure questions is an array
          const questionsArray = Array.isArray(categoryData.questions) ? categoryData.questions : [];
          const responseData: CategoryWithQuestions = {
            ...categoryData,
            questions: questionsArray,
          };
          return NextResponse.json(responseData, {
            headers: {
              'Cache-Control': 'public, max-age=3600, s-maxage=3600',
            },
          });
        }

        return NextResponse.json(
          { error: 'Category not found', categoryId, topicId },
          { status: 404 }
        );
      } catch (error) {
        console.error(`Error loading questions for ${topicId}/${categoryId}:`, error);
        return NextResponse.json(
          { error: 'Failed to load questions', message: error instanceof Error ? error.message : String(error) },
          { status: 500 }
        );
      }
    }

    // Path 2: Only topicId is provided (and not 'any')
    if (topicId && topicId !== 'any') {
      try {
        console.time('categories-for-topic-query');
        let topicIdResolved: number;

        if (!isNaN(Number(topicId))) {
          topicIdResolved = Number(topicId);
        } else {
          const { data: topicData, error: topicError } = await supabaseServer
            .from('topics')
            .select('id')
            .or(`name.eq.${topicId},slug.eq.${topicId},domain.eq.${topicId}`) // Added slug here
            .maybeSingle();

          if (topicError || !topicData) {
            console.error(`Error fetching topic ID for ${topicId}:`, topicError);
            return NextResponse.json({ error: `Topic not found: ${topicId}` }, { status: 404 });
          }
          topicIdResolved = topicData.id;
        }

        const { data: categories, error: categoriesError } = await supabaseServer
          .from('categories')
          .select('*')
          .eq('topic_id', topicIdResolved)
          .order('name');

        console.timeEnd('categories-for-topic-query');

        if (categoriesError) {
          console.error(`Error fetching categories for topic ${topicId}:`, categoriesError);
          throw categoriesError;
        }

        return NextResponse.json(categories || [], { // Return Category[] directly
          headers: {
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
          },
        });
      } catch (error) {
        console.error(`Error processing categories for topic ${topicId}:`, error);
        return NextResponse.json(
          { error: 'Failed to load categories for topic', details: error instanceof Error ? error.message : String(error) },
          { status: 500 }
        );
      }
    }

    // Path 3: No topicId, or topicId is 'any' (fetch all topics with their categories)
    // This path remains complex and uses legacy formatting. Review separately if needed.
    // For now, we assume DatabaseService calls will specify topicId or categoryId+topicId.
    try {
      console.time('all-topics-with-categories-query');
      const { data: joinData, error: joinError } = await supabaseServer
        .from('topics')
        .select('id, domain, name, slug, categories:categories(*)') // Added slug
        .order('name');

      if (joinError) {
        console.error('Error fetching topics with categories:', joinError);
        throw joinError;
      }

      // Legacy processing for this path
      const categoriesByTopic: Record<string, any[]> = {};
      const convertCategoriesToLegacyFormat = (cats: Category[]) => cats.map(c => ({ id: c.slug || c.id.toString(), label: c.name }));


      for (const topic of joinData || []) {
        const key = topic.slug || topic.domain || topic.name; // Prioritize slug, then domain, then name
        categoriesByTopic[key] = convertCategoriesToLegacyFormat(topic.categories || []);
      }
      console.timeEnd('all-topics-with-categories-query');
      return NextResponse.json(categoriesByTopic, {
        headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
      });
    } catch (error) {
      console.error('Error processing all topics with categories request:', error);
      return NextResponse.json(
        { error: 'Failed to load all topics with categories', details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }

  } catch (error) { // Outermost catch block
    console.error('General error in categories API route:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
