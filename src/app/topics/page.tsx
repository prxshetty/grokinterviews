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
    <div className="min-h-screen flex items-center justify-center">
      <div className="container mx-auto px-4 md:px-6 py-8">
        <TopicDomainSelector />
      </div>
    </div>
  );
}