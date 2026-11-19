/// <reference types="vite/client" />

declare module "*.yml" {
  const data: unknown;
  export default data;
}

/** True when `public/cv.pdf` exists at build time. */
declare const __HAS_CV__: boolean;
