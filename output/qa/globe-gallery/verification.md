# PORT-09D-G — Globe and travel gallery

Status: owner accepted delivery by requesting the changes be pushed; verification complete.

## Changes

- Globe/stand image: `public/assets/sprites/globe-stand/front-v1.png`, original generated 1086×1448 RGBA. Front three-quarter furniture style matches living-room reference. Center (4,6.5) in room-edge tile coordinates, 3.5-tile display height; stand base (3.375,7.75,1.25,0.375). Existing room geometry unchanged.
- Travel module: `src/content/travel.ts`. Three generated landscape placeholders inspired by Japan, Iceland and Peru, explicitly captioned as AI-generated rather than personal travel photos. Images inspected and stored locally; generation prompts/source provenance in `output/imagegen/globe-travel-prompts.md`.
- Generic optional gallery-array adapter and DOM renderer use native dialog-body scrolling, figures/captions, alt text and lazy loading. No carousel count, global listeners, timers or new dependency. Empty and failed-image states are supported; existing single-photo dog dialog is unchanged.
- Author workflow: `docs/travel-gallery.md`. No hard-coded list limit; 150 entries tested. Very large lists still have browser memory/DOM costs. Original PNG placeholders total about 9MB; recommend compressed web-sized owner replacements before a large production collection.

## Validation

- `npm test`: 760 tests across 29 files passed. Added 0/1/3/150-entry DOM tests, error handling, adapter mapping, asset presence/transparency and globe metadata assertions.
- `npm run build`: typecheck and build passed, with existing large-bundle warning.
- Scoped `git diff --check` and browser-script syntax check passed; unrelated owner style-file changes and PORT-18A local evidence remain untouched.
- Development browser suite passed desktop1280×900, portrait390×844 and landscape844×390: E/F/Enter/Space and mobile Interact, native keyboard/touch scrolling, all photos loaded, no horizontal overflow, close/focus restoration, movement gating, dog/media/CV dialog regression, four-sided globe base collisions and no uncaught exceptions.
- Development helper fixtures inside the real dialog passed empty/single/150-entry lists, image error fallback and reopen-scroll reset. Harness fixes: scroll touch targets into view after resizing; render helper fixtures in async evaluation rather than discovering a private DialogManager instance. These fixes do not change app runtime behavior.
- Visual inspection: generated assets, desktop globe placement and portrait/landscape gallery captures reviewed. Existing development diagnostics appear in some scene screenshots; perspective sorting is not implemented by this side quest.
- Browser runs are emulated/headless, not physical-device or Netlify deployment acceptance. Owner authorized delivery after implementation handoff.
- Production browser suite also passed all three viewport layouts, normal gallery interactions/scrolling/images/focus, existing dialogs and four-sided base collision, without uncaught exceptions. Synthetic empty/150/error fixtures were development-only; their DOM/adapter unit tests pass independently.
