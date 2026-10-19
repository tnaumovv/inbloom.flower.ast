# Community components used in the storefront

The flower-shop palette, product data, native links and reduced-motion behavior are preserved in these adaptations.

- **Interactive Hover Button — Magic UI / Dillion Verma**
  - Discovery: https://21st.dev/@dillionverma/components/interactive-hover-button
  - Public source: https://github.com/magicuidesign/magicui/blob/main/apps/www/registry/magicui/interactive-hover-button.tsx
  - Local adaptation: `src/components/ui/interactive-hover-link.tsx`
  - Uses the expanding dot, sliding label and replacement arrow composition. Native anchors replace buttons because these actions navigate to the catalogue or WhatsApp. The decorative duplicate label is hidden from assistive technology; keyboard focus receives the same treatment as hover.
- **Shine Border — Magic UI / Dillion Verma**
  - Discovery: https://21st.dev/@dillionverma/components/shine-border
  - Public source: https://github.com/magicuidesign/magicui/blob/main/apps/www/registry/magicui/shine-border.tsx
  - Local adaptation: `src/components/ui/shine-border.tsx`
  - Preserves the masked radial-gradient border; uses subdued rose and brass colors and honors reduced motion. Applied to bouquet cards and the contact map frame.

Both components are MIT licensed. Copyright and permission notice: `public/licenses/magic-ui-MIT.txt`.

The floating capsule navigation is adapted from the user's EduBright reference (https://edubrightcn.vercel.app): inset fixed container, translucent background, active/hover pill and a right-side call to action. The existing In Bloom logo asset is used in header and footer.

The 21st.dev Hero Fashion preview was inspected as an editorial reference; its locked implementation was not copied. The existing flower scene remains the hero component, with a mobile minimum height of `100svh` and a compact layout for short screens.
