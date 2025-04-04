const statsData = [
  // First row stats
  { labelLine1: "TOTAL QUESTIONS", labelLine2: "ACROSS ALL TOPICS", value: "620+", row: 1 },
  { labelLine1: "UNIQUE TOPICS", labelLine2: "COVERED", value: "42", row: 1 },
  { labelLine1: "QUESTIONS PER", labelLine2: "TOPIC (AVG)", value: "15", row: 1 },
  { labelLine1: "TOPICS WITH", labelLine2: "ADVANCED CONTENT", value: "18", row: 1 },

  // Second row stats
  { labelLine1: "HARD QUESTIONS", labelLine2: "PERCENTAGE", value: "32%", row: 2 },
  { labelLine1: "MONTHLY ACTIVE", labelLine2: "USERS", value: "2.4k", row: 2 },
  { labelLine1: "INTERVIEW", labelLine2: "SUCCESS RATE", value: "78%", row: 2 },
  { labelLine1: "AVERAGE TIME", labelLine2: "TO COMPLETION", value: "6h", row: 2 },
];

export default function StatsSection() {
  // Split stats by row
  const firstRowStats = statsData.filter(stat => stat.row === 1);
  const secondRowStats = statsData.filter(stat => stat.row === 2);

  return (
    <div className="max-w-screen-xl mx-auto">
      <h3 className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 mb-8 tracking-wider">
        Learning resources at a glance
      </h3>

      {/* First Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-16">
        {firstRowStats.map((stat, index) => (
          <div key={`row1-${index}`} className="border-t border-gray-200 dark:border-gray-800 pt-6 transition-colors duration-300">
            <p className="text-xs uppercase text-gray-500 dark:text-gray-400 leading-tight mb-4">
              {stat.labelLine1}<br/>
              {stat.labelLine2 && <span>{stat.labelLine2}</span>}
            </p>
            <p className="text-3xl md:text-4xl lg:text-5xl font-bold text-black dark:text-white transition-colors duration-300">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
        {secondRowStats.map((stat, index) => (
          <div key={`row2-${index}`} className="border-t border-gray-200 dark:border-gray-800 pt-6 transition-colors duration-300">
            <p className="text-xs uppercase text-gray-500 dark:text-gray-400 leading-tight mb-4">
              {stat.labelLine1}<br/>
              {stat.labelLine2 && <span>{stat.labelLine2}</span>}
            </p>
            <p className="text-3xl md:text-4xl lg:text-5xl font-bold text-black dark:text-white transition-colors duration-300">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}