/**
 * Minimal typing for Vite/Vitest's `import.meta.glob`, used by the
 * convex-test module map (see `helpers.ts`). `vite` is not a direct
 * dependency of this project, so its `vite/client` types cannot be resolved
 * from here — declare only the slice this repo uses.
 */
interface ImportMeta {
  glob(pattern: string): Record<string, () => Promise<unknown>>;
}
