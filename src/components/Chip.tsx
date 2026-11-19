import { useLang } from "../i18n";
import { skillKey, skillUsage, useSkillFilter } from "../skills";

/**
 * A skill tag. Skills used by at least one role or project are buttons that
 * highlight those items; the rest render as plain text.
 */
export function Chip({ name }: { name: string }) {
  const { active, toggle } = useSkillFilter();
  const { t } = useLang();
  const key = skillKey(name);
  const count = skillUsage.get(key) ?? 0;
  const pressed = active?.key === key;
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 font-display text-sm leading-6";

  if (count === 0) {
    return <span className={`${base} text-ink-3`}>{name}</span>;
  }

  return (
    <button
      type="button"
      onClick={() => toggle(name)}
      aria-pressed={pressed}
      title={pressed ? t.clearHighlight : t.highlightSkill(name)}
      className={`${base} border transition-[color,background-color,border-color,transform] duration-200 active:scale-95 ${
        pressed
          ? "border-accent bg-accent text-accent-ink"
          : "border-line text-ink-2 hover:border-accent hover:text-accent"
      }`}
    >
      {name}
    </button>
  );
}

export function ChipList({ skills, label }: { skills?: string[]; label: string }) {
  if (!skills?.length) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label={label}>
      {skills.map((s) => (
        <li key={s}>
          <Chip name={s} />
        </li>
      ))}
    </ul>
  );
}
