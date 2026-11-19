import { MotionConfig } from "motion/react";
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
import { cv } from "./data";
import { SkillFilterProvider } from "./skills";

const NAV: NavItem[] = [
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  ...(cv.publications.length ? [{ id: "publications", label: "Publications" }] : []),
  { id: "skills", label: "Skills" },
  { id: "education", label: "Education" },
  { id: "awards", label: "Awards" },
  { id: "contact", label: "Contact" },
];

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <SkillFilterProvider>
        <a
          href="#experience"
          className="sr-only z-50 rounded-md bg-accent px-4 py-2 text-accent-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <Nav items={NAV} />
        <Hero />
        <main className="mx-auto max-w-6xl px-4 sm:px-8">
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
