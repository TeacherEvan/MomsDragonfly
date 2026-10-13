# Mom's Dragonfly — Project Rules

This is a Next.js 15 + Convex + TypeScript PWA.

Full agent instructions live in `AGENTS.md` at the repo root — read it first
(dev environment, verified commands, conventions, pitfalls).

## Always

- Use pnpm, not npm or yarn
- TypeScript strict mode — no `any`
- Mobile-first Tailwind classes
- All Convex secrets via `npx convex env set`, never hardcoded
- Read `convex/_generated/ai/guidelines.md` before editing Convex code

## Agent Skills

Skills in `.agents/skills/` (convex-* and superpowers) are available for use.
