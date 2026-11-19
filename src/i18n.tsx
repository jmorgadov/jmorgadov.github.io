import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cvs, LANGS, type CV, type Lang } from "./data";

/** Each language's name, written in that language. */
export const LANGUAGE_NAMES: Record<Lang, string> = {
  en: "English",
  it: "Italiano",
  es: "Español",
};

const en = {
  skipToContent: "Skip to content",
  sectionsNav: "Sections",
  backToTop: (name: string) => `${name}, back to top`,
  sections: {
    experience: "Experience",
    projects: "Projects",
    publications: "Publications",
    skills: "Skills",
    education: "Education",
    awards: "Awards",
    teaching: "Teaching & early research",
    languages: "Languages",
    contact: "Contact",
  },
  language: "Language",
  switchTheme: (theme: "light" | "dark") => `Switch to ${theme} theme`,
  downloadCv: "Download CV",
  previousHighlight: "Previous highlight",
  nextHighlight: "Next highlight",
  previous: "Previous",
  next: "Next",
  paused: "Paused",
  scroll: "Scroll",
  present: "Present",
  skillsUsedAs: (title: string) => `Skills used as ${title}`,
  skillsUsedIn: (name: string) => `Skills used in ${name}`,
  papersCited: (papers: number, citations: number) =>
    `${papers} papers, cited ${citations} times.`,
  scholarProfile: "Google Scholar profile",
  citedBy: (n: number) => `Cited by ${n}`,
  skillsHint: "Select a skill to highlight the roles and projects where I used it.",
  thesis: "Thesis:",
  coursesTaught: "Courses taught",
  assistantRoles: "Research and teaching assistant roles",
  getInTouch: "Get in touch",
  builtWith: "Built with React.",
  highlighted: (n: number) =>
    `${n} ${n === 1 ? "role or project" : "roles and projects"} highlighted`,
  clearHighlight: "Clear highlight",
  clearHighlightEsc: "Clear highlight (Esc)",
  highlightSkill: (name: string) => `Highlight work that uses ${name}`,
};

export type Strings = typeof en;

const it: Strings = {
  skipToContent: "Vai al contenuto",
  sectionsNav: "Sezioni",
  backToTop: (name) => `${name}, torna all'inizio`,
  sections: {
    experience: "Esperienza",
    projects: "Progetti",
    publications: "Pubblicazioni",
    skills: "Competenze",
    education: "Formazione",
    awards: "Premi",
    teaching: "Didattica e prime ricerche",
    languages: "Lingue",
    contact: "Contatti",
  },
  language: "Lingua",
  switchTheme: (theme) => (theme === "dark" ? "Passa al tema scuro" : "Passa al tema chiaro"),
  downloadCv: "Scarica il CV",
  previousHighlight: "Punto saliente precedente",
  nextHighlight: "Punto saliente successivo",
  previous: "Precedente",
  next: "Successivo",
  paused: "In pausa",
  scroll: "Scorri",
  present: "oggi",
  skillsUsedAs: (title) => `Competenze usate come ${title}`,
  skillsUsedIn: (name) => `Competenze usate in ${name}`,
  papersCited: (papers, citations) => `${papers} articoli, citati ${citations} volte.`,
  scholarProfile: "Profilo Google Scholar",
  citedBy: (n) => `Citato da ${n}`,
  skillsHint: "Seleziona una competenza per evidenziare i ruoli e i progetti in cui l'ho usata.",
  thesis: "Tesi:",
  coursesTaught: "Corsi tenuti",
  assistantRoles: "Ruoli di assistente alla ricerca e alla didattica",
  getInTouch: "Contattami",
  builtWith: "Realizzato con React.",
  highlighted: (n) =>
    n === 1 ? `${n} ruolo o progetto evidenziato` : `${n} ruoli e progetti evidenziati`,
  clearHighlight: "Rimuovi evidenziazione",
  clearHighlightEsc: "Rimuovi evidenziazione (Esc)",
  highlightSkill: (name) => `Evidenzia il lavoro che usa ${name}`,
};

const es: Strings = {
  skipToContent: "Saltar al contenido",
  sectionsNav: "Secciones",
  backToTop: (name) => `${name}, volver arriba`,
  sections: {
    experience: "Experiencia",
    projects: "Proyectos",
    publications: "Publicaciones",
    skills: "Habilidades",
    education: "Formación",
    awards: "Premios",
    teaching: "Docencia e investigación temprana",
    languages: "Idiomas",
    contact: "Contacto",
  },
  language: "Idioma",
  switchTheme: (theme) => (theme === "dark" ? "Cambiar al tema oscuro" : "Cambiar al tema claro"),
  downloadCv: "Descargar CV",
  previousHighlight: "Destacado anterior",
  nextHighlight: "Destacado siguiente",
  previous: "Anterior",
  next: "Siguiente",
  paused: "En pausa",
  scroll: "Desplázate",
  present: "actualidad",
  skillsUsedAs: (title) => `Habilidades usadas como ${title}`,
  skillsUsedIn: (name) => `Habilidades usadas en ${name}`,
  papersCited: (papers, citations) => `${papers} artículos, citados ${citations} veces.`,
  scholarProfile: "Perfil de Google Scholar",
  citedBy: (n) => `Citado por ${n}`,
  skillsHint: "Selecciona una habilidad para resaltar los puestos y proyectos donde la he usado.",
  thesis: "Tesis:",
  coursesTaught: "Cursos impartidos",
  assistantRoles: "Puestos de asistente de investigación y docencia",
  getInTouch: "Hablemos",
  builtWith: "Hecho con React.",
  highlighted: (n) =>
    n === 1 ? `${n} puesto o proyecto resaltado` : `${n} puestos y proyectos resaltados`,
  clearHighlight: "Quitar resaltado",
  clearHighlightEsc: "Quitar resaltado (Esc)",
  highlightSkill: (name) => `Resaltar el trabajo que usa ${name}`,
};

const STRINGS: Record<Lang, Strings> = { en, it, es };
const STORAGE_KEY = "lang";

function isLang(value: unknown): value is Lang {
  return LANGS.includes(value as Lang);
}

/** The stored choice, else the first browser language we have, else English. */
function initialLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLang(stored)) return stored;
  } catch {
    // Storage unavailable: fall back to the browser languages.
  }
  for (const tag of navigator.languages ?? [navigator.language]) {
    const code = tag.slice(0, 2).toLowerCase();
    if (isLang(code)) return code;
  }
  return "en";
}

interface LangContext {
  lang: Lang;
  setLang: (lang: Lang) => void;
  cv: CV;
  t: Strings;
}

const LangContext = createContext<LangContext | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable: the choice lasts for this visit only.
    }
  }, []);

  const value = useMemo(
    () => ({ lang, setLang, cv: cvs[lang], t: STRINGS[lang] }),
    [lang, setLang],
  );
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContext {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside LanguageProvider");
  return ctx;
}
