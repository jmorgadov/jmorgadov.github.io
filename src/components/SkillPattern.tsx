import type { CSSProperties } from "react";
import { cv } from "../data";

const ROWS = 22;
const WORDS_PER_ROW = 20;

// Skill names are the same in every language, so the English data is enough.
const SKILLS = Object.values(cv.skills).flat();

/** Row `r` starts at a different point of the skill list so rows do not line up. */
function rowText(r: number): string {
  const start = (r * 7) % SKILLS.length;
  const words = Array.from(
    { length: WORDS_PER_ROW },
    (_, k) => SKILLS[(start + k) % SKILLS.length],
  );
  return `${words.join("  ·  ")}  ·  `;
}

/**
 * Faint, tilted rows of skill names drifting sideways behind the page.
 * Each row holds its text twice and slides by half its width, so it loops
 * without a seam. Neighbouring rows move in opposite directions.
 *
 * Not used at the moment; render it at the top of `App` to bring it back.
 */
export function SkillPattern() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-1 overflow-hidden select-none"
    >
      <div className="absolute top-1/2 left-1/2 flex w-[150vmax] -translate-x-1/2 -translate-y-1/2 -rotate-12 flex-col gap-9">
        {Array.from({ length: ROWS }, (_, r) => {
          const text = rowText(r);
          return (
            <div
              key={r}
              className="flex w-max animate-[pattern-drift_var(--drift)_linear_infinite] font-display text-3xl leading-none font-semibold whitespace-pre text-ink/[0.045] motion-reduce:animate-none dark:text-ink/[0.05]"
              style={
                {
                  "--drift": `${260 + (r % 5) * 30}s`,
                  animationDirection: r % 2 ? "reverse" : "normal",
                } as CSSProperties
              }
            >
              <span>{text}</span>
              <span>{text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
