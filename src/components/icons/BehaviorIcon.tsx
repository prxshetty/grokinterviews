import React from 'react';

interface BehaviorIconProps {
  className?: string;
  size?: number;
}

export const BehaviorIcon: React.FC<BehaviorIconProps> = ({ className = "", size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Behavior/Interview icon - representing conversation/dialogue */}
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
        fill="currentColor"
      />
      <circle
        cx="8"
        cy="9"
        r="1.5"
        fill="currentColor"
        opacity="0.7"
      />
      <circle
        cx="16"
        cy="9"
        r="1.5"
        fill="currentColor"
        opacity="0.7"
      />
      <path
        d="M12 13c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
        fill="currentColor"
        opacity="0.5"
      />
    </svg>
  );
};
