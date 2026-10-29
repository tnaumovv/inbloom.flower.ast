# UIArc controls

The Number Field, Search Field, Input and Select components are adapted from
the free [UIArc registry](https://uiarc.dev/docs/installation), retrieved on
2026-10-29. Their MIT notice is in [LICENSE](./LICENSE).

Sources: `https://uiarc.dev/r/{number-field,search-field,input,select,arc-motion-tokens,arc-foundation}.json`.

Local adaptations use the existing `framer-motion` package, Russian labels,
44px touch targets, and the scoped In Bloom palette in `theme.css`. Select
uses Radix Select for keyboard navigation and focus management. Shared motion
presets remain in `motion-tokens.ts`.

Catalog and cart state remain in their feature modules. Optional budget bounds
are text inputs with numeric keyboards so an empty bound remains unbounded;
cart quantity is a bounded integer from 1 to 99. No new data or state layer is
introduced.
