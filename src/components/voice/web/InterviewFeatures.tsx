import React from 'react';

export const InterviewFeatures: React.FC = () => {
  return (
    <div className="mb-12 font-sans">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-sans">
          Behavioral Interview Practice
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-sans">
          Practice common behavioral interview questions with our AI interviewer. 
          Get real-time feedback and improve your storytelling skills.
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl mb-3">🎯</div>
          <h3 className="font-semibold text-foreground mb-2">STAR Method Focus</h3>
          <p className="text-sm text-muted-foreground">
            Practice structuring your responses using the Situation, Task, 
            Action, Result framework for compelling answers.
          </p>
        </div>
        
        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl mb-3">💬</div>
          <h3 className="font-semibold text-foreground mb-2">Real-time Transcription</h3>
          <p className="text-sm text-muted-foreground">
            See your responses transcribed in real-time as you speak, 
            helping you track your communication clarity.
          </p>
        </div>
        
        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl mb-3">📊</div>
          <h3 className="font-semibold text-foreground mb-2">Detailed Report</h3>
          <p className="text-sm text-muted-foreground">
            Receive comprehensive feedback with scores, strengths, 
            weaknesses, and actionable improvement suggestions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InterviewFeatures;