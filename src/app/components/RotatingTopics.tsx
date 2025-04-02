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
  const itemHeight = 40;
  const visibleItems = 10;
  const containerHeight = itemHeight * visibleItems;
  const totalContentHeight = topics.length * itemHeight;

  return (
    // Container with perspective and clipping
    <div
      className="relative flex justify-center w-full bg-white dark:bg-black overflow-hidden"
      style={{
        height: `${containerHeight}px`,
        perspective: '500px', // Increased perspective slightly
        transformStyle: 'preserve-3d'
      }}
    >
      {/* Animated scrolling list */}
      <div
        className="absolute animate-scroll-up"
        style={{
            '--total-height': `${totalContentHeight}px`,
            '--item-height': `${itemHeight}px`,
            transformStyle: 'preserve-3d' // Added preserve-3d here too
          } as React.CSSProperties
        }
      >
        {topics.map((topic, index) => (
          <div
            key={`${topic}-${index}`} // Need unique keys due to repetition
            className="text-black dark:text-white text-center text-xl md:text-2xl font-medium" // Increased text size
            style={{
              height: `${itemHeight}px`,
              lineHeight: `${itemHeight}px`, // Vertically center text
              transform: 'rotateX(-10deg)' // Added rotateX tilt to each item
            }}
          >
            {topic}
          </div>
        ))}
      </div>
      {/* Optional: Add top/bottom fades */}
       <div className="absolute top-0 left-0 w-full h-1/4 bg-gradient-to-b from-white dark:from-black to-transparent pointer-events-none z-10"></div> {/* Added z-10 */}
       <div className="absolute bottom-0 left-0 w-full h-1/4 bg-gradient-to-t from-white dark:from-black to-transparent pointer-events-none z-10"></div> {/* Added z-10 */}
    </div>
  );
};

export default RotatingTopics; 