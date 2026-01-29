import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive design
 * Returns current breakpoint and device type information
 */
export const useResponsive = () => {
  const [state, setState] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isLargeDesktop: false,
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    orientation: typeof window !== 'undefined' 
      ? (window.innerWidth > window.innerHeight ? 'landscape' : 'portrait')
      : 'portrait',
    breakpoint: 'mobile'
  });

  useEffect(() => {
    const updateState = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const orientation = width > height ? 'landscape' : 'portrait';

      let breakpoint = 'mobile';
      let isMobile = true;
      let isTablet = false;
      let isDesktop = false;
      let isLargeDesktop = false;

      if (width >= 1536) {
        breakpoint = '2xl';
        isLargeDesktop = true;
        isDesktop = true;
        isMobile = false;
      } else if (width >= 1280) {
        breakpoint = 'xl';
        isDesktop = true;
        isMobile = false;
      } else if (width >= 1024) {
        breakpoint = 'lg';
        isDesktop = true;
        isMobile = false;
      } else if (width >= 768) {
        breakpoint = 'md';
        isTablet = true;
        isMobile = false;
      } else if (width >= 480) {
        breakpoint = 'sm';
      } else {
        breakpoint = 'xs';
      }

      setState({
        isMobile,
        isTablet,
        isDesktop,
        isLargeDesktop,
        width,
        height,
        orientation,
        breakpoint
      });
    };

    updateState();

    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateState, 150);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', updateState);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', updateState);
    };
  }, []);

  return state;
};

/**
 * Hook to detect if device supports touch
 */
export const useTouch = () => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0
      );
    };

    checkTouch();
  }, []);

  return isTouch;
};

/**
 * Hook to detect device orientation
 */
export const useOrientation = () => {
  const [orientation, setOrientation] = useState(
    typeof window !== 'undefined'
      ? window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
      : 'portrait'
  );

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(
        window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
      );
    };

    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return orientation;
};

/**
 * Hook to get safe area insets (iOS notch support)
 */
export const useSafeArea = () => {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  });

  useEffect(() => {
    const updateSafeArea = () => {
      if (CSS.supports('padding-top: env(safe-area-inset-top)')) {
        const style = getComputedStyle(document.documentElement);
        setSafeArea({
          top: parseInt(style.getPropertyValue('env(safe-area-inset-top)')) || 0,
          right: parseInt(style.getPropertyValue('env(safe-area-inset-right)')) || 0,
          bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)')) || 0,
          left: parseInt(style.getPropertyValue('env(safe-area-inset-left)')) || 0
        });
      }
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);

    return () => window.removeEventListener('resize', updateSafeArea);
  }, []);

  return safeArea;
};

/**
 * Hook to detect if user prefers reduced motion
 */
export const usePrefersReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};
