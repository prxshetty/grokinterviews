"use client";

import { useRef, useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DottedMap from "dotted-map";
import Image from "next/image";
import { useTheme } from "next-themes";

interface MapProps {
  dots?: Array<{
    start: { lat: number; lng: number; label?: string };
    end: { lat: number; lng: number; label?: string };
  }>;
  lineColor?: string;
  showLabels?: boolean;
  labelClassName?: string;
  animationDuration?: number;
  loop?: boolean;
}

// Cache the map instance globally to prevent recreation
let cachedMap: DottedMap | null = null;
let cachedLightSvg: string | null = null;
let cachedDarkSvg: string | null = null;

export function WorldMap({ 
  dots = [], 
  lineColor = "#0ea5e9",
  showLabels = true,
  animationDuration = 2,
  loop = true
}: MapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Create map instance only once
  const map = useMemo(() => {
    if (!cachedMap) {
      cachedMap = new DottedMap({ height: 100, grid: "diagonal" });
    }
    return cachedMap;
  }, []);

  // Cache SVG maps for both themes to prevent regeneration
  const svgMap = useMemo(() => {
    if (!mounted) return "";
    
    const isDark = resolvedTheme === "dark" || theme === "dark";
    
    if (isDark && cachedDarkSvg) {
      return cachedDarkSvg;
    }
    if (!isDark && cachedLightSvg) {
      return cachedLightSvg;
    }
    
    const svg = map.getSVG({
      radius: 0.22,
      color: isDark ? "#FFFFFF" : "#000000",
      shape: "circle",
      backgroundColor: "transparent",
    });
    
    if (isDark) {
      cachedDarkSvg = svg;
    } else {
      cachedLightSvg = svg;
    }
    
    return svg;
  }, [map, mounted, resolvedTheme, theme]);

  // Memoize projection function to avoid recreation
  const projectPoint = useCallback((lat: number, lng: number) => {
    const x = (lng + 180) * (800 / 360);
    const y = (90 - lat) * (400 / 180);
    return { x, y };
  }, []);

  const createCurvedPath = useCallback((
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => {
    const midX = (start.x + end.x) / 2;
    const midY = Math.min(start.y, end.y) - 50;
    return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
  }, []);

  // Memoize animation timing calculations
  const animationConfig = useMemo(() => {
    const staggerDelay = 0.3;
    const totalAnimationTime = dots.length * staggerDelay + animationDuration;
    const pauseTime = 2;
    const fullCycleDuration = totalAnimationTime + pauseTime;
    
    return {
      staggerDelay,
      totalAnimationTime,
      pauseTime,
      fullCycleDuration
    };
  }, [dots.length, animationDuration]);

  // Memoize projected points to avoid recalculation
  const projectedDots = useMemo(() => {
    return dots.map(dot => ({
      ...dot,
      startPoint: projectPoint(dot.start.lat, dot.start.lng),
      endPoint: projectPoint(dot.end.lat, dot.end.lng)
    }));
  }, [dots, projectPoint]);

  return (
    <div className="w-full aspect-[2/1] md:aspect-[2.5/1] lg:aspect-[2/1] bg-transparent rounded-lg relative font-sans overflow-hidden">
      {mounted && (
        <Image
          src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
          className="h-full w-full [mask-image:linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)] pointer-events-none select-none object-cover"
          alt="world map"
          height="495"
          width="1056"
          draggable={false}
          priority
        />
      )}
      <svg
        ref={svgRef}
        viewBox="0 0 800 400"
        className="w-full h-full absolute inset-0 pointer-events-auto select-none"
        preserveAspectRatio="xMidYMid meet"
        style={{
          willChange: 'auto',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden'
        }}
      >
        <defs>
          <linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="5%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="95%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          
          <filter id="glow">
            <feMorphology operator="dilate" radius="0.5" />
            <feGaussianBlur stdDeviation="1" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {projectedDots.map((dot, i) => {
          const { startPoint, endPoint } = dot;
          
          // Calculate keyframe times for this specific path
          const startTime = (i * animationConfig.staggerDelay) / animationConfig.fullCycleDuration;
          const endTime = (i * animationConfig.staggerDelay + animationDuration) / animationConfig.fullCycleDuration;
          const resetTime = animationConfig.totalAnimationTime / animationConfig.fullCycleDuration;
          
          return (
            <g key={`path-group-${i}`}>
              <motion.path
                d={createCurvedPath(startPoint, endPoint)}
                fill="none"
                stroke="url(#path-gradient)"
                strokeWidth="1"
                initial={{ pathLength: 0 }}
                animate={loop ? {
                  pathLength: [0, 0, 1, 1, 0],
                } : {
                  pathLength: 1
                }}
                transition={loop ? {
                  duration: animationConfig.fullCycleDuration,
                  times: [0, startTime, endTime, resetTime, 1],
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatDelay: 0,
                } : {
                  duration: animationDuration,
                  delay: i * animationConfig.staggerDelay,
                  ease: "easeInOut",
                }}
                style={{
                  willChange: 'auto',
                  transform: 'translateZ(0)'
                }}
              />
              
              {loop && (
                <motion.circle
                  r="4"
                  fill={lineColor}
                  initial={{ opacity: 0, cx: startPoint.x, cy: startPoint.y }}
                  animate={{
                    opacity: [0, 0, 1, 0, 0],
                    cx: [startPoint.x, startPoint.x, endPoint.x, endPoint.x, startPoint.x],
                    cy: [startPoint.y, startPoint.y, endPoint.y, endPoint.y, startPoint.y],
                  }}
                  transition={{
                    duration: animationConfig.fullCycleDuration,
                    times: [0, startTime, endTime, resetTime, 1],
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatDelay: 0,
                  }}
                />
              )}
            </g>
          );
        })}

        {projectedDots.map((dot, i) => {
          const { startPoint, endPoint } = dot;
          
          return (
            <g key={`points-group-${i}`}>
              {/* Start Point */}
              <g key={`start-${i}`}>
                <motion.g
                  onHoverStart={() => setHoveredLocation(dot.start.label || `Location ${i}`)}
                  onHoverEnd={() => setHoveredLocation(null)}
                  className="cursor-pointer"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
                  style={{ transformOrigin: `${startPoint.x}px ${startPoint.y}px` }}
                >
                  <circle
                    cx={startPoint.x}
                    cy={startPoint.y}
                    r="2"
                    fill={lineColor}
                    filter="url(#glow)"
                    className="drop-shadow-lg"
                  />
                  <motion.circle
                    cx={startPoint.x}
                    cy={startPoint.y}
                    r="2"
                    fill={lineColor}
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{
                      scale: [1, 6, 1],
                      opacity: [0.6, 0, 0.6]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      times: [0, 0.5, 1]
                    }}
                    style={{ transformOrigin: `${startPoint.x}px ${startPoint.y}px` }}
                  />
                </motion.g>
                
                {showLabels && dot.start.label && (
                  <motion.g
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 * i + 0.3, duration: 0.5, ease: "easeOut" }}
                    className="pointer-events-none"
                    style={{ willChange: 'transform, opacity' }}
                  >
                    <foreignObject
                      x={startPoint.x - 50}
                      y={startPoint.y - 35}
                      width="100"
                      height="30"
                      className="block"
                    >
                      <div className="flex items-center justify-center h-full">
                        <span className="text-[10px] font-normal py-0.5 rounded bg-white/90 dark:bg-black/90 text-black dark:text-white border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                          {dot.start.label}
                        </span>
                      </div>
                    </foreignObject>
                  </motion.g>
                )}
              </g>
              
              {/* End Point */}
              <g key={`end-${i}`}>
                <motion.g
                  onHoverStart={() => setHoveredLocation(dot.end.label || `Destination ${i}`)}
                  onHoverEnd={() => setHoveredLocation(null)}
                  className="cursor-pointer"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
                  style={{ transformOrigin: `${endPoint.x}px ${endPoint.y}px` }}
                >
                  <circle
                    cx={endPoint.x}
                    cy={endPoint.y}
                    r="2"
                    fill={lineColor}
                    filter="url(#glow)"
                    className="drop-shadow-lg"
                  />
                  <motion.circle
                    cx={endPoint.x}
                    cy={endPoint.y}
                    r="2"
                    fill={lineColor}
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{
                      scale: [1, 6, 1],
                      opacity: [0.6, 0, 0.6]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      times: [0, 0.5, 1],
                      delay: 0.5
                    }}
                    style={{ transformOrigin: `${endPoint.x}px ${endPoint.y}px` }}
                  />
                </motion.g>
                
                {showLabels && dot.end.label && (
                  <motion.g
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 * i + 0.5, duration: 0.5, ease: "easeOut" }}
                    className="pointer-events-none"
                    style={{ willChange: 'transform, opacity' }}
                  >
                    <foreignObject
                      x={endPoint.x - 50}
                      y={endPoint.y - 35}
                      width="100"
                      height="30"
                      className="block"
                    >
                      <div className="flex items-center justify-center h-full">
                        <span className="text-[10px] font-normal py-0.5 rounded bg-white/90 dark:bg-black/90 text-black dark:text-white border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                          {dot.end.label}
                        </span>
                      </div>
                    </foreignObject>
                  </motion.g>
                )}
              </g>
            </g>
          );
        })}
      </svg>
      
      {/* Mobile Tooltip */}
      <AnimatePresence>
        {hoveredLocation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 left-4 bg-white/90 dark:bg-black/90 text-black dark:text-white px-3 py-2 rounded-lg text-sm font-medium backdrop-blur-sm sm:hidden border border-gray-200 dark:border-gray-700"
          >
            {hoveredLocation}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}