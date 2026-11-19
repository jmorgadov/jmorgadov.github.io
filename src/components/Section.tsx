import { motion } from "motion/react";
import type { ReactNode } from "react";

interface SectionProps {
  id: string;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}

/** A page section with its heading in a sticky left margin. */
export function Section({ id, title, aside, children }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="grid gap-x-12 gap-y-8 border-t border-line py-16 first:border-t-0 md:grid-cols-[13rem_minmax(0,1fr)] md:py-24"
    >
      <div>
        <div className="md:sticky md:top-24">
          <h2 id={`${id}-title`} className="font-display text-3xl font-semibold tracking-tight">
            {title}
          </h2>
          {aside && <div className="mt-3 text-base text-ink-2">{aside}</div>}
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.08 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </section>
  );
}
