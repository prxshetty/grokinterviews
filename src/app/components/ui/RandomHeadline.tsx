'use client';

import { useState, useEffect } from 'react';

// Array of possible headlines
const headlines = [
  { before: "IT'S ABOUT DAMN TIME TO CONQUER", after: "SYSTEM DESIGN" },
  { before: "ACE YOUR NEXT", after: "CODING INTERVIEW" },
  { before: "LEVEL UP YOUR", after: "BEHAVIORAL SKILLS" },
  { before: "MASTER", after: "DATA STRUCTURES & ALGORITHMS" },
  { before: "UNLOCK YOUR POTENTIAL IN", after: "MACHINE LEARNING" },
  { before: "BECOME AN EXPERT IN", after: "ARTIFICIAL INTELLIGENCE" },
  { before: "NAIL THE", after: "SOFTWARE ENGINEERING INTERVIEW" },
  { before: "PREPARE FOR", after: "FAANG INTERVIEWS" },
  { before: "DEEP DIVE INTO", after: "ALGORITHMIC THINKING" },
  { before: "SHARPEN YOUR", after: "PROBLEM-SOLVING SKILLS" },
];

export default function RandomHeadline() {
  // State to hold a single, randomly selected headline
  const [headline, setHeadline] = useState<{ before: string; after: string } | null>(null);

  // Select a random headline on component mount
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * headlines.length);
    setHeadline(headlines[randomIndex]);
  }, []); // Empty dependency array ensures this runs only once on mount

  // Render nothing until a headline is selected
  if (!headline) {
    return null;
  }

  return (
    <div className="text-center mb-12 px-4 animate-fadeIn">
      <div className="text-3xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white uppercase">
        <div className="mb-1 md:mb-2">
          {headline.before}
        </div>
        <span className="font-medium text-lg md:text-xl text-purple-600 dark:text-purple-400 leading-tight">
          {headline.after}
        </span>
      </div>
    </div>
  );
}
