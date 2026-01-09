import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import TopicDomainSelector from '@/components/topics-ui/TopicDomainSelector';

export default async function TopicsPage() {
  const supabase = await createClient();

  // Check if user is authenticated
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/signin');
  }

  return (
    <div className="min-h-screen pt-8 sm:pt-12 pb-8">
      <TopicDomainSelector />
    </div>
  );
}