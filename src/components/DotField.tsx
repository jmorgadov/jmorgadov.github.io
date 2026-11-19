import { useEffect, useRef } from "react";

const SPACING = 26; // px between dots
const BASE_RADIUS = 1.1;
const GROW = 1.9; // extra radius at the lens centre
const PUSH = 9; // px a dot moves away from the lens centre
const LENS_RADIUS = 260;
const FOLLOW = 0.18; // how quickly the lens catches up with the cursor, per frame
const FADE = 0.08; // how quickly the lens appears/disappears, per frame

/**
 * A static grid of dots that swells and tints around the cursor like a lens.
 * Nothing animates while the pointer is away, so it stays out of the way.
 */
export function DotField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !host || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let dots: Float32Array = new Float32Array();
    let dotColor = "#646a7a";
    let accent = "#0c6f86";
    let cursor: { x: number; y: number } | null = null;
    const lens = { x: 0, y: 0, strength: 0 };
    let frame = 0;

    const readColors = () => {
      const style = getComputedStyle(document.documentElement);
      dotColor = style.getPropertyValue("--ink-3").trim();
      accent = style.getPropertyValue("--accent").trim();
    };

    const layout = () => {
      const cols = Math.ceil(width / SPACING) + 1;
      const rows = Math.ceil(height / SPACING) + 1;
      const offsetX = (width - (cols - 1) * SPACING) / 2;
      const offsetY = (height - (rows - 1) * SPACING) / 2;
      dots = new Float32Array(cols * rows * 2);
      let i = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          dots[i++] = offsetX + c * SPACING;
          dots[i++] = offsetY + r * SPACING;
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const lensed: number[] = [];

      // Unaffected dots share one path.
      ctx.globalAlpha = 0.32;
      ctx.fillStyle = dotColor;
      ctx.beginPath();
      for (let i = 0; i < dots.length; i += 2) {
        const x = dots[i];
        const y = dots[i + 1];
        if (lens.strength > 0.001) {
          const dx = x - lens.x;
          const dy = y - lens.y;
          if (dx * dx + dy * dy < LENS_RADIUS * LENS_RADIUS) {
            lensed.push(x, y);
            continue;
          }
        }
        ctx.moveTo(x + BASE_RADIUS, y);
        ctx.arc(x, y, BASE_RADIUS, 0, Math.PI * 2);
      }
      ctx.fill();

      ctx.fillStyle = accent;
      for (let i = 0; i < lensed.length; i += 2) {
        const dx = lensed[i] - lens.x;
        const dy = lensed[i + 1] - lens.y;
        const d = Math.hypot(dx, dy);
        const f = 1 - d / LENS_RADIUS;
        const t = lens.strength * f * f * (3 - 2 * f); // smoothstep falloff
        const push = d > 0 ? (PUSH * t) / d : 0;
        ctx.globalAlpha = 0.32 + 0.18 * t;
        ctx.beginPath();
        ctx.arc(lensed[i] + dx * push, lensed[i + 1] + dy * push, BASE_RADIUS + GROW * t, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const tick = () => {
      frame = 0;
      const target = cursor ? 1 : 0;
      if (cursor) {
        const follow = reduced || lens.strength < 0.01 ? 1 : FOLLOW;
        lens.x += (cursor.x - lens.x) * follow;
        lens.y += (cursor.y - lens.y) * follow;
      }
      lens.strength += (target - lens.strength) * (reduced ? 1 : FADE);
      if (Math.abs(target - lens.strength) < 0.005) lens.strength = target;
      draw();
      const settling =
        lens.strength !== target ||
        (cursor && Math.hypot(cursor.x - lens.x, cursor.y - lens.y) > 0.5);
      if (settling) frame = requestAnimationFrame(tick);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = host.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      layout();
      draw();
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      cursor = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      schedule();
    };
    const onPointerLeave = () => {
      cursor = null;
      schedule();
    };

    readColors();
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    const themeObserver = new MutationObserver(() => {
      readColors();
      draw();
    });
    themeObserver.observe(document.documentElement, { attributeFilter: ["data-theme"] });
    host.addEventListener("pointermove", onPointerMove);
    host.addEventListener("pointerleave", onPointerLeave);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
