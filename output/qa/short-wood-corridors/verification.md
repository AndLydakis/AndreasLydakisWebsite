# DEC-128 — Short wooden corridors

- Living room to gym: 3×2 tiles (previously 5×2).
- Living room to office: 4×2 tiles (previously 4×4).
- Gym to kitchen: 4×2 tiles (previously 4×4).
- Widths, room-local furniture, collision shapes and interaction offsets are preserved. Gym/kitchen move left two tiles; office/kitchen move up two tiles. Office spawn follows its room origin.
- Native graphics draw staggered warm wooden planks, clipped to each corridor; no extra image asset or dependency. Floor geometry is independent of collision geometry.
- 750 tests pass across 27 files; typecheck/build pass with the existing bundle-size warning. Corridor collision expectations and fractional office-alignment fixture were updated to the new coordinates. Three new floor tests check palette variation and every drawn rectangle's bounds.
- Browser command: `QA_OUTPUT_DIR=output/qa/short-wood-corridors QA_RENDER_SCALE=2 node scripts/verify-port09d-browser.mjs http://127.0.0.1:5173 9333`. Tests use room-relative positions and adjacency-derived corridor direction, so short vertical halls are not mistaken for horizontal ones.
- Owner subsequently accepted the living-room-matched texture refinement and authorized delivery of this follow-up (DEC-128).
- Development browser suite passed desktop, portrait and landscape: every corridor side contains movement, both end seams are traversable in both directions, kitchen interactions/collisions and mobile controls pass, and there are no uncaught exceptions. Production build passed; production browser suite was not rerun for this follow-up.
- `overview.png` visually inspected: all three shortened wooden connectors meet the adjoining room edges. Temporary overview zoom was restored by reloading; normal camera zoom remains unchanged. Screenshot includes the existing development collision overlays.
