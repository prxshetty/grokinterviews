'use client';

import { cn } from '@/lib/utils';

interface LabSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
}

const LabSpinner = ({ className, text }: LabSpinnerProps) => {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className="lab-loader-container">
        <div className="lab-loader" />
        <style jsx>{`
          .lab-loader-container {
            padding: 20px;
          }
          .lab-loader {
            display: inline-block;
            vertical-align: middle;
            position: relative;
            /* margin: 10px; removed to let flexbox handle spacing */
            width: 10px;
            height: 20px;
            /* margin-left: 20px; */
            /* margin-right: 20px; */
            background: #3b82f6;
          }

          .lab-loader:before,
          .lab-loader:after {
            content: '';
            position: absolute;
          }

          .lab-loader:before {
            top: -8px;
            left: -13px;
            width: 0;
            height: 0;
            border: 18px solid transparent;
            border-bottom: 20px solid #3b82f6;
            border-radius: 3px;
          }

          .lab-loader:after {
            top: 0;
            left: 0;
            width: 4px;
            height: 4px;
            background: #3b82f6;
            border-radius: 50%;
            animation: loader-bubbles 1s linear infinite forwards;
          }

          @keyframes loader-bubbles {
            0% {
              box-shadow: 0 -10px #3b82f6,
                          3px 0 #3b82f6,
                          5px 0 #3b82f6;
            }

            30% {
              box-shadow: 3px -20px rgba(59, 130, 246, 0),
                          5px -10px #3b82f6,
                          5px 0 #3b82f6;
            }

            60% {
              box-shadow: 3px 0 rgba(59, 130, 246, 0),
                          4px -20px rgba(59, 130, 246, 0),
                          3px -10px #3b82f6;
            }

            61% {
              box-shadow: 3px 0 #3b82f6,
                          4px -20px rgba(59, 130, 246, 0),
                          3px -10px #3b82f6;
            }

            100% {
              box-shadow: 0 -10px #3b82f6,
                          4px -20px rgba(59, 130, 246, 0),
                          5px -20px rgba(59, 130, 246, 0);
            }
          }
        `}</style>
      </div>
      {text && (
        <p className="text-sm tracking-widest text-gray-600 dark:text-gray-400 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

export default LabSpinner;
