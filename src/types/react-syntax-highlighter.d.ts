declare module 'react-syntax-highlighter' {
  import React from 'react';
  
  export const Prism: React.ComponentType<any>;
  export const Light: React.ComponentType<any>;
}

declare module 'react-syntax-highlighter/dist/cjs/styles/prism' {
  export const vscDarkPlus: any;
  export const vs: any;
}

declare module 'next-themes' {
  export const useTheme: () => {
    theme: string | undefined;
    setTheme: (theme: string) => void;
    resolvedTheme: string | undefined;
  };
  
  export const ThemeProvider: React.FC<{
    attribute?: string;
    defaultTheme?: string;
    enableSystem?: boolean;
    children: React.ReactNode;
  }>;
}
