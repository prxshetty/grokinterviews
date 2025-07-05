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
    <div className="bg-white dark:bg-black min-h-screen">
      <div className="container mx-auto px-4 md:px-6 py-20">
        <TopicDomainSelector />
      </div>
    </div>
  );
}