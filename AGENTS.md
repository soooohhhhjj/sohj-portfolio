# AGENTS.md

# Project Identity

This repository is a scalable full-stack personal platform.

It is NOT a static portfolio.

It is a modular web application that includes:

- Public portfolio presentation
- Authenticated visitor interaction
- Administrative content management (CMS-like behavior)
- Future analytics capability

This project is designed as a long-term extensible system.

All architectural decisions must prioritize scalability, maintainability, and clean separation of concerns over short-term convenience.


# System Architecture Overview

Architecture Style:
Modular MERN-style distributed application.

Deployment Model:
- Frontend → Vercel
- Backend → Render
- Database → MongoDB Atlas

Communication Flow:

Browser  
→ Frontend (React)  
→ Backend API (Express)  
→ Database (MongoDB Atlas)

The frontend never directly communicates with the database.
The frontend never contains secrets.


# Core Platform Responsibilities

The system has three primary domains:

1. Portfolio Presentation Domain  
   Displays professional information, skills, and journey.

2. Visitor Interaction Domain  
   Allows authenticated users to submit comments or messages.

3. Administrative CMS Domain  
   Allows admin to modify site content without editing source code.

Future domain:
4. Analytics Domain  
   Visitor tracking and statistics.

All features must clearly belong to one domain.
No cross-domain logic mixing.


# Tech Stack

Frontend:
- React (Vite)
- TypeScript
- Tailwind CSS
- Feature-based architecture

Backend:
- Node.js
- Express
- TypeScript
- MongoDB (Mongoose)
- JWT authentication
- Role-based authorization

Database:
- MongoDB Atlas
- Reference-based schema modeling (avoid excessive document nesting)


# Frontend Architecture Rules

Directory Structure:

src/
- features/
- shared/
- services/
- types/
- styles/

Rules:

1. Feature Isolation
Each feature must contain:
- components/
- hooks/
- types.ts (if needed)
- api/ (only if feature-specific requests exist)

2. Business Logic
- Business logic belongs inside hooks.
- Components must remain primarily presentational.
- No data-fetching logic directly inside UI components.

3. API Layer
- All API calls must go through services/.
- No direct fetch/axios usage inside features.
- services/ acts as the centralized transport layer.

4. Dependency Direction
- shared/ must never import from features/.
- features/ may import from shared/.
- services/ must not depend on UI components.

## 5. Styling

- Tailwind CSS only.
- Mobile-first responsive design.
- No inline styles.
- No arbitrary spacing.
- Use consistent spacing scale.
- Screen-size and layout tokens must originate from shared constants (breakpoints.ts); 
  CSS should consume those via generated/runtime variables. Avoid hardcoded width tokens except media-query conditions.
- Tailwind screens must be sourced from the same shared responsive tokens used by 
  breakpoints.ts (single source of truth).
- Fallback CSS token values are allowed only as non-authoritative defaults; primary 
  values must be injected/generated from shared responsive tokens.
- Do not hardcode numeric breakpoint/content-width values in component CSS/TS unless  
  justified and documented.
- Extract reusable layout primitives.
- Prefer reusable component variants over duplication.

### CSS File Organization Rules

When writing CSS files (global styles, overrides, or scoped CSS files):

- Use `#region` and `#endregion` to group related styles.
- Group styles by logical ownership (parent → children).
- Keep related selectors physically close.
- Order styles from high-level container to nested elements.
- Separate major sections clearly for easier scrolling.

Example structure:

```css
/* #region Hero Section */
.hero {
  ...
}

/* #region Hero - Content */
.hero__content {
  ...
}

.hero__title {
  ...
}
/* #endregion Hero - Content */

/* #region Hero - Actions */
.hero__actions {
  ...
}
/* #endregion Hero - Actions */

/* #endregion Hero Section */

6. State Management
- Prefer local state when possible.
- Avoid unnecessary global state.
- Avoid deep prop drilling (extract hooks or context when needed).


# Backend Architecture Rules

Directory Structure:

src/
- config/
- modules/
- middleware/
- utils/

Each module inside modules/ must contain:

- model.ts
- service.ts
- controller.ts
- routes.ts
- validation.ts (if required)

Layer Responsibilities:

Model:
- Schema definition only.
- No business logic.

Service:
- Contains business logic.
- Communicates with models.
- No direct response handling.

Controller:
- Handles request and response only.
- Calls services.
- No business logic.

Routes:
- Registers endpoints.
- No logic.

Middleware:
- Authentication
- Role enforcement
- Error handling

Strict Rule:
Controllers must never directly access models.

# API Response Structure

All API responses must follow a consistent format.

Success response:

{
  success: true,
  data: <payload>
}

Error response:

{
  success: false,
  message: "Human readable message",
  errorCode: "OPTIONAL_INTERNAL_CODE"
}

Controllers must not send inconsistent response shapes.
Services must throw errors, not send responses directly.


# Authentication and Authorization

- JWT-based authentication.
- Tokens issued on login.
- Role-based access control (User, Admin).
- Admin routes must be protected via middleware.
- Never trust frontend role claims.
- All protected routes validate token server-side.


# Database Design Rules

- Use reference-based relationships.
- Avoid deep nested documents.
- Keep schemas normalized.
- Store only required fields.
- No sensitive secrets exposed to frontend.

Intended Data Collections:

- Users
- Roles
- Comments / Messages
- Editable Content Blocks
- Future Analytics Data


# Scalability Definition (Project-Specific)

In this repository, scalable means:

- New features can be added without modifying unrelated modules.
- Business logic is isolated from transport layers.
- Modules are self-contained.
- Configuration is environment-driven.
- Files remain small and focused (avoid >300 lines).
- Avoid tight coupling between frontend and backend structures.


# Production-Ready Definition

Production-ready means:

- Proper validation on all endpoints.
- Centralized error handling middleware.
- No debug console logs in production code.
- Do not log sensitive information (tokens, passwords, secrets).
- No hardcoded secrets.
- No unhandled promise rejections.
- CORS restricted to deployed frontend domain.
- Environment variables used correctly.


# Environment Variables

Frontend:
- VITE_API_URL only
- No secrets ever

Backend:
- MONGODB_URI
- JWT_SECRET
- CLIENT_URL

Never commit .env files.


# CORS Policy

Production:
- Allow only deployed frontend URL.
- No wildcard origins.

# API Versioning

All backend routes must be prefixed with:

/api/v1/

If breaking changes are introduced in the future,
a new version must be created (e.g., /api/v2/)
instead of modifying existing route behavior.

Do not silently change API contracts.


# Git and GitHub Workflow Rules

This repository follows a structured workflow.

The purpose is to:
- Keep main stable
- Avoid messy history
- Make features isolated
- Make debugging easier


## Branch Rules

Never commit directly to main.

Main branch must always:
- Compile successfully
- Run without errors
- Contain only stable code

All work must be done in feature branches.


## When To Create a Branch

Create a new branch when:

- Adding a new feature
- Modifying backend logic
- Changing database schemas
- Refactoring structure
- Making significant UI changes
- Working on a specific development phase

Branch naming format:

feature/<feature-name>
fix/<what-is-being-fixed>
refactor/<what-is-being-refactored>
chore/<maintenance-task>

Examples:

feature/auth-login
feature/comment-system
fix/token-validation
refactor/extract-comment-service


## When NOT To Create a Branch

You may commit directly to main only if:

- Updating documentation only
- Fixing small typos
- Adjusting comments
- Minor README updates

If code behavior changes, use a branch.


## Commit Discipline

Each commit must represent one logical change.

Do NOT:
- Mix frontend and backend changes in one commit
- Mix refactoring and feature logic in one commit
- Commit unfinished broken code

Good practice:
- Small focused commits
- Clear commit messages
- Commit after completing a logical unit


## Commit Message Format

Use structured messages:

feat: add login endpoint
fix: correct JWT verification logic
refactor: extract comment validation logic
chore: reorganize folder structure

Do not use vague messages like:
- update
- changes
- fixed stuff


## Pull Request Guidelines

When finishing a branch:

1. Ensure project runs locally
2. Ensure no console errors
3. Ensure no unused code
4. Ensure no commented-out dead code
5. Rebase or merge latest main before merging

Main must remain clean and stable.


## When To Commit

Commit when:

- A function works correctly
- A component is complete
- An endpoint is tested
- A bug is fully resolved
- A refactor is finished and verified

Do not commit:

- Half-written functions
- TODO placeholders without purpose
- Debug logs
- Experimental temporary code


## Repository Cleanliness Rules

Before pushing:

- Remove debug console logs
- Remove unused imports
- Remove temporary test data
- Remove commented-out code blocks
- Ensure environment variables are not exposed

Never commit:
- .env files
- API keys
- Database connection strings
- Secrets of any kind


## Branch Lifecycle

Workflow:

1. Create branch
2. Develop feature
3. Commit in small logical chunks
4. Test locally
5. Merge into main
6. Delete branch after merge

Branches should not live long after completion.


## Why This Matters

Following this workflow ensures:

- Clean commit history
- Easier debugging
- Safer production deployment
- Clear development progression
- Professional repository structure

This repository must be treated as a production-level system, not a sandbox.


# Development Phases (Strict Order)

1. Infrastructure setup
2. Authentication system
3. Administrative platform
4. Visitor interaction features
5. Dynamic content management
6. Analytics expansion

No phase skipping.


# Code Discipline

- Prefer clarity over cleverness.
- No magic numbers.
- No hidden side effects.
- Keep responsibilities separated.
- Write code assuming long-term evolution.
- Optimize for readability and extensibility.


# AI Agent Behavioral Constraints

When generating code:

- Do not collapse layers.
- Do not place business logic inside controllers or components.
- Do not mix domains.
- Respect folder boundaries.
- Follow defined module structure.
- Avoid unnecessary abstractions.
- Avoid premature optimization.
- Do not introduce new libraries without justification.
- Ask clarifying questions when requirements are ambiguous or multiple interpretations are likely.
- Only create commits when the user explicitly requests a commit (e.g. "commit", "let's commit").

If uncertain, default to simpler modular design.


# Project Intent

This repository is treated as a production-grade application platform.

It represents engineering discipline, not just visual presentation.

Every architectural decision must support long-term maintainability and extensibility.
