
import Link from 'next/link';
import { AnchorHTMLAttributes, ReactNode } from 'react';

interface Button1Props extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
  href: string;
}

export const Button1 = ({ children, href, className, ...props }: Button1Props) => {
  // Filter out undefined properties to satisfy exactOptionalPropertyTypes
  const filteredProps = Object.fromEntries(
    Object.entries(props).filter(([_, value]) => value !== undefined)
  );

  return (
    <div className="relative inline-flex items-center justify-center gap-4 group">
      <div className="absolute inset-0 duration-1000 opacity-60 transition-all bg-gradient-to-r from-indigo-500 via-pink-500 to-yellow-400 rounded-md blur-lg filter group-hover:opacity-100 group-hover:duration-200"></div>
      <Link
        href={href}
        className={`group relative inline-flex items-center justify-center text-base rounded-md bg-gray-900 px-8 py-2 text-lg font-semibold text-white transition-all duration-200 hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5 hover:shadow-gray-600/30 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 dark:hover:shadow-gray-600/30 dark:border dark:border-gray-200/50 ${className}`}
        {...filteredProps}
      >
        {children}
        <svg
          viewBox="0 0 10 10"
          height="10"
          width="10"
          fill="none"
          className="mt-0.5 ml-2 -mr-1 stroke-white stroke-2 dark:stroke-gray-900"
        >
          <path d="M0 5h7" className="transition opacity-0 group-hover:opacity-100"></path>
          <path d="M1 1l4 4-4 4" className="transition group-hover:translate-x-[3px]"></path>
        </svg>
      </Link>
    </div>
  );
};