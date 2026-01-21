import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textClassName?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-12 h-12',
};

export function Logo({ className, size = 'md', showText = true, textClassName }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <svg
        className={cn('flex-shrink-0', sizeClasses[size])}
        viewBox="0 0 1200 1200"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
      >
        <g transform="scale(14.876031807216355) translate(-4.6666632758246545, -4.666666136847602)">
          <g fill="currentColor">
            <polygon points="71,48.7 71,18.2 54.8,9 38.7,9 63,22.8 63,36.7 63,53.3" />
            <polygon points="29,66 54.8,81 54.7,81 55.1,81.3 71.7,71.7 79.7,57.8 55.3,72 29,56.8" />
            <polygon points="61.2,57 61.3,57 46.9,65.2 54.8,69.8 81,54.5 81,35.2 73,21.3 73,49.8" />
            <polygon points="61,23.9 34.8,8.7 18.2,18.3 10.2,32.3 35,18 47,25 46.8,25 61,33.2" />
            <polygon points="35.2,20.3 9,35.6 9,54.8 17,68.7 17,40.2 28.8,33.2 28.8,33.2 43.2,24.9" />
            <polygon points="19,41.3 19,71.8 35.2,81 51.4,81 27,67.2 27,53.3 27,36.7" />
          </g>
        </g>
      </svg>
      {showText && (
        <span className={cn('font-normal tracking-tight', textClassName)}>
          Grok Interviews
        </span>
      )}
    </div>
  );
} 