# PORT-18F partial: plates and boxing bag

Delivery update (DEC-146): owner accepted this four-decoration subset and authorized push on 2026-09-25. Pending-owner/no-push notes below describe the earlier review state. Boombox remains pending; PORT-18F is not complete. Final combined suite passes 1,443 tests/40 files and build/typecheck; delivery is recorded in log.md and plan.md.

Status: **development and production PASS; technical approval for the four-decoration subset**. CDP9333 released to main after production completion. Technical metadata review finds no implementation blocker. This is only the four-decoration subset; boombox remains legacy. PORT-18E squat composite owner acceptance is still unresolved; independent game/owner visual acceptance is not claimed by this QA author. No push or story closure is claimed.

## Baseline and exact scope

`preintegration-geometry.json` was captured from the isolated live browser before main's source edit: exactly 80 bodies, none of the four targets registered. Its layout exactly equals the independent unit-test fixture `src/game/systems/fixtures/port18f-partial-before.json`.

The harness compares the complete world rectangle multiset on initial load and every restart. It also constructs the expected layout from that baseline and permits only these four anchors and transfers of their identical room-owned rectangles. All other fields, placements, scales, interaction definitions, 18E metadata, walls and corridors remain equal. Boombox must remain unregistered.

| Instance | Local tile-edge anchor | World sort Y | Preserved world base |
| --- | --- | --- | --- |
| Steel plates | (12.625,8.625) | 202 | (592,196,20,6) |
| Bumper plates | (14.125,10.5) | 232 | (616,226,20,6) |
| Extra bumper plates | (12.125,10.5) | 232 | (584,226,20,6) |
| Boxing bag | (3,11.6875) | 251 | (432,244,30,7) |

## Focused browser coverage

Per environment: 90 core records = one exact integration/80-outline check, 24 reachable-route sequences, 36 front/back/side-or-shared-bypass screenshot states, three diagnostic state pairs, 12 immediate/settled tie samples, two normal restarts and 12 missing-art restart states. Routes run at 144 forward and 72 reverse for each instance in desktop, portrait and landscape, with per-postupdate no-penetration/order checks and observed walk/idle animation. This is not the full two-direction-by-two-speed cross-product.

The two bumper instances are checked independently despite sharing an asset. Equal-plane object ordering follows their stable IDs; exact player ties put the player in front. Missing-art cases remove steel, the shared bumper texture (both instances), bag, all three textures, player, and all three plus player. Each case restarts twice with exact geometry, correct sorted placeholders/visible player fallback and stable listener counts. Missing art uses texture removal with preload disabled, not network failure simulation. Old animated views are stopped before removal to avoid fixture-induced invalid animation frames.

`interactions-results.json`: 14 squat/music cases per environment: E/F/Enter on desktop and portrait, plus portrait touch activation and close. Dialog titles, disabled gameplay while open, unchanged player position and resumed gameplay are asserted. No unrelated gallery or quick-travel matrix is repeated for this metadata-only increment.

`dpad-results.json`: two actual touch cases per environment, portrait and landscape. On-screen D-pad up moves from sole (602,219) into steel south contact at Y=203; down retreats to clear floor and release produces zero velocity with unchanged position over another 250ms. No keyboard or movement reset is used during this sequence. Controls scroll into view when needed, so unscrolled landscape control visibility is not claimed. Full mobile route matrices use keyboard under viewport emulation; they are distinct from this touch smoke. No physical device is claimed.

Diagnostics are checked off/on. Temporary owner-approved cyan bounds remain visible even in production and match exactly all 80 actual physics rectangles, not room outlines. Development-only other diagnostics stay hidden in production.

## Reachability and visual limitations

- Steel has a complete clear bypass around both sides; routes sample its rear and front.
- Bumper bases have a 12px gap between them, and the right bumper has only 4px to the east wall. Neither fits the 16px player foot width. Both instances use the shared left bypass. The right bumper's `side` image is shared-bypass evidence, not an immediately adjacent right/left gap traversal.
- Bag base ends at Y=251 and the south wall starts at Y=256. The narrow five-pixel strip admits the one-pixel foot body; the front route uses sole Y=254. Its left gap is exactly the 16px player width, so this is a tight wall-contact passage, not generous clearance.
- Bag and stand are one composite sprite at plane Y=251. Development desktop front/back captures show actual player overlap with that silhouette. They do not prove independently correct per-part stand/bag occlusion. Game reviewer/owner must judge this appearance; layered art would require separate authorization if unacceptable. No silent collider expansion or relocation was made.
- QA author inspected development desktop bag front/back, desktop bumper behind, portrait steel front and production desktop bag behind. Main separately reports inspecting bag front/back and steel behind as coherent. Screenshots remain evidence for independent game review, not claimed owner acceptance. Prior 18E squat composite gate remains open independently.

## Execution and independent source review

Development: 90 core records completed 2026-09-25 10:20:09 UTC; 14 interactions at 10:20:15; two D-pad cases at 10:20:20. Production: 90 core records at 10:21:51; 14 interactions at 10:21:57; two D-pad cases at 10:22:02. All six JSON files report zero exceptions. Evidence is in the `development/` and `production/` directories; build `index-Q2S55Ouf.js`.

Reviewer authored this QA harness, not runtime or unit tests. Read-only review of `houseLayout.ts` and the partial migration tests found no implementation blocker: four exact rectangle transfers and local tile-edge anchors, preserved scale/placement, independent shared-texture identities, boombox untouched, no renderer/physics/interaction branch added. Because 18E is also uncommitted, the Git diff includes its previously reviewed changes; the live 18F baseline comparison isolates this increment.

Initial independent targeted run: 1,068 PASS across three files. Another reviewer subsequently caught an x-only steel selector that selected a squat rectangle instead. The corrected selector now compares all four fields (`x`, `y`, `width`, `height`) against each explicit expected rectangle; seven direct exact-selection assertions prevent that false coverage. The shared selected case list feeds both cardinal and diagonal solver tests. Read-only re-review confirms the steel case is local `(12,8.25,1.25,0.375)`, not the squat piece `(12,5.125,0.625,0.3125)`. Production source hash remains unchanged. Final independently rerun targeted result: **1,075 PASS across three files** (`gymPartialMigration.test.mjs` 8, `gym.test.ts` 20, `gymCollisionPhysics.test.mjs` 1,047).

Scoped source whitespace check passes; fixture-layout equality is also independently checked. Main separately reports the fresh full suite **1,443 tests/40 files PASS** and build PASS; this agent does not claim independently executing that full suite/build. Final technical approval includes the corrected test selection. No remaining implementation blocker was found; scope/visual gates above still apply.

## Independent game review consolidation

Ramanujan approves the four-decoration source and saved development/production desktop/portrait/landscape visuals. His P2 finding about X-only steel-test selection is closed after exact four-field selection/assertions and an independent 1,055-test/typecheck rerun. No new blocking visual issue was found. Bag/stand remains whole-object sorting, not per-part occlusion. He did not operate the browser. Production results SHA256: `d7293c4af622708c0af0f08e723cca4538b65a337e8b29f0d89569aca1e121c6`. Main full suite passes 1,443 tests/40 files; build/typecheck and scoped whitespace checks pass. Owner acceptance and boombox work remain outstanding; no story closure or push.

## Reproduce and hashes

Delivery whitespace cleanup removed one blank line at harness EOF, without changing executable code. Delivered harness SHA256: `57cfc5871c43a093e26d80fd40fee9acfa97786c6b344710133e5da0fe67681d`; the execution snapshot below retains its original hash.

```sh
node scripts/verify-port18f-browser.mjs http://127.0.0.1:5173 9333
node scripts/verify-port18f-browser.mjs http://127.0.0.1:4173 9333
```

Optional `--interactions-only` and `--dpad-only` write separate evidence without rerunning core routes. Only this QA script and `output/qa/port18f/` were edited by this agent.

```text
a6315801c3d880aa0d0507802b7fe557165a8cbc25e81a0eefdc4d7baf3d7fc6  output/qa/port18f/preintegration-geometry.json
507e8c033333f379f025b0604bcbaab0694fb0785ca7efc6134c626257c901e1  scripts/verify-port18f-browser.mjs
d0d9cd98c0f713f10c2e424b5cdceb941608ee318ba1d0e6ad1314039015029c  src/game/data/houseLayout.ts
c87df2d831b9f889edda02a52f02eebb749ba2fa0166fdd21517cb576632deea  src/game/systems/gymPartialMigration.test.mjs
531cc69b462da10079ef25444acf2aa03f110af1ecab4fa538339c6d4a9e34b4  src/game/systems/gymCollisionPhysics.test.mjs
34c34df5938c7e7a3237fa9497a6dd4b76347edebb3195ce6c570785ed8456a0  dist/assets/index-Q2S55Ouf.js
```
