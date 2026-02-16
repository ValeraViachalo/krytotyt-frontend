import { useState, useEffect } from 'react';

const useIsDesktop = (aspectRatio = '4/3') => {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkIsDesktop = () => {
      if (typeof window !== 'undefined') {
        const mediaQuery = window.matchMedia(`(min-aspect-ratio: ${aspectRatio})`);
        setIsDesktop(mediaQuery.matches);
      }
    };

    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);

    return () => window.removeEventListener('resize', checkIsDesktop);
  }, [aspectRatio]);

  return isDesktop;
};

export default useIsDesktop;