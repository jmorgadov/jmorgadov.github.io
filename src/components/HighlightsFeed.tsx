import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { cv } from "../data";
import { useLang } from "../i18n";
import { ChevronLeftIcon, ChevronRightIcon } from "./Icons";
import { skillKey, skillUsage } from "../skills";

// Items enter from below when moving forward and from above when going back.
const slide = {
  enter: (dir: number) => ({ opacity: 0, y: dir * 24 }),
  exit: (dir: number) => ({
    opacity: 0,
    y: dir > 0 ? -12 : 24,
    transition: { duration: 0.3 },
  }),
};
const HOLD_MS = 5200; // time a finished highlight stays before the next one
// English, Italian and Spanish function words, which never get candidates.
const STOPWORDS = new Set(
  [
    "a an and the of in on at to for with from by as is are was were be been it its that this than or into over per via each my",
    "il lo la le gli un una uno di del della dello delle dei degli da dal dalla al alla allo ai agli nel nella nei con per tra fra che come sono ogni più",
    "el los las un una unos unas de del al en con por para que como sus más desde hasta entre sobre cada",
  ]
    .join(" ")
    .split(" "),
);
const SKILL_WORDS = new Set([
  ...skillUsage.keys(),
  ...Object.values(cv.skills)
    .flat()
    .map((s) => s.toLowerCase()),
]);

interface Token {
  text: string;
  core: string;
  content: boolean;
  salience: number;
}

interface Candidate {
  word: string;
  p: number;
}

/** The candidates shown while decoding the token at index `at`. */
interface CandidateBox {
  at: number;
  options: Candidate[];
}

function tokenize(text: string): Token[] {
  return text.split(/\s+/).map((t) => {
    const core = t.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
    const lower = core.toLowerCase();
    const content = core.length > 2 && !STOPWORDS.has(lower);
    let salience = 1;
    if (core.length > 6) salience += 0.3;
    if (/^[\p{Lu}\p{N}]/u.test(core)) salience += 0.4;
    if (SKILL_WORDS.has(lower) || skillUsage.has(skillKey(core))) salience += 0.6;
    return { text: t, core, content, salience };
  });
}

/** Deterministic pseudo-random number in [0, 1) for a pair of words. */
function pairNoise(a: string, b: string): number {
  const s = a < b ? `${a}|${b}` : `${b}|${a}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

/**
 * Fake but plausible attention weights from token `i` to the other content
 * tokens: nearby, salient words get most of the mass. With `causal`, only
 * earlier tokens are considered, as when a model generates token `i`.
 */
function attention(tokens: Token[], i: number, causal = false): Map<number, number> {
  const scores: [number, number][] = [];
  tokens.forEach((t, j) => {
    if (j === i || !t.content || (causal && j > i)) return;
    const s =
      t.salience * Math.exp(-Math.abs(i - j) / 7) * (0.6 + 0.8 * pairNoise(tokens[i].core, t.core));
    scores.push([j, s]);
  });
  if (!scores.length) return new Map();
  const max = Math.max(...scores.map(([, s]) => s));
  const exp = scores.map(([j, s]) => [j, Math.exp((s - max) / 0.75)] as const);
  const total = exp.reduce((sum, [, e]) => sum + e, 0);
  return new Map(
    exp
      .map(([j, e]) => [j, e / total] as [number, number])
      .filter(([, w]) => w > 0.06)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4),
  );
}

function makeCandidates(token: Token, vocab: string[]): Candidate[] {
  const pool = vocab.filter((w) => w !== token.core && Math.abs(w.length - token.core.length) < 4);
  const others = [...pool].sort(() => Math.random() - 0.5).slice(0, 2);
  const top = 0.55 + Math.random() * 0.37;
  const second = (1 - top) * (0.55 + Math.random() * 0.3);
  return [
    { word: token.core, p: top },
    ...others.map((word, k) => ({ word, p: k === 0 ? second : (1 - top - second) * 0.8 })),
  ];
}

interface Arc {
  id: string;
  d: string;
  w: number;
  x2: number;
  y2: number;
}

interface HighlightProps {
  tokens: Token[];
  revealed: number;
  candidates: CandidateBox | null;
}

function Highlight({ tokens, revealed, candidates }: HighlightProps) {
  const wrapRef = useRef<HTMLParagraphElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [hovered, setHovered] = useState<number | null>(null);
  const [arcs, setArcs] = useState<Arc[]>([]);
  const arcBatch = useRef(0);
  const caretRef = useRef<HTMLSpanElement>(null);
  const [caretAt, setCaretAt] = useState<{ x: number; y: number; flip: boolean } | null>(null);
  const decoding = revealed < tokens.length;

  // While decoding, the newest content word attends to the words before it.
  const generating = useMemo(() => {
    if (!decoding) return null;
    for (let i = Math.min(revealed, tokens.length) - 1; i >= 0; i--) {
      if (tokens[i].content) return i;
    }
    return null;
  }, [decoding, revealed, tokens]);
  const focus = hovered ?? generating;

  const weights = useMemo(
    () => (focus === null ? new Map<number, number>() : attention(tokens, focus, focus === generating)),
    [tokens, focus, generating],
  );

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const from = focus === null ? null : wordRefs.current[focus];
    if (!wrap || !from) {
      setArcs([]);
      return;
    }
    const base = wrap.getBoundingClientRect();
    const a = from.getBoundingClientRect();
    const x1 = a.left + a.width / 2 - base.left;
    const y1 = a.top - base.top + 3;
    // Each batch gets fresh keys, so arcs being replaced fade out on their own.
    const batch = ++arcBatch.current;
    const next: Arc[] = [];
    for (const [j, w] of weights) {
      const el = wordRefs.current[j];
      if (!el) continue;
      const b = el.getBoundingClientRect();
      const x2 = b.left + b.width / 2 - base.left;
      const y2 = b.top - base.top + 3;
      const lift = 12 + Math.abs(x2 - x1) * 0.18;
      const cy = Math.min(y1, y2) - lift;
      next.push({ id: `${batch}-${j}`, d: `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${cy} ${x2} ${y2}`, w, x2, y2 });
    }
    setArcs(next);
  }, [focus, weights]);

  // The candidate box hangs below the caret, opening towards the left when the
  // caret is near the edge.
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const caret = caretRef.current;
    if (!wrap || !caret) {
      setCaretAt(null);
      return;
    }
    const base = wrap.getBoundingClientRect();
    const c = caret.getBoundingClientRect();
    setCaretAt({ x: c.left - base.left, y: c.bottom - base.top, flip: base.right - c.left < 150 });
  }, [revealed]);

  // Arcs drawn while generating are fainter than the ones shown on hover.
  const strength = hovered === null ? 0.45 : 1;

  // Placed right after the last revealed word, before its space: a space
  // followed by the caret would no longer hang at the end of a centered line.
  const caret = (
    <span ref={caretRef} className="relative inline-block h-[1.1em] w-0 align-[-0.15em]">
      <span className="absolute inset-y-0 left-0.5 w-[2px] animate-pulse bg-accent" />
    </span>
  );

  // Every token is laid out from the start and unrevealed ones stay invisible,
  // so the centered lines do not shift as the highlight is decoded.
  return (
    <p ref={wrapRef} className="relative text-center text-xl leading-[1.7]">
      {tokens.map((t, i) => {
        const w = hovered === null ? 0 : (weights.get(i) ?? 0);
        const interactive = !decoding && t.content;
        return (
          <Fragment key={i}>
            {decoding && revealed === 0 && i === 0 && caret}
            <span
              ref={(el) => {
                wordRefs.current[i] = el;
              }}
              onPointerEnter={interactive ? () => setHovered(i) : undefined}
              onPointerLeave={interactive ? () => setHovered(null) : undefined}
              className={`rounded-sm transition-[background-color,color] duration-200 ${
                interactive ? "cursor-default" : ""
              } ${hovered === i ? "text-accent" : ""} ${i >= revealed ? "invisible" : ""}`}
              style={
                w
                  ? { backgroundColor: `color-mix(in oklab, var(--accent) ${Math.round(8 + w * 30)}%, transparent)` }
                  : undefined
              }
            >
              {t.text}
            </span>
            {decoding && i === revealed - 1 && caret}{" "}
          </Fragment>
        );
      })}
      <AnimatePresence>
        {candidates && caretAt && candidates.at === revealed && (
          <motion.span
            key={candidates.at}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{ left: caretAt.x, top: caretAt.y }}
            className={`absolute z-10 mt-1 ${caretAt.flip ? "-translate-x-full" : ""} flex flex-col rounded-md border border-line bg-paper/90 px-2 py-0.5 text-left font-display text-xs leading-[1.15rem] whitespace-nowrap text-ink-3 backdrop-blur-sm`}
          >
            {candidates.options.map((c, k) => (
              <span key={c.word} className={`flex justify-between gap-4 ${k === 0 ? "text-ink-2" : ""}`}>
                <span>{c.word}</span>
                <span className="tabular-nums">{c.p.toFixed(2)}</span>
              </span>
            ))}
          </motion.span>
        )}
      </AnimatePresence>
      <svg className="pointer-events-none absolute inset-0 size-full overflow-visible" aria-hidden="true">
        <AnimatePresence>
          {arcs.map((arc, k) => (
            <motion.g
              key={arc.id}
              className="text-accent"
              exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeOut" } }}
            >
              <motion.path
                d={arc.d}
                fill="none"
                stroke="currentColor"
                strokeWidth={0.8 + arc.w * 1.6}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: (0.25 + arc.w * 0.6) * strength }}
                transition={{ duration: decoding ? 0.2 : 0.35, delay: k * 0.04, ease: "easeOut" }}
              />
              <circle
                cx={arc.x2}
                cy={arc.y2}
                r={1.8}
                fill="currentColor"
                opacity={(0.3 + arc.w * 0.6) * strength}
              />
            </motion.g>
          ))}
        </AnimatePresence>
      </svg>
    </p>
  );
}

/**
 * Short CV highlights that write themselves out like an LLM decoding tokens,
 * one at a time. Hovering pauses the feed; hovering a word shows which
 * other words it "attends" to.
 */
export function HighlightsFeed({ items }: { items: string[] }) {
  const { t } = useLang();
  const reduced = useReducedMotion() ?? false;
  const tokenized = useMemo(() => items.map(tokenize), [items]);
  const vocab = useMemo(
    () => [...new Set(tokenized.flat().filter((t) => t.content).map((t) => t.core))],
    [tokenized],
  );
  const nextId = useRef(1);
  const [current, setCurrent] = useState({ id: 0, index: 0 });
  const [revealed, setRevealed] = useState(reduced ? Number.POSITIVE_INFINITY : 0);
  const [candidates, setCandidates] = useState<CandidateBox | null>(null);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);

  const tokens = tokenized[current.index];
  const done = revealed >= tokens.length;

  // Decode one token per step; content words briefly show their candidates.
  useEffect(() => {
    if (done) {
      setCandidates(null);
      return;
    }
    const token = tokens[revealed];
    setCandidates(
      token.content ? { at: revealed, options: makeCandidates(token, vocab) } : null,
    );
    const delay = token.content ? 150 + Math.random() * 90 : 55;
    const timer = setTimeout(() => setRevealed((r) => r + 1), delay);
    return () => clearTimeout(timer);
  }, [done, revealed, tokens, vocab]);

  const advance = useCallback(() => {
    setDirection(1);
    setCurrent((c) => ({ id: nextId.current++, index: (c.index + 1) % items.length }));
    setRevealed(reduced ? Number.POSITIVE_INFINITY : 0);
  }, [items.length, reduced]);

  // The previous highlight was already read, so it is shown in full instead of
  // being decoded again.
  const goBack = useCallback(() => {
    setDirection(-1);
    setCurrent((c) => ({
      id: nextId.current++,
      index: (c.index - 1 + items.length) % items.length,
    }));
    setRevealed(Number.POSITIVE_INFINITY);
  }, [items.length]);

  if (!items.length) return null;

  return (
    <div
      className="relative"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <div aria-hidden="true" className="relative min-h-[11rem] pt-10 sm:min-h-[9rem]">
        <AnimatePresence initial={false} mode="popLayout" custom={direction}>
          <motion.div
            key={current.id}
            custom={direction}
            variants={slide}
            initial="enter"
            animate={{ opacity: 1, y: 0 }}
            exit="exit"
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <Highlight tokens={tokens} revealed={revealed} candidates={candidates} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={goBack}
          aria-label={t.previousHighlight}
          title={t.previous}
          className="grid size-7 shrink-0 place-items-center rounded-full text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink"
        >
          <ChevronLeftIcon className="size-4" />
        </button>
        <span className="relative h-px flex-1 overflow-hidden bg-line">
          {done && (
            <span
              key={current.id}
              onAnimationEnd={advance}
              className="absolute inset-0 origin-left bg-accent"
              style={{
                animation: `feed-progress ${HOLD_MS}ms linear forwards`,
                animationPlayState: paused ? "paused" : "running",
              }}
            />
          )}
        </span>
        <button
          type="button"
          onClick={advance}
          aria-label={t.nextHighlight}
          title={t.next}
          className="grid size-7 shrink-0 place-items-center rounded-full text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink"
        >
          <ChevronRightIcon className="size-4" />
        </button>
      </div>
      <p className="mt-1 text-center font-display text-xs text-ink-3 tabular-nums">
        {current.index + 1} / {items.length}
        {paused && ` · ${t.paused}`}
      </p>

      <ul className="sr-only">
        {items.map((text) => (
          <li key={text}>{text}</li>
        ))}
      </ul>
    </div>
  );
}
