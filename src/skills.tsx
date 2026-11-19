import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { cv } from "./data";

// Names used in project/role tags that refer to an entry of the skills list.
const ALIASES: Record<string, string> = {
  llms: "llm integration",
  testing: "pytest",
};

export function skillKey(name: string): string {
  const key = name.trim().toLowerCase();
  return ALIASES[key] ?? key;
}

const taggedItems = [...cv.experience, ...cv.projects];

/** How many roles and projects are tagged with each skill key. */
export const skillUsage: Map<string, number> = (() => {
  const usage = new Map<string, number>();
  for (const item of taggedItems) {
    for (const key of new Set((item.skills ?? []).map(skillKey))) {
      usage.set(key, (usage.get(key) ?? 0) + 1);
    }
  }
  return usage;
})();

interface SkillFilter {
  active: { key: string; label: string } | null;
  toggle: (label: string) => void;
  clear: () => void;
}

const SkillFilterContext = createContext<SkillFilter | null>(null);

export function SkillFilterProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<SkillFilter["active"]>(null);

  const toggle = useCallback((label: string) => {
    const key = skillKey(label);
    setActive((cur) => (cur?.key === key ? null : { key, label }));
  }, []);
  const clear = useCallback(() => setActive(null), []);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && clear();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, clear]);

  const value = useMemo(() => ({ active, toggle, clear }), [active, toggle, clear]);
  return <SkillFilterContext.Provider value={value}>{children}</SkillFilterContext.Provider>;
}

export function useSkillFilter(): SkillFilter {
  const ctx = useContext(SkillFilterContext);
  if (!ctx) throw new Error("useSkillFilter must be used inside SkillFilterProvider");
  return ctx;
}

/** "idle" when no skill is selected, otherwise whether the item uses it. */
export function useMatch(skills: string[] | undefined): "idle" | "match" | "dim" {
  const { active } = useSkillFilter();
  if (!active) return "idle";
  return (skills ?? []).some((s) => skillKey(s) === active.key) ? "match" : "dim";
}
