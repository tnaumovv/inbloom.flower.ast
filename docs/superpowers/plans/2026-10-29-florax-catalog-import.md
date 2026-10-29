# Import the complete In Bloom catalogue

**Request:** Add every bouquet from the public In Bloom catalogue, remove the Florax navigation link, refine presentation, and push the completed change to Git.

**Approach:** Keep the existing Next.js catalogue, product routes, WhatsApp ordering, and Google Sheets administration. Import a dated public snapshot and local photos. Add only missing products to Sheets; preserve existing IDs, manual additions, hidden rows, and prices. Distinct source IDs remain distinct even when names repeat. Keep the current olive, pink, and white visual identity.

- [x] Verify all 23 public source products, prices, composition, image files, and source pagination.
- [x] Extend the bundled catalogue and prepare an idempotent append-only Sheets import, with dry-run and read-back verification.
- [x] Remove external catalogue navigation, refine the search/filter layout and product presentation at mobile and desktop sizes.
- [x] Run catalogue tests, type checking, production build, and browser checks for filtering, product pages, ordering links, and missing images.
- [ ] Review and commit only this task's changes; push `inbloom-site` and verify the remote commit.

Existing unrelated working-tree changes must remain uncommitted. Source provenance belongs in documentation, never as an external shopping link. A failed configured Sheets connection must continue to hide prices and offer retry rather than silently substituting the bundled snapshot.
