import { useLang } from "../i18n";
import { socialIcons } from "./Icons";

export function Footer() {
  const { cv, t } = useLang();
  const { personal, socials } = cv;
  return (
    <footer id="contact" className="border-t border-line py-20 md:py-28">
      <h2 className="font-display text-3xl font-semibold tracking-tight">{t.getInTouch}</h2>
      <a
        href={`mailto:${personal.email}`}
        className="mt-4 inline-block font-display text-[clamp(1.5rem,4.5vw,3rem)] font-semibold tracking-tight break-all text-accent transition-opacity hover:opacity-80"
      >
        {personal.email}
      </a>
      <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 font-display">
        {(Object.keys(socialIcons) as (keyof typeof socialIcons)[]).map((key) => {
          const href = socials[key];
          if (!href) return null;
          const { label, icon: Icon } = socialIcons[key];
          return (
            <li key={key}>
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-ink-2 transition-colors hover:text-accent"
              >
                <Icon className="size-4.5" />
                {label}
              </a>
            </li>
          );
        })}
      </ul>
      <p className="mt-16 font-display text-sm text-ink-3">
        © {new Date().getFullYear()} {personal.name} {personal.last_name}. {t.builtWith}{" "}
        <a
          href={`https://github.com/${personal.user_name}/${personal.user_name}.github.io`}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:text-accent"
        >
          {t.source}
        </a>
      </p>
    </footer>
  );
}
