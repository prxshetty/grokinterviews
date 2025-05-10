import Link from 'next/link';
import supabaseServer from '@/utils/supabase-server';
import { Category, Topic } from '@/types/database';

interface SectionPageProps {
  params: { 
    domain: string; 
    section: string; // This is the slug of a parent Topic record
  };
}

async function getSectionDetails(domainSlug: string, sectionTopicId: string): Promise<{parentTopic: Topic | null, categories: Category[]}> {
  // 1. Get the parent Topic by domain and its id (which is sectionTopicId)
  const { data: topicData, error: topicError } = await supabaseServer
    .from('topics')
    .select('id, name, domain, section_name, created_at') // Select specific, known-to-exist fields
    .eq('domain', domainSlug)
    .eq('id', sectionTopicId) // Changed from 'slug' to 'id'
    .single();

  if (topicError || !topicData) {
    console.error('Error fetching parent topic:', topicError);
    return { parentTopic: null, categories: [] };
  }
  const parentTopic = topicData as Topic;

  // 2. Get categories for this parent Topic
  const { data: categoriesData, error: categoriesError } = await supabaseServer
    .from('categories')
    .select('*') // Select all fields for the Category type
    .eq('topic_id', parentTopic.id)
    .order('name'); // Or by 'order' if that field is used and populated

  if (categoriesError) {
    console.error('Error fetching categories for topic:', categoriesError);
    return { parentTopic, categories: [] };
  }
  return { parentTopic, categories: (categoriesData as Category[]) || [] };
}

export default async function SectionPage({ params }: SectionPageProps) {
  console.log('[SectionPage] Received params:', params);
  const { domain, section } = params;
  const { parentTopic, categories } = await getSectionDetails(domain, section);

  if (!parentTopic) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold capitalize">Section Not Found</h1>
        <p className="mt-4">The section '({section})' under domain '({domain})' could not be found.</p>
        <Link href={`/topics/${domain}`} className="text-blue-600 hover:underline mt-4 inline-block">Back to {domain} topics</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <nav aria-label="breadcrumb" className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        <ol className="list-none p-0 inline-flex">
          <li className="flex items-center">
            <Link href="/topics" className="hover:underline">Topics</Link>
          </li>
          <li className="flex items-center mx-2">
            <span>/</span>
          </li>
          <li className="flex items-center">
            <Link href={`/topics/${domain}`} className="hover:underline capitalize">{domain}</Link>
          </li>
          <li className="flex items-center mx-2">
            <span>/</span>
          </li>
          <li className="font-medium capitalize">
            {parentTopic.name} (Section)
          </li>
        </ol>
      </nav>

      <h1 className="text-3xl font-bold mb-2 capitalize">{parentTopic.name}</h1>
      {parentTopic.description && <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">{parentTopic.description}</p>}

      {categories.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">No specific topics (categories) found in this section.</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <li key={category.id} className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow duration-300 ease-in-out">
              <Link href={`/topics/${domain}/${section}/${category.slug}`} className="block">
                <h2 className="text-xl font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400 mb-2 capitalize">{category.name}</h2>
                {category.description && <p className="text-gray-600 dark:text-gray-400 text-sm">{category.description}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 