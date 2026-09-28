# Compact office workstation verification

Date: 2026-09-28  
Scope: PORT-18G presentation follow-up (DEC-159)

## Result

Pass. The runtime selects the approved compact-chair RGBA asset without deleting or modifying the previous workstation image. The existing generic footprint collector and depth registry are reused; no workstation-specific runtime branch was added.

## Automated checks

- `npm test`: 1,940 tests in 44 files pass.
- `npm run build`: typecheck and Vite production build pass; output JavaScript is `index-BUMz4rlb.js`. The existing bundle-size advisory remains non-blocking.
- Alpha inspection pins the selected image at 1312×1199 with alpha≥128 bounding box `[170,33,1108,1166]`.
- Geometry regression preserves 79 world bodies and eight workstation pieces. Five desk outline pieces and the front foot stay unchanged; only the chair support and wheel base are replaced.

## Browser checks

`scripts/verify-compact-workstation-browser.mjs` passed against development (`127.0.0.1:5173`) and the built production preview (`127.0.0.1:4173`) in isolated Chrome.

- Selected texture, source dimensions, 4.5-tile display height and world sort plane y=426 match authored data.
- Arcade bodies include the compact support `{x:119,y:403,width:11,height:15}` and bottom-aligned wheel base `{x:101,y:410,width:30,height:16}`. The latter now ends flush with the desk foot at world y=426, closing the reported four-pixel recess below the casters.
- The player is stopped without penetration from north/east support approaches and south/west wheel-base approaches.
- A full player-width vertical route at world x=140 crosses the area occupied by the old chair without touching the compact chair.
- The player renders behind the complete workstation above the plane and in front below it; zero runtime exceptions were captured.
- Screenshots and serialized measurements are stored separately under `development/` and `production/`.

## Known representation limit

Desk and chair remain one generated image and therefore sort as one visual plane. This is the existing owner-approved PORT-18G composite behavior; the compact asset does not add or hide a per-part layering limitation.

## Independent review

Senior game/software engineering review: **APPROVE**, no blocking gaps. The original integration review inspected the old/new art, authored geometry, shared renderer/depth path, baseline fixture and browser results and reran 93 focused tests. The DEC-160 correction review independently confirmed the four-pixel root cause, shared y=426 bottom/plane, retained route/body counts and both browser modes, then reran all 1,940 tests and `git diff --check`. Neither review edited repository files.
