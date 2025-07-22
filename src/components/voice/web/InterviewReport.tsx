import React from 'react';
import { CheckCircle, TrendingUp, Target, Lightbulb } from 'lucide-react';

interface InterviewReportProps {
  report: {
    overall_score: number;
    summary?: string;
    detailed_feedback?: string;
    strengths?: string[];
    weaknesses?: string[];
    recommendations?: string[];
    improvements?: string[];
  };
}

export default function InterviewReport({ report }: InterviewReportProps) {
  // Add debug logging to help identify data structure issues
  console.log('InterviewReport received data:', report);
  
  // Add null/undefined checks
  if (!report) {
    console.warn('InterviewReport: No report data provided');
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-4xl mx-auto">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">No report data available</p>
        </div>
      </div>
    );
  }

  // Validate required fields
  if (typeof report.overall_score !== 'number') {
    console.warn('InterviewReport: Invalid or missing overall_score:', report.overall_score);
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-4xl mx-auto">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Invalid report data structure</p>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/20';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center ${getScoreBgColor(report.overall_score)}`}>
            <span className={`text-3xl font-bold ${getScoreColor(report.overall_score)}`}>
              {report.overall_score}/10
            </span>
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Interview Assessment Complete
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Here's your detailed performance analysis
        </p>
      </div>

      {/* Summary */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <CheckCircle className="w-6 h-6 mr-2 text-blue-600" />
          Summary
        </h3>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {report.summary || report.detailed_feedback || 'No detailed feedback available for this interview.'}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Strengths */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-green-600" />
            Strengths
          </h3>
          <div className="space-y-3">
            {(() => {
              const strengthsList = report.strengths || [];
              if (strengthsList.length === 0) {
                return <p className="text-gray-500 dark:text-gray-400">No specific strengths identified in this interview.</p>;
              }
              return strengthsList.map((strength, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700 dark:text-gray-300">{strength}</p>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Areas for Improvement */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Target className="w-6 h-6 mr-2 text-orange-600" />
            Areas for Improvement
          </h3>
          <div className="space-y-3">
            {(() => {
              const weaknessesList = report.weaknesses || [];
              if (weaknessesList.length === 0) {
                return <p className="text-gray-500 dark:text-gray-400">No specific areas for improvement identified.</p>;
              }
              return weaknessesList.map((weakness, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700 dark:text-gray-300">{weakness}</p>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Lightbulb className="w-6 h-6 mr-2 text-purple-600" />
          Recommendations
        </h3>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6">
          <div className="space-y-3">
            {(() => {
              const recommendationsList = report.recommendations || report.improvements || [];
              if (recommendationsList.length === 0) {
                return <p className="text-gray-500 dark:text-gray-400">No specific recommendations available for this interview.</p>;
              }
              return recommendationsList.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700 dark:text-gray-300">{recommendation}</p>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}