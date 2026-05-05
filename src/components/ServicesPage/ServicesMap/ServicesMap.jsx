"use client";

import React, { useEffect, useRef, useMemo, useCallback, useState } from "react";
import { generateLayout } from "./generateLayout";
import clsx from "clsx";

import "./ServicesMap.scss";

/* ── Main component ──────────────────────────────────────────── */

const MOBILE_BREAKPOINT = 768;
const MOBILE_SENSITYVITY_MULTUPLIER = 1.5;

/* Drift / inertia tuning — ported from HomePage WebGLCanvas (CameraController) */
const DRIFT_SPEED = 0.3;       // drift acceleration multiplier
const BASE_DRIFT_X = 1.2;      // constant background drift (units / s)
const DAMPING = 0.87;          // friction per 60fps frame
const VEL_CAP = 2400;          // max post-drag inertia velocity (units / s)
const DRAG_VEL_EMA = 0.35;     // EMA smoothing factor for drag velocity
const SNAP_EASE = 0.06;        // ease-rate when snapping to filtered category
const SCALE_EASE = 0.06;       // ease-rate for scale animation

export default function ServicesMap({ activeFilter, onFilterChange, data }) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.innerWidth < MOBILE_BREAKPOINT
      : false,
  );

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = (e) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const categories = useMemo(
    () => generateLayout(data, { isMobile }),
    [data, isMobile],
  );
  const activeCategory = activeFilter === "all" ? null : activeFilter;

  /* ── Flatten categories → individual items with 2×2 duplication ── */
  const { gridItems, tileSize, baseTileW, baseTileH, worldOffset } =
    useMemo(() => {
      const flat = [];
      categories.forEach((cat) => {
        cat.services.forEach((svc) => {
          flat.push({
            id: svc.id,
            title: svc.title,
            size: svc.size,
            catSlug: cat.slug,
            worldX: cat.position.x + svc.offset.x,
            worldY: cat.position.y + svc.offset.y,
          });
        });
      });

      if (!flat.length)
        return {
          gridItems: [],
          tileSize: { w: 2200, h: 2000 },
          baseTileW: 1600,
          baseTileH: 1000,
          worldOffset: { x: 0, y: 0 },
        };

      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;

      flat.forEach((it) => {
        if (it.worldX < minX) minX = it.worldX;
        if (it.worldX > maxX) maxX = it.worldX;
        if (it.worldY < minY) minY = it.worldY;
        if (it.worldY > maxY) maxY = it.worldY;
      });

      /* Extra spacing between categories */
      const pad = 600;
      const bw = maxX - minX + pad * 2;
      const bh = maxY - minY + pad * 2;
      const ox = -minX + pad;
      const oy = -minY + pad;

      /* Closer clone gap — shrink the repeat offset so clones overlap sooner */
      const cloneW = bw - 1000;
      const cloneH = bh - 1000;

      /* 2×2 copies for seamless wrapping */
      const items = [];
      [0, cloneW].forEach((rx) => {
        [0, cloneH].forEach((ry) => {
          flat.forEach((it) => {
            items.push({
              ...it,
              key: `${it.id}-${rx > 0 ? 1 : 0}-${ry > 0 ? 1 : 0}`,
              baseX: it.worldX + ox + rx,
              baseY: it.worldY + oy + ry,
            });
          });
        });
      });

      return {
        gridItems: items,
        tileSize: { w: cloneW * 2, h: cloneH * 2 },
        baseTileW: cloneW,
        baseTileH: cloneH,
        worldOffset: { x: ox, y: oy },
      };
    }, [categories]);

  /* ── Refs ───────────────────────────────────────────────────── */
  const containerRef = useRef(null);
  const itemWrapsRef = useRef([]);
  const itemInnersRef = useRef([]);
  const rafRef = useRef(null);
  const wasDragRef = useRef(false);
  const activeCategoryRef = useRef(activeCategory);
  activeCategoryRef.current = activeCategory;

  const scrollRef = useRef({
    current: { x: 0, y: 0 },
    vel: { x: 0, y: 0 },
    last: { x: 0, y: 0 },
    delta: { x: { c: 0, t: 0 }, y: { c: 0, t: 0 } },
    driftDir: { x: 1, y: 0 },
    snap: { active: false, x: 0, y: 0 },
  });

  const mouseRef = useRef({
    x: { t: 0.5, c: 0.5 },
    y: { t: 0.5, c: 0.5 },
  });

  const dragRef = useRef({
    active: false,
    prevX: 0,
    prevY: 0,
    lastMoveTime: 0,
    smoothVelX: 0,
    smoothVelY: 0,
  });

  const winRef = useRef({ w: 0, h: 0 });
  const itemDataRef = useRef([]);
  const scaleRef = useRef({ current: 0.8, target: 0.8 });
  const onFilterChangeRef = useRef(onFilterChange);
  onFilterChangeRef.current = onFilterChange;
  const isMobileRef = useRef(isMobile);
  isMobileRef.current = isMobile;

  /* ── Window resize ─────────────────────────────────────────── */
  useEffect(() => {
    const update = () => {
      winRef.current.w = window.innerWidth;
      winRef.current.h = window.innerHeight;
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  /* ── Init item runtime data + set initial scroll ───────────── */
  useEffect(() => {
    itemDataRef.current = gridItems.map(() => ({
      extraX: 0,
      extraY: 0,
      ease: Math.random() * 0.5 + 0.5,
      w: 200,
      h: 40,
    }));

    /* Center the base tile in the viewport */
    const s = scrollRef.current;
    const ix = -(baseTileW / 2) + winRef.current.w / 2 - 500;
    const iy = -(baseTileH / 2) + winRef.current.h / 2 - 500;
    s.current.x = s.last.x = ix;
    s.current.y = s.last.y = iy;
    s.vel.x = 0;
    s.vel.y = 0;
    s.snap.active = false;
  }, [gridItems, baseTileW, baseTileH]);

  /* ── Measure item sizes after first paint ──────────────────── */
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      itemWrapsRef.current.forEach((el, i) => {
        if (!el || !itemDataRef.current[i]) return;
        const r = el.getBoundingClientRect();
        itemDataRef.current[i].w = r.width || 200;
        itemDataRef.current[i].h = r.height || 40;
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [gridItems]);

  /* ── Pointer / Wheel events ────────────────────────────────── */
  useEffect(() => {
    const ctr = containerRef.current;
    if (!ctr) return;

    const onWheel = (e) => {
      e.preventDefault();
      const s = scrollRef.current;
      /* Cancel any in-flight snap so wheel pans immediately */
      s.snap.active = false;

      let dx = e.deltaX;
      let dy = e.deltaY;
      /* Normalise deltaMode (line / page → pixel equivalents) — matches WebGLCanvas */
      if (e.deltaMode === 1) { dx *= 24; dy *= 24; }
      if (e.deltaMode === 2) { dx *= 400; dy *= 400; }

      /* Pan 1:1; sign matches the existing scroll-direction convention */
      s.current.x -= dx;
      s.current.y -= dy;
    };

    const onPointerDown = (e) => {
      if (e.button && e.button !== 0) return;
      const s = scrollRef.current;
      dragRef.current.active = true;
      wasDragRef.current = false;
      ctr.classList.add("is-dragging");
      s.snap.active = false;
      s.vel.x = 0;
      s.vel.y = 0;
      dragRef.current.prevX = e.clientX;
      dragRef.current.prevY = e.clientY;
      dragRef.current.lastMoveTime = performance.now();
      dragRef.current.smoothVelX = 0;
      dragRef.current.smoothVelY = 0;
    };

    const onPointerMove = (e) => {
      const w = winRef.current.w || 1;
      const h = winRef.current.h || 1;
      mouseRef.current.x.t = e.clientX / w;
      mouseRef.current.y.t = e.clientY / h;

      if (!dragRef.current.active) return;
      const s = scrollRef.current;
      const rawDx = e.clientX - dragRef.current.prevX;
      const rawDy = e.clientY - dragRef.current.prevY;
      const mult = isMobileRef.current ? MOBILE_SENSITYVITY_MULTUPLIER : 1;
      const dx = rawDx * mult;
      const dy = rawDy * mult;

      if (Math.abs(rawDx) > 3 || Math.abs(rawDy) > 3) {
        wasDragRef.current = true;
        /* Deactivate filter as soon as dragging starts */
        if (activeCategoryRef.current) {
          onFilterChangeRef.current("all");
        }
      }

      /* 1:1 movement — content follows the cursor without smoothing */
      s.current.x += dx;
      s.current.y += dy;

      /* Track event-time velocity (EMA-smoothed, capped) for post-release inertia */
      const now = performance.now();
      const eventDt = Math.max((now - dragRef.current.lastMoveTime) / 1000, 0.004);
      dragRef.current.lastMoveTime = now;

      const rawVelX = dx / eventDt;
      const rawVelY = dy / eventDt;

      dragRef.current.smoothVelX =
        dragRef.current.smoothVelX * (1 - DRAG_VEL_EMA) + rawVelX * DRAG_VEL_EMA;
      dragRef.current.smoothVelY =
        dragRef.current.smoothVelY * (1 - DRAG_VEL_EMA) + rawVelY * DRAG_VEL_EMA;

      s.vel.x = Math.max(-VEL_CAP, Math.min(VEL_CAP, dragRef.current.smoothVelX));
      s.vel.y = Math.max(-VEL_CAP, Math.min(VEL_CAP, dragRef.current.smoothVelY));

      dragRef.current.prevX = e.clientX;
      dragRef.current.prevY = e.clientY;
    };

    const onPointerUp = () => {
      dragRef.current.active = false;
      ctr.classList.remove("is-dragging");
    };

    ctr.addEventListener("wheel", onWheel, { passive: false });
    ctr.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      ctr.removeEventListener("wheel", onWheel);
      ctr.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  /* ── requestAnimationFrame render loop ─────────────────────── */
  useEffect(() => {
    const ts = tileSize;
    let firstFrame = true;
    let lastTime = performance.now();

    const tick = (now) => {
      rafRef.current = requestAnimationFrame(tick);

      /* Frame-rate-independent delta (capped so a hidden tab doesn't jump) */
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = scrollRef.current;
      const m = mouseRef.current;
      const win = winRef.current;

      /* Mouse ease (used for parallax) */
      m.x.c += (m.x.t - m.x.c) * 0.04;
      m.y.c += (m.y.t - m.y.c) * 0.04;

      /* ── Pan update ──────────────────────────────────────────
         Modes, in priority order:
           1. Snap-to-category (filter selection)  — eased toward target
           2. Drag                                 — pan written by event handlers
           3. Zoomed (filter active, no snap)      — frozen
           4. Idle                                 — drift toward cursor + damping
      */
      if (s.snap.active) {
        s.current.x += (s.snap.x - s.current.x) * SNAP_EASE;
        s.current.y += (s.snap.y - s.current.y) * SNAP_EASE;
        s.vel.x = 0;
        s.vel.y = 0;
        if (
          Math.hypot(s.snap.x - s.current.x, s.snap.y - s.current.y) < 1
        ) {
          s.snap.active = false;
        }
      } else if (!dragRef.current.active && !activeCategoryRef.current) {
        /* Drift — fixed magnitude, direction = normalised cursor offset.
           Negated so the world drifts opposite the cursor (cursor right →
           content drifts left), matching the WebGLCanvas feel. */
        const speed = DRIFT_SPEED * 400;
        const mxN = m.x.c - 0.5;
        const myN = m.y.c - 0.5;
        const len = Math.hypot(mxN, myN);
        const eps = 1e-6;
        let dirX;
        let dirY;
        if (len > eps) {
          dirX = mxN / len;
          dirY = myN / len;
          s.driftDir.x = dirX;
          s.driftDir.y = dirY;
        } else {
          dirX = s.driftDir.x;
          dirY = s.driftDir.y;
        }
        s.vel.x -= dirX * speed * delta;
        s.vel.y -= dirY * speed * delta;
        /* Constant background drift so content is never fully static */
        s.vel.x -= BASE_DRIFT_X * delta;

        /* Frame-rate-independent exponential damping */
        const factor = Math.pow(DAMPING, delta * 60);
        s.vel.x *= factor;
        s.vel.y *= factor;

        /* Advance position from velocity */
        s.current.x += s.vel.x * delta;
        s.current.y += s.vel.y * delta;
      }
      /* When dragging, s.current is updated directly by pointermove. */

      /* Compute scroll deltas for parallax */
      s.delta.x.t = s.current.x - s.last.x;
      s.delta.y.t = s.current.y - s.last.y;
      s.delta.x.c += (s.delta.x.t - s.delta.x.c) * 0.04;
      s.delta.y.c += (s.delta.y.t - s.delta.y.c) * 0.04;

      const dirX = s.current.x > s.last.x ? "right" : "left";
      const dirY = s.current.y > s.last.y ? "down" : "up";

      itemDataRef.current.forEach((d, i) => {
        const el = itemWrapsRef.current[i];
        const item = gridItems[i];
        if (!el || !item) return;

        /* Per-item parallax based on scroll delta + mouse position */
        const px =
          3 * s.delta.x.c * d.ease + (m.x.c - 0.5) * d.w * 0.15;
        const py =
          3 * s.delta.y.c * d.ease + (m.y.c - 0.5) * d.h * 0.15;

        const posX = item.baseX + s.current.x + d.extraX + px;
        const posY = item.baseY + s.current.y + d.extraY + py;

        /* Wrap when item goes beyond 120% of screen */
        const marginX = win.w * 0.2;
        const marginY = win.h * 0.2;
        if (dirX === "right" && posX > win.w + marginX) d.extraX -= ts.w;
        if (dirX === "left" && posX + d.w < -marginX) d.extraX += ts.w;
        if (dirY === "down" && posY > win.h + marginY) d.extraY -= ts.h;
        if (dirY === "up" && posY + d.h < -marginY) d.extraY += ts.h;

        const fx = item.baseX + s.current.x + d.extraX + px;
        const fy = item.baseY + s.current.y + d.extraY + py;

        el.style.transform = `translate(${fx}px, ${fy}px)`;
      });

      s.last.x = s.current.x;
      s.last.y = s.current.y;

      /* Smooth scale animation — slower than scroll easing */
      const sc = scaleRef.current;
      sc.current += (sc.target - sc.current) * SCALE_EASE;
      if (containerRef.current) {
        containerRef.current.style.transform = `scale(${sc.current})`;
      }

      /* After first frame, reveal items */
      if (firstFrame) {
        firstFrame = false;
        containerRef.current?.classList.add("is-ready");
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [gridItems, tileSize]);

  /* Intro is handled by CSS fade-up via .is-ready class */

  /* ── Category filter → class toggling ──────────────────────── */
  useEffect(() => {
    const ctr = containerRef.current;
    if (!ctr) return;

    if (activeCategory) {
      ctr.setAttribute("data-filter", activeCategory);
      scaleRef.current.target = isMobile ? 0.9 : 1.2;
    } else {
      ctr.removeAttribute("data-filter");
      scaleRef.current.target = 0.8;
    }

    itemWrapsRef.current.forEach((el, i) => {
      if (!el) return;
      const item = gridItems[i];
      if (activeCategory && item?.catSlug === activeCategory) {
        el.classList.add("is-active");
      } else {
        el.classList.remove("is-active");
      }
    });
  }, [activeCategory, gridItems]);

  /* ── Camera focus on filter change → find nearest copy ────── */
  const prevFilterRef = useRef(activeFilter);
  useEffect(() => {
    if (prevFilterRef.current === activeFilter) return;
    prevFilterRef.current = activeFilter;

    if (!activeCategory || !categories.length) return;

    const cat = categories.find((c) => c.slug === activeCategory);
    if (!cat) return;

    const s = scrollRef.current;
    const win = winRef.current;
    const cx = isMobile ? win.w / 3 : win.w / 2.5;
    const cy = isMobile ? win.h / 2 : win.h / 2.2;

    /* Category center in base tile coordinates */
    const catBaseX = cat.position.x + worldOffset.x;
    const catBaseY = cat.position.y + worldOffset.y;

    /* Copies repeat every baseTileW / baseTileH (= cloneW / cloneH).
       Compute which copy index puts the category closest to screen centre,
       no matter how far the user has scrolled. */
    const periodX = baseTileW;
    const periodY = baseTileH;

    const mx = Math.round((cx - s.current.x - catBaseX) / periodX);
    const my = Math.round((cy - s.current.y - catBaseY) / periodY);

    const bestX = catBaseX + mx * periodX;
    const bestY = catBaseY + my * periodY;

    s.snap.active = true;
    s.snap.x = -bestX + cx;
    s.snap.y = -bestY + cy;
  }, [activeFilter, activeCategory, categories, worldOffset, baseTileW, baseTileH, isMobile]);

  /* ── Hover category dimming (event delegation) ────────────── */
  useEffect(() => {
    const ctr = containerRef.current;
    if (!ctr) return;

    let hoveredCat = null;

    const updateHoverClasses = (cat) => {
      if (cat) {
        ctr.setAttribute("data-hover-cat", "");
        itemWrapsRef.current.forEach((el, i) => {
          if (!el) return;
          el.classList.toggle(
            "is-hover-active",
            gridItems[i]?.catSlug === cat,
          );
        });
      } else {
        ctr.removeAttribute("data-hover-cat");
        itemWrapsRef.current.forEach((el) => {
          if (el) el.classList.remove("is-hover-active");
        });
      }
    };

    const onMouseOver = (e) => {
      const wrap = e.target.closest(".services-map__item-wrap");
      const cat = wrap?.dataset?.cat || null;
      if (cat === hoveredCat) return;
      hoveredCat = cat;
      updateHoverClasses(cat);
    };

    const onMouseLeave = () => {
      hoveredCat = null;
      updateHoverClasses(null);
    };

    ctr.addEventListener("mouseover", onMouseOver);
    ctr.addEventListener("mouseleave", onMouseLeave);

    return () => {
      ctr.removeEventListener("mouseover", onMouseOver);
      ctr.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [gridItems]);

  /* ── Click handler (event delegation) ──────────────────────── */
  const handleClick = useCallback(
    (e) => {
      if (wasDragRef.current) return;
      const wrap = e.target.closest(".services-map__item-wrap");
      if (!wrap) return;
      const slug = wrap.dataset.cat;
      if (!slug || slug === activeCategoryRef.current) return;
      onFilterChange(slug);
    },
    [onFilterChange],
  );

  /* ── Render ────────────────────────────────────────────────── */
  return (
    <div className="services-map-wrapper">
      <div className="services-map" ref={containerRef} onClick={handleClick}>
        {gridItems.map((item, i) => (
          <div
            key={item.key}
            ref={(el) => (itemWrapsRef.current[i] = el)}
            className="services-map__item-wrap"
            data-cat={item.catSlug}
          >
            <div
              ref={(el) => (itemInnersRef.current[i] = el)}
              className={clsx(
                "services-map__item",
                `services-map__item--${item.size}`,
              )}
            >
              <span className="services-map__item-label">{item.title}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
