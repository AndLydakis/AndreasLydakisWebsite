# PORT-19B owner-requested sofa bounds verification

Status: **PASS on development and production (`index-DXvGAu70.js`)**. Each completed final run passed 84 couch/bounds records plus 22 TV/vinyl interaction cases with zero uncaught exceptions. Browser CDP9333 released. This is new evidence for the owner-approved geometry change, not a replacement of the earlier PORT-19B review record. Owner live acceptance remains separate.

## Final results and images

| Environment | Couch/bounds completion (UTC, 2026-09-25) | Interaction completion | Results |
| --- | --- | --- | --- |
| Development | 08:46:45.771 | 08:46:55.405 | [84 records](development/results.json), [22 interactions](development/interactions-results.json) |
| Production | 08:47:44.419 | 08:47:55.656 | [84 records](production/results.json), [22 interactions](production/interactions-results.json) |

Both runs retained stable postupdate/worldstep listener counts of 2/1. All 80 actual collision rectangles are represented exactly once in the visible outline layer, including across missing-art restarts. All four cardinal sides and four diagonal corner approaches passed at speeds 144 and 72. Baseline geometry differs only by the approved sofa expansion.

The QA author visually inspected these final captures: [development desktop/front](development/desktop-front.png), [development portrait/behind](development/portrait-behind.png), [production desktop/behind](production/desktop-behind.png), and [production landscape/front](production/landscape-front.png). The taller cyan sofa outline, room collision boundaries and corridor/perimeter geometry are visible. Full-room decorative outlines are excluded by the exact collider comparison. Each environment contains 19 couch/fallback screenshots, 22 interaction screenshots, and `couch-routes.webm`.

## Approved exception

The immutable historical baseline remains `../port19b/preintegration-geometry.json`. Expected geometry replaces exactly one historical world-pixel sofa rectangle `(138,235,104,7)` with `(138,214,104,28)`. The bottom remains 242; height increases fourfold. The test asserts exactly one old rectangle exists before replacement and compares the complete resulting 80-body multiset against live physics. All other geometry remains subject to exact comparison.

The current room-local footprint must be `{x:6.625,y:9.375,width:6.5,height:1.75}`. Ground anchor remains unchanged at world Y=242. Routes use north sole Y=205; northern contacts begin at Y=206; side approaches use Y=228.

## Coverage

- Normal/slow forward/reverse routes; four cardinal and four diagonal corner approaches at both speeds, checking actual physical contact without sampled penetration.
- Desktop, portrait and landscape screenshots; collision graphics visible above actor depth with diagnostics disabled. The harness decodes the four stroke segments for every drawn rectangle and requires exact multiset equality with all 80 actual physics rectangles, including corridor/perimeter and excluding plain decorative room outlines. Doorway/world diagnostics remain hidden. These checks run again through missing-art restarts.
- Full-room `__BASE` frame and 1499×1049 source dimensions; all seven missing-art combinations, restart/listener checks, and physical contact under fallback.
- Additive TV/vinyl interaction matrix: E/F/Enter at all three viewports and touch in portrait/landscape; correct dialog, gameplay lock/restoration, unchanged position.
- Historical baseline and `output/qa/port19b/` evidence are not modified. Mobile is browser emulation, not physical-device testing. Missing art is simulated by texture removal with preload disabled, not network failure.

## Harness correction

The first development attempt stopped after 72 records: removing the foreground texture while the old scene could still render caused a destroyed-frame `drawImage` exception and restart timeout. The harness now hides only old views using the deliberately removed textures before removing them. Restart recreates the views, and all normal/fallback frame, geometry and outline assertions apply to the newly created views without modification. This is a test-fixture lifecycle correction, not a runtime fix or suppressed exception.

The outline decoder initially compared reconstructed widths, exposing floating-point cancellation (`161.2 - 130` versus authored `31.2`). Its comparison now uses exact world rectangle edges rather than subtracting then comparing widths. No tolerance was introduced, and the separate baseline physics-geometry multiset comparison still checks original widths exactly. The most recent diagnostic `development/failure.json` records that superseded assertion failure; final `results.json` is the completed-run evidence.

An intermediate rerun was interrupted when main announced the exact-all-collider outline revision. Final runs target production bundle `index-DXvGAu70.js`; only completed final results constitute acceptance evidence. Main separately reports 976 tests and a successful build; this QA task does not claim to have executed those unit tests.

## Reproduction

```sh
node scripts/verify-port19b-browser.mjs http://127.0.0.1:5173 9333
node scripts/verify-port19b-browser.mjs http://127.0.0.1:4173 9333
```

Only the harness and this new output directory are owned by this task. No runtime edits, commits or pushes.

## Snapshot SHA-256

```text
889285cbd415a1ac0ec54e1c7cef6f725e3230a61bdb28468add7d3e49877583  scripts/verify-port19b-browser.mjs
509c9e903d5c584353d3b08393cca1373b7a604ede6107220d62cc392aa24856  src/game/rendering/houseRenderer.ts
13e2443fabf14142fa1409c2876c301522562a872b7bee5d66b2a007aaef7ad5  src/game/scenes/HouseScene.ts
250559b222599b87827b3b3190a2170f6f617b17102796d8affa70eef95d801a  src/game/data/houseLayout.ts
109421089b9186574778a480353646282d6667b2026f953590f5d22517ff9ac8  dist/assets/index-DXvGAu70.js
8605061509436e79b1d662b18c84a961fbe0e114a925ec37459501b30a767251  output/qa/port19b/preintegration-geometry.json
c7bdf2f42687c2f454cc8e7e31ba7ac4c1d61ca9981b5b07f91e4837dbbd4247  output/qa/port19b-sofa-bounds/development/results.json
385c5cced7aec6bcfac3556a98ea0bf0a4e6f9aaff9193f7d28ffbcbef1c8926  output/qa/port19b-sofa-bounds/development/interactions-results.json
f4665bb524653fdd44c0c3dba4287e8cec5c4009f93fe4b785263068660567f3  output/qa/port19b-sofa-bounds/production/results.json
6ff2ce8d4f5c6c47e028224f761ccebea9069f214d5e32257c73fac52ce39a5a  output/qa/port19b-sofa-bounds/production/interactions-results.json
```
