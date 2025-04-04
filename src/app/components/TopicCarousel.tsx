'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const quizTopics = [
  { id: '01', shade: 'bg-red-600', title: 'JavaScript', subtitle: 'Core language fundamentals' },
  { id: '02', shade: 'bg-red-700', title: 'React', subtitle: 'Component patterns & hooks' },
  { id: '03', shade: 'bg-yellow-500', title: 'CSS', subtitle: 'Modern layout techniques' },
  { id: '04', shade: 'bg-orange-500', title: 'System Design', subtitle: 'Architecture fundamentals' },
  { id: '05', shade: 'bg-amber-600', title: 'Data Structures', subtitle: 'Algorithms & problem solving' },
  { id: '06', shade: 'bg-lime-600', title: 'Web Performance', subtitle: 'Optimization strategies' },
  { id: '07', shade: 'bg-green-600', title: 'Node.js', subtitle: 'API design & implementation' },
  { id: '08', shade: 'bg-emerald-600', title: 'GraphQL', subtitle: 'Modern API development' },
  { id: '09', shade: 'bg-teal-600', title: 'Redux', subtitle: 'Managing application state' },
  { id: '10', shade: 'bg-cyan-600', title: 'DevOps', subtitle: 'CI/CD and deployment' },
  { id: '11', shade: 'bg-sky-600', title: 'TypeScript', subtitle: 'Static typing for JavaScript' },
  { id: '12', shade: 'bg-blue-600', title: 'Python', subtitle: 'Versatile programming language' },
  { id: '13', shade: 'bg-indigo-600', title: 'AWS', subtitle: 'Cloud infrastructure & services' },
  { id: '14', shade: 'bg-violet-600', title: 'Docker', subtitle: 'Containerization technology' },
  { id: '15', shade: 'bg-purple-600', title: 'Kubernetes', subtitle: 'Container orchestration' },
  { id: '16', shade: 'bg-fuchsia-600', title: 'SQL', subtitle: 'Database query language' },
  { id: '17', shade: 'bg-pink-600', title: 'MongoDB', subtitle: 'NoSQL database solutions' },
  { id: '18', shade: 'bg-rose-600', title: 'Rust', subtitle: 'Performance & safety focused' },
];
const companies = [
  {
    name: 'Meta',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86a5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927c1.497 0 2.633-.671 3.965-2.444c.76-1.012 1.144-1.626 2.663-4.32l.756-1.339l.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314c1.046.987 1.992 1.22 3.06 1.22c1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745c0-2.72-.681-5.357-2.084-7.45c-1.282-1.912-2.957-2.93-4.716-2.93c-1.047 0-2.088.467-3.053 1.308c-.652.57-1.257 1.29-1.82 2.05c-.69-.875-1.335-1.547-1.958-2.056c-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999c1.132 1.748 1.647 4.195 1.647 6.4c0 1.548-.368 2.9-1.839 2.9c-.58 0-1.027-.23-1.664-1.004c-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327c1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446c.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338c-1.191 1.649-1.81 1.817-2.486 1.817c-.524 0-1.038-.237-1.383-.794c-.263-.426-.464-1.13-.464-2.046c0-2.221.63-4.535 1.66-6.088c.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z"/></svg>'
  },
  {
    name: 'Apple',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/></svg>'
  },
  {
    name: 'Amazon',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 432 384"><path fill="currentColor" d="M379 297q6-2 9 2.5t-2 8.5q-34 25-81 39t-92 14Q91 361 2 280q-3-3-1-5.5t6-.5q96 56 211 56q83 0 161-33zm46-26q5 6-2.5 31.5T399 342q-3 3-5 2t-1-5q18-45 12-53t-54-2q-4 0-4.5-2t2.5-4q18-13 46-13.5t30 6.5zM237 113v-6q0-22-6-30q-7-11-23-11q-28 0-33 25q-2 8-8 8l-40-4q-8-2-6-9q6-34 32.5-49T214 22q41 0 63 21q3 3 5.5 6t4.5 7.5t3.5 7t2 8t1.5 8t1 9V180q0 17 16 38q5 7 0 12q-16 12-32 27q-5 4-10 1q-11-9-24-28q-17 18-32 24.5t-37 6.5q-27 0-44.5-17T114 196q0-49 44-69q17-7 79-14zm-8 87q8-14 8-45v-9q-62 0-62 42q0 14 6.5 22.5T200 219q18 0 29-19z"/></svg>'
  },
  {
    name: 'Netflix',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M6.5 2h4l2.94 8.83L13.5 2h4v20c-1.25-.22-2.63-.36-4.09-.42L10.5 13l-.07 8.59c-1.4.06-2.73.2-3.93.41V2Z"/></svg>'
  },
  {
    name: 'Google',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>'
  },
  {
    name: 'Microsoft',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M3 3h8v8H3V3zm0 10h8v8H3v-8zM13 3h8v8h-8V3zm0 10h8v8h-8v-8z"/></svg>'
  },
  {
    name: 'Adobe',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 1024 896"><path fill="currentColor" d="M512 320L352 704h160l82 192H0L384 0h256l384 896H759z"/></svg>'
  },
  {
    name: 'Uber',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M0 7.97v4.958c0 1.867 1.302 3.101 3 3.101c.826 0 1.562-.316 2.094-.87v.736H6.27V7.97H5.082v4.888c0 1.257-.85 2.106-1.947 2.106c-1.11 0-1.946-.827-1.946-2.106V7.971H0zm7.44 0v7.925h1.13v-.725c.521.532 1.257.86 2.06.86a3.006 3.006 0 0 0 3.034-3.01a3.01 3.01 0 0 0-3.033-3.024a2.86 2.86 0 0 0-2.049.861V7.971H7.439zm9.869 2.038c-1.687 0-2.965 1.37-2.965 3c0 1.72 1.334 3.01 3.066 3.01c1.053 0 1.913-.463 2.49-1.233l-.826-.611c-.43.577-.996.847-1.664.847c-.973 0-1.753-.7-1.912-1.64h4.697v-.373c0-1.72-1.222-3-2.886-3zm6.295.068c-.634 0-1.098.294-1.381.758v-.713h-1.131v5.774h1.142V12.61c0-.894.544-1.47 1.291-1.47H24v-1.065h-.396zm-6.319.928c.85 0 1.564.588 1.756 1.47H15.52c.203-.882.916-1.47 1.765-1.47zm-6.732.012c1.086 0 1.98.883 1.98 2.004a1.993 1.993 0 0 1-1.98 2.001A1.989 1.989 0 0 1 8.56 13.02a1.99 1.99 0 0 1 1.992-2.004z"/></svg>'
  },
  {
    name: 'Stripe',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409c0-.831.683-1.305 1.901-1.305c2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0C9.667 0 7.589.654 6.104 1.872C4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219c2.585.92 3.445 1.574 3.445 2.583c0 .98-.84 1.545-2.354 1.545c-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813c1.664-1.305 2.525-3.236 2.525-5.732c0-4.128-2.524-5.851-6.594-7.305h.003z"/></svg>'
  },
  {
    name: 'Airbnb',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12.001 18.275c-1.353-1.697-2.148-3.184-2.413-4.457c-.263-1.027-.16-1.848.291-2.465c.477-.71 1.188-1.056 2.121-1.056s1.643.345 2.12 1.063c.446.61.558 1.432.286 2.465c-.291 1.298-1.085 2.785-2.412 4.458zm9.601 1.14c-.185 1.246-1.034 2.28-2.2 2.783c-2.253.98-4.483-.583-6.392-2.704c3.157-3.951 3.74-7.028 2.385-9.018c-.795-1.14-1.933-1.695-3.394-1.695c-2.944 0-4.563 2.49-3.927 5.382c.37 1.565 1.352 3.343 2.917 5.332c-.98 1.085-1.91 1.856-2.732 2.333c-.636.344-1.245.558-1.828.609c-2.679.399-4.778-2.2-3.825-4.88c.132-.345.395-.98.845-1.961l.025-.053c1.464-3.178 3.242-6.79 5.285-10.795l.053-.132l.58-1.116c.45-.822.635-1.19 1.351-1.643c.346-.21.77-.315 1.246-.315c.954 0 1.698.558 2.016 1.007c.158.239.345.557.582.953l.558 1.089l.08.159c2.041 4.004 3.821 7.608 5.279 10.794l.026.025l.533 1.22l.318.764c.243.613.294 1.222.213 1.858zm1.22-2.39c-.186-.583-.505-1.271-.9-2.094v-.03c-1.889-4.006-3.642-7.608-5.307-10.844l-.111-.163C15.317 1.461 14.468 0 12.001 0c-2.44 0-3.476 1.695-4.535 3.898l-.081.16c-1.669 3.236-3.421 6.843-5.303 10.847v.053l-.559 1.22c-.21.504-.317.768-.345.847C-.172 20.74 2.611 24 5.98 24c.027 0 .132 0 .265-.027h.372c1.75-.213 3.554-1.325 5.384-3.317c1.829 1.989 3.635 3.104 5.382 3.317h.372c.133.027.239.027.265.027c3.37.003 6.152-3.261 4.802-6.975z"/></svg>'
  },
  {
    name: 'LinkedIn',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 432 432"><path fill="currentColor" d="M319 221.5q-8-10.5-30-10.5q-27 0-38 16t-11 45v146q0 5-3 8t-8 3h-76q-4 0-7.5-3t-3.5-8V148q0-4 3.5-7.5t7.5-3.5h74q4 0 6.5 2t3.5 6v5q1 2 1 7q28-27 76-27q53 0 83 27t30 79v182q0 5-3.5 8t-7.5 3h-78q-4 0-7.5-3t-3.5-8V254q0-22-8-32.5zM88 91.5Q73 107 51.5 107T15 91.5t-15-37T15 18T51.5 3T88 18t15 36.5t-15 37zm13 56.5v270q0 5-3.5 8t-7.5 3H14q-5 0-8-3t-3-8V148q0-4 3-7.5t8-3.5h76q4 0 7.5 3.5t3.5 7.5z"/></svg>'
  },
  {
    name: 'Salesforce',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M10.006 5.415a4.195 4.195 0 0 1 3.045-1.306c1.56 0 2.954.9 3.69 2.205c.63-.3 1.35-.45 2.1-.45c2.85 0 5.159 2.34 5.159 5.22s-2.31 5.22-5.176 5.22c-.345 0-.69-.044-1.02-.104a3.75 3.75 0 0 1-3.3 1.95c-.6 0-1.155-.15-1.65-.375A4.314 4.314 0 0 1 8.88 20.4a4.302 4.302 0 0 1-4.05-2.82c-.27.062-.54.076-.825.076c-2.204 0-4.005-1.8-4.005-4.05c0-1.5.811-2.805 2.01-3.51c-.255-.57-.39-1.2-.39-1.846c0-2.58 2.1-4.65 4.65-4.65c1.53 0 2.85.705 3.72 1.8"/></svg>'
  },
  {
    name: 'Tesla',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="m12 5.362l2.475-3.026s4.245.09 8.471 2.054c-1.082 1.636-3.231 2.438-3.231 2.438c-.146-1.439-1.154-1.79-4.354-1.79L12 24L8.619 5.034c-3.18 0-4.188.354-4.335 1.792c0 0-2.146-.795-3.229-2.43C5.28 2.431 9.525 2.34 9.525 2.34L12 5.362l-.004.002H12v-.002zm0-3.899c3.415-.03 7.326.528 11.328 2.28c.535-.968.672-1.395.672-1.395C19.625.612 15.528.015 12 0C8.472.015 4.375.61 0 2.349c0 0 .195.525.672 1.396C4.674 1.989 8.585 1.435 12 1.46v.003z"/></svg>'
  },
  {
    name: 'Spotify',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M7 15s4.5-1 9 1m-9.5-4s6-1.5 11 1.5M6 9c3-.5 8-1 13 2"/><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-12 10z"/></g></svg>'
  },
  {
    name: 'Twitter',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 432 384"><path fill="currentColor" d="M383 105v11q0 45-16.5 88.5t-47 79.5t-79 58.5T134 365q-73 0-134-39q10 1 21 1q61 0 109-37q-29-1-51.5-18T48 229q8 2 16 2q12 0 23-4q-30-6-50-30t-20-55v-1q19 10 40 11q-39-27-39-73q0-24 12-44q33 40 79.5 64T210 126q-2-10-2-20q0-36 25.5-61.5T295 19q38 0 64 27q30-6 56-21q-10 31-39 48q27-3 51-13q-18 26-44 45z"/></svg>'
  },
  {
    name: 'Github',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 432 416"><path fill="currentColor" d="M213.5 0q88.5 0 151 62.5T427 213q0 70-41 125.5T281 416q-14 2-14-11v-58q0-27-15-40q44-5 70.5-27t26.5-77q0-34-22-58q11-26-2-57q-18-5-58 22q-26-7-54-7t-53 7q-18-12-32.5-17.5T107 88h-6q-12 31-2 57q-22 24-22 58q0 55 27 77t70 27q-11 10-13 29q-42 18-62-18q-12-20-33-22q-2 0-4.5.5t-5 3.5t8.5 9q14 7 23 31q1 2 2 4.5t6.5 9.5t13 10.5T130 371t30-2v36q0 13-14 11q-64-22-105-77.5T0 213q0-88 62.5-150.5T213.5 0z"/></svg>'
  }
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
        <div className="flex justify-center items-center py-16 relative overflow-hidden">
          {/* Enhanced arc background indicator */}
          <div className="absolute bottom-0 left-1/2 w-[95%] h-[300px] border-t-2 border-gray-200 dark:border-gray-700 rounded-t-full transform -translate-x-1/2 opacity-30 dark:opacity-20"></div>
          <div className="absolute bottom-0 left-1/2 w-[85%] h-[280px] border-t border-gray-300 dark:border-gray-600 rounded-t-full transform -translate-x-1/2 opacity-20 dark:opacity-15"></div>

          {/* All cards displayed at once in a gentle arc */}
          <div className="flex justify-center items-end space-x-4 md:space-x-6 px-2 md:px-4 max-w-full overflow-visible">
            {visibleTopics.map((topic, index) => {
              // Calculate slight vertical and rotation offsets for gentle curve
              const totalCards = visibleTopics.length;
              const midPoint = Math.floor(totalCards / 2);
              const distanceFromMiddle = index - midPoint;
              const isActive = index === activeIndex;

              // Subtle arc effect calculations
              // Cards further from center are positioned lower with subtle rotation
              const verticalOffset = Math.pow(Math.abs(distanceFromMiddle), 1.5) * (isMobile ? 10 : 12); // Adjusted curve calculation
              const rotationDeg = (distanceFromMiddle * (isMobile ? 2.5 : 3)) * (1 - Math.abs(distanceFromMiddle) * 0.1); // Smoother rotation
              const scale = 1 - Math.abs(distanceFromMiddle) * 0.04; // Base scale for non-active cards
              // Using 1.05 as active scale directly in the transform style

              // Card visibility logic - hide cards that would be way off screen
              const isVisible = Math.abs(distanceFromMiddle) <= 5; // Show only cards close enough to center

              if (!isVisible) return null;

              // Add hover state for each card
              const [isHovered, setIsHovered] = React.useState(false);

              return (
                <div
                  key={topic.id}
                  className={`
                    group w-[168px] md:w-[216px] h-[264px] md:h-[312px] rounded-lg ${topic.shade}
                    text-white cursor-pointer transform-gpu select-none flex-shrink-0
                    overflow-hidden relative
                    shadow-[0_8px_16px_rgba(0,0,0,0.2)]
                    transition-all duration-500 ease-out
                    ${isActive ? 'z-30 shadow-[0_20px_40px_rgba(0,0,0,0.4)] dark:shadow-[0_20px_40px_rgba(255,255,255,0.1)]' : 'z-10'}
                    hover:z-40 hover:shadow-[0_16px_32px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_16px_32px_rgba(255,255,255,0.08)]
                  `}
                  style={{
                    // Base transform for position and rotation
                    transform: `
                      translateY(${isActive ? -20 : isHovered ? -15 : verticalOffset * 1.2}px)
                      rotate(${rotationDeg * 0.8}deg)
                      scale(${isActive ? 1.1 : isHovered ? 1.05 : scale})
                    `,
                    transition: 'transform 0.5s ease-out',
                    opacity: isActive ? 1 : (1 - Math.abs(distanceFromMiddle) * 0.15),
                  }}
                  onClick={() => setActiveIndex(index)}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-16 h-16 opacity-20">
                    <div className="absolute top-4 right-4 w-px h-8 bg-white dark:bg-white rotate-45"></div>
                    <div className="absolute top-4 right-8 w-px h-8 bg-white dark:bg-white rotate-45"></div>
                    <div className="absolute top-4 right-12 w-px h-4 bg-white dark:bg-white rotate-45"></div>
                  </div>

                  {/* Inner content div with counter-rotation and hover effect */}
                  <div
                    className={`
                      p-5 md:p-7 h-full flex flex-col justify-between
                      transition-all duration-500 ease-out
                      ${isActive ? 'scale-105' : isHovered ? 'scale-[1.05]' : ''}
                    `}
                    style={{ transform: `rotate(${-rotationDeg * 0.8}deg)` }}
                  >
                    {/* Topic number with angled design */}
                    <div className="relative">
                      <div className="text-5xl md:text-7xl font-bold opacity-30 dark:opacity-40 font-mono tracking-tighter">{topic.id}</div>
                      <div className="absolute top-1 left-1 text-sm font-mono text-white/70 dark:text-white/80 tracking-wide">topic</div>
                    </div>

                    {/* Middle section with titles */}
                    <div className="mt-auto relative">
                      <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3 font-sans tracking-tight leading-tight">{topic.title}</h3>
                      <p className="text-xs md:text-sm opacity-80 font-sans line-clamp-2">{topic.subtitle}</p>

                      {/* Small decorative elements */}
                      <div className="absolute bottom-[-20px] right-0 text-[8px] text-white/60 dark:text-white/70 font-mono">
                        <div>category/{topic.title.toLowerCase()}</div>
                        <div>id/{topic.id}</div>
                      </div>
                    </div>
                  </div>

                  {/* Reveal on hover - additional info */}
                  <div className="absolute inset-0 bg-black/30 dark:bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center pointer-events-none">
                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 text-center">
                      <div className="text-sm font-bold mb-2 text-white dark:text-white">Explore {topic.title}</div>
                      <div className="inline-block px-4 py-1.5 rounded-full bg-white/20 dark:bg-white/30 text-xs font-medium border border-white/10 dark:border-white/20 shadow-lg">View Details</div>
                    </div>
                  </div>

                  {/* Subtle effects for active card */}
                  {isActive && (
                    <>
                      <div className="absolute inset-0 bg-white/5 dark:bg-white/10 animate-pulse pointer-events-none"></div>
                      <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-white/40 dark:bg-white/60 animate-pulse"></div>
                      <div className="absolute top-4 left-4 text-[8px] font-mono text-white/60 dark:text-white/70 animate-float">
                        <div>active</div>
                        <div>selected</div>
                      </div>
                    </>
                  )}
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
      <div className="mt-20 mb-16">
        <h2 className="text-lg md:text-xl font-semibold mb-8 text-center tracking-tight">Companies You Can Join With These Skills</h2>
        <div className="w-full overflow-hidden">
          {/* Added a container with padding to ensure smooth transition */}
          <div className="relative py-2">
            {/* Added a gradient mask for smoother fade effect at the edges */}
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-black dark:via-black/80 dark:to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white via-white/80 to-transparent dark:from-black dark:via-black/80 dark:to-transparent z-10"></div>

            {/* Main carousel with improved animation */}
            <div className="flex animate-scroll-smooth">
              {/* Create a shuffled version of companies to avoid duplicates appearing close to each other */}
              {(() => {
                // Create a shuffled copy of companies
                const shuffled = [...companies].sort(() => Math.random() - 0.5);
                // Combine original and shuffled for smooth looping without adjacent duplicates
                return [...companies, ...shuffled].map((company, index) => (
                <div
                  key={`${company.name}-${index}`}
                  className="flex flex-col items-center justify-center mx-10 w-32 opacity-80 hover:opacity-100 transition-opacity" // Further increased width and spacing
                >
                  {/* SVG container with larger dimensions */}
                  <div
                    className="w-16 h-16 text-gray-800 dark:text-gray-200 transform transition-transform duration-300 ease-in-out mb-3 flex items-center justify-center" // Further increased size
                    dangerouslySetInnerHTML={{ __html: company.svg }}
                  />
                  {/* Company Name with better alignment */}
                  <p className="text-sm font-sans text-gray-600 dark:text-gray-400 whitespace-nowrap text-center">
                    {company.name}
                  </p>
                </div>
              ))
              })()}
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