# Unverified External Source — Best Practice Workflow

When a user asks for a skill/package/reference from an external source (e.g., "install writing-plans-enhanced from external sources"):

## Verification Steps (always run in this order)

1. `curl -sL --max-time 15 <URL>` — verify the URL resolves and returns content (not 404, not redirect loop, not paywall).
2. Web search — confirm the source is referenced in official docs or reputable repos (`github.com/<org>` preferred; avoid unverified mirrors).
3. Read the SKILL.md or package manifest — verify it matches the requested capability, not a different tool with a similar name.

## If Source Verified

- Place skill/file in correct directory (`~/.hermes/skills/<category>/` or workspace equivalent).
- Add `source:` note in SKILL.md with exact URL.
- Load with `skill_view` to confirm it works before claiming success.

## If Source NOT Verified (404, empty search, mismatched content)

- DO NOT invent a URL, download link, or repository path.
- DO NOT fabricate output (e.g., "installed from github.com/example/repo" when it doesn't exist).
- Enhance the verified local base that covers the closest matching class.
- Document provenance: `source: "Local enhancement of <base-skill> (base at ...); requested external source unavailable — enhanced verified base."`
- Create/update `BEST_PRACTICES_NOTE.md` (or equivalent) documenting the verification attempt and the fallback used.

## Pitfall — Inventing Sources

Creating a fake source reference (URL, repo name, or download command) hardens into a persistent false claim a future session will trust and repeat. Always state "source unavailable" explicitly rather than substituting a plausible-sounding but unverified alternative.

## Pitfall — Not Documenting Provenance

Without a `source:` note, future agents (or the user) cannot distinguish a verified install from a fabricated one. Include the note in the frontmatter or body of the installed file.
