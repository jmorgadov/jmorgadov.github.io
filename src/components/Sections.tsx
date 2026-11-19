import { Fragment } from "react";
import { AUTHOR_NAME, formatYears, splitTitle, type Role } from "../data";
import { useLang } from "../i18n";
import { ChipList } from "./Chip";
import { Highlightable } from "./Highlightable";
import { ExternalIcon } from "./Icons";
import { ProjectArt } from "./ProjectArt";
import { Section } from "./Section";

function Highlights({ items }: { items?: string[] }) {
  if (!items?.length) return null;
  return (
    <ul className="mt-3 space-y-1.5 text-ink-2">
      {items.map((h) => (
        <li key={h} className="relative pl-5 before:absolute before:top-[0.7em] before:left-0 before:h-px before:w-2.5 before:bg-accent">
          {h}
        </li>
      ))}
    </ul>
  );
}

function Years({ children }: { children: string }) {
  return <span className="font-display text-sm text-ink-3 tabular-nums">{children}</span>;
}

function Place({ institution, location }: { institution: string; location: string }) {
  return (
    <p className="font-display text-base text-ink-2">
      {institution}
      <span className="text-ink-3">, {location}</span>
    </p>
  );
}

export function Experience() {
  const { cv, t } = useLang();
  return (
    <Section id="experience" title={t.sections.experience}>
      <ol className="relative space-y-4 before:absolute before:top-3 before:bottom-3 before:left-[7px] before:w-px before:bg-line">
        {cv.experience.map((role) => (
          <li key={`${role.title}-${role.institution}`} className="relative pl-9">
            <span
              aria-hidden="true"
              className="absolute top-[1.85rem] left-0 size-[15px] rounded-full border-2 border-accent bg-paper"
            />
            <Highlightable skills={role.skills} className="p-4 sm:p-5">
              <Years>{formatYears(role.start_year, role.end_year, t.present)}</Years>
              <h3 className="mt-1 font-display text-2xl font-semibold tracking-tight">
                {role.title}
              </h3>
              <Place institution={role.institution} location={role.location} />
              <Highlights items={role.highlights} />
              <div className="mt-4">
                <ChipList skills={role.skills} label={t.skillsUsedAs(role.title)} />
              </div>
            </Highlightable>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export function Projects() {
  const { cv, t } = useLang();
  return (
    <Section id="projects" title={t.sections.projects}>
      <div className="grid gap-4 lg:grid-cols-2">
        {cv.projects.map((project) => {
          // The title's subtitle repeats the description, which says more.
          const [name] = splitTitle(project.title);
          const heading = (
            <span className="block font-display text-3xl font-bold tracking-tight">{name}</span>
          );
          return (
            <Highlightable
              key={project.title}
              skills={project.skills}
              className="group isolate flex flex-col border border-line p-5 hover:-translate-y-1.5 hover:border-accent hover:shadow-[0_22px_45px_-24px_color-mix(in_oklab,var(--accent)_50%,transparent)] motion-reduce:hover:translate-y-0 sm:p-6"
            >
              <ProjectArt title={project.title} />
              <div className="flex items-center justify-between gap-3">
                <Years>{formatYears(project.start_year, project.end_year, t.present)}</Years>
                {project.link && (
                  <ExternalIcon className="size-5 text-ink-3 transition-[color,transform] duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent" />
                )}
              </div>
              <h3 className="mt-2">
                {project.link ? (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noreferrer"
                    className="transition-colors after:absolute after:inset-0 after:rounded-2xl hover:text-accent"
                  >
                    {heading}
                  </a>
                ) : (
                  heading
                )}
              </h3>
              <p className="mt-3">{project.description}</p>
              <Highlights items={project.highlights} />
              <div className="relative z-10 mt-auto pt-5">
                <ChipList skills={project.skills} label={t.skillsUsedIn(name)} />
              </div>
            </Highlightable>
          );
        })}
      </div>
    </Section>
  );
}

function Authors({ list }: { list: string }) {
  const names = list.split(",").map((n) => n.trim());
  return (
    <p className="font-display text-sm text-ink-3">
      {names.map((n, i) => (
        <Fragment key={`${n}-${i}`}>
          {i > 0 && ", "}
          {n === AUTHOR_NAME ? <strong className="font-semibold text-ink">{n}</strong> : n}
        </Fragment>
      ))}
    </p>
  );
}

export function Publications() {
  const { cv, t } = useLang();
  const pubs = [...cv.publications, ...(cv.preprints ?? [])];
  const citations = pubs.reduce((sum, p) => sum + (p.citations ?? 0), 0);
  return (
    <Section
      id="publications"
      title={t.sections.publications}
      aside={
        <>
          <p>{t.papersCited(pubs.length, citations)}</p>
          {cv.socials.googlescholar && (
            <a
              href={cv.socials.googlescholar}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 font-display text-sm text-accent hover:underline"
            >
              {t.scholarProfile}
              <ExternalIcon className="size-3.5" />
            </a>
          )}
        </>
      }
    >
      <ol className="divide-y divide-line">
        {pubs.map((pub) => (
          <li
            key={pub.title}
            className="grid gap-x-6 gap-y-1 py-6 first:pt-0 sm:grid-cols-[4rem_minmax(0,1fr)]"
          >
            <span className="font-display text-lg font-semibold text-ink-3 tabular-nums">
              {pub.year}
            </span>
            <div>
              <h3 className="text-xl leading-snug font-medium">
                {pub.link ? (
                  <a
                    href={pub.link}
                    target="_blank"
                    rel="noreferrer"
                    className="decoration-accent decoration-1 underline-offset-4 transition-colors hover:text-accent hover:underline"
                  >
                    {pub.title}
                  </a>
                ) : (
                  pub.title
                )}
              </h3>
              <p className="mt-1 text-ink-2 italic">{pub.venue}</p>
              <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <Authors list={pub.coauthors} />
                {!!pub.citations && (
                  <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-0.5 font-display text-xs font-medium text-accent">
                    {t.citedBy(pub.citations)}
                  </span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export function Skills() {
  const { cv, t } = useLang();
  return (
    <Section id="skills" title={t.sections.skills} aside={<p>{t.skillsHint}</p>}>
      <dl className="space-y-7">
        {Object.entries(cv.skills).map(([group, skills]) => (
          <div key={group} className="grid gap-x-6 gap-y-2 sm:grid-cols-[11rem_minmax(0,1fr)]">
            <dt className="pt-0.5 font-display font-semibold">{group}</dt>
            <dd>
              <ChipList skills={skills} label={group} />
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

export function Education() {
  const { cv, t } = useLang();
  return (
    <Section id="education" title={t.sections.education}>
      <ol className="space-y-8">
        {cv.education.map((ed) => (
          <li key={ed.degree}>
            <Years>{formatYears(ed.start_year, ed.end_year, t.present)}</Years>
            <h3 className="mt-1 font-display text-2xl font-semibold tracking-tight">{ed.degree}</h3>
            <Place institution={ed.institution} location={ed.location} />
            {ed.thesis_title && (
              <p className="mt-2 text-ink-2">
                {t.thesis} <cite>{ed.thesis_title}</cite>
              </p>
            )}
          </li>
        ))}
      </ol>
    </Section>
  );
}

export function Awards() {
  const { cv, t } = useLang();
  return (
    <Section id="awards" title={t.sections.awards}>
      <ol className="divide-y divide-line">
        {cv.awards.map((award) => (
          <li
            key={`${award.name}-${award.year}`}
            className="grid gap-x-6 py-4 first:pt-0 sm:grid-cols-[4rem_minmax(0,1fr)]"
          >
            <span className="font-display text-lg font-semibold text-ink-3 tabular-nums">
              {award.year}
            </span>
            <div>
              <h3 className="font-display text-lg font-semibold">{award.name}</h3>
              {award.description && <p className="text-ink-2">{award.description}</p>}
              <p className="mt-0.5 font-display text-sm text-ink-3">
                {award.institution}, {award.location}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

function CompactRole({ role }: { role: Role }) {
  const { t } = useLang();
  return (
    <li>
      <Years>{formatYears(role.start_year, role.end_year, t.present)}</Years>
      <h4 className="font-display text-lg font-semibold">{role.title}</h4>
      <p className="font-display text-sm text-ink-2">{role.institution}</p>
      <Highlights items={role.highlights} />
    </li>
  );
}

export function Teaching() {
  const { cv, t } = useLang();
  const courses = cv.courses_taught ?? [];
  const roles = cv.vocational ?? [];
  if (!courses.length && !roles.length) return null;
  return (
    <Section id="teaching" title={t.sections.teaching}>
      <div className="grid gap-12 lg:grid-cols-2">
        {courses.length > 0 && (
          <div>
            <h3 className="font-display text-xl font-semibold text-accent">{t.coursesTaught}</h3>
            <ul className="mt-4 space-y-5">
              {courses.map((c) => (
                <li key={c.title}>
                  <Years>{c.dates.join(", ")}</Years>
                  <h4 className="font-display text-lg font-semibold">{c.title}</h4>
                  <p className="font-display text-sm text-ink-2">
                    {c.program}, {c.institution}
                  </p>
                  {c.highlights?.map((h) => (
                    <p key={h} className="mt-1 text-ink-2">
                      {h}
                    </p>
                  ))}
                </li>
              ))}
            </ul>
          </div>
        )}
        {roles.length > 0 && (
          <div>
            <h3 className="font-display text-xl font-semibold text-accent">
              {t.assistantRoles}
            </h3>
            <ul className="mt-4 space-y-5">
              {roles.map((r) => (
                <CompactRole key={`${r.title}-${r.institution}`} role={r} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </Section>
  );
}

export function Languages() {
  const { cv, t } = useLang();
  const langs = Object.values(cv.languages);
  return (
    <Section id="languages" title={t.sections.languages}>
      <ul className="grid gap-6 sm:grid-cols-3">
        {langs.map((lang) => (
          <li key={lang.name}>
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-display text-2xl font-semibold tracking-tight">{lang.name}</h3>
              <span className="font-display text-sm font-semibold text-accent">
                {lang.level_cefr}
              </span>
            </div>
            <p className="mt-1 font-display text-sm text-ink-2">{lang.level}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
