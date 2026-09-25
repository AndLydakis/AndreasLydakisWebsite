# Current desk correction — focused QA handoff

**Focused development/production PASS. Browser CDP9333 released to main. No push. Broader PORT-18F–J browser QA remains pending.** Main reports independent game-review approval of the focused evidence and full 1,777-test suite/build PASS.

## Approved geometry exception

The historical 80-body baseline remains immutable. Current expected geometry subtracts exactly one rectangle: local `(2,3.5625,2.0625,0.3125)`, world `(88,377,33,5)`. All other rectangles and anchors remain unchanged: **79 bodies, eight workstation pieces, three dining pieces, 21 separately registered object instances**.

The harness checks exact multiset equality against that explicit subtraction and full-layout equality allowing only the nine metadata migrations plus that deletion. Development `geometry-results.json` passed and persists this evidence. Production geometry-only verification was launched immediately before the report-only instruction; its completion is not claimed here. The focused production route/transition results below are completed and persisted.

## Completed focused browser evidence

| Environment | Interior/strip routes | Overlapping transition states | Exceptions |
| --- | --- | --- | --- |
| Development | 5 PASS, 12:03:36 UTC | 12 PASS, 12:04:34 UTC | 0 |
| Production `index-ChCaQiSJ.js` | 5 PASS, 12:04:01 UTC | 12 PASS, 12:04:14 UTC | 0 |

Dates are 2026-09-25. Files are `development/` and `production/` → `interior-results.json`, `transition-results.json`, and corresponding PNGs.

- Four actual keyboard strip sequences cover 144/72px/s forward/reverse along `(174,381) → (112,381) → (112,378) → (120,378)`, or reverse. They cross the deleted band, turn north and return/exit right while respecting the 16×1px foot body and plant. Every sampled postupdate checks nonpenetration and depth; no teleport inside the strip creates traversal evidence.
- The fifth sequence enters the narrow desk/chair interior at 72px/s from accessible right-side floor. Desk front/back/interior captures wait for two actual postrender events; clean captures temporarily hide cyan bounds, then restore them. Display-list checks confirm one workstation view and correct player/object ordering.
- Twelve near-plane states cover desk, dining, sofa and office table at plane −1/0/+1px. Positive opaque overlap is measured from actual loaded frames; exact player ties sort in front. These are focused transition checks, not complete nine-instance regressions.

The desk/chair still forms one whole-image plane at world Y=426. Passing routes does not imply independent desk/chair sublayer ordering. Main reports game-review approval of this evidence; no new layered-art capability is claimed. Earlier bounds-on ambiguity is documented in the historical report; it is not silently relabeled a proven stale-frame bug.

## Independent engineer review

Approved for the scoped source change: the exact topmost outline rectangle is removed, anchor unchanged, remaining workstation geometry preserved. Baseline-exception tests identify the exact piece rather than masking general geometry changes. New real-Arcade escape tests exercise both directions at four frame rates with all office solids. Independently rerun **1,395 targeted tests across four files PASS** on this correction. Main's full 1,777/build result is separately attributed above.

No blanket broad-story QA approval: complete current 79-body dev/prod nine-instance route/fallback/restart/interaction/touch matrices were stopped at main's request. Prior complete development 80-body runs and interrupted production runs are superseded geometry evidence, not current acceptance. Broad QA stays pending.

## Reviewed SHA256 snapshot

```text
7e3da3c4299b448cff0de2f437566f65ff427619833ba96c27606cccd3bed952  scripts/verify-port18f-j-browser.mjs
ac595c2b3b9d72a1a129b407fdcbe8b9e3f89d15556ed3ad676acfea423e835b  output/qa/port18f-j/preintegration-geometry.json
f63cfce0ef2660045bb3c422960a6833abe51b2ab550512c00ad6e2e50422b47  src/game/data/houseLayout.ts
aa9f90041ee6727bfbb1be17063e692d82e83d8103b8fce11fbf9ddcc2af9605  src/game/data/office.ts
d46b067ce24a61ac9e4f248fa4bddc08bf8bb068e0e5bd40a679c6de6097d016  src/game/data/kitchen.ts
dcc1ee2cb7f8e3d37cb890305c8c009a2a1ce65e4f7d06ae0ac413d720c1f3d5  src/game/systems/remainingPerspectiveMigration.test.mjs
685c1cf5c87825aabd35ff415f1c8244a4a2ca0570877a1da5f98cf0ed10dcbd  src/game/systems/fixtures/remainingOwnership.mjs
0c39f931c139ae0e2286a3404aa8e5ed092825fd19252d65bd5a8f281394600e  src/game/systems/gymCollisionPhysics.test.mjs
b7d313add0d208227a25c09bf45d4c731ac407e53f7a985d72247900660825e5  dist/assets/index-ChCaQiSJ.js
```

Only the QA harness/evidence were edited by this agent; production/tests/plan/log remain owned by main and the test author. No further browser work is scheduled by this agent.
