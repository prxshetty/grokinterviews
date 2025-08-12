import React from 'react';
import { Download, BarChart3 } from 'lucide-react';

export const InterviewFeatures: React.FC = () => {
  return (
    <div className="mb-16 font-sans">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-light text-foreground mb-6 tracking-tight">
          Interview Practice Statistics
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
          Track your progress with comprehensive analytics and detailed performance insights
        </p>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-8">
        <div className="bg-gradient-to-br from-slate-100/80 to-slate-200/60 dark:from-slate-800/80 dark:to-slate-900/60 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/50 dark:border-slate-700/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
          <div className="relative z-10">
            <div className="text-5xl font-light mb-2 text-slate-800 dark:text-slate-200">5</div>
            <div className="text-slate-600 dark:text-slate-400 text-sm uppercase tracking-wider">Questions per session</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-slate-100/80 to-slate-200/60 dark:from-slate-800/80 dark:to-slate-900/60 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/50 dark:border-slate-700/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent" />
          <div className="relative z-10">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-5xl font-light text-slate-800 dark:text-slate-200">100%</span>
              <Download className="w-6 h-6 text-purple-500 dark:text-purple-400" />
            </div>
            <div className="text-slate-600 dark:text-slate-400 text-sm uppercase tracking-wider">Downloadable transcripts</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-slate-100/80 to-slate-200/60 dark:from-slate-800/80 dark:to-slate-900/60 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/50 dark:border-slate-700/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent" />
          <div className="relative z-10">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-5xl font-light text-slate-800 dark:text-slate-200">360°</span>
              <BarChart3 className="w-6 h-6 text-green-500 dark:text-green-400" />
            </div>
            <div className="text-slate-600 dark:text-slate-400 text-sm uppercase tracking-wider">Comprehensive feedback report</div>
          </div>
        </div>
      </div>
      
      {/* Description Text */}
      <div className="text-center max-w-4xl mx-auto">
        <p className="text-base text-muted-foreground leading-relaxed">
          Each interview session includes 5 carefully curated behavioral questions designed to assess your communication skills and problem-solving abilities. 
          All conversations are automatically transcribed and available for download, while our AI provides detailed feedback reports with actionable insights 
          to help you improve your interview performance.
        </p>
      </div>
    </div>
  );
};

export default InterviewFeatures;