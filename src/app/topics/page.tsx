import TopicDomainSelector from '@/components/topics-ui/TopicDomainSelector';

export default async function TopicsPage() {
  return (
    <div className="min-h-screen pt-8 sm:pt-12 pb-8">
      <TopicDomainSelector />
    </div>
  );
}