/**
 * Generates map layout from Sanity services data.
 *
 * Uses the same category positions as the original data.js and produces
 * item offsets with the same visual spread (~150–500px).
 */

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ≈ 137.5°

/* ── Category positions (matching data.js) ───────────────────── */
const POSITION_MAP = {
  "dizajn-interieru":              { x: 0,      y: 0 },
  "mebli":                         { x: -870,   y: 550 },
  "inzheneriya":                   { x: 800,    y: 450 },
  "art-instalyatsiyi":             { x: 600,    y: -550 },
  "vyroby-z-metalu":               { x: -700,   y: -450 },
  "prykhovani-i-rozsuvni-systemy": { x: 1030,   y: -80 },
  "muzyka":                        { x: -1200,  y: 0 },
  "dekoruvannya":                  { x: 100,    y: 670 },
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
const BASE_RADIUS = 50;
const RADIUS_STEP = 45;

/* ── Size assignment ─────────────────────────────────────────── */
function assignSize(index, total) {
  if (index === 0) return "xl";
  if (index <= 2) return "lg";
  if (index <= Math.floor(total * 0.4)) return "md";
  return "sm";
}

/* ── Main generator ──────────────────────────────────────────── */
export function generateLayout(sanityList) {
  if (!sanityList?.length) return [];

  const cats = sanityList.filter((c) => c.list?.length > 0);

  return cats.map((cat) => {
    const position = POSITION_MAP[cat.slug] || fallbackPosition();

    const services = (cat.list || []).map((item, si) => {
      const a = si * GOLDEN_ANGLE;
      const r = BASE_RADIUS + RADIUS_STEP * Math.sqrt(si);
      const jitter = 1 + ((si % 3) - 1) * 0.15;

      return {
        id: item._id,
        title: item.name,
        slug: item.slug,
        size: assignSize(si, cat.list.length),
        offset: {
          x: Math.round(Math.cos(a) * r * jitter * 1.8),
          y: Math.round(Math.sin(a) * r * jitter * 0.6),
        },
      };
    });

    return {
      id: cat._id,
      slug: cat.slug,
      title: cat.name,
      position,
      services,
    };
  });
}
