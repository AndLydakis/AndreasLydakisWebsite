# PORT-09C office implementation checks — 2026-09-24

## Alignment follow-up — DEC-109

Office origin shifted from (4,22) to (3.5,22), aligning both doors and the painted office passage at world x=12. Furniture positions within the office are unchanged. The office opening remains intentionally narrower than the corridor, now symmetrically inset. Added centerline regression and finite fractional-origin validation tests. `npm test`: 384 tests passed; typecheck/build and whitespace checks passed. Both development and production desktop/portrait/landscape browser suites passed, with zero uncaught exceptions. Production corridor-alignment.png was visually inspected and confirms a shared centerline. Nothing committed or pushed.

Status: Done. Implementation commit 1403d5f successfully pushed to origin/master on 2026-09-24 after owner approval (DEC-110). Dog remains decorative; no placeholder dialog required for this delivery. Earlier no-push statements describe pre-delivery verification history.

## Automated checks

- `npm test`: 384 tests across 24 files passed after the corridor-alignment follow-up.
- `npm run build`: TypeScript check and production build passed. Existing >500kB bundle warning remains.
- `git diff --check`: passed.
- Office tests cover seven selected sprites, 17×10 backdrop proportions, placement relationships, shared content identity, foot-width flood-fill routes, object contact bands and optional-texture fallback rendering.
- The real installed Arcade solver verifies all seven office bases from up/down/left/right at 15, 30, 60 and 120 render FPS (112 office cases, plus 64 existing gym cases). No mocked physics claimed.

## Browser checks

Driver: `scripts/verify-port09c-browser.mjs`, isolated headless Chrome with CDP port 9333. No use of the owner's interactive Chrome session.

Both development (`http://127.0.0.1:5173`) and production (`http://127.0.0.1:4173`) passed desktop 1280×900, touch-emulated portrait 390×844 and landscape 844×390:

- All selected textures loaded; no startup failure or uncaught browser exceptions.
- Real arrow-key travel through the corridor into the office and back out.
- Real E/F or touch Interact opens workstation CV and shared reading list twice each; exact titles checked.
- Dialogs disable gameplay; Escape/touch close restores it.
- Sustained upward movement stops at every office object base.
- Touch D-pad moves the player and release stops movement.

Fixture positioning uses the live physics body's reset API; movement/dialog tests use CDP keyboard and touch events. This is not a claim of unassisted whole-house traversal or physical-phone coverage.

Initial browser run caught missing registration of the office CV in DialogManager. Added the registration in main.ts and reran both complete suites successfully. Inventory test corrected to accept the opaque RGB background while requiring RGBA object sprites.

Screenshots: initial development captures are desktop.png, portrait.png and landscape.png in this directory; final production captures are under production/. Future driver runs store development screenshots under development/. Desktop and mobile production screenshots visually inspected. Existing generic collision/doorway outlines are still visible in production; no new overlay behavior was introduced.

## Scope and remaining review

- Desk uses left-review.png (camera-side filename) because its working side faces screen-right. Alternate-view geometric consistency is not certified; original assets were not modified.
- Dog, sofa, table and robots remain decorative in the accepted scope; no real dog photo supplied.
- CV-specific rendering/download remain PORT-13A/13B. No new PDF behavior.
- No depth-sorted object occlusion implemented; the later layering stories remain separate.
- Owner approved the story for delivery after the alignment fix. No claim of independent reviewer sign-off. Completion status is recorded in plan.md after successful push.
