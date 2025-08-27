'use client';

import React, { useState } from 'react';

interface TopicCardProps {
  topic: {
    id: string;
    shade: string;
    title: string;
    subtitle: string;
  };
  isActive: boolean;
  isMobile?: boolean; // Make this optional
  onClick: () => void;
}

// SVG icon components for tech stacks
// Define a type for the keys of TechIcons
type TechIconKey = keyof typeof TechIcons;

const TechIcons = {
  JavaScript: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path fill="#F7DF1E" d="M100 0H0v100h100z"/><path fill="#000" d="M67.175 78.125c2.014 3.29 4.634 5.707 9.27 5.707 3.893 0 6.38-1.946 6.38-4.635 0-3.222-2.555-4.364-6.84-6.238l-2.35-1.008c-6.781-2.89-11.286-6.508-11.286-14.159 0-7.047 5.37-12.413 13.762-12.413 5.975 0 10.27 2.08 13.365 7.524l-7.317 4.699c-1.612-2.89-3.35-4.027-6.048-4.027-2.752 0-4.497 1.746-4.497 4.027 0 2.819 1.746 3.96 5.778 5.706l2.35 1.006c7.983 3.424 12.491 6.915 12.491 14.762 0 8.46-6.646 13.096-15.571 13.096-8.727 0-14.365-4.16-17.124-9.61zm-33.196.815c1.477 2.619 2.82 4.833 6.048 4.833 3.087 0 5.035-1.208 5.035-5.905V45.916h9.397v32.08c0 9.73-5.705 14.158-14.032 14.158-7.524 0-11.881-3.894-14.097-8.583z"/>
    </svg>
  ),
  React: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="-11.5 -10.23174 23 20.46348" fill="none" stroke="currentColor" strokeWidth="1" className="w-6 h-6">
      <circle cx="0" cy="0" r="2.05" fill="currentColor"/>
      <g stroke="currentColor">
        <ellipse rx="11" ry="4.2"/>
        <ellipse rx="11" ry="4.2" transform="rotate(60)"/>
        <ellipse rx="11" ry="4.2" transform="rotate(120)"/>
      </g>
    </svg>
  ),
  TypeScript: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M21 16V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z"></path>
      <path d="M12 9v6"></path><path d="M10 9h4"></path>
    </svg>
  ),
  Python: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M10.5 18H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2.5"></path>
      <path d="M13.5 6H16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.5"></path>
      <circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="12" r="1"></circle>
      <circle cx="8" cy="10" r="1" fill="currentColor"></circle><circle cx="16" cy="14" r="1" fill="currentColor"></circle>
    </svg>
  ),
  Node: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
    </svg>
  ),
  Docker: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M22 12.5c0-1.2-1.3-2-2.8-2H5.8C4.3 10.5 3 11.3 3 12.5S4.3 14.5 5.8 14.5h15.4c1.5 0 2.8-.8 2.8-2zM4.5 10.5V9m3 1.5V9m3 1.5V9m3 1.5V9m-4.5-3V4.5m3 1.5V4.5m3 1.5V4.5"></path>
      <path d="M17.5 14.5c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5H12c0 2.2 1.8 4 4 4s4-1.8 4-4h-2.5z"></path>
    </svg>
  ),
  GraphQL: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M12 2v20"></path><path d="M2 12h20"></path>
      <path d="M5.64 5.64l12.72 12.72"></path><path d="M18.36 5.64L5.64 18.36"></path>
      <circle cx="12" cy="12" r="3.5" fill="currentColor"></circle>
    </svg>
  ),
  MongoDB: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.9c-3.96 0-3.96-7.8 0-7.8s3.96 7.8 0 7.8z" fill="currentColor" opacity="0.4"></path>
      <path d="M11 9.1c0-3.96 3.96-3.96 3.96 0 0 3.96-3.96 3.96-3.96 0z" fill="currentColor"></path>
    </svg>
  ),
  CSS: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M4 3l1.5 16.5L12 21l6.5-1.5L20 3H4z"></path>
      <path d="M8.5 7H15l-.5 4.5h-5l-.5 5L12 18l3-1.5.5-4.5h-5"></path>
    </svg>
  ),
  HTML: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M4 3l1.5 16.5L12 21l6.5-1.5L20 3H4z"></path>
      <path d="M8.5 7h7L15 12h-5l-.5 2.5 4 1 4-1 .5-4.5h-7L8.5 7z"></path>
    </svg>
  ),
  Git: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M12 8l-4 4 4 4"></path><path d="M12 12h8"></path>
    </svg>
  ),
  Redux: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 2a10 10 0 100 20 10 10 0 100-20z"></path>
      <path d="M12 12c-2.333 4.667-7 2.333-7-2.333S9.667 5 12 5s4.667 2.333 4.667 4.667c0 4.666-2.333 7-4.667 7z"></path>
      <path d="M12 12c2.333-4.667 7-2.333 7 2.333s-2.333 7-7 7-7-2.333-7-7c0-4.666 4.667-7 7-7z"></path>
    </svg>
  ),
  'System Design': () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
      <path d="M10 6.5h4m-4 11h4m-7.5-7.5v4m11-4v4"></path>
    </svg>
  ),
  'Data Structures': () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 12l-4-4 4-4 4 4-4 4zm0 0l-4 4 4 4 4-4-4-4z"></path>
      <path d="M12 2v2m0 16v2m8-10h2M2 12h2"></path>
    </svg>
  ),
  'Algorithms': () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 20.5V12l-6 4.5V12l6-4.5v11zM18 16.5V12l-6 4.5V21l6-4.5zM12 3.5v4l6 3v-4l-6-3zM6 8.5v4l6 3v-4l-6-3z"></path>
    </svg>
  ),
  'Web Performance': () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 2a10 10 0 100 20 10 10 0 100-20z"></path>
      <path d="M12 6v6l4 2"></path><path d="M19.07 4.93l-1.41 1.41"></path>
    </svg>
  ),
  'Machine Learning': () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 2048 2048"><path fill="currentColor" d="M1968 1095q38 36 59 84t21 101q0 53-20 99t-55 82t-81 55t-100 20q-21 0-42-3l-471 235q1 6 1 12t0 12q0 53-20 99t-55 82t-81 55t-100 20q-52 0-98-20t-82-54t-56-81t-21-98v-13q0-6 2-14l-471-235q-21 3-42 3q-53 0-99-20t-82-55t-55-81t-20-100q0-71 36-131t99-94l175-642q-54-69-54-157q0-53 20-99t55-82t81-55T512 0q69 0 128 34t94 94h580q35-60 94-94t128-34q53 0 99 20t82 55t55 81t20 100q0 42-13 81t-39 73l228 685zm-432 185q0-55 22-105t64-86l-449-337l-663 497l2 31h1024zM512 512q-47 0-92-17l-144 530q55 5 103 31t82 70l606-454l-350-262q-37 48-90 75t-115 27zm1241 515q8-2 18-2t19-1h10q5 0 10 1l-177-532q-49 19-97 19q-20 0-39-3l-217 163l473 355zm-217-899q-27 0-50 10t-40 27t-28 41t-10 50q0 27 10 50t27 40t41 28t50 10q27 0 50-10t40-27t28-41t10-50q0-27-10-50t-27-40t-41-28t-50-10zm-256 128H768l-2 31l407 305l193-145q-42-36-64-86t-22-105zM512 128q-27 0-50 10t-40 27t-28 41t-10 50q0 27 10 50t27 40t41 28t50 10q27 0 50-10t40-27t28-41t10-50q0-27-10-50t-27-40t-41-28t-50-10zM128 1280q0 27 10 50t27 40t41 28t50 10q27 0 50-10t40-27t28-41t10-50q0-27-10-50t-27-40t-41-28t-50-10q-27 0-50 10t-40 27t-28 41t-10 50zm896 640q27 0 50-10t40-27t28-41t10-50q0-27-10-50t-27-40t-41-28t-50-10q-27 0-50 10t-40 27t-28 41t-10 50q0 27 10 50t27 40t41 28t50 10zm0-384q63 0 119 29t92 82l375-187q-11-12-21-25t-19-27H478q-8 14-18 27t-22 25l375 187q35-52 91-81t120-30zm768-128q27 0 50-10t40-27t28-41t10-50q0-33-16-62t-44-46l-1 1l-1-1l1-1q-32-19-67-19q-27 0-50 10t-40 27t-28 41t-10 50q0 27 10 50t27 40t41 28t50 10z"/>
    </svg>
  ),
  Security: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      <path d="M12 12l4-4m-4 4l-4-4m4 4v5"></path>
    </svg>
  ),
  Microservices: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <circle cx="6" cy="6" r="3"></circle><circle cx="18" cy="6" r="3"></circle>
      <circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="18" r="3"></circle>
      <path d="M9 6h6m-6 12h6m-9-6v-6m0 12v-6m12-6v6m0 6v-6"></path>
    </svg>
  ),
  'Cloud Computing': () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M18 10h-1.26A8 8 0 104 16.25"></path>
      <path d="M16 16.5A4.5 4.5 0 1022 12c0-1.54-.78-2.9-2-3.75"></path>
    </svg>
  ),
  Databases: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
    </svg>
  ),
  Networking: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <circle cx="12" cy="12" r="2"></circle>
      <path d="M12 2v2m0 16v2m-7.07-7.07L6.34 8.34m9.32 9.32l-1.41-1.41"></path>
      <path d="M2 12h2m16 0h2m-7.07-5.66l-1.41-1.41M19.07 4.93l-1.41 1.41"></path>
      <path d="M4.93 19.07l1.41-1.41m9.32-9.32l1.41-1.41"></path>
    </svg>
  ),
  'Operating Systems': () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <rect x="3" y="14" width="18" height="6" rx="2"></rect>
      <path d="M12 14v-4m-4 4v-4m8 4v-4"></path>
      <path d="M12 10V4H8v6m8-6h-4v6"></path>
    </svg>
  ),
  'Object-Oriented Programming': () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 2l-5.5 9h11L12 2z"></path>
      <circle cx="12" cy="17" r="4"></circle>
      <path d="M4 22h16"></path>
    </svg>
  ),
  'Functional Programming': () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 3v18M18 9l-6 6-6-6"></path>
      <path d="M3 15h18"></path>
    </svg>
  ),
  Concurrency: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M16 4h2a2 2 0 012 2v12a2 2 0 01-2 2h-2"></path>
      <path d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h2"></path>
      <path d="M12 2v20"></path>
    </svg>
  ),
  Testing: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
      <path d="M9 12l2 2 4-4"></path>
    </svg>
  ),
  DevOps: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 2a10 10 0 100 20 10 10 0 100-20z"></path>
      <path d="M12 8l4 4-4 4-4-4 4-4z"></path>
      <path d="M8 12h8"></path>
    </svg>
  ),
  'Frontend Development': () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <rect x="2" y="3" width="20" height="18" rx="2"></rect>
      <path d="M6 8h12M6 12h12M6 16h6"></path>
    </svg>
  ),
  'Backend Development': () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <rect x="2" y="14" width="20" height="8" rx="2"></rect>
      <path d="M6 18h.01M10 18h.01M14 18h.01"></path>
      <path d="M2 10V6a2 2 0 012-2h16a2 2 0 012 2v4"></path>
      <path d="M6 6h.01M10 6h.01"></path>
    </svg>
  ),
  'Mobile Development': () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <rect x="7" y="2" width="10" height="20" rx="2" ry="2"></rect>
      <path d="M12 18h.01"></path>
    </svg>
  ),
  'API Development': () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M4 14.5h16M4 9.5h16M14.5 4L20 9.5 14.5 15M9.5 9L4 14.5 9.5 20"></path>
    </svg>
  ),
  Kubernetes: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 12l-8-4 8-4 8 4-8 4z"></path>
      <path d="M4 12l8 4 8-4m-8 4v8"></path>
    </svg>
  ),
  AWS: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 2a10 10 0 00-7.07 17.07A10 10 0 1019.07 4.93 9.93 9.93 0 0012 2z"></path>
      <path d="M7.05 14.24A5.5 5.5 0 0112 8a5.5 5.5 0 015.45 7.05"></path>
      <path d="M12 22a5.5 5.5 0 01-4.95-8.95"></path>
      <path d="M16.95 14.24A5.5 5.5 0 0112 22"></path>
    </svg>
  ),
  Azure: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 2l-8.5 8.5L12 19l8.5-8.5L12 2z"></path>
      <path d="M2 12h20M12 2v20"></path>
    </svg>
  ),
  'Google Cloud': () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M18 10h-1.26A8 8 0 104 16.25"></path>
      <path d="M16 16.5A4.5 4.5 0 1022 12c0-1.54-.78-2.9-2-3.75"></path>
    </svg>
  ),
  Linux: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 2a10 10 0 100 20 10 10 0 100-20z"></path>
      <path d="M12 12a4 4 0 100-8 4 4 0 000 8z"></path>
      <path d="M12 12v6a2 2 0 002 2h0a2 2 0 002-2v-6"></path>
    </svg>
  ),
  Windows: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M2 12h20M12 2v20"></path>
      <path d="M2 7l10 5 10-5M2 17l10-5 10 5"></path>
    </svg>
  ),
  PostgreSQL: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"></path>
      <path d="M12 12v10m0-10H2m10 0h10M5.64 5.64L2 12l3.64 6.36"></path>
    </svg>
  ),
  MySQL: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
      <path d="M15 12l-3-3-3 3"></path>
    </svg>
  ),
  default: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 2a10 10 0 100 20 10 10 0 100-20z"></path>
      <path d="M12 12v-4M12 16h.01"></path>
    </svg>
  )
};

// Update the techIcons mapping to use the new SVG components


// Helper function to get color with opacity
const getColorWithOpacity = (shade: string, opacity: number) => {
  // Map of Tailwind color classes to their hex values
  const colorMap: Record<string, string> = {
    'bg-red-600': '#dc2626',
    'bg-red-700': '#b91c1c',
    'bg-yellow-500': '#eab308',
    'bg-orange-500': '#f97316',
    'bg-amber-600': '#d97706',
    'bg-lime-600': '#65a30d',
    'bg-green-600': '#16a34a',
    'bg-emerald-600': '#059669',
    'bg-teal-600': '#0d9488',
    'bg-cyan-600': '#0891b2',
    'bg-sky-600': '#0284c7',
    'bg-blue-600': '#2563eb',
    'bg-indigo-600': '#4f46e5',
    'bg-violet-600': '#7c3aed',
    'bg-purple-600': '#9333ea',
    'bg-fuchsia-600': '#c026d3',
    'bg-pink-600': '#db2777',
    'bg-rose-600': '#e11d48',
  };

  const hexColor = colorMap[shade] || '#000000';
  return `${hexColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
};

export default function TopicCard({ topic, isActive, onClick }: TopicCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const IconComponent = TechIcons[topic.title as TechIconKey] || TechIcons.default;

  // The active card shouldn't have a hover effect, it's already highlighted
  const showHoverEffect = isHovered && !isActive;

  return (
    <div
      key={topic.id}
      className={`
        group relative flex-shrink-0 w-[70px] h-[130px] sm:w-[120px] sm:h-[180px] md:w-[160px] md:h-[220px] rounded-xl overflow-hidden
        transition-all duration-400 ease-[cubic-bezier(0.25,0.1,0.25,1)] cursor-pointer
        ${isActive ? 'z-10 shadow-xl' : 'z-0 shadow-lg'}
        ${showHoverEffect ? 'z-20 shadow-xl scale-105' : ''}
        backdrop-blur-md
        will-change-transform,opacity,box-shadow
      `}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Base background - dark in light mode, white in dark mode */}
      <div className="absolute inset-0 bg-gray-900 dark:bg-black transition-all duration-300"></div>

      {/* Colored overlay with gradient */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${isActive ? 'opacity-50 dark:opacity-60' : 'opacity-30 dark:opacity-40'}`}
        style={{
          background: `radial-gradient(circle at center 40%,
                      ${getColorWithOpacity(topic.shade, 1)} 0%,
                      transparent 70%)`
        }}
      ></div>

      {/* Glass effect border */}
      <div className="absolute inset-0 border border-white/10 dark:border-white/10 rounded-xl"></div>

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)`,
          backgroundSize: '8px 8px'
        }}
      ></div>

      {/* Subtle glow effect */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          boxShadow: `inset 0 0 30px ${getColorWithOpacity(topic.shade, 0.5)}`
        }}
      ></div>

      {/* Hover state overlay */}
      <div
        className={`absolute inset-0 bg-white dark:bg-white transition-opacity duration-500 ease-out ${
          showHoverEffect ? 'opacity-10' : 'opacity-0'
        }`}
      ></div>

      {/* Card content with icon and text */}
      <div className="absolute inset-0 flex flex-col items-center justify-start pt-6 pb-4 px-4 text-white">
        {/* Icon container with glow effect */}
        <div
          className={`
            w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mb-2 sm:mb-3 md:mb-4 flex items-center justify-center rounded-full
            ${isActive ? 'scale-110' : 'scale-100'}
            transition-all duration-300 animate-pulse-slow
          `}
          style={{
            background: `radial-gradient(circle at center,
                        ${getColorWithOpacity(topic.shade, 0.8)} 0%,
                        ${getColorWithOpacity(topic.shade, 0.4)} 50%,
                        transparent 70%)`,
            boxShadow: `0 0 30px ${getColorWithOpacity(topic.shade, 0.6)}`
          }}
        >
          {/* Tech icon */}
          <div className="text-xl sm:text-2xl md:text-4xl transition-transform duration-400 ease-out group-hover:scale-110">
            {IconComponent && <IconComponent />}
          </div>
        </div>

        {/* Text content */}
        <div className="text-center mt-2">
          <h3 className="text-[10px] sm:text-xs md:text-base font-medium transition-all duration-300 group-hover:translate-y-[-1px]">
            {topic.title}
          </h3>
          <div className={`mt-0.5 sm:mt-1 text-[9px] sm:text-[10px] md:text-xs text-gray-400 transition-all duration-400 ease-out overflow-visible whitespace-normal leading-tight ${
            showHoverEffect ? 'opacity-100' : 'opacity-0 h-0'
          }`}>
            {topic.subtitle}
          </div>
        </div>

        {/* Active indicator */}
        {isActive && (
          <div className="absolute bottom-3 w-1 h-1 rounded-full bg-white animate-pulse"></div>
        )}
      </div>
    </div>
  );
}