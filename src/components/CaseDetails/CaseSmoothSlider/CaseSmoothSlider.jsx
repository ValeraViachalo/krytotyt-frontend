import { useEffect, useRef, useState } from "react";
import Core, { lerp } from "smooothy";
import gsap from "gsap";
import "./CaseSmoothSlider.scss";
import Image from "next/image";
import useIsMobile from "@/lib/helpers/useIsMobile";

/** hook */
export function useSmooothy(config) {
  const sliderRef = useRef(null);
  const [slider, setSlider] = useState(null);

  const refCallback = (node) => {
    if (node && !slider) {
      const instance = new Core(node, config);
      gsap.ticker.add(instance.update.bind(instance));
      setSlider(instance);
    }
    sliderRef.current = node;
  };

  useEffect(() => {
    return () => {
      if (slider) {
        gsap.ticker.remove(slider.update.bind(slider));
        slider.destroy();
      }
    };
  }, [slider]);

  return { ref: refCallback, slider };
}

/** component */

export default function CaseSmoothSlider({ data }) {
  const imageRefs = useRef([]);
  const loadedCount = useRef(0);
  const isMobile = useIsMobile();  

  const { ref, slider } = useSmooothy({
    variableWidth: true,
    lerpFactor: isMobile ? 0.1 : 0.2,
    scrollSensitivity: 0.2,
    dragSensitivity: 0.2,
    onUpdate: () => {
      const viewportCenter = window.innerWidth / 2;
      imageRefs.current.forEach((el) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const elCenter = rect.left + rect.width / 2;
        const diff = elCenter - viewportCenter;
        const t = Math.min(Math.abs(diff) / viewportCenter, 1);
        const sign = diff > 0 ? -1 : 1;
        const scale = 1 - t * 0.15; // 1 at center → 0.8 at edges
        const x = sign * t * 5; // pushes toward center from both sides
        gsap.set(el, { scale, xPercent: x });
      });
    },
  });

  // Resize slider once all images have loaded so sizes are correct
  const handleImageLoad = () => {
    loadedCount.current += 1;
    if (loadedCount.current >= data.length && slider) {
      slider.resize();
    }
  };

  // Also resize after a short delay as a safety net (e.g. cached images)
  useEffect(() => {
    if (!slider) return;
    const id = setTimeout(() => slider.resize(), 100);
    return () => clearTimeout(id);
  }, [slider]);

  return (
    <div className="case-slider">
      <div className="smooth-slider" ref={ref}>
        {data.map((slide, i) => (
          <div key={i} className="smooth-slider__slide"
            onClick={() => slider.goToIndex(i)}
          >
            <div className="smooth-slider__slide-inner">
              <img
                ref={(el) => (imageRefs.current[i] = el)}
                src={slide?.imageUrl}
                alt={`Slide ${i}`}
                className="smooth-slider__slide-image"
                onLoad={handleImageLoad}
                style={{ 
                  aspectRatio: `${slide?.width} / ${slide?.height}`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="arrows">
        <button className="arrow arrow--prev" onClick={() => slider.goToPrev()}>
          <Image
            src="/assets/icon/arrow-bg.svg"
            width={48}
            height={48}
            alt="arrow-right"
            className="arrow__icon"
          />
        </button>
        <button className="arrow arrow--next" onClick={() => slider.goToNext()}>
          <Image
            src="/assets/icon/arrow-bg.svg"
            width={48}
            height={48}
            alt="arrow-right"
            className="arrow__icon"
          />
        </button>
      </div>
    </div>
  );
}
