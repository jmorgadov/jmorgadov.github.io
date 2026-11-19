import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useMatch } from "../skills";

/** Dims or outlines its content depending on the selected skill. */
export function Highlightable({
  skills,
  className = "",
  children,
}: {
  skills?: string[];
  className?: string;
  children: ReactNode;
}) {
  const state = useMatch(skills);
  return (
    <motion.div
      data-match={state}
      animate={{ opacity: state === "dim" ? 0.32 : 1 }}
      transition={{ duration: 0.3 }}
      className={`relative rounded-2xl transition-[box-shadow,background-color,border-color,translate] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        state === "match" ? "bg-accent-soft shadow-[0_0_0_1.5px_var(--accent)]" : ""
      } ${className}`}
    >
      {children}
    </motion.div>
  );
}
