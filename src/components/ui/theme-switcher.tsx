'use client';

import { cn } from '@/lib/utils';
import { Monitor, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useThemeAnimation } from '@space-man/react-theme-animation'

const themes = [
  {
    key: 'system',
    icon: Monitor,
    label: 'System theme',
  },
  {
    key: 'light',
    icon: Sun,
    label: 'Light theme',
  },
  {
    key: 'dark',
    icon: Moon,
    label: 'Dark theme',
  },
];

export type ThemeSwitcherProps = {
  className?: string;
};

export const ThemeSwitcher = ({ className }: ThemeSwitcherProps) => {
  const { theme, toggleTheme, ref } = useThemeAnimation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      className={cn(
        'relative flex h-8 items-center rounded-full bg-transparent p-1 ring-1 ring-border/50',
        className
      )}
      role="toolbar"
      aria-label="Theme switcher"
    >
      {themes.map(({ key, icon: Icon, label }) => {
        const isActive = theme === key

        return (
          <button
            type="button"
            key={key}
            className="relative h-6 w-6 rounded-full hover:bg-gray-200/50 dark:hover:bg-gray-800/50 transition-colors"
            onClick={() => toggleTheme()}
            aria-label={label}
          >
            {isActive && (
              <motion.div
                layoutId="activeTheme"
                className="absolute inset-0 rounded-full bg-primary dark:bg-primary/80"
                transition={{ type: 'spring', duration: 0.5 }}
              />
            )}
            <Icon
              className={cn(
                'relative m-auto h-4 w-4 transition-all duration-200',
                isActive 
                  ? 'text-primary-foreground scale-110' 
                  : 'text-muted-foreground/60 hover:text-muted-foreground/90 dark:text-muted-foreground dark:hover:text-foreground/90 hover:scale-105'
              )}
            />

          </button>
        )
      })}
    </div>
  )
}