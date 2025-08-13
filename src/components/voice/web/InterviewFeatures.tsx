import React from 'react';

export const InterviewFeatures: React.FC = () => {
  return (
    <div className="mb-16 font-sans">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-light text-foreground mb-6 tracking-tight">
          Behavioral Interview
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
          Track your progress with comprehensive analytics and detailed performance insights
        </p>
      </div>
      
      {/* Statistics Cards */}
       <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-slate-100/80 to-slate-200/60 dark:from-slate-800/80 dark:to-slate-900/60 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/50 dark:border-slate-700/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
            <div className="relative z-10 text-center">
              <div className="text-5xl font-light text-slate-800 dark:text-slate-200 mb-3">5</div>
              <div className="text-slate-600 dark:text-slate-400 text-sm uppercase tracking-wider mb-4">Questions per session</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed space-y-3">
                 <div className="space-y-2">
                   <div className="flex items-center justify-center gap-2">
                     <span className="text-green-500 w-4 text-center">✓</span>
                     <span className="w-32 text-left">AI-powered questions</span>
                   </div>
                   <div className="flex items-center justify-center gap-2">
                     <span className="text-green-500 w-4 text-center">✓</span>
                     <span className="w-32 text-left">Real-time adaptation</span>
                   </div>
                   <div className="flex items-center justify-center gap-2">
                     <span className="text-green-500 w-4 text-center">✓</span>
                     <span className="w-32 text-left">Personalized experience</span>
                   </div>
                 </div>
                 <p className="text-center mt-4 text-xs">
                   Each interview session includes carefully curated behavioral and technical questions. Our AI conversation API generates dynamic questions based on your profile and session type.
                 </p>
               </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-slate-100/80 to-slate-200/60 dark:from-slate-800/80 dark:to-slate-900/60 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/50 dark:border-slate-700/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent" />
            <div className="relative z-10 text-center">
              <div className="text-5xl font-light text-slate-800 dark:text-slate-200 mb-3">100%</div>
              <div className="text-slate-600 dark:text-slate-400 text-sm uppercase tracking-wider mb-4">Downloadable transcripts</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed space-y-3">
                 <div className="space-y-2">
                   <div className="flex items-center justify-center gap-2">
                     <span className="text-green-500 w-4 text-center">✓</span>
                     <span className="w-32 text-left">Timed transcripts</span>
                   </div>
                   <div className="flex items-center justify-center gap-2">
                     <span className="text-green-500 w-4 text-center">✓</span>
                     <span className="w-32 text-left">Duration tracking</span>
                   </div>
                   <div className="flex items-center justify-center gap-2">
                     <span className="text-green-500 w-4 text-center">✓</span>
                     <span className="w-32 text-left">Web & phone support</span>
                   </div>
                 </div>
                 <p className="text-center mt-4 text-xs">
                   Complete conversation transcripts with timestamps and duration tracking. All conversations are automatically transcribed and formatted for easy review.
                 </p>
               </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-slate-100/80 to-slate-200/60 dark:from-slate-800/80 dark:to-slate-900/60 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/50 dark:border-slate-700/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent" />
            <div className="relative z-10 text-center">
              <div className="text-5xl font-light text-slate-800 dark:text-slate-200 mb-3">360°</div>
              <div className="text-slate-600 dark:text-slate-400 text-sm uppercase tracking-wider mb-4">Comprehensive feedback report</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed space-y-3">
                 <div className="space-y-2">
                   <div className="flex items-center justify-center gap-2">
                     <span className="text-green-500 w-4 text-center">✓</span>
                     <span className="w-32 text-left">Performance scores</span>
                   </div>
                   <div className="flex items-center justify-center gap-2">
                     <span className="text-green-500 w-4 text-center">✓</span>
                     <span className="w-32 text-left">Strength identification</span>
                   </div>
                   <div className="flex items-center justify-center gap-2">
                     <span className="text-green-500 w-4 text-center">✓</span>
                     <span className="w-32 text-left">Better insights</span>
                   </div>
                 </div>
                 <p className="text-center mt-4 text-xs">
                   Detailed performance analysis with overall scores and identified strengths. Our AI provides comprehensive feedback reports with actionable recommendations.
                 </p>
               </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default InterviewFeatures;