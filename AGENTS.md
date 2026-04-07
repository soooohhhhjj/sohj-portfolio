# AGENTS.md

## Core Rule (Highest Priority)

Only modify what the user explicitly asks for.

- Do NOT change unrelated files
- Do NOT refactor outside the scope
- Do NOT rename, restructure, or optimize unless requested
- Do NOT introduce new patterns unless necessary

If something *seems* wrong but is not part of the request:
→ Leave it untouched


## Project Context

This is a scalable MERN full-stack application (NOT a static portfolio).

Domains:
- Portfolio Presentation
- Visitor Interaction
- Admin CMS
- (Future) Analytics

Keep features isolated within their domain.
Do NOT mix domain logic.


## Development Approach

- Make the smallest correct change possible
- Prefer incremental updates over large rewrites
- Follow existing patterns in the codebase first
- If a pattern exists → reuse it
- If unsure → ask instead of assuming


## Frontend Rules (React + TS + Tailwind)

- Components → presentational only
- Business logic → hooks
- API calls → services layer only

STRICT:
- No API calls inside components
- No business logic inside UI

### Responsiveness

- Default styling targets **lg and above**
- Adjustments for **md, sm, and below** are added only when needed
- Do NOT redesign layouts unless requested

Breakpoints:
- Already defined in the codebase
- Always reuse existing breakpoint system
- Do NOT hardcode new breakpoint values

### Tailwind vs CSS (Project Pattern)

Use Tailwind for all "basic" styling:
- Layout: display/flex/grid, positioning, spacing, sizing (w/h), z-index
- Typography: font family/size/weight, tracking/leading, text align
- Visual basics: opacity, borders, border-radius, colors (when simple), responsive variants

Use CSS files only for "special" or hard-to-express styling:
- Backgrounds/gradients, complex shadows, filters, clip-path, calc-heavy rules
- Keyframe animations
- Vendor-specific properties (ex: `-webkit-text-stroke`)
- Interactive styling is allowed in CSS (hover/focus/active states + transitions), especially when it would make Tailwind class strings noisy

CSS placement:
- Prefer feature/component-scoped CSS (colocated with the component/feature)
- Keep `globals.css` for truly global base styles/utilities only
- Avoid leaving unused selectors in global CSS; remove unused CSS when working in the relevant scope

Tailwind class formatting:
- Prefer grouped, multi-line `className` strings (base styles + responsive overrides grouped) over long one-liners


## Backend Rules (Node + Express + TS)

Structure:
- model → schema only
- service → business logic
- controller → request/response only
- routes → endpoint registration

STRICT:
- Controllers must NOT access models directly
- No business logic in controllers


## Scalability Rules

- Keep files small and focused
- Avoid tight coupling
- Do not create unnecessary abstractions
- Reuse existing modules when possible
- New features must not break existing ones


## Code Quality Rules

- Write clear, readable code
- No magic numbers (unless already present)
- Follow existing naming conventions
- Do not introduce unused code
- Do not leave TODOs unless instructed


## Git Rules

- Do NOT commit
- Do NOT create branches
- Do NOT suggest commits

Only perform Git actions when the user explicitly says:
→ "commit" or similar


## AI Behavior Rules

- Do exactly what is asked — nothing more
- Do not over-engineer
- Do not over-explain
- Do not assume missing requirements
- Ask questions if the task is unclear

Default behavior:
→ Minimal, precise, scoped changes only
