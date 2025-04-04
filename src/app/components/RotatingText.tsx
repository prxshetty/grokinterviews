'use client';

import { useState, useEffect, useRef } from 'react';
import './text-animations.css';

const topics = ['ARTIFICIAL  INTELLIGENCE', 'DATA  STRUCTURES  &  ALGORITHMS', 'MACHINE  LEARNING', 'WEB  DEVELOPMENT', 'SYSTEM  DESIGN'];

export default function RotatingText() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [chars, setChars] = useState<Array<{char: string, visible: boolean, style: string}>>([]);
  const currentTopic = topics[currentIndex];
  const animationSpeedRef = useRef(40); // ms per frame
  const stageRef = useRef(0);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize and run animation
  useEffect(() => {
    // Reset when topic changes
    const initAnimation = () => {
      // Create array of characters with visibility and style properties
      const initialChars = currentTopic.split('').map(char => ({
        char,
        visible: false,
        style: getRandomStyle()
      }));
      setChars(initialChars);
      stageRef.current = 0;
    };

    // Get a random style for character animation
    const getRandomStyle = () => {
      const styles = [
        'fade-in', // Simple fade in
        'slide-up', // Slide up and fade in
        'slide-down', // Slide down and fade in
        'scale-in', // Scale up and fade in
        'blur-in', // Blur in
      ];
      return styles[Math.floor(Math.random() * styles.length)];
    };

    initAnimation();

    // Start the animation sequence
    const runAnimation = () => {
      // Clear any existing animation
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }

      // Reveal characters one by one with a slight delay
      const revealNextChar = (index: number) => {
        if (index >= chars.length) {
          // All characters revealed, wait before starting the next cycle
          animationRef.current = setTimeout(() => {
            // Start disappearing animation
            startDisappearAnimation();
          }, 3000); // Wait 3 seconds before starting to disappear
          return;
        }

        setChars(prev => {
          const updated = [...prev];
          if (index < updated.length) {
            updated[index] = { ...updated[index], visible: true };
          }
          return updated;
        });

        // Schedule the next character reveal
        animationRef.current = setTimeout(() => {
          revealNextChar(index + 1);
        }, animationSpeedRef.current + Math.random() * 30); // Add some randomness to the timing
      };

      // Start the disappear animation
      const startDisappearAnimation = () => {
        // Make characters disappear in reverse order
        const makeDisappear = (index: number) => {
          if (index < 0) {
            // All characters have disappeared, move to next topic
            animationRef.current = setTimeout(() => {
              setCurrentIndex((prevIndex) => (prevIndex + 1) % topics.length);
            }, 500);
            return;
          }

          setChars(prev => {
            const updated = [...prev];
            if (index < updated.length) {
              updated[index] = { ...updated[index], visible: false };
            }
            return updated;
          });

          // Schedule the next character disappearance
          animationRef.current = setTimeout(() => {
            makeDisappear(index - 1);
          }, animationSpeedRef.current);
        };

        makeDisappear(chars.length - 1);
      };

      // Start revealing characters
      revealNextChar(0);
    };

    // Start the animation after a short delay
    animationRef.current = setTimeout(runAnimation, 500);

    // Cleanup function
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [currentIndex, currentTopic, chars.length]);

  return (
    <div className="block mt-8 mb-4 relative">
      <div className="block font-bold text-4xl md:text-6xl lg:text-7xl tracking-tight leading-none font-sans">
        {chars.map((charObj, index) => (
          <span
            key={index}
            className={`char ${charObj.visible ? `char-${charObj.style}` : 'opacity-0'}`}
            style={{
              animationDelay: `${index * 0.03}s`,
            }}
          >
            {charObj.char}
          </span>
        ))}
      </div>
    </div>
  );
}
