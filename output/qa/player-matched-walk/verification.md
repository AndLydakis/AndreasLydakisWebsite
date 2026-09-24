# DEC-127 matched walking frames — local review

Date: 2026-09-24. Owner approved playback and authorized delivery of DEC-126/127 as a PORT-09D follow-up.

## Artwork and integration

- Built-in imagegen rebuilt left, right and up from the accepted downward sheet; side views received additional opposite-phase corrections. Exact prompts and selected source paths are in `output/imagegen/player-matched-walk.prompt.md`.
- Three original generated PNGs are retained under `public/assets/sprites/player/animations/*-walk-matched-v1.png`. No raster resizing or pixel editing was used.
- Explicit frame rectangles isolate irregular generated row boundaries. Torso/sole anchors position each frame without changing gameplay geometry or the accepted gait cadence.
- Corrected `preview.png` was visually inspected: all eight frames in four directions are shown, without the neighboring shoe fragments exposed by the initial uniform-grid preview. This screenshot replaces that failed preview.
- Generated anatomy and foot planting are not guaranteed exact; final perceived smoothness requires owner playback review. Downward walk and all idle sources remain byte-identical, enforced by hash regression tests.

## Automated checks

- `npm test`: 747 tests across 27 files passed.
- `npm run build`: typecheck and production build passed; existing large-bundle warning remains.
- Development and production motion telemetry passed for four cardinal directions and a diagonal: distance-driven frame correspondence, zero measured camera-relative positional spread on the sampled interior paths, blocked movement returning to idle, stable restart listener counts, and no uncaught exceptions. See `development/summary.json` and `production/summary.json`.
- Camera telemetry measures positional stability, not anatomical quality or physical-device performance.
- Production browser regression passed desktop, portrait and landscape: render resolution/world framing, corridor containment and seams, both kitchen dialogs twice, read-only content, furniture collisions, mobile controls, and no uncaught exceptions. Command: `QA_OUTPUT_DIR=output/qa/player-matched-walk/gameplay QA_RENDER_SCALE=2 node scripts/verify-port09d-browser.mjs http://127.0.0.1:4173 9333` (exit 0).

## Manual review entry point

Open `/utils/player-animation-preview.html` on the development server. Compare the accepted down cycle against the rebuilt directions at normal cadence, or pause/step at 2 fps. Also review actual gameplay at normal display size before approving delivery.
