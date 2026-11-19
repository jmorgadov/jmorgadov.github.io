import en from "../data/en.yml";
import es from "../data/es.yml";
import it from "../data/it.yml";

export type Year = number | "present";

export interface Personal {
  name: string;
  last_name: string;
  user_name: string;
  email: string;
  phone?: string;
  location: string;
  slogan: string;
  shortbio: string;
}

export interface Education {
  degree: string;
  start_year: Year;
  end_year: Year;
  institution: string;
  location: string;
  thesis_title?: string;
}

export interface Role {
  title: string;
  start_year: Year;
  end_year: Year;
  institution: string;
  location: string;
  highlights?: string[];
  skills?: string[];
}

export interface Publication {
  title: string;
  year: number;
  venue: string;
  citations?: number;
  coauthors: string;
  link?: string;
}

export interface Project {
  title: string;
  start_year: Year;
  end_year: Year;
  link?: string;
  description: string;
  highlights?: string[];
  skills?: string[];
}

export interface Course {
  title: string;
  program: string;
  dates: string[];
  institution: string;
  location: string;
  highlights?: string[];
}

export interface Award {
  name: string;
  description?: string;
  year: number;
  institution: string;
  location: string;
}

export interface Language {
  name: string;
  level: string;
  level_cefr: string;
  score: number;
}

export interface CV {
  personal: Personal;
  highlights?: string[];
  socials: Partial<Record<"linkedin" | "twitter" | "github" | "googlescholar" | "orcid", string>>;
  education: Education[];
  experience: Role[];
  publications: Publication[];
  preprints?: Publication[];
  vocational?: Role[];
  courses_taught?: Course[];
  projects: Project[];
  skills: Record<string, string[]>;
  awards: Award[];
  languages: Record<string, Language>;
}

export const LANGS = ["en", "it", "es"] as const;
export type Lang = (typeof LANGS)[number];

export const cvs: Record<Lang, CV> = { en: en as CV, it: it as CV, es: es as CV };

/**
 * The English data, for what every language shares: names, links and skill
 * tags. Translated content comes from `useLang().cv`.
 */
export const cv = cvs.en;

/** Name shown in the hero and nav. */
export const displayName = `${cv.personal.name.split(" ")[0]} ${cv.personal.last_name}`;

export const fullName = `${cv.personal.name} ${cv.personal.last_name}`;

/** How the owner's name appears in coauthor lists. */
export const AUTHOR_NAME = "JJ Morgado-Vega";

export function formatYears(start: Year, end: Year, present = "Present"): string {
  const fmt = (y: Year) => (y === "present" ? present : String(y));
  return start === end ? fmt(start) : `${fmt(start)}–${fmt(end)}`;
}

/** Splits "yupi: Open Source Framework" into its name and subtitle. */
export function splitTitle(title: string): [string, string | null] {
  const i = title.indexOf(": ");
  return i === -1 ? [title, null] : [title.slice(0, i), title.slice(i + 2)];
}
