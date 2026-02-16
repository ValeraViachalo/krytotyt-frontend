import { useState, useEffect } from 'react';

const useIsMobile = (aspectRatio = '2/3') => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsDesktop = () => {
      if (typeof window !== 'undefined') {
        const mediaQuery = window.matchMedia(`(max-aspect-ratio: ${aspectRatio})`);
        setIsMobile(mediaQuery.matches);
      }
    };

    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);

    return () => window.removeEventListener('resize', checkIsDesktop);
  }, [aspectRatio]);

  return isMobile;
};

export default useIsMobile