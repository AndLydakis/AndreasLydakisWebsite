# On-screen control visibility — PORT-22

`src/styles/mobile-controls.css` uses `(any-pointer: coarse)` to show the D-pad
and contextual Interact button. A narrow window or browser zoom alone does not
enable them. Touch-capable hybrids intentionally qualify even with a mouse.
This describes browser-reported input capability, not a mobile-device detector.

The same capability guard owns the control-row space and short-landscape rail.
Within that guard, landscape screens at most 56rem wide and 32rem high use a
side rail; other touch layouts use a bottom row. Without it, the canvas/UI fill
the shell with no reserved control space.

`MobileControls.ts` listens to the same capability query only to release held
pointers when controls disappear. The listener is removed on teardown; restoring
touch capability does not resume old input. CSS remains the source of layout.

Run `node scripts/verify-mobile-controls-browser.mjs [URL]` with isolated Chrome
CDP on port 9333. Set `QA_OUTPUT_DIR` for separate evidence folders. The verifier
checks computed geometry, actual capability queries, keyboard and touch input,
resize/rotation and held-touch capability loss without reload. Full unit tests
also cover capture release, cancellation and listener teardown.

Chrome emulation is not physical-device/hybrid certification. The hybrid policy
follows the standard query semantics: https://www.w3.org/TR/mediaqueries-4/#any-input.
