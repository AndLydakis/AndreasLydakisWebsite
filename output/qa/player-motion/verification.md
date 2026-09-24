# DEC-126 — Local player-motion trial

Resolution delivery is separate: 7ce5402 (implementation) and b51e5c6 (delivery record) are pushed. Owner has now accepted DEC-126/127 and authorized delivery; local-only notes below describe the earlier trial.

## Changes and calibration

- Camera follows the completed physics anchor in POST_UPDATE, after sprite synchronization, and no longer rounds scroll to whole world pixels. Bounds, pixel-art textures, 1024x576 rendering and 2.5 zoom retained.
- Walking pose selection advances from actual anchor travel with a trial 72-world-pixel full cycle. At speed 144 this produces 16 poses/second, versus the former fixed 8. Idle animation remains time-driven. Blocked input becomes idle; render frames without physics steps retain the current walking pose; large teleport discontinuities are excluded.
- No source artwork, collision geometry, movement speed or diagonal normalization changes. Full stride length is a tunable visual calibration, not proof of perfect foot planting across generated poses.

## Verification

- 745 tests pass across 27 files; typecheck/build pass with existing bundle warning. New tests cover equal-distance/diagonal cadence, 15/30/60/120 update rates, wrapping, blocked/invalid distances, skipped physics steps, teleport handling and listener cleanup after the physics plugin clears its reference.
- Reproducible telemetry: node scripts/verify-player-motion-browser.mjs [URL] 9333. It temporarily disables furniture collision for controlled straight/diagonal travel, restores real collision for obstacle testing, and restores position/collider state on exit. It also restarts the scene to check listener counts.
- Prior diagnostic sample: steady motion advanced 2.4 world pixels per step while whole-pixel camera scroll alternated 2/3 pixels, producing about 2 render pixels of camera-relative wobble; camera also sampled the pre-physics-copy sprite position.
- Development telemetry PASS: all four directions and diagonal travel report zero camera-relative position spread (within 1e-6 tolerance), walking frames match cumulative distance, held movement into the kitchen counter idles, scene restart listener counts stay stable, and no uncaught exceptions occur. Raw traces are in development/.
- Production telemetry and full development/production desktop/portrait/landscape gameplay runs: PASS before the subsequent DEC-127 art replacements. Both telemetry runs reported zero camera-relative spread in all tested directions; both gameplay runs passed corridor, dialog, collision and mobile checks without exceptions. New-art verification is recorded separately in output/qa/player-matched-walk/verification.md.
- Test-discovered issue: world-step listener cleanup originally used the scene physics-world reference after Phaser cleared it. Store the original world reference for cleanup instead. Camera shutdown unregisters only its own listener, leaving physics body disposal to Phaser. Restart regression now passes. A separate harness issue returning the entire Scene object from restart was corrected to return no value.

## Limitations and review

- Camera-coordinate stability is measured; generated pose-to-pose body/foot shape changes and fixed-60Hz physics on high-refresh displays may still affect perceived smoothness. No blanket claim of zero visible jitter.
- Headless desktop/mobile-sized browser tests do not establish physical-phone GPU performance or appearance on every display. Owner accepted the final stride and rebuilt directions after playback review.
