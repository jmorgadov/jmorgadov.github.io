import { useEffect, useRef } from "react";

interface Point {
  x: number;
  y: number;
}

const MAX_POINTS = 700;
const GAMMA = 1.4; // friction
const SIGMA = 300; // noise strength, px / s^1.5
const PULL = 2.2; // attraction towards the cursor
const HOME_PULL = 0.35; // weak spring towards the resting point
const ALPHA_BUCKETS = 24;

function gaussian(): number {
  // Box-Muller transform.
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * A particle following Langevin dynamics, drawn with a fading tail.
 * It drifts towards the cursor while the pointer is over the parent element.
 */
export function Trajectory({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !host || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let accent = "#0c6f86";
    let points: Point[] = [];
    let vx = 0;
    let vy = 0;
    let cursor: Point | null = null;
    let visible = true;
    let frame = 0;
    let last = 0;

    const home = (): Point => ({
      x: width * (width > 768 ? 0.72 : 0.5),
      y: height * 0.45,
    });

    const readColors = () => {
      accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
    };

    const step = (dt: number) => {
      const head = points[points.length - 1];
      const target = cursor ?? home();
      const pull = cursor ? PULL : HOME_PULL;
      const noise = SIGMA * Math.sqrt(dt);
      vx += (-GAMMA * vx + pull * (target.x - head.x)) * dt + noise * gaussian();
      vy += (-GAMMA * vy + pull * (target.y - head.y)) * dt + noise * gaussian();
      const margin = 24;
      const x = Math.min(Math.max(head.x + vx * dt, margin), width - margin);
      const y = Math.min(Math.max(head.y + vy * dt, margin), height - margin);
      if (x === margin || x === width - margin) vx *= -0.5;
      if (y === margin || y === height - margin) vy *= -0.5;
      points.push({ x, y });
      if (points.length > MAX_POINTS) points.shift();
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const n = points.length;
      if (n < 2) return;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.4;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      // Batch segments by opacity so the tail fades without one stroke per segment.
      const size = Math.ceil(n / ALPHA_BUCKETS);
      for (let b = 0; b * size < n - 1; b++) {
        const from = b * size;
        const to = Math.min(n - 1, from + size);
        ctx.globalAlpha = 0.65 * (to / n) ** 2;
        ctx.beginPath();
        ctx.moveTo(points[from].x, points[from].y);
        for (let i = from + 1; i <= to; i++) ctx.lineTo(points[i].x, points[i].y);
        ctx.stroke();
      }
      const head = points[n - 1];
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(head.x, head.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(head.x, head.y, 4, 0, Math.PI * 2);
      ctx.fill();
    };

    const seed = (steps: number) => {
      points = [home()];
      vx = vy = 0;
      for (let i = 0; i < steps; i++) step(1 / 60);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = host.getBoundingClientRect();
      const scaleX = width ? rect.width / width : 1;
      const scaleY = height ? rect.height / height : 1;
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (points.length) points = points.map((p) => ({ x: p.x * scaleX, y: p.y * scaleY }));
      else seed(reduced ? MAX_POINTS : 240);
      draw();
    };

    const loop = (t: number) => {
      const dt = Math.min((t - last) / 1000, 1 / 30);
      last = t;
      if (dt > 0) step(dt);
      draw();
      frame = requestAnimationFrame(loop);
    };

    const start = () => {
      if (reduced || frame || !visible || document.hidden) return;
      last = performance.now();
      frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      cursor = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onPointerLeave = () => {
      cursor = null;
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    readColors();
    resize();
    start();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    const themeObserver = new MutationObserver(() => {
      readColors();
      draw();
    });
    themeObserver.observe(document.documentElement, { attributeFilter: ["data-theme"] });
    const viewObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    viewObserver.observe(host);
    host.addEventListener("pointermove", onPointerMove);
    host.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      resizeObserver.disconnect();
      themeObserver.disconnect();
      viewObserver.disconnect();
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
