# DEC-128 — Living-room wood refinement

- Reuse source pixels from the furniture-free patch at (1080, 360), bounded by 312×440 pixels, in the existing 1499×1049 living-room backdrop. Match its 20×14-tile display scale. The current corridors fit inside one patch each; cached frame rectangles avoid duplicate registration on scene restart.
- Original PNG unchanged. No generated image, new asset file, dependency, layout or collision change. Procedural wood remains a missing-texture fallback.
- 752 tests across 27 files and typecheck/production build passed. Existing bundle-size warning remains. Added tests cover source-frame coordinates, display size, frame caching and missing texture.
- Development browser checks passed desktop, portrait and landscape: every corridor side contains movement and both ends remain traversable in both directions, rendering dimensions unchanged, no uncaught exceptions. Used `verify-port09d-browser.mjs --capture-only`; dialog/furniture checks were not repeated in this texture-only refinement (previous full pass is in short-wood-corridors).
- `overview.png` visually inspected: wood color, fine grain and plank scale now match the living-room art. Development debug overlays are visible. Temporary overview camera was restored by reload.
- Owner accepted the changes and authorized delivery as a PORT-09D follow-up (DEC-128).
