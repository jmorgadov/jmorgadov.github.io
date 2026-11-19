# jmorgadov.github.io

Personal site and live CV of Jorge Morgado Vega, built with React, Vite, Tailwind CSS
and Motion.

## Updating the content

All content comes from [`en.yml`](en.yml) (the same data file used by
[yuca](https://github.com/yuca-devs/yuca)). Edit it, rebuild, and commit `docs/`:

```sh
npm run build
git add -A && git commit -m "Update CV"
```

Notes on the data:

- `experience[].skills` and `projects[].skills` drive the skill highlighting. Selecting
  a skill highlights every role and project tagged with it.
- Tags that differ from the names in `skills:` are mapped in `src/skills.tsx` (`ALIASES`).
- Empty lists (e.g. `students`, `preprints`) are simply not rendered.
- `phone`, `stats` and `events` are intentionally not shown.

To add the downloadable CV, drop the file at `public/cv.pdf` and rebuild. The
"Download CV" buttons only appear when that file exists.

## Development

```sh
npm install
npm run dev        # local dev server
npm run typecheck  # TypeScript only
npm run build      # type-check and build into docs/
npm run preview    # serve the built docs/ folder
```

Theme colors are CSS variables at the top of `src/index.css`.

## Deployment

GitHub Pages serves the committed `docs/` folder: **Settings → Pages → Deploy from a
branch → `main` / `docs`**. There is no CI build step, so always run `npm run build`
before committing source changes.
