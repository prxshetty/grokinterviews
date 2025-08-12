import React from 'react';
import { Download, BarChart3, MessageCircle } from 'lucide-react';

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
       <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
         <div className="bg-gradient-to-br from-slate-100/80 to-slate-200/60 dark:from-slate-800/80 dark:to-slate-900/60 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/50 dark:border-slate-700/50 relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
           <div className="relative z-10">
             <div className="flex items-baseline gap-2 mb-2">
               <span className="text-5xl font-light text-slate-800 dark:text-slate-200">5</span>
               <MessageCircle className="w-6 h-6 text-blue-500 dark:text-blue-400" />
             </div>
             <div className="text-slate-600 dark:text-slate-400 text-sm uppercase tracking-wider mb-3">Questions per session</div>
             <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
               Carefully curated behavioral questions designed to assess your communication skills and problem-solving abilities.
             </p>
           </div>
         </div>
         
         <div className="bg-gradient-to-br from-slate-100/80 to-slate-200/60 dark:from-slate-800/80 dark:to-slate-900/60 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/50 dark:border-slate-700/50 relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent" />
           <div className="relative z-10">
             <div className="flex items-baseline gap-2 mb-2">
               <span className="text-5xl font-light text-slate-800 dark:text-slate-200">100%</span>
               <Download className="w-6 h-6 text-purple-500 dark:text-purple-400" />
             </div>
             <div className="text-slate-600 dark:text-slate-400 text-sm uppercase tracking-wider mb-3">Downloadable transcripts</div>
             <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
               All conversations are automatically transcribed and available for download to review your responses.
             </p>
           </div>
         </div>
         
         <div className="bg-gradient-to-br from-slate-100/80 to-slate-200/60 dark:from-slate-800/80 dark:to-slate-900/60 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/50 dark:border-slate-700/50 relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent" />
           <div className="relative z-10">
             <div className="flex items-baseline gap-2 mb-2">
               <span className="text-5xl font-light text-slate-800 dark:text-slate-200">360°</span>
               <BarChart3 className="w-6 h-6 text-green-500 dark:text-green-400" />
             </div>
             <div className="text-slate-600 dark:text-slate-400 text-sm uppercase tracking-wider mb-3">Comprehensive feedback report</div>
             <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
               Detailed feedback reports with actionable insights to help you improve your interview performance.
             </p>
           </div>
         </div>
       </div>
    </div>
  );
};

export default InterviewFeatures;