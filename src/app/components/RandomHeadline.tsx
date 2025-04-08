'use client';

import { useState, useEffect } from 'react';
import RotatingText from './ui/RotatingText';

// Array of possible headlines
const headlines = [
  {
    before: "NO MORE BS. GET GOOD AT",
    after: "NOW."
  },
  {
    before: "IT'S ABOUT DAMN TIME TO CONQUER",
    after: ""
  },
  {
    before: "STOP WAITING. START CRUSHING",
    after: ""
  },
  {
    before: "",
    after: "? IT'S DAMN WELL TIME YOU OWNED IT"
  },
  {
    before: "THE WAIT IS OVER. DOMINATE",
    after: "NOW"
  },
  {
    before: "TIME TO KICK SOME SERIOUS",
    after: "ASS"
  },
  {
    before: "ENOUGH EXCUSES. MASTER",
    after: "ALREADY"
  },
  {
    before: "FINALLY GETTING GOOD AT",
    after: "? ABOUT DAMN TIME"
  },
  {
    before: "YOUR",
    after: "SKILLS? YEAH, IT'S TIME TO LEVEL UP"
  }
];

export default function RandomHeadline() {
  const [headline, setHeadline] = useState({ before: "", after: "" });
  const [mounted, setMounted] = useState(false);

  // Select a random headline on component mount (client-side only)
  useEffect(() => {
    setMounted(true);

    // Use a small delay to ensure proper hydration
    const timer = setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * headlines.length);
      setHeadline(headlines[randomIndex]);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  // Use a default headline for initial server-side rendering to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="flex justify-end">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9] text-right font-sans">
          <div className="mb-2">
            IT'S ABOUT DAMN TIME TO CONQUER
          </div>
          <RotatingText />
        </h1>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9] text-right font-sans">
        {headline.before && (
          <div className="mb-2">
            {headline.before}
          </div>
        )}
        <RotatingText />
        {headline.after && (
          <div className="mt-2">
            {headline.after}
          </div>
        )}
      </h1>
    </div>
  );
}
