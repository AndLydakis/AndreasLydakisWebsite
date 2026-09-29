# Active interactable nameplate verification

Date: 2026-09-29
Scope: PORT-07C local presentation follow-up (DEC-161)

## Result

Pass and owner accepted. The central `ALWAYS_SHOW_INTERACTABLE_NAMEPLATES` flag defaults to `true`, so all in-world FF7-inspired nameplates remain visible, including while gameplay is disabled. Setting the flag (or the `createGame()` override) to `false` shows only the interactable currently selected by the existing proximity system; inactive labels are hidden and disabling gameplay clears the active nameplate. No interaction, content, collision, perspective, movement, camera or DOM accessibility contract changed.

## Implementation checks

- All 11 interactables use the same renderer and target-change callback; there are no room- or object-specific runtime branches.
- A single configuration flag selects persistent-all or proximity-only visibility; persistent-all is the production default.
- Separate-art objects place the label below the maximum authored footprint edge and align horizontally with the ground anchor.
- Baked-art hotspots use a generic below-center fallback. Horizontal clamping keeps long labels inside the owning room.
- The nameplate reproduces the dialog palette and chrome with a diagonal `#244fbc`/`#102b8c`/`#080f55`/`#04072f` gradient, silver/white/dark bevel, white bold Courier text and shadow.
- The existing DOM prompt remains the accessible live instruction. Canvas nameplates are visual reinforcement and do not cause duplicate screen-reader announcements.

## Automated verification

- `npm test`: 1,944 tests in 44 files pass.
- `npm run build`: typecheck and Vite production build pass; output JavaScript is `index-CnMsjzSj.js`. The existing bundle-size advisory remains non-blocking.
- Unit coverage pins authored and baked-art placement, visual tokens, hidden initial state, renderer registration, the default flag value and both visibility branches.
- `git diff --check` passes.

## Browser verification

`scripts/verify-interactable-nameplates-browser.mjs` passes against development (`127.0.0.1:5173`) and production preview (`127.0.0.1:4173`) in isolated Chrome.

- All 11 expected label identities, texts, positions, depths, fonts and graphics buffers are present.
- With the default true mode, all 11 labels remain visible both with and without gameplay enabled.
- With the false override, every target transition shows only that target's label and disabling interaction leaves none visible.
- Each mode records all 11 desktop targets plus one representative target per room in portrait and landscape: 19 captures per mode, 38 total.
- Mobile emulation retains the separate prompt and on-screen controls without nameplate clipping or page overflow.
- Zero runtime exceptions were captured.

## Delivery state

Owner accepted the current presentation and authorized the PORT-07C follow-up for commit and push on 2026-09-29.
