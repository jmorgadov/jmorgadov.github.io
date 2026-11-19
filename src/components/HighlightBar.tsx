import { AnimatePresence, motion } from "motion/react";
import { skillUsage, useSkillFilter } from "../skills";
import { CloseIcon } from "./Icons";

/** Floating bar that names the selected skill and clears it. */
export function HighlightBar() {
  const { active, clear } = useSkillFilter();
  const count = active ? (skillUsage.get(active.key) ?? 0) : 0;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
      <AnimatePresence>
        {active && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="pointer-events-auto flex items-center gap-3 rounded-full bg-ink py-2 pr-2 pl-5 font-display text-sm text-paper shadow-[0_12px_40px_-12px_rgb(0_0_0/0.45)]"
          >
            <span>
              <strong className="font-semibold">{active.label}</strong>: {count}{" "}
              {count === 1 ? "role or project" : "roles and projects"} highlighted
            </span>
            <button
              type="button"
              onClick={clear}
              aria-label="Clear highlight"
              title="Clear highlight (Esc)"
              className="grid size-8 place-items-center rounded-full bg-paper/15 transition-colors hover:bg-paper/30"
            >
              <CloseIcon className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
