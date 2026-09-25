# PORT-18E gym metadata browser verification

Delivery update (DEC-146): owner accepted the current presentation and authorized push on 2026-09-25. The pending-owner/no-push statements below are historical review notes. Final combined suite passes 1,443 tests/40 files and build/typecheck; delivery is recorded in log.md and plan.md.

Status: **development and production gym suites and regressions PASS**, including additional mobile routes, actual D-pad smoke and measured bench/steel overlap. CDP9333 released to main after final touch smoke. Automated state assertions cannot close the squat-rack composite-art acceptance condition. Story remains In review; no owner acceptance is claimed.

## Scope and baseline

`preintegration-geometry.json` was captured from the isolated production browser before source edits: 80 bodies and none of the three gym instances registered for sorting. The harness requires exact complete collision-multiset equality; all nine squat pieces, one dumbbell base and one bench base migrate without changes. Existing placement, dimensions, other sprite metadata, walls, doors and corridor definitions are compared against that snapshot.

Approved room-local anchors: squat `(12.25,6.4375)`, dumbbell `(2.5,3.96875)`, bench `(9.5,8.3125)`; world sort planes are respectively 167, 127.5 and 197 pixels. No physics or asset edits belong to this QA task.

## Reachability and acceptance limits

- Dumbbell rear is blocked by the north wall at the base's top; the left gap is only 10px for 16px-wide feet. There is no claimed rear walk or full left-side approach. Below-plane and equal-depth checks occur on clear right-side floor, not behind the rack. Front and both reachable front corners are checked.
- Squat rack uses one sort plane for its complete diagonal silhouette. The interior screenshot/video is explicit evidence of that limitation, not per-part occlusion. Owner acceptance of this appearance or a separately authorized art split is required before closure. The right approach is to the lower/right foot, not a claimed full bypass between the outer rack and east wall.
- Initial bench/steel images are proximity evidence only, as flagged by the visual reviewer. Additional `*-bench-steel-opaque-overlap.png` captures at clear world sole `(580,205)` establish simultaneous opaque player overlap with bench and steel. Offscreen alpha masks from actual loaded frames/transforms measure 659 player/bench and 548 player/steel samples at alpha >=128 on a 4× grid (16 samples per world-pixel area). The two furniture masks themselves have zero opaque intersection. The player sorts above both; steel remains legacy depth 2. Twelve actual clear-front-pass sequences cover both speeds/directions across all three viewports. No placement/metadata changes create this evidence. The sampled idle frame is paused only during alpha measurement/screenshot, then resumed; movement sequences remain live.
- An initial interior turn at Y=158 timed out on the preserved left foot after normal input-release travel reached Y=155.8. The fixture turn was moved to clear floor Y=160. This is a test-route correction, not a runtime geometry change. The diagnostic failure file may remain as superseded evidence.
- A subsequent run reached missing-player simulation after 135 records but an old animated view advanced into a deliberately removed texture. The fixture now stops/deactivates affected old views before removing textures. Restart creates fresh views; all assertions still apply unmodified to the restarted scene. This is a fixture lifecycle correction, not a runtime fix or waived exception.

## Intended evidence

- Normal/half-speed routes (144/72), both directions, with per-postupdate collision/order checks and observed walk/idle animation keys. Video `gym-routes.webm`.
- Cardinal/diagonal first-contact checks for reachable approaches; sustained pushing is not claimed.
- Per-instance desktop/portrait/landscape screenshots, squat interior and bench/steel proximity; debug off/on with owner-approved cyan collision bounds remaining visible even in production.
- Exact ties and adjacent Y offsets on clear side floor, immediate prephysics and settled readings.
- Individual three-object missing art, all three missing, player missing, and all three plus player missing; two restarts each, exact geometry, sorted placeholders, player fallback and listener checks.
- Squat/music and existing TV/vinyl E/F/Enter plus touch interactions; existing gallery/quick-travel regression suites afterward.

Screenshots are desktop-browser emulation, not physical-device verification. Missing art is simulated through texture removal with preload disabled, not network failures. Only `scripts/verify-port18e-browser.mjs` and `output/qa/port18e/` may be changed by this agent. No push.

## Completed gym execution

- `development/results.json`: 145 core records, zero exceptions, completed 2026-09-25 09:36:49.206 UTC.
- `development/interactions-results.json`: 44 squat/music/TV/vinyl keyboard/touch cases, zero exceptions, completed 09:37:06.360 UTC.
- `development/mobile-routes-results.json`: 32 portrait/landscape route sequences, zero exceptions, completed 09:39:12.758 UTC. These use actual keyboard movement under touch-enabled viewport emulation; touch dialog activation is tested separately.
- `development/overlap-results.json`: 12 front-pass sequences plus three measured opaque overlap poses, zero exceptions, completed 09:40:15.748 UTC.
- Core checks include 16 desktop route sequences, 42 reachable cardinal/diagonal contacts, 39 per-instance screenshots, six diagnostic captures, nine tie/adjacent-Y samples, two normal restarts, 12 missing-art restart states, and 18 missing-art contacts. Missing-player restart removes the visual's worldstep listener as expected, without accumulating listeners.

Production results (2026-09-25 UTC): `production/results.json` 145 records at 09:41:36.396; `interactions-results.json` 44 cases at 09:41:53.535; `mobile-routes-results.json` 32 sequences at 09:43:08.371; `overlap-results.json` 15 records at 09:43:22.560. Every file records zero exceptions. Normal listeners remain postupdate=2/worldstep=1; missing-player worldstep=0 is expected.

QA author visually inspected the production desktop opaque-overlap capture and portrait squat-interior capture, plus development desktop squat-interior and measured-overlap views. The production image set is available for independent game review. Each environment includes three route WEBMs (desktop/portrait/landscape) and separate JSON evidence for all four matrices. Initial `steel-overlap`/current `steel-proximity` images are not relied upon to prove opaque intersection; only the measured `bench-steel-opaque-overlap` poses and their JSON are.

Main separately reports 1316 tests across 39 files and build `index-DMf4DGQt.js`; these are not unit tests executed by this QA agent.

## Actual D-pad smoke and current regressions

Both `development/dpad-results.json` and `production/dpad-results.json` PASS two cases each: portrait and landscape, actual CDP touchStart/touchEnd on the on-screen up/down D-pad buttons (no keyboard or movement-reset calls during the touch sequence). From `(552,218)`, held up reaches the bench's south face at sole Y=198; down then retreats onto free floor. After release, both velocity components are zero and position remains unchanged across a further 250ms observation. Separate `*-dpad-release.png` screenshots preserve the final views. This is a touch-input smoke, not a duplicate full touch route matrix or physical-device test. Existing mobile route matrices remain keyboard-driven.

Landscape controls initially lay below the viewport; the smoke scrolls the actual button into view before touching it, as the interaction fixture does. It does not establish that the controls are visible without scrolling. An initial fixture assertion and its masked touchEnd error were corrected by scrolling and only ending an active touch. Superseded `failure.json` is not a final run result; final dedicated touch JSONs contain zero exceptions.

All four existing regression harness runs PASS with zero uncaught exceptions:

- [Quick travel development](quick-travel-development/run.log): desktop, portrait, landscape, narrow (320px).
- [Quick travel production](quick-travel-production/run.log): same four viewports.
- [Gallery development](gallery-development/run.log): desktop, portrait, landscape; empty/single/150-photo cases, error fallback/reset, globe base and existing dialogs.
- [Gallery production](gallery-production/run.log): desktop, portrait, landscape; globe base and existing dialogs. Development-only synthetic gallery cases are not claimed for production.

## Independent engineer source review

Reviewer authored this browser harness, not production runtime or the migration unit tests. Read-only review found no implementation blocker in the metadata migration: the only production file change is `houseLayout.ts`, with the three agreed anchors and exact transfer of eleven rectangles. No generic renderer, physics, placement, scale, interaction or other room changes. The immutable unit-test fixture layout exactly matches the independently captured browser pre-migration layout. Added tests cover the full multiset, preservation of unrelated metadata, renamed generic render fixtures, quick-travel clearance, and real-solver cardinal/diagonal contact for the migrated pieces. Existing tests now use the combined geometry consumer. Scoped diff whitespace checks pass. Main's reported full test result is attributed above; no additional unit-test execution is claimed here.

Technical source approval is distinct from story closure: **P2 acceptance gate remains explicit owner acceptance of the complete diagonal squat-rack single-plane behavior**, or a separately authorized layered-art remedy. Do not infer per-upright occlusion from passing depth tests.

Main-agent review consolidation: Ramanujan independently reviewed the source and saved development/production desktop/portrait/landscape images. He approves the strengthened bench/steel simultaneous player-overlap evidence (closing that P2) and the reviewed visuals, conditional only on owner acceptance of the rack approximation. He did not perform live browser testing. Final reviewed layout hash matches below; production overlap-results SHA256 is `332359a2653401b3d8f92e94951fb8299d3733b972fe40a5323b480df25ffab8`. Owner acceptance remains outstanding; nothing is committed/pushed.

## Reproduction and snapshot

```sh
node scripts/verify-port18e-browser.mjs http://127.0.0.1:5173 9333
node scripts/verify-port18e-browser.mjs http://127.0.0.1:4173 9333
```

Optional `--interactions-only`, `--mobile-routes-only`, `--overlap-only`, and `--dpad-only` repeat their separate result files. Development ran added matrices separately; production ran the core/interactions/mobile/overlap together. The subsequent D-pad-only addition was executed separately on both environments; previous matrices were not rerun for this additive test function.

```text
08e065b895ecdc6e1e88babae948423c9d7cebf021bbe2c7ec4392fb6a54c7dd  scripts/verify-port18e-browser.mjs
00f5294c83f4df460ec2d46d44141e381d4b14277630bc60c964592894e77990  src/game/data/houseLayout.ts
626704f4f0f3be28b6dc5e2a297c778e25c4393463894eee59a8af4c8c6edd53  src/game/systems/gymPerspectiveMigration.test.mjs
66df589b65b34ca630840dc49cf016d9c3aeb83a94b4a2c0498cb2f5671cd43b  src/game/systems/fixtures/port18e-before.json
3014b8317b16ed381346f9bc8d8cf05f027b937adb2c74db5908ef988219f0ca  output/qa/port18e/preintegration-geometry.json
60e5cb54d734b6bd482407db75adf766463633d5ded35a9e88024db6bda824bb  dist/assets/index-DMf4DGQt.js
```
