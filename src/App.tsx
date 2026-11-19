import { MotionConfig } from "motion/react";
import { ContourBackground } from "./components/ContourLines";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { HighlightBar } from "./components/HighlightBar";
import { Nav, type NavItem } from "./components/Nav";
import {
  Awards,
  Education,
  Experience,
  Languages,
  Projects,
  Publications,
  Skills,
  Teaching,
} from "./components/Sections";
import { LanguageProvider, useLang } from "./i18n";
import { SkillFilterProvider } from "./skills";

export function App() {
  return (
    <LanguageProvider>
      <Page />
    </LanguageProvider>
  );
}

function Page() {
  const { cv, t } = useLang();
  const nav: NavItem[] = [
    { id: "experience", label: t.sections.experience },
    { id: "projects", label: t.sections.projects },
    ...(cv.publications.length ? [{ id: "publications", label: t.sections.publications }] : []),
    { id: "skills", label: t.sections.skills },
    { id: "education", label: t.sections.education },
    { id: "awards", label: t.sections.awards },
    { id: "contact", label: t.sections.contact },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <SkillFilterProvider>
        <a
          href="#experience"
          className="sr-only z-50 rounded-md bg-accent px-4 py-2 text-accent-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          {t.skipToContent}
        </a>
        <ContourBackground />
        <Nav items={nav} />
        <Hero />
        <main className="mx-auto max-w-[78rem] px-4 sm:px-8">
          <Experience />
          <Projects />
          {cv.publications.length > 0 && <Publications />}
          <Skills />
          <Education />
          <Awards />
          <Teaching />
          <Languages />
          <Footer />
        </main>
        <HighlightBar />
      </SkillFilterProvider>
    </MotionConfig>
  );
}
