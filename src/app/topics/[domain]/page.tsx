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

  // 1. Filter topics with valid section names and map to { sectionName, createdAt }
  const sectionsWithCreationTime = topicsForDomain
    .filter(topic => !!topic.section_name && topic.section_name.trim() !== '')
    .map(topic => ({
      sectionName: topic.section_name as string,
      createdAt: new Date(topic.created_at), // Ensure created_at is a Date object
    }));

  // 2. Group by sectionName and find the earliest createdAt for each section
  const sectionMap = new Map<string, Date>();
  for (const item of sectionsWithCreationTime) {
    const existingDate = sectionMap.get(item.sectionName);
    if (!existingDate || item.createdAt < existingDate) {
      sectionMap.set(item.sectionName, item.createdAt);
    }
  }

  // 3. Convert map to array of { sectionName, createdAt } and sort by createdAt
  const sortedSections = Array.from(sectionMap.entries())
    .map(([sectionName, createdAt]) => ({ sectionName, createdAt }))
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()); // Ascending

  // 4. Extract the sorted section names
  const finalSortedSectionNames = sortedSections.map(s => s.sectionName);

  if (finalSortedSectionNames.length === 0) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold capitalize">{domain}</h1>
        <p className="mt-4">No sections found for this domain.</p>
      </div>
    );
  }

  // Prepare items for the TopicCategoryGrid using the sorted section names
  const displayItems: DisplayItem[] = finalSortedSectionNames.map((sectionName) => ({
    id: slugify(sectionName), // Using slugified section name as ID
    label: sectionName,
  }));

  // Callback for when a section is selected - for future navigation to section-specific page
  // const handleSelectSection = (sectionId: string) => {
  //   // sectionId here will be the slugified name
  //   console.log(`Selected section ID (slug): ${sectionId}, Domain: ${domain}`);
  //   // Potentially navigate: router.push(`/topics/${domain}/${sectionId}`);
  // };


  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 capitalize text-center">
        Sections in {domain}
      </h1>
      
      <TopicCategoryGrid
        items={displayItems}
        level="section"
        domain={domain}
        // onSelectItem={handleSelectSection} // Removed as the grid now handles its own navigation for sections
      />
    </div>
  );
} 