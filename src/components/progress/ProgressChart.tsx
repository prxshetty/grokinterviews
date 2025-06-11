"use client";

import { useEffect, useRef } from 'react';

interface ProgressChartProps {
  data?: number[];
  className?: string;
}

export default function ProgressChart({
  data = [3, 5, 2, 8, 12, 7, 10, 15, 9, 6, 18, 14, 11, 13, 16, 20, 17, 19, 15, 12, 10, 8, 6, 9, 11, 13, 15, 17, 14, 12],
  className = ""
}: ProgressChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Calculate dot size and spacing
    const dotSize = 3;
    const dotSpacing = 8;
    const maxHeight = rect.height - 40; // Leave space for labels
    const maxValue = Math.max(...data);

    // Draw dots
    data.forEach((value, index) => {
      const x = index * dotSpacing + 20; // Start with some padding
      const normalizedHeight = (value / maxValue) * maxHeight;

      // Calculate number of dots to draw vertically
      const dotsCount = Math.ceil(normalizedHeight / dotSpacing);

      for (let i = 0; i < dotsCount; i++) {
        const y = rect.height - 30 - (i * dotSpacing); // 30px from bottom for labels

        // Determine opacity based on position
        const opacity = i === dotsCount - 1 ? 1 : 0.6;

        // Draw dot
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100, 100, 100, ${opacity})`;

        // Highlight June data (middle section)
        if (index > data.length / 2 - 5 && index < data.length / 2 + 5) {
          ctx.fillStyle = `rgba(50, 50, 50, ${opacity})`;
        }

        ctx.fill();
      }
    });

    // Draw month labels
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#999';
    ctx.textAlign = 'left';
    ctx.fillText('MAY', 10, rect.height - 10);

    ctx.textAlign = 'right';
    ctx.fillText('JUN', rect.width - 10, rect.height - 10);

    // Draw value labels
    ctx.textAlign = 'left';
    ctx.fillText('$3,250', 10, rect.height - 10);

    ctx.textAlign = 'right';
    ctx.fillText('$12,392', rect.width - 10, rect.height - 10);

  }, [data]);

  return (
    <div className={`bg-white dark:bg-black p-4 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <div className="text-gray-800 dark:text-gray-200 font-medium">PROGRESS</div>
        <div className="flex space-x-4 text-xs text-gray-400">
          <span>DAILY</span>
          <span>WEEKLY</span>
          <span className="text-gray-800 dark:text-gray-200">MONTHLY</span>
        </div>
      </div>

      <div className="mb-2">
        <div className="text-3xl font-light text-gray-800 dark:text-gray-100">
          +32<span className="text-xl">%</span>
        </div>
      </div>

      <div className="w-full h-40 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
