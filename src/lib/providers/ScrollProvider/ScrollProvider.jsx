"use client"
import React, {
  useEffect,
  useState,
} from "react";
import { ScrollContext } from "./context";
import { ScrollBar } from "@/utils/ScrollBar/ScrollBar";

function easeInOutExpo(x) {
  return x === 0
    ? 0
    : x === 1
    ? 1
    : x < 0.5
    ? Math.pow(2, 20 * x - 10) / 2
    : (2 - Math.pow(2, -20 * x + 10)) / 2;
}

export const ScrollProvider = ({ children, scrollBar = false, wrapper }) => {
  const [lenis, setLenis] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("lenis").then((LenisModule) => {
        const lenisInstance = new LenisModule.default({
          duration: 0.7,
          lerp: 0.1,
          smoothWheel: true,
          wheelMultiplier: 2,
          wrapper: wrapper ? document.querySelector(wrapper) : window,
        });

        setLenis(lenisInstance);

        function raf(time) {
          lenisInstance.raf(time);
          requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        return () => {
          lenisInstance.destroy();
        };
      });
    }
  }, []);

  // Add click event listener for data-scroll-anchor elements
  useEffect(() => {
    const handleClick = (e) => {
      const scrollTrigger = e.target.closest('[data-scroll-anchor]');
      if (scrollTrigger) {
        // Prevent default behavior and event propagation
        e.preventDefault();
        e.stopPropagation();
        
        const targetSection = scrollTrigger.getAttribute('data-scroll-anchor');
        const targetElement = document.querySelector(targetSection);
        if (targetElement) {
          scrollTo(targetElement);
        }
      }
    };

    // Use capture phase to ensure we handle the event before other listeners
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [lenis]);

  const scrollTo = (target) => {
    if (lenis) {
      lenis.scrollTo(target, {
        duration: 1.7,
        easing: (x) => easeInOutExpo(x),
      });
    }
  };

  const rangeScrollTo = (progress) => {
    if (lenis) {
      lenis.scrollTo(progress, {
        duration: 1.5,
      });
    }
  };

  return (
    <ScrollContext.Provider value={{ scrollTo, rangeScrollTo }}>
      {scrollBar && <ScrollBar />}
      {children}
    </ScrollContext.Provider>
  );
};