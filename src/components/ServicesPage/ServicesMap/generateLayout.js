/**
 * Generates map layout from Sanity services data.
 *
 * Uses the same category positions as the original data.js and produces
 * item offsets with the same visual spread (~150–500px).
 */

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ≈ 137.5°

/* ── Category positions — desktop (wide spread) ──────────────── */
const DESKTOP_POSITION_MAP = {
  "dizajn-interieru":              { x: 0,      y: 0 },
  "mebli":                         { x: -950,   y: 550 },
  "inzheneriya":                   { x: 1000,   y: 350 },
  "art-instalyatsiyi":             { x: 600,    y: -550 },
  "vyroby-z-metalu":               { x: -700,   y: -450 },
  "prykhovani-i-rozsuvni-systemy": { x: 1030,   y: -80 },
  "muzyka":                        { x: -1200,  y: -50 },
  "dekoruvannya":                  { x: 300,    y: 670 },
};

/* ── Category positions — mobile (tall, two-column weave) ────── */
const MOBILE_POSITION_MAP = {
  "dizajn-interieru":              { x: 250,     y: 50 },
  "mebli":                         { x: -260,  y: 520 },
  "inzheneriya":                   { x: 240,   y: 1020 },
  "art-instalyatsiyi":             { x: -220,  y: -520 },
  "vyroby-z-metalu":               { x: 260,   y: -960 },
  "prykhovani-i-rozsuvni-systemy": { x: 280,   y: 780 },
  "muzyka":                        { x: -80,  y: -560 },
  "dekoruvannya":                  { x: -240,  y: 1240 },
};

/* Fallback: distribute unknowns on a circle */
let _fallbackAngle = 0;
function fallbackPosition() {
  _fallbackAngle += GOLDEN_ANGLE;
  return {
    x: Math.round(Math.cos(_fallbackAngle) * 900),
    y: Math.round(Math.sin(_fallbackAngle) * 600),
  };
}

/* ── Item offset generation ──────────────────────────────────── */
/* Desktop stays wide & airy; mobile packs tighter and stretches vertically */
const DESKTOP_LAYOUT = {
  baseRadius: 60,
  radiusStep: 55,
  stretch: { x: 1.8, y: 0.7 },
  padX: 16,
  padY: 8,
  positionMap: DESKTOP_POSITION_MAP,
};
const MOBILE_LAYOUT = {
  baseRadius: 38,
  radiusStep: 36,
  stretch: { x: 0.7, y: 1.55 },
  padX: 12,
  padY: 6,
  positionMap: MOBILE_POSITION_MAP,
};

/* ── Estimated bounding boxes per size (width × height in px) ── */
const SIZE_BOUNDS = {
  xl: { w: 260, h: 40 },
  lg: { w: 220, h: 36 },
  md: { w: 190, h: 32 },
  sm: { w: 160, h: 28 },
};

/* ── Size assignment ─────────────────────────────────────────── */
function assignSize(index, total) {
  if (index === 0) return "xl";
  if (index <= 2) return "lg";
  if (index <= Math.floor(total * 0.4)) return "md";
  return "sm";
}

/* ── Collision resolution ────────────────────────────────────── */
function resolveOverlaps(items, padX, padY, iterations = 12) {
  const PAD_X = padX;
  const PAD_Y = padY;

  for (let iter = 0; iter < iterations; iter++) {
    let moved = false;
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];
        const boundsA = SIZE_BOUNDS[a.size];
        const boundsB = SIZE_BOUNDS[b.size];

        const halfW = (boundsA.w + boundsB.w) / 2 + PAD_X;
        const halfH = (boundsA.h + boundsB.h) / 2 + PAD_Y;

        const dx = b.offset.x - a.offset.x;
        const dy = b.offset.y - a.offset.y;
        const overlapX = halfW - Math.abs(dx);
        const overlapY = halfH - Math.abs(dy);

        if (overlapX > 0 && overlapY > 0) {
          moved = true;
          /* Push along the axis with smaller overlap */
          if (overlapX < overlapY) {
            const push = Math.ceil(overlapX / 2) + 1;
            const signX = dx >= 0 ? 1 : -1;
            a.offset.x -= push * signX;
            b.offset.x += push * signX;
          } else {
            const push = Math.ceil(overlapY / 2) + 1;
            const signY = dy >= 0 ? 1 : -1;
            a.offset.y -= push * signY;
            b.offset.y += push * signY;
          }
        }
      }
    }
    if (!moved) break;
  }
}

/* ── Main generator ──────────────────────────────────────────── */
export function generateLayout(sanityList, { isMobile = false } = {}) {
  if (!sanityList?.length) return [];

  const layout = isMobile ? MOBILE_LAYOUT : DESKTOP_LAYOUT;
  const cats = sanityList.filter((c) => c.list?.length > 0);

  return cats.map((cat) => {
    const position = layout.positionMap[cat.slug] || fallbackPosition();

    const services = (cat.list || []).map((item, si) => {
      const a = si * GOLDEN_ANGLE;
      const r = layout.baseRadius + layout.radiusStep * Math.sqrt(si);
      const jitter = 1 + ((si % 3) - 1) * 0.15;

      return {
        id: item._id,
        title: item.name,
        slug: item.slug,
        size: assignSize(si, cat.list.length),
        offset: {
          x: Math.round(Math.cos(a) * r * jitter * layout.stretch.x),
          y: Math.round(Math.sin(a) * r * jitter * layout.stretch.y),
        },
      };
    });

    /* Push apart any items that overlap */
    resolveOverlaps(services, layout.padX, layout.padY);

    return {
      id: cat._id,
      slug: cat.slug,
      title: cat.name,
      position,
      services,
    };
  });
}
