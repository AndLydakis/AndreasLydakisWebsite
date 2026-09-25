# PORT-09D-H — Header quick travel

Status: implementation verified; owner visually approved the original-image glove and authorized delivery.

## Delivered behavior

- CV → Office, Media → Living room, Training → Gym, Food Log → Kitchen. Destinations live in `src/game/data/quickTravel.ts` as room-local foot positions, with a collision clearance guard.
- Owner's exact 48×24 PNG glove (`public/assets/ui/glove-pointer-original.png`), replacing the rejected SVG. Original PNG already has alpha transparency: 300 fully transparent pixels and all four corners alpha 0. No resampling, redraw or added CSS shadow. CV initially highlighted, hover/focus changes the pointer, activation teleports only. Compact desktop rows; coarse-pointer rows retain 44px touch targets. Changes are scoped to this menu.
- Physics body/history, held input, pending interaction and idle facing reset on travel. Camera and interaction selection refresh in the scene. Native buttons provide Tab/Enter/Space, with Arrow/Home/End navigation isolated from game movement.
- Buttons remain disabled before game readiness; gameplay suspension blocks travel. Modal dialogs use native inert behavior. Existing scene geometry/assets and content are unchanged.

## Verification

- `npm test`: 772 tests across 31 files passed. New tests cover mapping, clearance, blocked/missing rooms, relocation, highlighting, focus/navigation/cleanup and Player reset.
- `npm run build`: typecheck/build pass; existing large-bundle warning remains.
- `node scripts/verify-quick-travel-browser.mjs http://127.0.0.1:5173 9333` and production URL `http://127.0.0.1:4173`: passed desktop 1280×900, portrait 390×844, landscape 844×390 and narrow 320×640. All four destinations twice per viewport, exact foot landing, zero velocity/held input, no accidental dialog, camera visibility, native Enter/Space, hover/focus, touch, modal guard and no horizontal overflow/uncaught exceptions.
- CDP harness initially omitted Enter's character event; fixed the harness to send native Enter/Space text. Scrolling after travel can move a different menu row under a stationary mouse: the highlight correctly follows that hover without changing the destination. No app workaround for these harness assumptions.
- Existing production `verify-globe-gallery-browser.mjs` suite passed desktop/portrait/landscape gallery interaction, native scrolling, images, close/focus/movement gating, dog/media/CV dialogs and four-sided globe collision. Its production screenshots are refreshed regression evidence.
- Screenshots under `development/` and `production/`; the compact shaded glove, room landing and responsive box were visually inspected. Development images include existing collision diagnostics. Physical-device and deployed-site testing are not claimed.
- Decisions in DEC-131; owner acceptance completes visual review. Unrelated style edits, owner plan wording and PORT-18A local work are preserved.
