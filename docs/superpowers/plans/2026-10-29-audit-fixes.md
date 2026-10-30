# Audit fixes implementation plan

> **For agentic workers:** Use the existing delegated tasks for the independent frontend, backend and browser-test changes. Root owns integration and final verification.

**Goal:** Resolve the six findings from the 29 October project audit while retaining the current design and store data.

**Architecture:** Extend the existing CSS/native dialog and request/configuration boundaries. Keep public and admin browser environments separate, with synthetic data and no live writes.

**Tech stack:** Next.js 16.4.2, React 19, Node.js 24, Vitest, Playwright.

**Spec:** The preceding audit and the user's instruction to fix every finding. The user confirmed that the site is local only and no domain has been chosen.

## Constraints and review focus

- Preserve production HTTPS and secure-session requirements; never invent a public domain.
- Preserve images, prices, catalog data, design and external accounts.
- Validate tablet card bounds, including clipping hidden by overflow-x:clip.
- Close the mobile dialog above1050px and release body scrolling.
- Both caller cancellation and timeout must abort an admin request.
- Read and write catalog configuration must agree before enabling admin.
- Test current functionality, without old selectors or mutable live fixtures.

## Tasks

- [ ] Frontend: bounded responsive approach grid in globals.css; breakpoint dismissal in shell.tsx; check701/768/1050/1051 and keyboard focus.
- [ ] Backend: combine lifecycle cancellation and30-second timeout in admin/client.ts; require valid public-reader config; regression tests for missing key, malformed ID, timeout and cancellation.
- [ ] Browser coverage: replace obsolete scenarios with current page, FAQ, links, motion, failure and responsive checks; separate admin test configuration and commands.
- [ ] Local/production setup: keep local development documented; make standalone assets/startup reproducible; provide an explicit future production configuration check without weakening HTTPS.
- [ ] Verification: unit tests, typecheck, lint, build, all public/admin browser scenarios, and fresh visual screenshots. No deployment or live data mutations.
