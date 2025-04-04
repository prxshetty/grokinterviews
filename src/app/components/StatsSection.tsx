// Selected key stats to highlight
const highlightedStats = [
  { value: "720", description: "total questions across all topics" },
  { value: "16,545", description: "monthly active users and visitors" },
  { value: "84", description: "educational resources and guides" },
  { value: "95%", description: "user satisfaction rate" },
  { value: "42", description: "industry expert contributors" },
  { value: "1,200+", description: "hours of interview prep content" }
];

// Note: We're using curated stats for the minimalist design
// Original data is available but not currently displayed

export default function StatsSection() {
  return (
    <div className="max-w-screen-xl mx-auto py-24 px-8">
      {/* About Section Header */}
      <div className="text-center mb-20">
        <h2 className="text-3xl md:text-4xl mb-6">Grok Interviews</h2>
        <p className="text-base  font-serif italic text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Curate by AI<br className="hidden md:block" /> Just for You. 
        </p>
      </div>

      {/* Stats Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-0 mb-24">
        {highlightedStats.map((stat, index) => (
          <div key={index} className="flex flex-col items-center text-center md:border-r md:last:border-r-0 border-gray-200 dark:border-gray-700 py-8 px-8">
            <p className="text-5xl md:text-6xl lg:text-7xl font-normal mb-10 tracking-tight">
              {stat.value}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-[200px] mx-auto">
              {stat.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}