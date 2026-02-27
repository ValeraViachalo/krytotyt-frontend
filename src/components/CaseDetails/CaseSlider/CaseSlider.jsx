"use client";
import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { Draggable } from "gsap/draggable";
import { InertiaPlugin } from "gsap/inertiaPlugin";

import "./CaseSlider.scss";
import Image from "next/image";

gsap.registerPlugin(Draggable, InertiaPlugin);

// ─── scale helpers ────────────────────────────────────────────────────────────
const MAX_SCALE = 1.2;

function updateScales(items, container) {
  const cRect = container.getBoundingClientRect();
  const centerX = cRect.left + cRect.width / 2;
  const maxDist = cRect.width * 0.7;
  const G = 8; // gap px

  const data = items.map((item) => {
    const inner = item.querySelector(".case-slider-item__inner");
    const r = item.getBoundingClientRect();
    const W = r.width;
    const cx = r.left + W / 2;
    const dist = Math.abs(cx - centerX);
    const lin = Math.max(0, 1 - dist / maxDist);
    const t = lin * lin * (3 - 2 * lin); // smoothstep
    const scale = 0.8 + (MAX_SCALE - 1) * t;
    return { item, inner, W, cx, scale };
  });

  const sorted = [...data].sort((a, b) => a.cx - b.cx);
  if (!sorted.length) return;

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

  let txAtCenter = 0;
  const last = sorted[sorted.length - 1];
  if (last.cx <= centerX) {
    txAtCenter = last.tx;
  } else if (sorted[0].cx >= centerX) {
    txAtCenter = sorted[0].tx;
  } else {
    for (let i = 0; i < sorted.length - 1; i++) {
      const L = sorted[i],
        R = sorted[i + 1];
      if (L.cx <= centerX && R.cx >= centerX) {
        const frac = (centerX - L.cx) / (R.cx - L.cx);
        txAtCenter = L.tx + (R.tx - L.tx) * frac;
        break;
      }
    }
  }

  for (const d of sorted) {
    gsap.set(d.inner, { scale: d.scale, x: d.tx - txAtCenter });
  }
}

// ─── horizontalLoop ───────────────────────────────────────────────────────────
function horizontalLoop(items, config) {
  let timeline;
  items = gsap.utils.toArray(items);
  config = config || {};

  gsap.context(() => {
    let onChange = config.onChange,
      onScaleUpdate = config.onScaleUpdate,
      lastIndex = 0,
      tl = gsap.timeline({
        repeat: config.repeat,
        onUpdate: function () {
          onScaleUpdate && onScaleUpdate(container);
          if (onChange) {
            let i = tl.closestIndex();
            if (lastIndex !== i) {
              lastIndex = i;
              onChange(items[i], i);
            }
          }
        },
        paused: config.paused,
        defaults: { ease: "none" },
        onReverseComplete: () =>
          tl.totalTime(tl.rawTime() + tl.duration() * 100),
      }),
      length = items.length,
      startX = items[0].offsetLeft,
      times = [],
      widths = [],
      spaceBefore = [],
      xPercents = [],
      curIndex = 0,
      indexIsDirty = false,
      center = config.center,
      pixelsPerSecond = (config.speed || 1) * 100,
      snap =
        config.snap === false
          ? (v) => v
          : gsap.utils.snap(config.snap || 1),
      timeOffset = 0,
      container =
        center === true
          ? items[0].parentNode
          : gsap.utils.toArray(center)[0] || items[0].parentNode,
      totalWidth,
      getTotalWidth = () =>
        items[length - 1].offsetLeft +
        (xPercents[length - 1] / 100) * widths[length - 1] -
        startX +
        spaceBefore[0] +
        items[length - 1].offsetWidth *
          gsap.getProperty(items[length - 1], "scaleX") +
        (parseFloat(config.paddingRight) || 0),
      populateWidths = () => {
        let b1 = container.getBoundingClientRect(),
          b2;
        items.forEach((el, i) => {
          widths[i] = parseFloat(gsap.getProperty(el, "width", "px"));
          xPercents[i] = snap(
            (parseFloat(gsap.getProperty(el, "x", "px")) / widths[i]) *
              100 +
              gsap.getProperty(el, "xPercent"),
          );
          b2 = el.getBoundingClientRect();
          spaceBefore[i] = b2.left - (i ? b1.right : b1.left);
          b1 = b2;
        });
        gsap.set(items, { xPercent: (i) => xPercents[i] });
        totalWidth = getTotalWidth();
      },
      timeWrap,
      populateOffsets = () => {
        timeOffset = center
          ? (tl.duration() * (container.offsetWidth / 2)) / totalWidth
          : 0;
        center &&
          times.forEach((t, i) => {
            times[i] = timeWrap(
              tl.labels["label" + i] +
                (tl.duration() * widths[i]) / 2 / totalWidth -
                timeOffset,
            );
          });
      },
      getClosest = (values, value, wrap) => {
        let i = values.length,
          closest = 1e10,
          index = 0,
          d;
        while (i--) {
          d = Math.abs(values[i] - value);
          if (d > wrap / 2) d = wrap - d;
          if (d < closest) {
            closest = d;
            index = i;
          }
        }
        return index;
      },
      populateTimeline = () => {
        let i, item, curX, distanceToStart, distanceToLoop;
        tl.clear();
        for (i = 0; i < length; i++) {
          item = items[i];
          curX = (xPercents[i] / 100) * widths[i];
          distanceToStart = item.offsetLeft + curX - startX + spaceBefore[0];
          distanceToLoop =
            distanceToStart + widths[i] * gsap.getProperty(item, "scaleX");
          tl.to(
            item,
            {
              xPercent: snap(((curX - distanceToLoop) / widths[i]) * 100),
              duration: distanceToLoop / pixelsPerSecond,
            },
            0,
          )
            .fromTo(
              item,
              {
                xPercent: snap(
                  ((curX - distanceToLoop + totalWidth) / widths[i]) * 100,
                ),
              },
              {
                xPercent: xPercents[i],
                duration:
                  (curX - distanceToLoop + totalWidth - curX) /
                  pixelsPerSecond,
                immediateRender: false,
              },
              distanceToLoop / pixelsPerSecond,
            )
            .add("label" + i, distanceToStart / pixelsPerSecond);
          times[i] = distanceToStart / pixelsPerSecond;
        }
        timeWrap = gsap.utils.wrap(0, tl.duration());
      },
      refresh = (deep) => {
        let progress = tl.progress();
        tl.progress(0, true);
        populateWidths();
        deep && populateTimeline();
        populateOffsets();
        deep && tl.draggable && tl.paused()
          ? tl.time(times[curIndex], true)
          : tl.progress(progress, true);
      },
      onResize = () => refresh(!(tl.draggable && tl.draggable.isDragging)),
      proxy;

    gsap.set(items, { x: 0 });
    populateWidths();
    populateTimeline();
    populateOffsets();
    window.addEventListener("resize", onResize);

    function toIndex(index, vars) {
      vars = vars || {};
      Math.abs(index - curIndex) > length / 2 &&
        (index += index > curIndex ? -length : length);
      let newIndex = gsap.utils.wrap(0, length, index),
        time = times[newIndex];
      if (time > tl.time() !== index > curIndex && index !== curIndex) {
        time += tl.duration() * (index > curIndex ? 1 : -1);
      }
      if (time < 0 || time > tl.duration()) {
        vars.modifiers = { time: timeWrap };
      }
      curIndex = newIndex;
      vars.overwrite = true;
      gsap.killTweensOf(proxy);
      return vars.duration === 0
        ? tl.time(timeWrap(time))
        : tl.tweenTo(time, vars);
    }

    tl.toIndex = (index, vars) => toIndex(index, vars);
    tl.closestIndex = (setCurrent) => {
      let index = getClosest(times, tl.time(), tl.duration());
      if (setCurrent) {
        curIndex = index;
        indexIsDirty = false;
      }
      return index;
    };
    tl.current = () => (indexIsDirty ? tl.closestIndex(true) : curIndex);
    tl.next = (vars) => toIndex(tl.current() + 1, vars);
    tl.previous = (vars) => toIndex(tl.current() - 1, vars);
    tl.times = times;
    tl.progress(1, true).progress(0, true);

    if (config.reversed) {
      tl.vars.onReverseComplete();
      tl.reverse();
    }

    if (config.draggable && typeof Draggable === "function") {
      proxy = document.createElement("div");
      let wrap = gsap.utils.wrap(0, 1),
        ratio,
        startProgress,
        draggable,
        wasPlaying,
        align = () =>
          tl.progress(
            wrap(startProgress + (draggable.startX - draggable.x) * ratio),
          ),
        syncIndex = () => tl.closestIndex(true);

      draggable = Draggable.create(proxy, {
        trigger: container,
        type: "x",
        onPressInit() {
          gsap.killTweensOf(tl);
          wasPlaying = !tl.paused();
          tl.pause();
          startProgress = tl.progress();
          refresh();
          ratio = 1 / totalWidth;
          gsap.set(proxy, { x: startProgress / -ratio });
        },
        onDrag: align,
        onThrowUpdate: align,
        overshootTolerance: 0,
        inertia: true,
        snap(value) {
          let time = -(value * ratio) * tl.duration(),
            wrappedTime = timeWrap(time),
            snapTime = times[getClosest(times, wrappedTime, tl.duration())],
            dif = snapTime - wrappedTime;
          Math.abs(dif) > tl.duration() / 2 &&
            (dif += dif < 0 ? tl.duration() : -tl.duration());
          return (time + dif) / tl.duration() / -ratio;
        },
        onRelease() {
          syncIndex();
          draggable.isThrowing && (indexIsDirty = true);
        },
        onThrowComplete() {
          syncIndex();
          wasPlaying && tl.play();
        },
      })[0];

      tl.draggable = draggable;
    }

    tl.closestIndex(true);
    lastIndex = curIndex;
    onChange && onChange(items[curIndex], curIndex);
    timeline = tl;

    return () => window.removeEventListener("resize", onResize);
  });

  return timeline;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function CaseSlider({ data }) {
  const wrapperRef = useRef(null);
  const loopRef = useRef(null);
  const activeRef = useRef(null);

  useEffect(() => {
    if (!wrapperRef.current || !data?.length) return;
    const items = gsap.utils.toArray(".case-slider-item", wrapperRef.current);

    loopRef.current = horizontalLoop(items, {
      paused: true,
      draggable: true,
      center: true,
      onScaleUpdate: (container) => updateScales(items, container),
      onChange: (element) => {
        activeRef.current?.classList.remove("active");
        element.classList.add("active");
        activeRef.current = element;
      },
    });

    updateScales(items, wrapperRef.current);

    // click-to-center each item
    items.forEach((box, i) =>
      box.addEventListener("click", () =>
        loopRef.current?.toIndex(i, { duration: 0.8, ease: "power1.inOut" }),
      ),
    );

    return () => {
      loopRef.current?.kill?.();
      loopRef.current = null;
    };
  }, [data]);

  const handlePrev = () =>
    loopRef.current?.previous({ duration: 0.6, ease: "power1.inOut" });
  const handleNext = () =>
    loopRef.current?.next({ duration: 0.6, ease: "power1.inOut" });

  return (
    <section className="case-slider container">
      <div className="case-slider-scroll" ref={wrapperRef}>
        {data?.map((image, index) => (
          <div key={index} className="case-slider-item">
            <div className="case-slider-item__inner">
              <img
                src={image?.imageUrl}
                alt={`case-slider-${index}`}
                className="case-slider-image"
                draggable={false}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="arrows">
        <button className="arrow arrow--prev" onClick={handlePrev}>
          <Image
            src="/assets/icon/arrow-bg.svg"
            width={48}
            height={48}
            alt="previous"
            className="arrow__icon"
          />
        </button>
        <button className="arrow arrow--next" onClick={handleNext}>
          <Image
            src="/assets/icon/arrow-bg.svg"
            width={48}
            height={48}
            alt="next"
            className="arrow__icon"
          />
        </button>
      </div>
    </section>
  );
}

function OldCaseSlider({ data }) {
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
        <div className="case-slider-list" style={{ transform }}>
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
