import { useScroll, useSpring, motion, useTransform } from "framer-motion";
import { useContext, useEffect, useState } from "react";
import { useScrollLenis } from "@/lib/providers/ScrollProvider/ScrollProvider";
import { ScrollContext } from "@/lib/providers/ScrollProvider/context";

import "./ScrollBar.scss";
import { usePathname } from "next/navigation";

export const ScrollBar = () => {
  const [rangeValue, setRangeValue] = useState(0);
  const [documentHeight, setDocumentHeight] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const path = usePathname();

  const { scrollYProgress } = useScroll();
  const scrollSpring = useSpring(scrollYProgress, {
    stiffness: 1000,
    damping: 100,
  });
  const y = useTransform(scrollSpring, [0, 1], ["0%", "-100%"]);
  const top = useTransform(scrollSpring, [0, 1], ["0%", "100%"]);

  const { rangeScrollTo } = useContext(ScrollContext);

  useEffect(() => {
    setIsMounted(true);
    setDocumentHeight(
      document.documentElement.scrollHeight - window.innerHeight
    );
  }, [path]);

  const handleRangeChange = (e) => {
    const value = e.target.value;
    setRangeValue(value);
    const scrollTo = (documentHeight * value) / 100;
    rangeScrollTo(scrollTo);
  };

  useEffect(() => {
    const unsubscribe = scrollYProgress.onChange((v) => {
      setRangeValue(v * 100);
    });
    return () => unsubscribe();
  }, [scrollYProgress, path]);

  return (
    <div className="progressBar" data-desktop-element>
      <motion.div className="progressBar__bar" style={{ top, y }} />
      <input
        type="range"
        min="0"
        max="100"
        value={rangeValue}
        onChange={handleRangeChange}
        className="progressBar__range"
      />
    </div>
  );
};
