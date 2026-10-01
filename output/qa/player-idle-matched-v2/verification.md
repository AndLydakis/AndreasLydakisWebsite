# PORT-14 idle-matched walking review — 2026-10-01

Four new generated walk sheets use their corresponding unchanged idle strips as appearance references. Each exported direction contains eight padded 362px frames, lossless WebP, uniformly scaled as a direction and aligned at (181,356). Original source sheets and idle files remain unchanged. This is a closer style/proportion match, not a claim of exact anatomical reproduction.

## Verified

- `npm test`: 46 files, 1,968 passing tests.
- `npm run build`: typecheck and production build pass; existing bundle-size advisory remains.
- `node scripts/verify-player-motion-browser.mjs http://127.0.0.1:5173 9333`: all four directions plus diagonal travel, distance-based phase/frame selection, zero camera jitter, blocked idle, scene-restart listener cleanup, no exceptions. Results preserved in `motion/`.
- `node scripts/verify-idle-matched-walk-browser.mjs`: all 32 decoded frames nonempty, transparent margins, fixed sole baseline, eight-step preview and slow/full-speed playback without exceptions. Results in `frames.json`.
- `comparison-1.png` through `comparison-8.png`: side-by-side original idle/new walking evidence and contact sheets. Packed sheets and selected comparison frames visually inspected for orientation, completeness and closer idle appearance. These still contain the minor pose/proportion variation of generated animation; owner acceptance pending.
- No fresh physical-device test performed for the artwork replacement.

## Review locally

### Sequencing correction after owner review — DEC-190

The initial automated pass checked textures/camera/cadence but did not establish gait continuity. Left/right/up recovery cells incorrectly returned to contact A, and fixed lowest-shoe anchors shifted the whole figure with leg movement. Runtime now selects six distinct source poses for sideways walking and five for upward walking across eight phase slots, holding neutral passing poses. The upward neutral pose is shared between half cycles. This intentionally omits defective recovery artwork; it does not claim eight newly drawn intermediate poses.

Per-frame origins compensate the measured body-height deltas so the head remains at idle-reference height; physics ground can project below the visible lifted shoes. The browser verifier checks selected source cells, passing holds and at most one source pixel of head-position spread. Updated tests/build, comparison screenshots and actual distance-driven motion checks pass. Down remains unchanged. Final perceived smoothness remains for owner review.

Open `http://127.0.0.1:5173/utils/player-animation-preview.html` for idle/walk comparison with pause, slow playback and individual frame stepping. The normal game preview also uses the new sheets. Check starting/stopping in all four directions and the full loop at normal speed.

No commit or push. User's independent index.html and domShell.ts edits preserved.
