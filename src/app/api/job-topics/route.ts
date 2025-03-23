import { NextResponse } from 'next/server';

// Define job role to topics mapping
const jobRoleTopics: Record<string, string[]> = {
  'Data Scientist': [
    'machine learning',
    'statistics',
    'python',
    'data visualization',
    'deep learning',
    'probability',
    'regression'
  ],
  'Data Engineer': [
    'sql',
    'data pipelines',
    'etl',
    'database design',
    'big data',
    'data warehouse',
    'spark'
  ],
  'AI Engineer': [
    'neural networks',
    'nlp',
    'computer vision',
    'reinforcement learning', 
    'deep learning',
    'tensorflow',
    'pytorch'
  ],
  'Machine Learning Engineer': [
    'machine learning',
    'model deployment',
    'mlops',
    'algorithms',
    'feature engineering',
    'docker',
    'kubernetes'
  ],
  'Business Intelligence Analyst': [
    'data visualization',
    'sql',
    'tableau',
    'power bi',
    'reporting',
    'excel',
    'data modeling'
  ]
};

// List of all predefined ML topics
const predefinedTopics = [
  'neural networks',
  'supervised learning',
  'unsupervised learning',
  'reinforcement learning',
  'nlp',
  'computer vision',
  'deep learning',
  'machine learning',
  'statistics',
  'probability',
  'regression',
  'classification',
  'clustering',
  'dimensionality reduction',
  'feature engineering',
  'model evaluation',
  'time series',
  'decision trees',
  'random forests',
  'boosting algorithms',
  'recommender systems',
  'bayesian methods'
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobRole = searchParams.get('role');
  
  if (jobRole) {
    // Return topics for specific job role
    const topics = jobRoleTopics[jobRole] || [];
    return NextResponse.json({ topics });
  }
  
  // Return all job roles and topics
  return NextResponse.json({
    jobRoles: Object.keys(jobRoleTopics),
    predefinedTopics,
    jobRoleTopics
  });
} 