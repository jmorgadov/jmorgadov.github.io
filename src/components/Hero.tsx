import { motion, type Variants } from "motion/react";
import { displayName } from "../data";
import { useLang } from "../i18n";
import { HighlightsFeed } from "./HighlightsFeed";
import { DownloadIcon, MailIcon, PinIcon, socialIcons } from "./Icons";
import { Portrait } from "./Portrait";

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};

const rise: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

export function Hero() {
  const { lang, cv, t } = useLang();
  const { personal, socials } = cv;
  const [first, ...rest] = displayName.split(" ");

  return (
    <header id="top" className="relative isolate overflow-hidden">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="mx-auto flex min-h-[92svh] max-w-6xl flex-col justify-center gap-14 px-4 pt-32 pb-24 sm:px-8 lg:gap-20"
      >
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-center sm:gap-10 lg:gap-14">
          <motion.div variants={rise} className="shrink-0">
            <Portrait className="w-48 sm:w-56 lg:w-64" />
          </motion.div>
          <div className="text-center sm:text-left">
            <motion.h1
              variants={rise}
              className="font-display text-[clamp(2.75rem,5.6vw,5.25rem)] leading-[0.95] font-semibold tracking-[-0.03em]"
            >
              {first}
              <br />
              {rest.join(" ")}
            </motion.h1>
            <motion.p
              variants={rise}
              className="mt-6 font-display text-xl font-medium text-accent sm:text-2xl"
            >
              {personal.slogan}
            </motion.p>

            <motion.div
              variants={rise}
              className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-display text-base text-ink-2 sm:justify-start"
            >
              <span className="inline-flex items-center gap-2">
                <PinIcon className="size-4.5" />
                {personal.location}
              </span>
              <a
                href={`mailto:${personal.email}`}
                className="link-underline inline-flex items-center gap-2 hover:text-ink"
              >
                <MailIcon className="size-4.5" />
                {personal.email}
              </a>
            </motion.div>

            <motion.div
              variants={rise}
              className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:justify-start"
            >
              <a
                href={`mailto:${personal.email}`}
                className="rounded-full bg-ink px-5 py-2.5 font-display font-medium text-paper transition-transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {t.emailMe}
              </a>
              {__HAS_CV__ && (
                <a
                  href="/cv.pdf"
                  download
                  className="inline-flex items-center gap-2 rounded-full border border-ink/25 px-5 py-2.5 font-display font-medium transition-[transform,border-color] hover:-translate-y-0.5 hover:border-ink active:translate-y-0"
                >
                  <DownloadIcon className="size-4.5" />
                  {t.downloadCv}
                </a>
              )}
              <ul className="ml-1 flex items-center gap-1">
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
                        aria-label={label}
                        title={label}
                        className="grid size-10 place-items-center rounded-full text-ink-2 transition-[color,background-color,transform] hover:-translate-y-0.5 hover:bg-paper-2 hover:text-accent"
                      >
                        <Icon className="size-5" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          </div>
        </div>

        {cv.highlights && cv.highlights.length > 0 && (
          <motion.div variants={rise} className="mx-auto w-full max-w-xl">
            <HighlightsFeed key={lang} items={cv.highlights} />
          </motion.div>
        )}
      </motion.div>

    </header>
  );
}
