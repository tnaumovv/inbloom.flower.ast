# Cart and mobile catalogue refinement

User request: remove the duplicate inline WhatsApp action on mobile product pages and its note, show four bouquets instead of three in selections, add a cart with a pink icon in the mobile bottom-right corner.

Keep the existing brand, catalogue, live price source, and direct WhatsApp ordering. Add a local cart (ID and quantity only) with current catalogue pricing, quantity changes, removal, reload persistence, and one combined WhatsApp enquiry. Cart checkout does not send a message automatically or record/confirm an order.

Implementation:
- Cart model, storage, provider, and unit tests; exclude unavailable products from checkout and never use saved prices.
- Pink floating cart trigger on desktop and mobile; accessible drawer, empty state, item controls, and combined WhatsApp link.
- Add-to-cart controls on bouquet photos and detail pages. Preserve direct WhatsApp links. Hide inline WhatsApp only on mobile; reserve space beside the remaining bottom bar for the cart.
- Four distinct products in each home selection and related products, using 4-column desktop / 2-column tablet and mobile selections.
- Browser verification of add/edit/remove, reload, errors, price refresh, modal focus, 320/390px placement, and desktop layout. Build, review, and push only task-related changes.

Existing uncommitted admin/hosting/general-test work remains separate. No Google Sheets mutations, payments, or new backend order system are part of this change.

Verification completed on 29 October 2026 in the current checkout:
- Production build and focused ESLint passed; 83 unit tests passed.
- 7 cart E2E flows, 4 motion checks, 16 catalogue/contact/navigation checks, and 1 JavaScript-disabled ordering check passed. Mobile placement and selection grids checked at 320/390px; selections also checked at 820/1440px.
- Fixed photo stacking over add controls, plus a reproduced pointer-focus entrance-animation jump that lost clicks. Direct-click and keyboard Tab/Enter paths pass.
- Independent code review found no actionable issues. Visually inspected mobile cart and desktop four-card selection.
- Browser checkout links were inspected without sending WhatsApp messages. No live catalogue writes or deployment verification were performed in this change.

The pre-existing broader test/admin/hosting edits remain unstaged. This is scoped verification of the cart/catalogue changes, not a claim that the entire unrelated browser suite is green.
