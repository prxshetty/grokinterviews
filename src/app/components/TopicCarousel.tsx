'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const quizTopics = [
  { id: '01', shade: 'bg-black opacity-10 dark:bg-white dark:opacity-10', title: 'JavaScript Basics', subtitle: 'Core language fundamentals' },
  { id: '02', shade: 'bg-black opacity-20 dark:bg-white dark:opacity-20', title: 'React Essentials', subtitle: 'Component patterns & hooks' },
  { id: '03', shade: 'bg-black opacity-30 dark:bg-white dark:opacity-30', title: 'CSS & Styling', subtitle: 'Modern layout techniques' },
  { id: '04', shade: 'bg-black opacity-40 dark:bg-white dark:opacity-40', title: 'System Design', subtitle: 'Architecture fundamentals' },
  { id: '05', shade: 'bg-black opacity-50 dark:bg-white dark:opacity-50', title: 'Data Structures', subtitle: 'Algorithms & problem solving' },
  { id: '06', shade: 'bg-black opacity-60 dark:bg-white dark:opacity-60', title: 'Web Performance', subtitle: 'Optimization strategies' },
  { id: '07', shade: 'bg-black opacity-70 dark:bg-white dark:opacity-70', title: 'Backend Dev', subtitle: 'API design & implementation' },
  { id: '08', shade: 'bg-black opacity-80 dark:bg-white dark:opacity-80', title: 'GraphQL', subtitle: 'Modern API development' },
  { id: '09', shade: 'bg-black opacity-90 dark:bg-white dark:opacity-90', title: 'State Management', subtitle: 'Managing application state' },
  { id: '10', shade: 'bg-black opacity-90 dark:bg-white dark:opacity-90', title: 'DevOps', subtitle: 'CI/CD and deployment' },
];

export default function TopicCarousel() {
  const [activeIndex, setActiveIndex] = useState(4); // Center card starts as active
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if we're on a mobile device for responsive adjustments
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Calculate visible topics so it looks like more cards off-screen
  const visibleTopics = quizTopics;

  return (
    <div className="py-16">
      {/* Container for all cards with slight curve */}
      <div className="relative">
        {/* Card container with slight arc - no scrolling */}
        <div className="flex justify-center items-center py-12 relative overflow-hidden">
          {/* Subtle arc background indicator */}
          <div className="absolute bottom-0 left-1/2 w-[90%] h-[220px] border-t-2 border-gray-200 dark:border-gray-800 rounded-t-full transform -translate-x-1/2 opacity-50"></div>
          
          {/* All cards displayed at once in a gentle arc */}
          <div className="flex justify-center items-end space-x-2 md:space-x-3 px-2 md:px-4 max-w-full overflow-visible">
            {visibleTopics.map((topic, index) => {
              // Calculate slight vertical and rotation offsets for gentle curve
              const totalCards = visibleTopics.length;
              const midPoint = Math.floor(totalCards / 2);
              const distanceFromMiddle = index - midPoint;
              const isActive = index === activeIndex;
              
              // Subtle arc effect calculations
              // Cards further from center are positioned lower with subtle rotation
              const verticalOffset = Math.abs(distanceFromMiddle) * (isMobile ? 8 : 10); // px lower for cards away from center
              const rotationDeg = distanceFromMiddle * (isMobile ? 3 : 4); // subtle rotation
              const scale = isActive ? 1 : (1 - Math.abs(distanceFromMiddle) * 0.05); // subtle scaling
              
              // Card visibility logic - hide cards that would be way off screen
              const isVisible = Math.abs(distanceFromMiddle) <= 5; // Show only cards close enough to center
              
              if (!isVisible) return null;
              
              return (
                <div
                  key={topic.id}
                  className={`w-[168px] md:w-[216px] h-[264px] md:h-[312px] rounded-lg ${topic.shade} text-white dark:text-black cursor-pointer transition-all duration-300 transform-gpu select-none flex-shrink-0 hover:-translate-y-3 backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90 border border-white/10 dark:border-black/10 shadow-[0_8px_16px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_16px_rgba(255,255,255,0.1)]`}
                  style={{ 
                    transform: `translateY(${verticalOffset}px) rotate(${rotationDeg}deg) scale(${scale})`,
                    opacity: isActive ? 1 : (1 - Math.abs(distanceFromMiddle) * 0.1),
                    backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                  }}
                  onClick={() => setActiveIndex(index)}
                >
                  <div className="p-5 md:p-7 h-full flex flex-col justify-between" style={{ transform: `rotate(${-rotationDeg}deg)` }}>
                    {/* Top section with number */}
                    <div className="text-2xl md:text-4xl font-bold opacity-80 font-sans">{topic.id}</div>
                    
                    {/* Middle section with titles */}
                    <div className="mt-auto">
                      <h3 className="text-base md:text-xl font-bold mb-1 md:mb-2 font-sans tracking-tight">{topic.title}</h3>
                      <p className="text-xs md:text-sm opacity-80 font-sans line-clamp-2">{topic.subtitle}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* View All Quizzes Button */}
      <div className="text-center mt-12">
        <Link 
          href="/topics" 
          className="px-4 py-2 border border-black/20 dark:border-white/20 text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-md inline-flex items-center text-sm"
        >
          Get notified for new quizzes
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>
      {/* Companies You Can Join Carousel */}
      <div className="mt-24 mb-16">
        <h2 className="text-xl md:text-2xl font-semibold mb-8 text-center tracking-tight">Companies You Can Join With These Skills</h2>
        <div className="flex items-center justify-center gap-8 md:gap-12 py-6 overflow-hidden">
          <div className="flex animate-marquee">
            <div className="flex space-x-12 md:space-x-16 items-center">
              <div className="flex flex-col items-center justify-center w-20 md:w-24 opacity-80 hover:opacity-100 transition-opacity">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-black dark:text-white" viewBox="0 0 424 432">
                    <path fill="currentColor" d="M214 186v-1h201q3 12 3 36q0 93-56.5 150.5T213 429q-88 0-150.5-62T0 216T62 65T213 3q87 0 144 57l-57 56q-33-33-86-33q-54 0-92.5 39.5t-38.5 95t38.5 94.5t92.5 39q31 0 55-9.5t37.5-24.5t20.5-29.5t10-27.5H214v-74z"/>
                  </svg>
                </div>
                <span className="mt-2 text-xs md:text-sm">Google</span>
              </div>
              
              <div className="flex flex-col items-center justify-center w-20 md:w-24 opacity-80 hover:opacity-100 transition-opacity">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-black dark:text-white" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M2 2h9.503v9.503H2zm10.493 0h9.503v9.503h-9.503zM2 12.497h9.503V22H2zm10.493 0h9.503V22h-9.503z"/>
                  </svg>
                </div>
                <span className="mt-2 text-xs md:text-sm">Microsoft</span>
              </div>
              
              <div className="flex flex-col items-center justify-center w-20 md:w-24 opacity-80 hover:opacity-100 transition-opacity">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-black dark:text-white" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M0 7.97v4.958c0 1.867 1.302 3.101 3 3.101c.826 0 1.562-.316 2.094-.87v.736H6.27V7.97H5.082v4.888c0 1.257-.85 2.106-1.947 2.106c-1.11 0-1.946-.827-1.946-2.106V7.971H0zm7.44 0v7.925h1.13v-.725c.521.532 1.257.86 2.06.86a3.006 3.006 0 0 0 3.034-3.01a3.01 3.01 0 0 0-3.033-3.024a2.86 2.86 0 0 0-2.049.861V7.971H7.439zm9.869 2.038c-1.687 0-2.965 1.37-2.965 3c0 1.72 1.334 3.01 3.066 3.01c1.053 0 1.913-.463 2.49-1.233l-.826-.611c-.43.577-.996.847-1.664.847c-.973 0-1.753-.7-1.912-1.64h4.697v-.373c0-1.72-1.222-3-2.886-3zm6.295.068c-.634 0-1.098.294-1.381.758v-.713h-1.131v5.774h1.142V12.61c0-.894.544-1.47 1.291-1.47H24v-1.065h-.396zm-6.319.928c.85 0 1.564.588 1.756 1.47H15.52c.203-.882.916-1.47 1.765-1.47zm-6.732.012c1.086 0 1.98.883 1.98 2.004a1.993 1.993 0 0 1-1.98 2.001A1.989 1.989 0 0 1 8.56 13.02a1.99 1.99 0 0 1 1.992-2.004z"/>
                  </svg>
                </div>
                <span className="mt-2 text-xs md:text-sm">Uber</span>
              </div>
              
              <div className="flex flex-col items-center justify-center w-20 md:w-24 opacity-80 hover:opacity-100 transition-opacity">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-black dark:text-white" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409c0-.831.683-1.305 1.901-1.305c2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0C9.667 0 7.589.654 6.104 1.872C4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219c2.585.92 3.445 1.574 3.445 2.583c0 .98-.84 1.545-2.354 1.545c-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813c1.664-1.305 2.525-3.236 2.525-5.732c0-4.128-2.524-5.851-6.594-7.305h.003z"/>
                  </svg>
                </div>
                <span className="mt-2 text-xs md:text-sm">Stripe</span>
              </div>
              
              <div className="flex flex-col items-center justify-center w-20 md:w-24 opacity-80 hover:opacity-100 transition-opacity">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-black dark:text-white" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M12.001 18.275c-1.353-1.697-2.148-3.184-2.413-4.457c-.263-1.027-.16-1.848.291-2.465c.477-.71 1.188-1.056 2.121-1.056s1.643.345 2.12 1.063c.446.61.558 1.432.286 2.465c-.291 1.298-1.085 2.785-2.412 4.458zm9.601 1.14c-.185 1.246-1.034 2.28-2.2 2.783c-2.253.98-4.483-.583-6.392-2.704c3.157-3.951 3.74-7.028 2.385-9.018c-.795-1.14-1.933-1.695-3.394-1.695c-2.944 0-4.563 2.49-3.927 5.382c.37 1.565 1.352 3.343 2.917 5.332c-.98 1.085-1.91 1.856-2.732 2.333c-.636.344-1.245.558-1.828.609c-2.679.399-4.778-2.2-3.825-4.88c.132-.345.395-.98.845-1.961l.025-.053c1.464-3.178 3.242-6.79 5.285-10.795l.053-.132l.58-1.116c.45-.822.635-1.19 1.351-1.643c.346-.21.77-.315 1.246-.315c.954 0 1.698.558 2.016 1.007c.158.239.345.557.582.953l.558 1.089l.08.159c2.041 4.004 3.821 7.608 5.279 10.794l.026.025l.533 1.22l.318.764c.243.613.294 1.222.213 1.858zm1.22-2.39c-.186-.583-.505-1.271-.9-2.094v-.03c-1.889-4.006-3.642-7.608-5.307-10.844l-.111-.163C15.317 1.461 14.468 0 12.001 0c-2.44 0-3.476 1.695-4.535 3.898l-.081.16c-1.669 3.236-3.421 6.843-5.303 10.847v.053l-.559 1.22c-.21.504-.317.768-.345.847C-.172 20.74 2.611 24 5.98 24c.027 0 .132 0 .265-.027h.372c1.75-.213 3.554-1.325 5.384-3.317c1.829 1.989 3.635 3.104 5.382 3.317h.372c.133.027.239.027.265.027c3.37.003 6.152-3.261 4.802-6.975z"/>
                  </svg>
                </div>
                <span className="mt-2 text-xs md:text-sm">Airbnb</span>
              </div>
              
              <div className="flex flex-col items-center justify-center w-20 md:w-24 opacity-80 hover:opacity-100 transition-opacity">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-black dark:text-white" viewBox="0 0 432 432">
                    <path fill="currentColor" d="M319 221.5q-8-10.5-30-10.5q-27 0-38 16t-11 45v146q0 5-3 8t-8 3h-76q-4 0-7.5-3t-3.5-8V148q0-4 3.5-7.5t7.5-3.5h74q4 0 6.5 2t3.5 6v5q1 2 1 7q28-27 76-27q53 0 83 27t30 79v182q0 5-3.5 8t-7.5 3h-78q-4 0-7.5-3t-3.5-8V254q0-22-8-32.5zM88 91.5Q73 107 51.5 107T15 91.5t-15-37T15 18T51.5 3T88 18t15 36.5t-15 37zm13 56.5v270q0 5-3.5 8t-7.5 3H14q-5 0-8-3t-3-8V148q0-4 3-7.5t8-3.5h76q4 0 7.5 3.5t3.5 7.5z"/>
                  </svg>
                </div>
                <span className="mt-2 text-xs md:text-sm">LinkedIn</span>
              </div>
              
              <div className="flex flex-col items-center justify-center w-20 md:w-24 opacity-80 hover:opacity-100 transition-opacity">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-black dark:text-white" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M10.006 5.415a4.195 4.195 0 0 1 3.045-1.306c1.56 0 2.954.9 3.69 2.205c.63-.3 1.35-.45 2.1-.45c2.85 0 5.159 2.34 5.159 5.22s-2.31 5.22-5.176 5.22c-.345 0-.69-.044-1.02-.104a3.75 3.75 0 0 1-3.3 1.95c-.6 0-1.155-.15-1.65-.375A4.314 4.314 0 0 1 8.88 20.4a4.302 4.302 0 0 1-4.05-2.82c-.27.062-.54.076-.825.076c-2.204 0-4.005-1.8-4.005-4.05c0-1.5.811-2.805 2.01-3.51c-.255-.57-.39-1.2-.39-1.846c0-2.58 2.1-4.65 4.65-4.65c1.53 0 2.85.705 3.72 1.8"/>
                  </svg>
                </div>
                <span className="mt-2 text-xs md:text-sm">Salesforce</span>
              </div>
              
              <div className="flex flex-col items-center justify-center w-20 md:w-24 opacity-80 hover:opacity-100 transition-opacity">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-black dark:text-white" viewBox="0 0 24 24">
                    <path fill="currentColor" fillRule="evenodd" d="M16.53 10.091L21 12.939l-4.502 2.868L12 12.941l-4.498 2.866L3 12.939l4.47-2.848L3 7.243l4.502-2.868L12 7.241l4.498-2.866L21 7.243z" clipRule="evenodd"/>
                    <path fill="currentColor" fillRule="evenodd" d="M16.467 10.091L12 7.245l-4.467 2.846L12 12.936z" clipRule="evenodd" opacity=".25"/>
                    <path fill="currentColor" fillRule="evenodd" d="m7.531 16.757l-.029-.95L12 12.941l4.498 2.866l.036.95l-4.502 2.868z" clipRule="evenodd" opacity=".5"/>
                  </svg>
                </div>
                <span className="mt-2 text-xs md:text-sm">Dropbox</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* AI Agents Curated Dataset Section */}
      <div className="mt-24 mb-12">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-8 md:gap-16">
          <div className="md:w-1/2">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">AI Agents Curated Dataset</h2>
            <p className="text-gray-700 dark:text-gray-300 text-base md:text-lg mb-6">
              Our resources are aggregated and organized from top industry sources, ensuring you get the most relevant and up-to-date information for your technical interview preparation.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-black/5 dark:bg-white/5 text-black dark:text-white mr-3 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span>Topic-based organization for targeted study</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-black/5 dark:bg-white/5 text-black dark:text-white mr-3 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span>Role-specific content for various technical positions</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-black/5 dark:bg-white/5 text-black dark:text-white mr-3 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span>Continuously updated with the latest industry questions</span>
              </li>
            </ul>
          </div>
          
          <div className="md:w-1/2 p-6 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-900">
            <h3 className="text-lg md:text-xl font-semibold mb-3">Core Features</h3>
            <ul className="space-y-2 text-sm md:text-base">
              <li className="flex items-start">
                <span className="text-gray-500 dark:text-gray-400 mr-2">→</span>
                <span><strong>Topic-based browsing:</strong> Browse interview questions by topic (e.g., Neural Networks, Deep Learning)</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-500 dark:text-gray-400 mr-2">→</span>
                <span><strong>Job role exploration:</strong> Find relevant questions for specific job roles</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-500 dark:text-gray-400 mr-2">→</span>
                <span><strong>Custom search:</strong> Search for specific keywords or concepts</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-500 dark:text-gray-400 mr-2">→</span>
                <span><strong>Direct links:</strong> Click through for complete answers and resources</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      
    </div>
  );
} 