import React from 'react';

const topics = [
  'Data Analysis',
  'Data Visualization',
  'Pandas & NumPy',
  'Machine Learning',
  'Deep Learning',
  'TensorFlow & PyTorch',
  'Natural Language Processing',
  'Computer Vision',
  'React & Next.js',
  'Node.js & APIs',
  'Tailwind CSS',
  'JavaScript & TypeScript',
  'Cloud Deployment',
  'SQL & NoSQL Databases',
  'Big Data Technologies',
  // Repeat topics for seamless looping effect
  'Data Analysis',
  'Data Visualization',
  'Pandas & NumPy',
  'Machine Learning',
  'Deep Learning',
  'TensorFlow & PyTorch',
  'Natural Language Processing',
  'Computer Vision',
  'React & Next.js',
  'Node.js & APIs',
  'Tailwind CSS',
  'JavaScript & TypeScript',
  'Cloud Deployment',
  'SQL & NoSQL Databases',
  'Big Data Technologies',
];

const RotatingTopics: React.FC = () => {
  const itemHeight = 40; // Approx height of each item in px (adjust as needed)
  const visibleItems = 7; // Number of items visible at once (adjust as needed)
  const containerHeight = itemHeight * visibleItems;
  const totalContentHeight = topics.length * itemHeight;

  return (
    // Container with perspective and clipping
    <div
      className="relative flex justify-center w-full bg-white dark:bg-black overflow-hidden" // Added dark:bg-black
      style={{ height: `${containerHeight}px`, perspective: '400px' }}
    >
      {/* Animated scrolling list */}
      <div
        className="absolute animate-scroll-up"
        style={
          {
            '--total-height': `${totalContentHeight}px`,
            '--item-height': `${itemHeight}px`,
          } as React.CSSProperties
        }
      >
        {topics.map((topic, index) => (
          <div
            key={`${topic}-${index}`} // Need unique keys due to repetition
            className="text-black dark:text-white text-center text-lg md:text-xl font-medium" // Added dark:text-white
            style={{
              height: `${itemHeight}px`,
              lineHeight: `${itemHeight}px`, // Vertically center text
            }}
          >
            {topic}
          </div>
        ))}
      </div>
      {/* Optional: Add top/bottom fades */}
       <div className="absolute top-0 left-0 w-full h-1/4 bg-gradient-to-b from-white dark:from-black to-transparent pointer-events-none"></div> {/* Added dark:from-black */}
       <div className="absolute bottom-0 left-0 w-full h-1/4 bg-gradient-to-t from-white dark:from-black to-transparent pointer-events-none"></div> {/* Added dark:from-black */}
    </div>
  );
};

export default RotatingTopics; 