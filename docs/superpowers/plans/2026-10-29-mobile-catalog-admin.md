# Mobile Catalog Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Give In Bloom admins a mobile interface to add/edit/hide bouquets and upload photos using Google Sheets, without a separate database.

**Architecture:** A separate Next.js /admin surface uses Google Identity Services and jose to validate ID tokens and sign stateless cookies. Server-only adapters write the existing nine-column sheet and authorize Cloudinary image uploads. A single Node process serializes writes; public catalogue behavior is preserved.

**Tech Stack:** Existing Next.js 16.4.2 / React 19.3 / TypeScript / CSS modules / Vitest / Playwright; jose 6.2.13; native forms and fetch.

**Spec:** ../specs/2026-10-28-mobile-catalog-admin-design.md (approved by user 29 October 2026).

## Global Constraints

- No separate database; Google Sheet remains catalog source; Cloudinary stores images.
- Google login for an explicit allowlist; no public registration or production mock-write mode.
- Add/edit/publish/hide, no irreversible deletion; stable generated ID and RAW sheet writes.
- Mobile from 360 px, Russian UI, original In Bloom logo and olive/pink identity.
- Current public 5-second refresh remains unchanged; external service failures are not success.
- First deployment runs one Node instance in Kazakhstan for the required .kz.
- Read the installed Next.js guides before modifying framework integration.

## Review Focus

- Expired/tampered cookie, wrong Google audience/issuer/nonce or removed allowlist address must not authorize writes (Task 1).
- Unknown write outcome or repeated submit must reread using the same ID; direct sheet edits remain best-effort conflicts (Task 2).
- A forged Cloudinary result or overlarge/disallowed image must not become a published URL (Task 3).
- Failed upload/save must retain form inputs and upload result for retry; mobile focus and controls remain usable (Task 4).
- Missing external config must fail closed; tests must never send writes to the real configured sheet (Tasks 1, 4).

## Capability decisions and reuse

- Authentication: external-dependency / comparative. Existing project has no auth. Choose jose (official Google guide permits a general JWT library) plus Google GIS, instead of Auth.js OAuth code flow; GIS needs only a web client ID and avoids storing refresh/access tokens. jose owns signature, algorithm, audience, issuer and expiry validation. Project owns bounded allowlist/cookie/nonce/origin policy. Verify with locally signed test tokens and a fresh security review.
- Forms: platform / direct. Native form/input/textarea/details and existing catalog parser/constraints cover a short single-object editor; no custom overlay, form engine or drag/drop. Existing Button/Radix patterns inspected; CSS module supplies admin-specific compact layout while native controls retain behavior.
- Images: external-dependency / known-fit provider. Signed Cloudinary image upload with a restricted preset and server-created public ID; validate response and issue session-bound upload receipt. No permanent image bytes on ephemeral app disk.
- Layout: framework / direct. Next route group separates existing storefront shell from admin without changing public URLs. Public data loader/parser stays owned by catalog.
- Design: florist working from a phone; focal action is add/save bouquet, then photo and price. Olive action color, warm paper surfaces, logo pink only for supporting detail; 4 px rhythm, 16 px inputs, 48 px actions, quiet surface depth. Photo thumbnail + visible/hidden label gives the catalog its identity without dashboard metrics.

### Task 1: Protected admin boundary

**Files:** src/features/admin/{config,errors,auth,http}.ts; src/app/api/admin/{login,logout}/route.ts; tests/unit/admin-auth.test.ts; package.json/lock.

**Interfaces:** `AdminError(status, message, fields?)`; `getAdminConfig(env?)`; `getAdminSetupIssues(env?)`; `createAdminSession(identity, env?, now?)`; `readAdminSession(token, env?, now?)`; `verifyGoogleCredential(credential, nonce, env?, keySet?)`; `requireAdmin(request)`; `assertSameOrigin(request)`; `adminResponse(handler)`.

- [x] Write tests for session tampering/expiry/revocation, configuration, origin and Google nonce/audience/verified-email checks; run and observe missing-module failure.
- [x] Install pinned jose; implement helpers, GIS nonce flow and login/logout routes, 8-hour host-only HttpOnly session and 10-minute signed login nonce.
- [x] Run focused tests and confirm all pass; commit the protected boundary.

### Task 2: Google Sheets editor

**Files:** src/features/admin/{model,google,sheet}.ts; src/app/api/admin/bouquets/route.ts; tests/unit/admin-sheet.test.ts.

**Interfaces:** `AdminBouquet` includes all nine sheet fields plus `version`; `validateBouquetInput(input)` returns typed draft; `createSheetEditor({env?,fetcher?,pause?})` returns `list()` and `save(draft, expectedVersion, uploadedImage?)`; service token uses jose RS256 and Google OAuth token endpoint.

- [x] Test hidden rows, header mapping, RAW formula-like text, stable-ID retry, stale edits, provider failure and no fallbacks; observe RED.
- [x] Implement bounded transport, service-account token caching, serialized reread/write and safe errors. Keep service credentials server-only; public read path unchanged.
- [x] Test GREEN and commit; manual sheet edits remain a documented best-effort boundary.

### Task 3: Photo upload authorization

**Files:** src/features/admin/media.ts; src/app/api/admin/uploads/route.ts; tests/unit/admin-media.test.ts.

**Interfaces:** `createUploadTicket(session)` returns Cloudinary endpoint, signed constrained fields, publicId and a session-bound ticket; `verifyUploadResult(result, ticket, session)` validates provider signature and returns URL plus signed receipt; `verifyImageReceipt(receipt, url, session)` authorizes attachment at save.

- [x] Test tampered provider signatures/tickets, mismatched public IDs, other session, wrong cloud/format, 10 MB cap and expired receipts; observe RED.
- [x] Implement authenticated signed preset upload, server response verification and session-bound receipt; no paid upgrade or delete endpoints.
- [x] Focused tests GREEN and commit.

### Task 4: Mobile workspace, deployment handover and verification

**Files:** src/app/{layout,admin/page}.tsx; src/app/(storefront)/layout.tsx and moved existing public pages; src/features/admin/{admin-workspace,bouquet-form,google-login}.tsx; admin.module.css; tests/e2e/admin.spec.ts; playwright.admin.config.ts; .env.example; docs/admin/README.md; docs/hosting/kz-deployment.md; README.md; PRODUCT.md; next.config.ts.

**Interfaces:** /admin server page renders setup state, Google login or protected workspace; client uses /api/admin/bouquets and /api/admin/uploads with same-origin fetch. Responses carry Russian message/field errors and no secrets. No public storefront chrome under /admin.

- [x] Read installed route-group/cookie/deploy docs. Add isolated browser tests (dedicated fake config, signed test cookie, mocked browser API only) for setup/unauthorized API, add/upload/save, retry retention, edit/hide, empty/error and mobile no-overflow. Observe RED.
- [x] Implement the native form and state boundaries, scoped styling and public shell route group. Add noindex/no-store and upload/error limits. Root admin page never calls Google catalog loader.
- [x] Add standalone Node deployment instructions, .kz/DNS/HTTPS requirements, Google/Cloudinary setup, cost research with primary links, backup/manual media cleanup and company account ownership. Live OAuth/cloud writes/deployment remain explicitly unverified until credentials are provided.
- [x] Run unit tests, typecheck, lint, production build, focused existing storefront tests and isolated admin e2e. Inspect mobile/desktop screenshots; correct material issues.
- [x] Request one fresh whole-change review; fix material findings with regression tests, rerun affected checks and commit. Record what is verified locally and what requires external accounts.

## Execution

User explicitly approved implementation. Continue in the current suitable feature checkout `inbloom-site`, preserving the clean baseline; no new checkout, external publication, purchase or DNS mutation is needed. Execute inline to avoid further method-selection questions. The hosting research agent works independently; one fresh reviewer checks implementation before handover.
