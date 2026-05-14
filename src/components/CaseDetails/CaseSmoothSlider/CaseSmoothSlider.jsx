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

/** Extract the 11-char video id from any common YouTube url shape */
function getYouTubeId(url) {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:.*[?&]v=|embed\/|shorts\/|v\/))([A-Za-z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

/** component */

export default function CaseSmoothSlider({ data, videoUrl }) {
  const slideRefs = useRef([]);
  const containerRef = useRef(null);
  const loadedCount = useRef(0);
  const [allLoaded, setAllLoaded] = useState(false);
  const [playingVideoIndex, setPlayingVideoIndex] = useState(null);
  const isMobile = useIsMobile();

  const images = Array.isArray(data) ? data : [];
  const videoId = getYouTubeId(videoUrl);

  // The video, when present, is the first slide on mobile and the second slide
  // (after the first image) on desktop. The slider triples its slides to fake
  // an infinite loop, so the video copy must be part of that base set.
  const imageSlides = images.map((image) => ({ type: "image", ...image }));
  const videoPosition = isMobile ? 0 : 1;
  const baseSlides = videoId
    ? [
        ...imageSlides.slice(0, videoPosition),
        { type: "video", videoId },
        ...imageSlides.slice(videoPosition),
      ]
    : imageSlides;
  const slides = [...baseSlides, ...baseSlides, ...baseSlides];

  const { ref, slider } = useSmooothy({
    variableWidth: true,
    lerpFactor: isMobile ? 0.1 : 0.2,
    scrollInput: false,
    scrollSensitivity: 0.000002,
    dragSensitivity: 0.2,
    onUpdate: () => {
      const slides = slideRefs.current.filter(Boolean);
      if (slides.length === 0) return;

      const maxScale = 1.5;
      const G = 16; // gap between slides
      const cRect = containerRef.current?.getBoundingClientRect();
      if (!cRect) return;
      const centerX = cRect.left + cRect.width / 2;
      const maxDist = cRect.width * 0.7;

      const items = slides.map((slide) => {
        const inner = slide.querySelector(".smooth-slider__slide-inner");
        const r = slide.getBoundingClientRect();
        const W = r.width;
        const cx = r.left + W / 2;
        const dist = Math.abs(cx - centerX);
        const lin = Math.max(0, 1 - dist / maxDist);
        const t = lin * lin * (3 - 2 * lin); // smoothstep
        const scale = 1 + (maxScale - 1) * t;
        return { inner, W, cx, scale };
      });

      const sorted = [...items].sort((a, b) => a.cx - b.cx);
      if (sorted.length < 2) {
        if (sorted[0])
          gsap.set(sorted[0].inner, { scale: sorted[0].scale, x: 0 });
        return;
      }

      // Accumulate x-offsets to account for scaled sizes
      sorted[0].tx = 0;
      for (let i = 1; i < sorted.length; i++) {
        const p = sorted[i - 1],
          c = sorted[i];
        c.tx =
          p.tx +
          G -
          (p.W + c.W) / 2 +
          (p.scale * (p.W - G)) / 2 +
          (c.scale * (c.W - G)) / 2;
      }

      // Find the offset at the viewport center and re-center
      let txAtCenter = 0;
      const last = sorted[sorted.length - 1];
      if (last.cx <= centerX) {
        txAtCenter = last.tx;
      } else if (sorted[0].cx >= centerX) {
        txAtCenter = sorted[0].tx;
      } else {
        for (let i = 0; i < sorted.length - 1; i++) {
          if (sorted[i].cx <= centerX && sorted[i + 1].cx >= centerX) {
            const L = sorted[i],
              R = sorted[i + 1];
            const frac = (centerX - L.cx) / (R.cx - L.cx);
            txAtCenter = L.tx + (R.tx - L.tx) * frac;
            break;
          }
        }
      }

      for (const d of sorted) {
        gsap.set(d.inner, { scale: d.scale, x: d.tx - txAtCenter });
      }
    },
  });

  // Resize slider once all images have loaded so sizes are correct
  const handleImageLoad = () => {
    loadedCount.current += 1;
    if (loadedCount.current >= baseSlides.length && slider) {
      slider.resize();
    }
  };

  // Once slider is ready, jump to the middle copy and reveal
  useEffect(() => {
    if (!slider) return;
    // Resize and jump to the middle copy so infinite loop works both ways
    slider.resize();
    // slider.goToIndex(0);
    // Allow the slider to lerp to position before revealing
    const id = setTimeout(() => setAllLoaded(true), 300);
    return () => clearTimeout(id);
  }, [slider]);

  return (
    <div className={`case-slider${allLoaded ? ' is-loaded' : ''}`}>
      <div className="smooth-slider" ref={(node) => { ref(node); containerRef.current = node; }}>
        {slides.map((slide, i) => (
          <div key={i} className={`smooth-slider__slide${slide.type === "video" ? " smooth-slider__slide--video" : ""}`}
            ref={(el) => (slideRefs.current[i] = el)}
            onClick={() => slider.goToIndex(i)}
          >
            <div className="smooth-slider__slide-inner">
              {slide.type === "video" ? (
                <div className="smooth-slider__video">
                  {playingVideoIndex === i ? (
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${slide.videoId}?autoplay=1&rel=0`}
                      title="YouTube video"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <button
                      type="button"
                      className="smooth-slider__video-poster"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlayingVideoIndex(i);
                      }}
                      aria-label="Відтворити відео"
                    >
                      <img
                        src={`https://img.youtube.com/vi/${slide.videoId}/maxresdefault.jpg`}
                        alt="Прев'ю відео"
                        onLoad={handleImageLoad}
                        onError={(e) => {
                          e.currentTarget.src = `https://img.youtube.com/vi/${slide.videoId}/hqdefault.jpg`;
                        }}
                      />
                      <span className="smooth-slider__video-play" />
                    </button>
                  )}
                </div>
              ) : (
                <img
                  src={slide?.imageUrl}
                  alt={`Slide ${i}`}
                  className="smooth-slider__slide-image"
                  onLoad={handleImageLoad}
                  style={{
                    aspectRatio: `${slide?.width} / ${slide?.height}`,
                  }}
                />
              )}
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
