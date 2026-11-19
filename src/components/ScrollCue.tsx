import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useLang } from "../i18n";
import { ChevronDownIcon } from "./Icons";

/**
 * A bobbing chevron at the bottom of the hero that invites scrolling and
 * links to the first section. It appears after the intro animation and fades
 * out once the page is scrolled.
 */
export function ScrollCue() {
  const { t } = useLang();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.a
      href="#experience"
      aria-label={`${t.scroll}: ${t.sections.experience}`}
      tabIndex={scrolled ? -1 : undefined}
      initial={{ opacity: 0 }}
      animate={{ opacity: scrolled ? 0 : 1 }}
      transition={{ duration: 0.4, delay: scrolled ? 0 : 1.4 }}
      className={`absolute bottom-4 left-1/2 grid size-10 -translate-x-1/2 place-items-center rounded-full text-ink-3 transition-colors hover:text-accent sm:bottom-6 ${
        scrolled ? "pointer-events-none" : ""
      }`}
    >
      <motion.span
        animate={{ y: [0, 5, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDownIcon className="size-6" />
      </motion.span>
    </motion.a>
  );
}
