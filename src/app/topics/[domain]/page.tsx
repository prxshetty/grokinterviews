import Link from 'next/link';
import supabaseServer from '@/utils/supabase-server';
import { Topic } from '@/types/database'; // Assuming Topic type is available
import TopicCategoryGrid from '@/app/components/topics-ui/TopicCategoryGrid'; // Import the grid component

// Helper function to slugify section names (can be moved to a utils file)
function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-'); // Replace multiple - with single -
}

interface DomainPageProps {
  params: { domain: string };
}

// Define the structure for items to be displayed by TopicCategoryGrid
interface DisplayItem {
  id: string;
  label: string;
  // Progress will be handled by TopicCategoryGrid internally for sections
}

async function getTopicsForDomain(domainSlug: string): Promise<Topic[]> {
  const { data, error } = await supabaseServer
    .from('topics')
    .select('id, name, domain, section_name, created_at')
    .eq('domain', domainSlug)
    .order('section_name')
    .order('name');

  if (error) {
    console.error('Error fetching topics for domain:', error);
    return [];
  }
  return data || [];
}

export default async function DomainPage({ params }: DomainPageProps) {
  console.log('[DomainPage] Received params:', params);
  const domain = params.domain;
  const topicsForDomain = await getTopicsForDomain(domain);

  const uniqueSectionNames = Array.from(
    new Set(
      topicsForDomain
        .map(topic => topic.section_name)
        .filter((name): name is string => !!name && name.trim() !== '')
    )
  ).sort();

  if (uniqueSectionNames.length === 0) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold capitalize">{domain}</h1>
        <p className="mt-4">No sections found for this domain.</p>
      </div>
    );
  }

  // Prepare items for the TopicCategoryGrid
  const displayItems: DisplayItem[] = uniqueSectionNames.map((sectionName) => ({
    id: slugify(sectionName), // Using slugified section name as ID for consistency if needed by grid for navigation
    label: sectionName,
  }));

  // Callback for when a section is selected - for future navigation to section-specific page
  const handleSelectSection = (sectionId: string) => {
    // sectionId here will be the slugified name
    console.log(`Selected section ID (slug): ${sectionId}, Domain: ${domain}`);
    // Potentially navigate: router.push(`/topics/${domain}/${sectionId}`);
    // For now, TopicCategoryGrid might handle its own link generation if items have hrefs,
    // or we can enhance this handler. The grid itself creates links.
  };


  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 capitalize text-center">
        Sections in {domain}
      </h1>
      
      <TopicCategoryGrid
        items={displayItems}
        level="section"
        domain={domain}
        // onSelectItem={handleSelectSection} // The grid handles navigation via Link components internally
      />
    </div>
  );
} 