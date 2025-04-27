// Redirecting from /topics to /topics/ml (default domain)
import { redirect } from 'next/navigation';

export default function TopicsPage() {
  redirect('/topics/ml');
}