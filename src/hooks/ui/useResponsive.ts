import { useState, useEffect } from 'react';

interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isLaptop: boolean;
  isDesktop: boolean;
  width: number;
}

export function useResponsive(): ResponsiveState {
  const [responsive, setResponsive] = useState<ResponsiveState>({
    isMobile: false,
    isTablet: false,
    isLaptop: false,
    isDesktop: false,
    width: 0,
  });

  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;
      setResponsive({
        isMobile: width < 640,
        isTablet: width >= 640 && width < 1024,
        isLaptop: width >= 1024 && width < 1280,
        isDesktop: width >= 1280,
        width,
      });
    };

    // Initial check
    checkDeviceType();

    // Add resize listener
    window.addEventListener('resize', checkDeviceType);

    return () => {
      window.removeEventListener('resize', checkDeviceType);
    };
  }, []);

  return responsive;
}