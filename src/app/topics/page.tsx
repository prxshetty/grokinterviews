import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import TopicDomainSelector from '@/components/topics-ui/TopicDomainSelector';
import { cookies } from 'next/headers';

export default async function TopicsPage() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const devBypass = cookieStore.get('dev-bypass');

  // Check if user is authenticated
  const { data: { user }, error } = await supabase.auth.getUser();

  // Allow access if user is authenticated OR if we have valid bypass in dev
  const isBypassed = process.env.NODE_ENV === 'development' && devBypass?.value === 'true';

  if ((error || !user) && !isBypassed) {
    redirect('/signin');
  }

  return (
    <div className="min-h-screen pt-8 sm:pt-12 pb-8">
      <TopicDomainSelector />
    </div>
  );
}