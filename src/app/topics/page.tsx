'use client';

export default function TopicsPage() {
  return (
    <div className="bg-white dark:bg-black min-h-screen">
      {/* Empty content area - the TopicNav is now provided by MainNavigation */}
      <div className="container mx-auto px-4 md:px-6 py-20">
        <div className="text-center text-gray-400 dark:text-gray-500 text-lg">
          <p>Select a domain to view topics</p>
        </div>
      </div>
    </div>
  );
}