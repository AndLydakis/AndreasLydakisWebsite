# PORT-19C1 browser verification

Status: **PASS for the scoped table and TV/vinyl interaction suites on development and production (`index-8eKa4OuK.js`)**. Both environments completed 114 table/fallback/passage records plus 22 interaction cases, zero uncaught exceptions, and stable postupdate/worldstep listener counts of 2/1. CDP9333 released to main for the four gallery/quick-travel regressions. Owner live acceptance is separate.

| Environment | Table-suite completion (UTC, 2026-09-25) | Interaction completion | Records |
| --- | --- | --- | --- |
| Development | 09:03:53.007 | 09:04:02.728 | 114 + 22 |
| Production | 09:04:58.472 | 09:05:08.493 | 114 + 22 |

## Baseline and integration

`preintegration-geometry.json` was captured from the live production scene on port 4173 before table integration. The snapshot contains 80 colliders, the approved enlarged sofa, and no registered table foreground. It is not derived from obsolete PORT-18A geometry. The full 80-body multiset must remain exactly unchanged: only ownership of table world rectangle `(160,191,60,8)` transfers to the table decoration.

Assertions verify table anchor `(190,199)` world pixels, native 308×185 frame, exact source-crop centered registration and explicit width/height, both registered bundle members, full background frame `__BASE` at 1499×1049, unchanged existing decorations/interactables, and unchanged corridor/doorway geometry. The collision-outline stroke rectangles must match all 80 physical collider edges exactly.

## Executed matrix

- 28 normal/half-speed forward/reverse table-route waypoint records.
- Four dedicated horizontal passage runs, both directions at speeds 144 and 72. Every sampled physics frame checks for overlap with both table and sofa. The player's body stays between table bottom 199 and sofa top 214 (15px gap).
- All four cardinal and four diagonal corner approaches at both speeds (16 contact cases). These stop at first contact and reject sampled penetration; they do **not** claim sustained-push testing.
- Desktop 1280×900, portrait 390×844 and landscape 844×390 screenshots from behind/front/left/right.
- TV, vinyl, globe and couch sorting regressions (eight records), plus two normal restarts and stable listener counts.
- All 15 nonempty missing-texture combinations of original background, new background, couch and table. Each is checked across two scene creations/restarts: complete bundle draws both members; original-art fallback suppresses both; no viable backdrop produces both placeholders. All 80 bodies and visible collision outlines must remain unchanged. Full-background frame/dimensions and independent TV/vinyl/globe presence are checked. Each missing-art case also includes a north table contact and screenshot.
- Separate 22-case TV/vinyl E/F/Enter and touch interaction matrix: expected dialog titles, gameplay lock/restoration and unchanged player position.

Texture-failure simulation hides affected old views before removing their texture entries, disables preload, and restarts; assertions inspect newly created views without modification. This is not network-failure testing. Mobile screenshots use browser emulation, not physical devices. Status/prompt panels are hidden temporarily for clean screenshots; requested collision bounds remain visible.

## Evidence

- [Development table results](development/results.json), [development interactions](development/interactions-results.json).
- [Production table results](production/results.json), [production interactions](production/interactions-results.json).
- Each environment: 12 normal screenshots, 15 fallback screenshots, 22 interaction screenshots, and `table-routes.webm` (including dedicated passage runs).
- QA author inspected development [behind](development/desktop-behind.png) and [front](development/desktop-front.png) captures; foreground ordering changes as expected.
- QA author also inspected production [portrait behind](production/portrait-behind.png), [missing-table original-art fallback](production/fallback-8.png), and [all-four-missing placeholders](production/fallback-15.png). The restored original room is complete; both extracted members are suppressed in baked fallback, and both placeholders appear when no backdrop is viable.

Globe-gallery and quick-travel behavioral regression suites are assigned to main after CDP9333 release; their previous-story results are not claimed as current-run evidence. Main separately reports 981 tests across 38 files, typecheck and build passing. This task did not run those unit tests.

## Reproduction

```sh
node scripts/verify-port19c1-browser.mjs http://127.0.0.1:5173 9333
node scripts/verify-port19c1-browser.mjs http://127.0.0.1:4173 9333
```

Use `--interactions-only` to repeat only the 22 interaction cases without overwriting table results. Only the new harness and this evidence directory are owned by this task. No runtime edits, commits or pushes.

## Snapshot SHA-256

```text
b7f3d718a792ff6930eae3598f5ec65cd73f13404685355b08448761cc7cfa73  scripts/verify-port19c1-browser.mjs
035f70e48a3aee61b0d75339b9b0de213f07ef9d298e140d7c7a4c22869827ec  src/game/data/houseLayout.ts
509c9e903d5c584353d3b08393cca1373b7a604ede6107220d62cc392aa24856  src/game/rendering/houseRenderer.ts
13e2443fabf14142fa1409c2876c301522562a872b7bee5d66b2a007aaef7ad5  src/game/scenes/HouseScene.ts
e398d8f77d62ce17279bbf4da2329f45a3871a2c672a18710506a9a4b00f1623  src/app/assetManifest.ts
19df49b7e8087a67490afdf20731ea0cd76832ae6707049d56b89395bf2d7b8a  dist/assets/index-8eKa4OuK.js
9e8a8055c8a678c7b02b471b2e22a02fc4d6633b7fb69b11b299286d78ec8789  output/qa/port19c1/preintegration-geometry.json
39cc8c05bdb43729d3238b7268210494a9f4c31ad2d6ebab3c8f3471d8bb161c  output/qa/port19c1/development/results.json
08fe7a9edddec1225d4640a65ddb0b56570431f3946646db22a53bbb35995e67  output/qa/port19c1/production/results.json
d9f0b2695edca9e1664b3e48e8ecad222bd1a046005040b3381beb3396c976b3  output/qa/port19c1/development/interactions-results.json
5dd29c6135536e076ae4e7fdf29b131a5ce04b585bce5f61fa71e9a03e47e7fd  output/qa/port19c1/production/interactions-results.json
```
