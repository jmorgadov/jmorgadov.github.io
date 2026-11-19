// Topographic contour lines, traced once from a smooth height field with
// marching squares and drawn as a static SVG.

import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useState, type CSSProperties } from "react";

const W = 1600;
const H = 1000;
const NX = 128; // grid columns
const NY = 80; // grid rows
const LEVELS = 18;
const INDEX_EVERY = 4; // every few lines is an "index contour", drawn stronger

type Point = [number, number];

function bump(x: number, y: number, cx: number, cy: number, s: number): number {
  return Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * s * s));
}

/** Height at (x, y), with x in [0, 1.6] and y in [0, 1]: a few hills and waves. */
function height(x: number, y: number): number {
  return (
    bump(x, y, 0.25, 0.3, 0.22) +
    0.8 * bump(x, y, 1.25, 0.25, 0.28) +
    0.9 * bump(x, y, 1.05, 0.85, 0.25) -
    0.5 * bump(x, y, 0.7, 0.55, 0.2) +
    0.6 * bump(x, y, 0.2, 0.95, 0.2) +
    0.12 * Math.sin(5.1 * x + 1.7 * y + 0.4) +
    0.08 * Math.sin(-3.3 * x + 6.2 * y + 1.1) +
    0.05 * Math.sin(9.7 * x - 7.1 * y)
  );
}

// For each marching-squares case (corners above the level as bits: top-left 8,
// top-right 4, bottom-right 2, bottom-left 1), the cell edges each segment
// joins: 0 top, 1 right, 2 bottom, 3 left.
const CASES: [number, number][][] = [
  [],
  [[3, 2]],
  [[2, 1]],
  [[3, 1]],
  [[0, 1]],
  [[0, 1], [3, 2]],
  [[0, 2]],
  [[0, 3]],
  [[0, 3]],
  [[0, 2]],
  [[0, 3], [2, 1]],
  [[0, 1]],
  [[3, 1]],
  [[2, 1]],
  [[3, 2]],
  [],
];

function trace(): { paths: { d: string; index: boolean }[]; chains: Point[][] } {
  const values: number[][] = [];
  let min = Infinity;
  let max = -Infinity;
  for (let j = 0; j < NY; j++) {
    const row: number[] = [];
    for (let i = 0; i < NX; i++) {
      const v = height((i / (NX - 1)) * 1.6, j / (NY - 1));
      row.push(v);
      min = Math.min(min, v);
      max = Math.max(max, v);
    }
    values.push(row);
  }
  const sx = W / (NX - 1);
  const sy = H / (NY - 1);

  const paths: { d: string; index: boolean }[] = [];
  const chains: Point[][] = [];
  for (let k = 1; k <= LEVELS; k++) {
    const level = min + ((max - min) * k) / (LEVELS + 1);

    // Collect segments, then chain them into polylines through shared ends.
    const segments: [Point, Point][] = [];
    for (let j = 0; j < NY - 1; j++) {
      for (let i = 0; i < NX - 1; i++) {
        const a = values[j][i];
        const b = values[j][i + 1];
        const c = values[j + 1][i + 1];
        const d = values[j + 1][i];
        const kase =
          (a > level ? 8 : 0) | (b > level ? 4 : 0) | (c > level ? 2 : 0) | (d > level ? 1 : 0);
        if (!CASES[kase].length) continue;
        const x = i * sx;
        const y = j * sy;
        const edge = (e: number): Point => {
          if (e === 0) return [x + ((level - a) / (b - a)) * sx, y];
          if (e === 1) return [x + sx, y + ((level - b) / (c - b)) * sy];
          if (e === 2) return [x + ((level - d) / (c - d)) * sx, y + sy];
          return [x, y + ((level - a) / (d - a)) * sy];
        };
        for (const [e1, e2] of CASES[kase]) segments.push([edge(e1), edge(e2)]);
      }
    }

    const key = (p: Point) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`;
    const byEnd = new Map<string, number[]>();
    segments.forEach(([p, q], s) => {
      for (const end of [key(p), key(q)]) {
        const list = byEnd.get(end);
        if (list) list.push(s);
        else byEnd.set(end, [s]);
      }
    });
    const used = new Uint8Array(segments.length);
    const extend = (chain: Point[], from: Point) => {
      for (;;) {
        const next = byEnd.get(key(from))?.find((s) => !used[s]);
        if (next === undefined) return;
        used[next] = 1;
        const [p, q] = segments[next];
        from = key(p) === key(from) ? q : p;
        chain.push(from);
      }
    };

    const parts: string[] = [];
    segments.forEach(([p, q], s) => {
      if (used[s]) return;
      used[s] = 1;
      const forward: Point[] = [q];
      extend(forward, q);
      const backward: Point[] = [];
      extend(backward, p);
      const chain = [...backward.reverse(), p, ...forward];
      chains.push(chain);
      parts.push(
        `M${chain.map(([px, py]) => `${px.toFixed(1)} ${py.toFixed(1)}`).join("L")}`,
      );
    });
    paths.push({ d: parts.join(""), index: k % INDEX_EVERY === 0 });
  }
  return { paths, chains };
}

const { paths: PATHS, chains: CHAINS } = trace();

// Walks along the contours: short highlights that travel along a stretch of
// one contour line, at the same height, drawn one after another by CSS
// animations (see `.walk` in index.css). The timing there assumes these values.
const WALKS = 24;
const WALK_GAP = 1.5; // seconds between two walks starting
const WALK_START = 1; // seconds before the first walk, so none shows on load

/** A small seeded random generator (mulberry32), so the walks never change. */
function seeded(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stretches of 350-700px along random contour lines, mostly on the sides. */
function walks(): { d: string; length: number }[] {
  const random = seeded(7);
  const long = CHAINS.filter((chain) => chain.length > 40);
  const found: { d: string; length: number }[] = [];
  for (let tries = 0; found.length < WALKS && tries < 2000; tries++) {
    const chain = long[Math.floor(random() * long.length)];
    const target = 350 + random() * 350;
    let k = Math.floor(random() * chain.length);
    const stretch: Point[] = [chain[k]];
    let length = 0;
    while (length < target && ++k < chain.length) {
      const [x0, y0] = stretch[stretch.length - 1];
      length += Math.hypot(chain[k][0] - x0, chain[k][1] - y0);
      stretch.push(chain[k]);
    }
    if (length < target) continue;
    // Keep it where the background shows: the sides, or the top strip.
    const [mx, my] = stretch[Math.floor(stretch.length / 2)];
    if (mx > 0.32 * W && mx < 0.68 * W && my > 0.3 * H) continue;
    found.push({
      d: `M${stretch.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}`,
      length,
    });
  }
  return found;
}

const WALK_PATHS = walks();

/** Faint topographic contour lines, covering their (positioned) parent. */
export function ContourLines({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      aria-hidden="true"
      style={style}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      className={`pointer-events-none text-ink ${className}`}
    >
      {PATHS.map(({ d, index }, k) => (
        <path
          key={k}
          d={d}
          stroke="currentColor"
          strokeWidth={index ? 1.3 : 0.8}
          // A touch stronger in the light theme, where faint lines vanish sooner.
          className={
            index
              ? "[stroke-opacity:0.15] dark:[stroke-opacity:0.12]"
              : "[stroke-opacity:0.1] dark:[stroke-opacity:0.08]"
          }
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

/** The walks along the contours, in their own SVG so the contours never repaint. */
function WalkLines() {
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      className="pointer-events-none absolute inset-0 size-full text-accent motion-reduce:hidden"
    >
      {/* Dashes use each stretch's real length (--l); `pathLength` combined
          with a non-scaling stroke is not handled the same in every browser. */}
      {WALK_PATHS.map(({ d, length }, k) => (
        <path
          key={k}
          className="walk"
          d={d}
          stroke="currentColor"
          strokeWidth={1.5}
          strokeOpacity={0.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={
            {
              "--delay": `${WALK_START + k * WALK_GAP}s`,
              "--l": `${length.toFixed(1)}px`,
            } as CSSProperties
          }
        />
      ))}
    </svg>
  );
}

// The sides layer keeps a trace of the lines in the middle too; the centre
// layer's mask is its complement, so the two never add up to more than one.
const SIDES = "linear-gradient(to right, black, rgb(0 0 0 / 0.15) 40%, rgb(0 0 0 / 0.15) 60%, black)";
const CENTRE = "linear-gradient(to right, transparent, rgb(0 0 0 / 0.85) 40%, rgb(0 0 0 / 0.85) 60%, transparent)";
// The centre layer only shows along the top of the page, above the hero text.
const TOP = "linear-gradient(to bottom, black, transparent 35%)";

/**
 * The contour lines fixed behind the whole page. The sides always show them;
 * the central column, where the text is, shows them only in a strip along the
 * top of the page, which fades away as the page scrolls. The two layers use
 * complementary masks, so together they never double a line.
 */
export function ContourBackground() {
  const { scrollY } = useScroll();
  const [fadeEnd, setFadeEnd] = useState(600);
  useEffect(() => {
    const update = () => setFadeEnd(window.innerHeight * 0.6);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const centre = useTransform(scrollY, [0, fadeEnd], [1, 0]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-1">
      <div className="absolute inset-0" style={{ maskImage: SIDES }}>
        <ContourLines className="absolute inset-0 size-full" />
        <WalkLines />
      </div>
      <motion.div
        className="absolute inset-0"
        style={{
          opacity: centre,
          maskImage: `${CENTRE}, ${TOP}`,
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
      >
        <ContourLines className="absolute inset-0 size-full" />
      </motion.div>
    </div>
  );
}
