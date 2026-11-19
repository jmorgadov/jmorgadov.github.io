import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import type { PointerEvent } from "react";
import photo from "../assets/profile.webp";
import { displayName } from "../data";
import { useLang } from "../i18n";

/** The rounded profile photo, with a slight tilt that follows the pointer. */
export function Portrait({ className = "" }: { className?: string }) {
  const { t } = useLang();
  const reduced = useReducedMotion();
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spring = { stiffness: 160, damping: 18 };
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [6, -6]), spring);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-6, 6]), spring);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduced) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <motion.div
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`relative perspective-[900px] ${className}`}
    >
      <motion.div
        style={{ rotateX, rotateY }}
        className="overflow-hidden rounded-[2rem] shadow-[0_2px_6px_rgb(0_0_0/0.06),0_28px_60px_-18px_color-mix(in_oklab,var(--accent)_40%,transparent)] dark:shadow-[0_2px_6px_rgb(0_0_0/0.4),0_28px_60px_-18px_rgb(0_0_0/0.75)]"
      >
        <img
          src={photo}
          alt={t.portraitOf(displayName)}
          width={640}
          height={800}
          decoding="async"
          fetchPriority="high"
          className="aspect-4/5 w-full object-cover dark:brightness-90"
        />
      </motion.div>
    </motion.div>
  );
}
