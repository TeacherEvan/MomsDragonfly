---
name: writing-plans-enhanced
description: Enhanced writing-plans skill with visual/transform verification, anti-gravity agent collaboration, and surgical-implementation integration. Use when you need a verified, auditable implementation plan with enhanced validation gates.
category: software-development
version: 1.1.0-enhanced
source: "Local enhancement of installed writing-plans (base from hermes-agent superpowers); no unverified external source was available. Enhanced per workspace references in Devil-sDelight/ShapeKeeper plans."
tags: [superpowers, enhanced, verification, anti-gravity, surgical-implementation]
related_skills: [writing-plans, surgical-implementation, subagent-driven-development, executing-plans, using-git-worktrees]
---

# Writing Plans — Enhanced

Builds on `writing-plans`. This enhanced version adds **visual/transform verification**, **anti-gravity collaboration gates**, and tighter integration with `surgical-implementation`.

**Announce at start:** "I'm using the writing-plans-enhanced skill to create an enhanced implementation plan with verification gates."

## Enhanced Principles (over base)

- **Visual / Transform verification** — every plan must include a verification section that specifies how the result will be observed (UI, file output, test, screenshot, browser state), not just that it passes tests.
- **Anti-Gravity collaboration** — when working with Google's Anti-Gravity agent (or any external agent pair), document the handoff boundary explicitly: which agent owns which task, what context is shared, and what stays private.
- **Surgical-implementation integration** — reference `surgical-implementation` state gates (INIT→COMPLETE) when the plan feeds into a full build pipeline.

## Enhanced Plan Header (required)

Every enhanced plan MUST include this header:

```markdown
# [Feature Name] Implementation Plan (Enhanced)

> **Agent:** Fenrie / Anti-Gravity Pair / [collaborator]
> **Enhanced sub-skills invoked:** writing-plans-enhanced + surgical-implementation (optional) + subagent-driven-development (optional)
> **Verification mode:** Visual / Transform / Test / Browser-observable / Internal

**Goal:** [One sentence]

**Architecture:** [2-3 sentences]

**Anti-Gravity boundary (if applicable):** [What is shared externally vs kept internal — never share private config, keys, or user identity without confirmation.]

---
```

## Enhanced Task Structure (visual/transform verification)

After each task's steps, add:

```markdown
### Verify Visual & Transform Claims

- [ ] **Visual claim:** [What should look different after this task — exact description]
- [ ] **Transform claim:** [What data/state/file should have changed — exact path/content]
- [ ] **Verification method:** [How to confirm — screenshot, file read, test output, browser snapshot, `hermes doctor`, etc.]
- [ ] **Verification result:** [PASS / FAIL / BLOCKED — with evidence link or output snippet]
```

## Enhanced Self-Review (add to base checklist)

**4. Visual/Transform verification completeness:**
For every deliverable that produces a user-observable change, does the plan specify how to observe it? If the only verification is "tests pass" but there's a UI change, the plan is incomplete.

**5. Anti-Gravity collaboration boundary:**
If the plan mentions sharing with an external agent (Anti-Gravity, subagent, or other), does it explicitly state what context is shared and what is withheld? Never include `.env` contents, user profiles, private messages, or unverified external URLs in shared plan sections.

**6. Source provenance check:**
If the plan references an external skill, package, or source, verify it exists (curl/git clone/read) before committing to it. If it doesn't exist, document the fallback. See `references/unverified-source-workflow.md` for the full workflow — never assume an external reference is valid.

## Enhanced Execution Handoff

Same as base (`subagent-driven-development` or `executing-plans`), with one addition:

**3. Enhanced verification pass (optional):** Before final handoff, run a verification pass that checks visual/transform claims against real artifacts (files, screenshots, test output, browser state). If claims don't match reality, fix or document the gap.

---

## Always-On Rules (Fenrie / Lea's preferences — apply every time)

- **Be brief and action-oriented.** The user interrupted lengthy clarifications. Start with action, explain only when needed. Skip filler words ("Great question!", "I'd be happy to help!").
- **Never invent unverified sources.** If an external skill/package/reference is requested, verify it exists (curl / read / web search) before committing to it. If it doesn't exist, enhance the verified local base and document the gap — don't fabricate URLs or download links.
- **Document provenance explicitly.** Every enhanced or installed skill must include a `source:` note stating where it came from (verified repo URL, local enhancement of base X, or unverified — with the fallback used).
- **Private things stay private.** When sharing skills/plans with external agents (Anti-Gravity, subagents), never include `.env` contents, user identity details, private messages, or unverified URLs.

*Note: This is a local enhancement of the installed `writing-plans` skill. No external source was available at fetch time (`curl -I https://raw.githubusercontent.com/NousResearch/hermes-agent/main/skills/superpowers/writing-plans-enhanced/SKILL.md` returned 404). Best practice followed: enhanced the verified local base rather than inventing an unverified external source.*
