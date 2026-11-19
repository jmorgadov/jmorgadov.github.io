import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Variants,
} from "motion/react";
import type { PointerEvent } from "react";
import photo from "../assets/photo.webp";
import { cv, displayName } from "../data";
import { DownloadIcon, MailIcon, PinIcon, socialIcons } from "./Icons";
import { Trajectory } from "./Trajectory";

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};

const rise: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

function Portrait() {
  const reduced = useReducedMotion();
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spring = { stiffness: 160, damping: 18 };
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [7, -7]), spring);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-7, 7]), spring);
  const shadowX = useSpring(useTransform(px, [-0.5, 0.5], [22, 6]), spring);
  const shadowY = useSpring(useTransform(py, [-0.5, 0.5], [22, 6]), spring);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduced) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <motion.div
      variants={rise}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="relative mx-auto w-56 [perspective:900px] sm:w-64 md:mx-0 md:w-72 lg:w-80"
    >
      <motion.div style={{ rotateX, rotateY }} className="relative">
        <motion.div
          aria-hidden="true"
          style={{ x: shadowX, y: shadowY }}
          className="absolute inset-0 rounded-[2rem] bg-accent"
        />
        <img
          src={photo}
          alt={`Portrait of ${displayName}`}
          width={900}
          height={900}
          className="relative aspect-square w-full rounded-[2rem] object-cover dark:brightness-90"
        />
      </motion.div>
    </motion.div>
  );
}

export function Hero() {
  const { personal, socials } = cv;
  const [first, ...rest] = displayName.split(" ");

  return (
    <header id="top" className="relative isolate overflow-hidden">
      <Trajectory className="pointer-events-none absolute inset-0 -z-10" />
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="mx-auto grid min-h-[92svh] max-w-6xl items-center gap-12 px-4 pt-32 pb-24 sm:px-8 md:grid-cols-[minmax(0,1fr)_auto] md:gap-16"
      >
        <div className="order-2 md:order-1">
          <motion.h1
            variants={rise}
            className="font-display text-[clamp(3.5rem,10vw,8.5rem)] leading-[0.88] font-bold tracking-[-0.035em]"
            style={{ fontStretch: "78%" }}
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
          <motion.p
            variants={rise}
            className="mt-4 max-w-[36ch] text-xl leading-relaxed text-ink-2 sm:text-2xl"
          >
            {personal.shortbio}
          </motion.p>

          <motion.div
            variants={rise}
            className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 font-display text-base text-ink-2"
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

          <motion.div variants={rise} className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href={`mailto:${personal.email}`}
              className="rounded-full bg-ink px-5 py-2.5 font-display font-medium text-paper transition-transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Email me
            </a>
            {__HAS_CV__ && (
              <a
                href="/cv.pdf"
                download
                className="inline-flex items-center gap-2 rounded-full border border-ink/25 px-5 py-2.5 font-display font-medium transition-[transform,border-color] hover:-translate-y-0.5 hover:border-ink active:translate-y-0"
              >
                <DownloadIcon className="size-4.5" />
                Download CV
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

        <div className="order-1 md:order-2">
          <Portrait />
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.8 }}
        className="absolute inset-x-0 bottom-6 mx-auto max-w-6xl px-4 font-display text-sm text-ink-3 sm:px-8 sm:text-right"
      >
        The line is a live Langevin walk, the model behind{" "}
        <a
          href="https://github.com/yupidevs/yupi"
          target="_blank"
          rel="noreferrer"
          className="underline decoration-line underline-offset-2 hover:text-accent"
        >
          yupi
        </a>
        &rsquo;s trajectory generator.
        <br className="hidden sm:inline" /> Point anywhere here to steer it.
      </motion.p>
    </header>
  );
}
