import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { displayName } from "../data";
import { useLang } from "../i18n";
import { DownloadIcon, MonogramIcon } from "./Icons";
import { LanguageSwitch } from "./LanguageSwitch";
import { ThemeToggle } from "./ThemeToggle";

export interface NavItem {
  id: string;
  label: string;
}

function useActiveSection(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    for (const id of ["top", ...ids]) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [ids]);
  return active === "top" ? null : active;
}

export function Nav({ items }: { items: NavItem[] }) {
  const { t } = useLang();
  const active = useActiveSection(items.map((i) => i.id));
  const [scrolled, setScrolled] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);

  // On narrow screens the list scrolls sideways: keep the active link in view.
  useEffect(() => {
    const list = listRef.current;
    const item = list?.querySelector<HTMLElement>('[aria-current="location"]')?.parentElement;
    if (!list || !item || list.scrollWidth <= list.clientWidth) return;
    const left = item.offsetLeft - (list.clientWidth - item.offsetWidth) / 2;
    list.scrollTo({ left, behavior: "smooth" });
  }, [active]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      aria-label={t.sectionsNav}
      className={`fixed inset-x-0 top-0 z-40 transition-[background-color,box-shadow,backdrop-filter] duration-300 ${
        scrolled
          ? "bg-paper/80 shadow-[0_1px_0_var(--line)] backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[78rem] items-center gap-4 px-4 sm:px-8">
        <a
          href="#top"
          aria-label={t.backToTop(displayName)}
          className="flex shrink-0 items-center gap-2.5 font-display font-semibold tracking-tight"
        >
          <span className="size-8 rounded-lg bg-accent text-accent-ink">
            <MonogramIcon className="block size-full" />
          </span>
          <motion.span
            className="hidden lg:inline"
            animate={{ opacity: active ? 1 : 0, x: active ? 0 : -6 }}
            transition={{ duration: 0.25 }}
          >
            {displayName}
          </motion.span>
        </a>

        <ul
          ref={listRef}
          className="relative -my-2 flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto py-2 [mask-image:linear-gradient(to_right,transparent,black_4%,black_85%,transparent)] [scrollbar-width:none] lg:justify-center lg:[mask-image:none]">
          {items.map((item) => (
            <li key={item.id} className="relative shrink-0">
              <a
                href={`#${item.id}`}
                aria-current={active === item.id ? "location" : undefined}
                className={`relative block rounded-full px-3 py-1.5 font-display text-sm transition-colors ${
                  active === item.id ? "text-accent-ink" : "text-ink-2 hover:text-ink"
                }`}
              >
                {active === item.id && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-accent"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex shrink-0 items-center gap-1">
          {__HAS_CV__ && (
            <a
              href="/cv.pdf"
              download
              aria-label={t.downloadCv}
              title={t.downloadCv}
              className="grid size-9 place-items-center rounded-full text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink sm:flex sm:w-auto sm:gap-1.5 sm:px-3 sm:font-display sm:text-sm"
            >
              <DownloadIcon className="size-4.5" />
              <span className="hidden sm:inline">CV</span>
            </a>
          )}
          <LanguageSwitch />
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
