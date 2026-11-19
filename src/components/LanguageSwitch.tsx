import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { LANGS } from "../data";
import { LANGUAGE_NAMES, useLang } from "../i18n";
import { CheckIcon, GlobeIcon } from "./Icons";

/** Navbar button showing the current language, with a menu to pick another. */
export function LanguageSwitch() {
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on a click outside or on Escape, returning focus to the button.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t.language}: ${LANGUAGE_NAMES[lang]}`}
        title={t.language}
        className="flex h-9 items-center gap-1.5 rounded-full px-2.5 font-display text-sm text-ink-2 uppercase transition-colors hover:bg-paper-2 hover:text-ink"
      >
        <GlobeIcon className="size-4.5" />
        {lang}
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="menu"
            aria-label={t.language}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full right-0 mt-2 min-w-40 origin-top-right rounded-xl border border-line bg-paper p-1 shadow-[0_12px_40px_-12px_rgb(0_0_0/0.25)]"
          >
            {LANGS.map((code) => (
              <li key={code} role="none">
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={code === lang}
                  lang={code}
                  onClick={() => {
                    setLang(code);
                    setOpen(false);
                    buttonRef.current?.focus();
                  }}
                  className={`flex w-full items-center justify-between gap-4 rounded-lg px-3 py-2 text-left font-display text-sm transition-colors hover:bg-paper-2 ${
                    code === lang ? "text-accent" : "text-ink-2 hover:text-ink"
                  }`}
                >
                  {LANGUAGE_NAMES[code]}
                  {code === lang && <CheckIcon className="size-4" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
