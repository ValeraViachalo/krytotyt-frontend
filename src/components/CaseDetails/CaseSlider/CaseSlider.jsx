"use client";
import React, { useState, useRef } from "react";

import "./CaseSlider.scss";
import useIsMobile from "@/lib/helpers/useIsMobile";
import Image from "next/image";

export default function CaseSlider({ data }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const isMobile = useIsMobile();

  const visibleSlides = isMobile ? 1 : 5; // Adjust the number of visible slides based on screen size

  const handlePrevSlide = () => {
    setActiveSlide((prev) =>
      prev === 0 ? data.length - visibleSlides : prev - 1,
    );
  };

  const handleNextSlide = () => {
    setActiveSlide((prev) =>
      prev === data.length - visibleSlides ? 0 : prev + 1,
    );
  };

  // Touch drag logic for mobile
  const touchStartX = useRef(null);
  const touchDeltaX = useRef(0);

  const onTouchStart = (e) => {
    if (!isMobile) return;
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const onTouchMove = (e) => {
    if (!isMobile || touchStartX.current === null) return;
    const currentX = e.touches[0].clientX;
    touchDeltaX.current = currentX - touchStartX.current;
    // optional: prevent vertical scroll when horizontal swipe larger than threshold
  };

  const onTouchEnd = () => {
    if (!isMobile || touchStartX.current === null) {
      touchStartX.current = null;
      touchDeltaX.current = 0;
      return;
    }

    const delta = touchDeltaX.current;
    const threshold = 50; // px needed to trigger slide change

    if (delta < -threshold) {
      handleNextSlide();
    } else if (delta > threshold) {
      handlePrevSlide();
    }

    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  const transform = isMobile
    ? `translateX(-${activeSlide * 20.25}em)`
    : `translateX(-${activeSlide * 20.25}em)`;

  return (
    <section className="case-slider container">
      <div
        className="case-slider-scroll"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="case-slider-list"
          style={{ transform }}
        >
          {data.map((image, index) => (
            <div key={index} className="case-slider-item">
              <img
                src={image?.imageUrl}
                alt={`case-slider-${index}`}
                className="case-slider-image"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="arrows">
        <button className="arrow arrow--prev" onClick={handlePrevSlide}>
          <Image
            src="/assets/icon/arrow-bg.svg"
            width={48}
            height={48}
            alt="arrow-right"
            className="arrow__icon"
          />
        </button>
        <button className="arrow arrow--next" onClick={handleNextSlide}>
          <Image
            src="/assets/icon/arrow-bg.svg"
            width={48}
            height={48}
            alt="arrow-right"
            className="arrow__icon"
          />
        </button>
      </div>
    </section>
  );
}
