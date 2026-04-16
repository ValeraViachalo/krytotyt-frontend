"use client";

import React, { useEffect, useRef, useMemo, useState, useCallback } from "react";
import { motion, useMotionValue, animate, AnimatePresence } from "framer-motion";
import { useGesture } from "@use-gesture/react";
import { generateLayout } from "../ServicesMap/generateLayout";
import clsx from "clsx";

import "./ServicesMap.scss";

const Icon = () => (
  <svg
    width="34"
    height="29"
    viewBox="0 0 34 29"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="services-map__icon"
  >
    <path d="M6.13115 25.6133L7.81105 26.3006L11.4033 26.6361L25.462 26.8622L27.1055 26.4137L26.2234 28.4328L26.2071 28.4014L26.2209 28.4328L8.43678 28.8198L8.43552 28.8185L8.43301 28.816L6.59981 26.2817L6.13115 25.6133Z" fill="currentColor" />
    <path d="M3.79844 22.4595L7.08663 23.481L15.3882 23.8303L24.0603 23.9735L28.4668 23.481L27.7632 25.0604L27.4629 25.7376L25.1547 26.2942L12.257 26.1334L7.6621 25.8356L5.45824 24.7915L5.02727 24.1884L3.79844 22.4595Z" fill="currentColor" />
    <path d="M1.65012 19.4438L6.32421 20.356L19.3689 20.9001L22.6358 20.9541L29.873 20.3171L28.8792 22.58L23.7289 23.2736L16.3107 23.1504L6.94114 22.8866L3.22197 21.6527L1.65012 19.4438Z" fill="currentColor" />
    <path d="M0.641541 15.3704L1.48463 13.1904L1.99099 14.1956L4.95125 14.7057L12.8947 15.1455L21.352 14.6668L28.3393 15.1656L32.3022 14.8515L32.3047 14.8502L32.0006 15.535L31.9994 15.5363L31.3623 16.9699L24.4756 17.5026L21.6121 17.3494L18.0022 17.431L5.47394 16.8518V16.8505L0.723209 15.9986L0.641541 15.3704Z" fill="currentColor" />
    <path d="M1.69863 12.5975L2.32611 10.9692L3.56751 11.9405L4.31486 12.4602L7.46321 12.8289L21.0715 11.6088L32.9678 12.3715L33.3887 12.4104L32.6561 14.0853L29.3918 14.5301L21.2989 14.0451L13.0996 14.5795L4.83906 14.1971L2.28829 13.7085L1.69863 12.5975Z" fill="currentColor" />
    <path d="M2.79796 9.63239L2.79419 9.62862L3.0103 9.07451L4.3791 10.1581L5.35187 10.4985L20.7794 8.36963L30.8827 9.59092L31.5059 9.51176L33.4434 11.7646L21.0457 11.0057V11.007L7.02461 12.3119L4.29065 11.8601L3.78429 11.5058L2.47379 10.4818L2.79796 9.63239Z" fill="currentColor" />
    <path d="M3.1869 8.59943L3.82142 6.97983L4.85802 7.51132L10.6604 7.30777L20.5074 5.42432L27.4381 6.65064L29.01 6.65817L30.8984 8.8168L30.0918 8.91103L20.7311 7.85057L5.57835 9.9147L4.70108 9.76707L3.1869 8.59943Z" fill="currentColor" />
    <path d="M4.0716 6.3263L4.74507 4.58232L5.46378 4.73938L15.76 3.64021L20.2424 2.51416L23.9377 3.67012L26.4494 3.73043L27.0601 4.42903L28.3379 5.89282L26.5323 5.90287L20.4585 4.89392L10.7196 6.63163L5.00642 6.82889L4.0716 6.3263Z" fill="currentColor" />
    <path d="M20.0429 0.35554V0.356797L20.0328 0.361823L20.0429 0.35554ZM5.59717 4.23051L15.9059 3.10219L16.0988 3.04816L20.1886 1.93744L23.1639 3.00796L23.1652 3.00921L25.8867 3.06576L23.9781 0.903363L20.0479 0.358053L20.0429 0.353027V0.354284L6.00176 2.2792L6.0005 2.28674L5.57079 2.46642L4.9526 4.05083L5.59717 4.23051Z" fill="currentColor" />
    <path d="M5.86532 1.56431L6.45963 0L19.2832 0.1019L19.2636 0.120119L6.17818 1.51279L5.86532 1.56431Z" fill="currentColor" />
    <path d="M1.08622 18.651L6.16865 19.7014L20.2713 20.2606L22.3495 20.3862L30.2264 19.5255L31.0996 17.5629L23.4979 18.0668L21.6509 17.9575L19.3905 18.0555L5.62209 17.4574L0.319767 16.5753L0.184948 16.5576L0.000623703 17.0754L1.08622 18.651Z" fill="currentColor" />
  </svg>
);

/* ── Settings sidebar icons ──────────────────────────────────── */
const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.32 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/* ── Main component ──────────────────────────────────────────── */

export default function ServicesMap({ activeFilter, onFilterChange, data }) {
  const categories = useMemo(() => generateLayout(data), [data]);

  const [hoveredService, setHoveredService] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(0.75);
  const [worldSizeX, setWorldSizeX] = useState(3200);
  const [worldSizeY, setWorldSizeY] = useState(2000);
  const [itemScale, setItemScale] = useState(1.2);
  const [animSpeed, setAnimSpeed] = useState(27);
  const [animIntensity, setAnimIntensity] = useState(0.8);
  const [isAnimEnabled, setIsAnimEnabled] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(0.75);

  const containerRef = useRef(null);
  const skipCameraResetRef = useRef(false);

  const activeCategory = activeFilter === "all" ? null : activeFilter;

  const moveTo = useCallback(
    (newX, newY, newScale, animated = true) => {
      setZoomLevel(newScale);
      if (animated) {
        animate(x, newX, { type: "spring", damping: 30, stiffness: 100 });
        animate(y, newY, { type: "spring", damping: 30, stiffness: 100 });
        animate(scale, newScale, { type: "spring", damping: 30, stiffness: 100 });
      } else {
        x.set(newX);
        y.set(newY);
        scale.set(newScale);
      }
    },
    [x, y, scale],
  );

  const showAll = useCallback(() => {
    onFilterChange("all");
    moveTo(0, 0, 0.75);
  }, [onFilterChange, moveTo]);

  /* Release active filter WITHOUT resetting camera (used by gestures) */
  const releaseFilter = useCallback(() => {
    skipCameraResetRef.current = true;
    onFilterChange("all");
  }, [onFilterChange]);

  const focusCategory = useCallback(
    (cat) => {
      onFilterChange(cat.slug);
      moveTo(-cat.position.x, -cat.position.y, 1);
    },
    [onFilterChange, moveTo],
  );

  /* Sync filter → camera whenever parent changes activeFilter */
  useEffect(() => {
    if (activeFilter === "all") {
      if (skipCameraResetRef.current) {
        skipCameraResetRef.current = false;
      } else {
        moveTo(0, 0, 0.75);
      }
    } else {
      const cat = categories.find((c) => c.slug === activeFilter);
      if (cat) moveTo(-cat.position.x, -cat.position.y, 1);
    }
  }, [activeFilter, moveTo, categories]);

  /* ── Gestures ──────────────────────────────────────────────── */
  useGesture(
    {
      onDrag: ({ delta: [dx, dy] }) => {
        if (activeCategory) {
          releaseFilter();
          return;
        }
        moveTo(
          x.get() + dx / scale.get(),
          y.get() + dy / scale.get(),
          scale.get(),
          false,
        );
      },
      onWheel: ({ delta: [dx, dy], event }) => {
        event.preventDefault();
        if (activeCategory) {
          releaseFilter();
          return;
        }
        moveTo(
          x.get() - dx / scale.get(),
          y.get() - dy / scale.get(),
          scale.get(),
          false,
        );
      },
      onPinch: ({ offset: [d] }) => {
        if (activeCategory) {
          releaseFilter();
          return;
        }
        const newScale = Math.max(0.7, Math.min(d, 2));
        moveTo(x.get(), y.get(), newScale, false);
      },
    },
    {
      target: containerRef,
      eventOptions: { passive: false },
      drag: { filterTaps: true },
      pinch: { scaleBounds: { min: 0.7, max: 2 } },
    },
  );

  /* ── Infinite-scroll wrap ──────────────────────────────────── */
  const offsets = [
    { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
    { x: -1, y: 0 },  { x: 0, y: 0 },  { x: 1, y: 0 },
    { x: -1, y: 1 },  { x: 0, y: 1 },  { x: 1, y: 1 },
  ];

  useEffect(() => {
    const unsubX = x.on("change", (v) => {
      if (v > worldSizeX / 2) x.set(v - worldSizeX);
      if (v < -worldSizeX / 2) x.set(v + worldSizeX);
    });
    const unsubY = y.on("change", (v) => {
      if (v > worldSizeY / 2) y.set(v - worldSizeY);
      if (v < -worldSizeY / 2) y.set(v + worldSizeY);
    });
    return () => { unsubX(); unsubY(); };
  }, [x, y, worldSizeX, worldSizeY]);

  /* ── Render ────────────────────────────────────────────────── */
  return (
    <div className="services-map" ref={containerRef}>
      <motion.div className="services-map__scale" style={{ scale }}>
        <motion.div className="services-map__pan" style={{ x, y }}>
          {offsets.map((offset, oi) => (
            <div
              key={oi}
              className="services-map__tile"
              style={{
                left: `calc(50% + ${offset.x * worldSizeX}px)`,
                top: `calc(50% + ${offset.y * worldSizeY}px)`,
              }}
            >
              {categories.map((cat, ci) => (
                <div
                  key={cat.id}
                  className="services-map__category"
                  style={{ left: cat.position.x, top: cat.position.y }}
                >
                  {cat.services.map((service, si) => {
                    const isActive = activeCategory === cat.slug;
                    const isAnyActive = activeCategory !== null;
                    const isHovered = hoveredService === service.id;
                    const isAnyHovered = hoveredService !== null;

                    const baseScales = { sm: 0.8, md: 0.9, lg: 1.0, xl: 1.1 };
                    const baseOpacities = { sm: 0.3, md: 0.5, lg: 0.8, xl: 1.0 };
                    const targetScales = { sm: 1.2, md: 1.1, lg: 0.9, xl: 0.8 };
                    const targetOpacities = { sm: 1.0, md: 0.8, lg: 0.5, xl: 0.3 };

                    const myBaseScale = baseScales[service.size] * itemScale;
                    const myBaseOpacity = baseOpacities[service.size];
                    const myTargetScale =
                      (baseScales[service.size] +
                        (targetScales[service.size] - baseScales[service.size]) * animIntensity) *
                      itemScale;
                    const myTargetOpacity =
                      myBaseOpacity +
                      (targetOpacities[service.size] - myBaseOpacity) * animIntensity;

                    let animProps = {};

                    if (isAnyHovered) {
                      animProps = {
                        opacity: isHovered ? 1 : 0.2,
                        scale: myBaseScale,
                        transition: { duration: 0.3, ease: "easeOut" },
                      };
                    } else if (isAnyActive) {
                      animProps = {
                        opacity: isActive ? 1 : 0.2,
                        scale: myBaseScale,
                        transition: { duration: 0.3, ease: "easeOut" },
                      };
                    } else if (isAnimEnabled) {
                      animProps = {
                        opacity: [myBaseOpacity, myTargetOpacity, myBaseOpacity],
                        scale: [myBaseScale, myTargetScale, myBaseScale],
                        transition: {
                          duration: animSpeed,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: ((ci * 100 + si) * 1.37) % animSpeed,
                        },
                      };
                    } else {
                      animProps = {
                        opacity: myBaseOpacity,
                        scale: myBaseScale,
                        transition: { duration: 0.3, ease: "easeOut" },
                      };
                    }

                    const sizeClass = `services-map__item--${service.size}`;

                    return (
                      <div
                        key={service.id}
                        className={clsx("services-map__item", sizeClass)}
                        style={{
                          // left: service.offset.x,
                          top: service.offset.y,
                          zIndex: isHovered || isActive ? 50 : 1,
                        }}
                        onMouseEnter={() => setHoveredService(service.id)}
                        onMouseLeave={() => setHoveredService(null)}
                        onClick={() => focusCategory(cat)}
                      >
                        <motion.div
                          className="services-map__item-inner"
                          // animate={animProps}
                        >
                          {/* <Icon /> */}
                          <span className="services-map__item-label">
                            {service.title}
                          </span>
                        </motion.div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* ── Settings sidebar ─────────────────────────────────── */}
      {isMounted && (
        <div className="services-map__sidebar-wrap">
          {!isSidebarOpen && (
            <button
              className="services-map__sidebar-toggle"
              onClick={() => setIsSidebarOpen(true)}
            >
              <SettingsIcon />
            </button>
          )}

          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div
                className="services-map__sidebar"
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
              >
                <div className="services-map__sidebar-header">
                  <div className="services-map__sidebar-title-row">
                    <SettingsIcon />
                    <h3>Налаштування</h3>
                  </div>
                  <button
                    className="services-map__sidebar-close"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <CloseIcon />
                  </button>
                </div>

                <div className="services-map__sidebar-body">
                  {/* Animation toggle */}
                  <div className="services-map__setting-row">
                    <span className="services-map__setting-label">Анімація</span>
                    <button
                      className={clsx("services-map__setting-btn", {
                        "services-map__setting-btn--on": isAnimEnabled,
                      })}
                      onClick={() => setIsAnimEnabled(!isAnimEnabled)}
                    >
                      {isAnimEnabled ? "УВІМК" : "ВИМК"}
                    </button>
                  </div>

                  {/* Zoom */}
                  <SliderControl
                    label="Масштаб (Zoom)"
                    value={zoomLevel}
                    display={`${Math.round(zoomLevel * 100)}%`}
                    min={0.7}
                    max={2}
                    step={0.05}
                    onChange={(v) => moveTo(x.get(), y.get(), v, false)}
                  />

                  {/* World gap X */}
                  <SliderControl
                    label="Відстань Gap X"
                    value={worldSizeX}
                    display={`${worldSizeX}px`}
                    min={2000}
                    max={8000}
                    step={50}
                    onChange={setWorldSizeX}
                  />

                  {/* World gap Y */}
                  <SliderControl
                    label="Відстань Gap Y"
                    value={worldSizeY}
                    display={`${worldSizeY}px`}
                    min={2000}
                    max={8000}
                    step={50}
                    onChange={setWorldSizeY}
                  />

                  {/* Item scale */}
                  <SliderControl
                    label="Розмір елементів"
                    value={itemScale}
                    display={`${itemScale.toFixed(1)}x`}
                    min={0.5}
                    max={2}
                    step={0.1}
                    onChange={setItemScale}
                  />

                  {/* Animation speed */}
                  <SliderControl
                    label="Швидкість анімації"
                    value={animSpeed}
                    display={`${animSpeed}s`}
                    min={2}
                    max={30}
                    step={1}
                    onChange={setAnimSpeed}
                  />

                  {/* Animation intensity */}
                  <SliderControl
                    label="Глибина анімації"
                    value={animIntensity}
                    display={`${Math.round(animIntensity * 100)}%`}
                    min={0}
                    max={1}
                    step={0.05}
                    onChange={setAnimIntensity}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

/* ── Reusable range slider for settings ──────────────────────── */
function SliderControl({ label, value, display, min, max, step, onChange }) {
  return (
    <div className="services-map__slider-control">
      <div className="services-map__slider-head">
        <label>{label}</label>
        <span>{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}
