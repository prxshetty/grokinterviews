"use client";

interface ActivityProgressProps {
  questionsCompleted?: number;
  totalQuestions?: number;
  timeSpent?: number;
  domainsSolved?: number;
  totalDomains?: number;
}

export default function ActivityProgress({
  questionsCompleted = 24,
  totalQuestions = 120,
  timeSpent = 8.5,
  domainsSolved = 3,
  totalDomains = 5
}: ActivityProgressProps) {
  // Calculate percentages
  const questionsPercentage = Math.round((questionsCompleted / totalQuestions) * 100);
  const domainsPercentage = Math.round((domainsSolved / totalDomains) * 100);

  // For demo purposes, calculate a total progress percentage
  const totalProgress = Math.round((questionsPercentage * 0.4) + (domainsPercentage * 0.6));

  return (
    <div className="bg-white dark:bg-black p-6 w-full">
      {/* Status header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          {/* <h2 className="text-gray-800 dark:text-gray-200 font-medium">Status.</h2> */}
          <p className="text-gray-400 dark:text-gray-500 text-sm">Your learning progress</p>
        </div>
        <div className="flex space-x-0.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-1 h-3 bg-gray-800 dark:bg-gray-200"></div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main percentage column */}
        <div className="flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div className="text-8xl font-light text-gray-800 dark:text-gray-100">
              {totalProgress}<span className="text-6xl">%</span>
            </div>
            <div className="text-gray-800 dark:text-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </div>
          </div>

          {/* Progress breakdown */}
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            <span className="mr-4">{questionsPercentage}% Questions</span>
            <span>{domainsPercentage}% Domains</span>
          </div>
        </div>

        {/* Middle column - Progress status and questions */}
        <div className="flex flex-col space-y-4">
          <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-lg">
            <h3 className="font-medium text-gray-800 dark:text-gray-200">Progress status</h3>
            <div className="text-3xl font-light text-gray-800 dark:text-gray-200 mt-1">
              {questionsPercentage}<span className="text-xl">%</span>
            </div>
          </div>

          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg flex items-center justify-between">
            <div className="text-gray-800 dark:text-gray-200">{questionsCompleted} questions</div>
            <div className="text-gray-500 dark:text-gray-400">{totalQuestions} total</div>
          </div>
        </div>

        {/* Right column - Time and domains */}
        <div className="flex flex-col space-y-4">
          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
            <div className="flex items-center mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800 dark:text-gray-200 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="font-medium text-gray-800 dark:text-gray-200">Time spent</h3>
            </div>
            <div className="text-3xl font-light text-gray-800 dark:text-gray-200">
              {timeSpent}h
            </div>
          </div>

          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
            <div className="flex justify-between">
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800 dark:text-gray-200 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <div className="text-3xl font-light text-gray-800 dark:text-gray-200">
                  {domainsPercentage}<span className="text-xl">%</span>
                </div>
              </div>
              <div className="self-end text-right">
                <div className="text-gray-500 dark:text-gray-400 text-sm">{domainsSolved} domains</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
