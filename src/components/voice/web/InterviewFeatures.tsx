import React from 'react';
import { InterviewType } from './InterviewAvatar';
import CustomInterviewForm from './CustomInterviewForm';
import { InterviewModeConfig } from '@/app/api/voice/types';

interface InterviewFeaturesProps {
  selectedType?: InterviewType;
  customConfig?: InterviewModeConfig;
  onCustomConfigChange?: (config: InterviewModeConfig) => void;
  customConfigErrors?: Record<string, string>;
}

export const InterviewFeatures: React.FC<InterviewFeaturesProps> = ({
  selectedType = 'behavioral',
  customConfig = { customTopics: '', questionFormat: '', difficulty: '' },
  onCustomConfigChange,
  customConfigErrors = {}
}) => {
  const getFeatureContent = () => {
    switch (selectedType) {
      case 'behavioral':
        return {
          title: 'Behavioral Interview',
          description: 'Track your progress with comprehensive analytics and detailed performance insights',
          stats: [
            {
              number: '5',
              label: 'Questions per session',
              features: ['AI-powered questions', 'Real-time adaptation', 'Personalized experience'],
              description: 'Each interview session includes carefully curated behavioral and technical questions. Our AI conversation API generates dynamic questions based on your profile and session type.'
            },
            {
              number: '100%',
              label: 'Downloadable transcripts',
              features: ['Timed transcripts', 'Duration tracking', 'Web & phone support'],
              description: 'Complete conversation transcripts with timestamps and duration tracking. All conversations are automatically transcribed and formatted for easy review.'
            },
            {
              number: '360°',
              label: 'Comprehensive feedback report',
              features: ['Performance scores', 'Strength identification', 'Better insights'],
              description: 'Detailed performance analysis with overall scores and identified strengths. Our AI provides comprehensive feedback reports with actionable recommendations.'
            }
          ]
        };
      case 'technical':
        return {
          title: 'Technical Interview',
          description: 'Master coding challenges and technical problem-solving skills',
          stats: [
            {
              number: '8',
              label: 'Coding challenges',
              features: ['Algorithm problems', 'Data structures', 'Code optimization'],
              description: 'Comprehensive coding challenges covering algorithms, data structures, and system design. Practice with real interview questions from top tech companies.'
            },
            {
              number: '100%',
              label: 'Code review & feedback',
              features: ['Syntax analysis', 'Performance review', 'Best practices'],
              description: 'Detailed code analysis with performance metrics and best practice recommendations. Get insights on code quality, efficiency, and maintainability.'
            },
            {
              number: '24/7',
              label: 'Practice environment',
              features: ['Multiple languages', 'IDE integration', 'Real-time testing'],
              description: 'Practice coding in a realistic environment with support for multiple programming languages and real-time code execution and testing.'
            }
          ]
        };
      case 'system-design':
        return {
          title: 'System Design Interview',
          description: 'Learn to design scalable systems and architecture patterns',
          stats: [
            {
              number: '6',
              label: 'Design scenarios',
              features: ['Scalability focus', 'Real-world problems', 'Architecture patterns'],
              description: 'Practice designing large-scale systems with focus on scalability, reliability, and performance. Learn common architecture patterns and trade-offs.'
            },
            {
              number: '360°',
              label: 'Architecture review',
              features: ['Component analysis', 'Scalability assessment', 'Best practices'],
              description: 'Comprehensive review of your system design with focus on component interaction, scalability bottlenecks, and industry best practices.'
            },
            {
              number: '∞',
              label: 'Iterative improvement',
              features: ['Design refinement', 'Trade-off analysis', 'Performance optimization'],
              description: 'Continuous improvement process with iterative design refinement, trade-off analysis, and performance optimization recommendations.'
            }
          ]
        };
      case 'custom':
        return {
          title: 'Custom Interview',
          description: 'Tailor your interview practice to specific topics and requirements',
          stats: [
            {
              number: '∞',
              label: 'Custom topics',
              features: ['Your topics', 'Flexible format', 'Adaptive difficulty'],
              description: 'Practice with topics of your choice. Define custom areas of focus, question formats, and difficulty levels tailored to your specific needs.'
            },
            {
              number: '100%',
              label: 'Personalized feedback',
              features: ['Topic-specific insights', 'Custom metrics', 'Targeted improvement'],
              description: 'Receive feedback specifically tailored to your chosen topics and format. Get insights and recommendations based on your custom interview configuration.'
            },
            {
              number: '24/7',
              label: 'Flexible scheduling',
              features: ['On-demand practice', 'Custom duration', 'Adaptive sessions'],
              description: 'Practice anytime with flexible session duration and adaptive questioning based on your progress and performance in custom topics.'
            }
          ]
        };
      default:
        return {
          title: 'Behavioral Interview',
          description: 'Track your progress with comprehensive analytics and detailed performance insights',
          stats: []
        };
    }
  };

  const content = getFeatureContent();

  return (
    <div className="mb-16 font-sans">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-light text-foreground mb-6 tracking-tight">
          {content.title}
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
          {content.description}
        </p>
      </div>
      
      {/* Layout: Statistics on left, Custom Form on right for custom type */}
      <div className={`${selectedType === 'custom' ? 'grid lg:grid-cols-2 gap-12' : ''} max-w-6xl mx-auto`}>
        {/* Statistics Cards */}
        <div className={`${selectedType === 'custom' ? '' : 'grid md:grid-cols-3 gap-8'}`}>
          {selectedType === 'custom' ? (
            <div className="space-y-8">
              {content.stats.map((stat, index) => (
                <div key={index} className="bg-gradient-to-br from-slate-100/80 to-slate-200/60 dark:from-slate-800/80 dark:to-slate-900/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
                  <div className="relative z-10">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl font-light text-slate-800 dark:text-slate-200">{stat.number}</div>
                      <div className="flex-1">
                        <div className="text-slate-600 dark:text-slate-400 text-sm uppercase tracking-wider mb-2">{stat.label}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {stat.features.map((feature, featureIndex) => (
                              <div key={featureIndex} className="flex items-center gap-1">
                                <span className="text-green-500 text-xs">✓</span>
                                <span className="text-xs">{feature}</span>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs mt-2">{stat.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            content.stats.map((stat, index) => (
              <div key={index} className="bg-gradient-to-br from-slate-100/80 to-slate-200/60 dark:from-slate-800/80 dark:to-slate-900/60 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/50 dark:border-slate-700/50 relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${
                  index === 0 ? 'from-blue-500/5' : 
                  index === 1 ? 'from-purple-500/5' : 
                  'from-green-500/5'
                } to-transparent`} />
                <div className="relative z-10 text-center">
                  <div className="text-5xl font-light text-slate-800 dark:text-slate-200 mb-3">{stat.number}</div>
                  <div className="text-slate-600 dark:text-slate-400 text-sm uppercase tracking-wider mb-4">{stat.label}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed space-y-3">
                    <div className="space-y-2">
                      {stat.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center justify-center gap-2">
                          <span className="text-green-500 w-4 text-center">✓</span>
                          <span className="w-32 text-left">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-center mt-4 text-xs">{stat.description}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Custom Interview Form - Only show for custom type */}
        {selectedType === 'custom' && onCustomConfigChange && (
          <div className="bg-gradient-to-br from-slate-100/80 to-slate-200/60 dark:from-slate-800/80 dark:to-slate-900/60 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/50 dark:border-slate-700/50">
            <h3 className="text-xl font-semibold text-foreground mb-6">Configure Your Custom Interview</h3>
            <div className="space-y-6">
              <CustomInterviewForm
                config={customConfig}
                onConfigChange={onCustomConfigChange}
                errors={customConfigErrors}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewFeatures;