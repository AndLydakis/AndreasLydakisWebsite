# PORT-19B browser verification

Status: **PASS for couch and TV/vinyl interaction browser suites on development and production after the background-frame fix.** Main also reports all four quick-travel/gallery regression runs passed with zero exceptions. Browser released after final interaction verification. Owner live/story acceptance remains separate.

Handoff finalized: **PORT-19B remains In review, awaiting owner live acceptance**, consistent with main's plan/log update. Main has read both 22-case interaction JSON files and confirmed zero exceptions. No further browser work is pending for this QA assignment.

The initial development run completed 84 automated records, but was superseded as acceptance evidence. Independent visual review found that fallback screenshots 2, 4 and 6 rendered an enlarged wood subframe rather than the original furnished room. Texture-key assertions alone did not detect this defect. Production execution was interrupted on receipt of the blocker. Both environments were subsequently rerun in full; current environment artifacts are from the successful fixed runs.

The harness now requires both normal and restored full-room backgrounds to use frame `__BASE` with source dimensions 1499×1049, including both restart iterations of every missing-texture case. Syntax validation and both browser runs passed. The QA author visually inspected refreshed fallback screenshots 2, 4 and 6 in both environments: each now shows the complete original furnished room. Original-art fallback intentionally has the baked couch, not independent couch occlusion. Generic missing-all-art fallback was also visually inspected in development.

## Final executed results

| Environment | Completion (UTC, 2026-09-25) | Records | Uncaught exceptions | Stable listeners |
| --- | --- | --- | --- | --- |
| Development, port 5173 | 08:27:11.773 | 84 | 0 | postupdate 2; worldstep 1 |
| Production, port 4173 | 08:27:52.805 | 84 | 0 | postupdate 2; worldstep 1 |

Production build: `index-BsunBI-4.js`. Each run preserved the full 80-body baseline multiset, room origins, corridor/doorway geometry and existing interactable metadata. No couch penetration was observed in sampled physical-contact checks.

### Additional interaction verification

The QA author executed `--interactions-only` on both development and production: **22 cases per environment passed, zero uncaught exceptions**. Completion times on 2026-09-25: development 08:31:26.987 UTC; production 08:31:50.438 UTC. The previous 84-record couch results were preserved; no full couch rerun was needed for the additive interaction function.

- E, F and Enter each opened TV and vinyl dialogs at desktop 1280×900, portrait 390×844 and landscape 844×390 (18 cases per environment).
- Actual CDP touch input opened and closed both dialogs in portrait and landscape (4 more cases per environment).
- Every case checked the selected interaction target, expected dialog title, gameplay disabled while open, gameplay restored after close, and unchanged player position. Keyboard cases closed using Escape; touch cases used the close button.
- Separate proof: [development interaction JSON](development/interactions-results.json), [production interaction JSON](production/interactions-results.json), and 22 `interaction-*.png` captures in each environment directory. The QA author inspected the development portrait TV touch screenshot.

### Main-executed regression evidence

Main reports the following completed successfully with zero uncaught exceptions. The QA author verified the evidence directories exist, but did not rerun these suites or independently observe their console assertions. These harnesses emit assertions to console and persist screenshots, not results JSON.

| Suite | Development evidence | Production evidence | Viewports |
| --- | --- | --- | --- |
| Quick travel | [quick-travel-development](quick-travel-development/) | [quick-travel-production](quick-travel-production/) | desktop, portrait, landscape, narrow 320 |
| Globe/gallery | [gallery-development](gallery-development/) | [gallery-production](gallery-production/) | desktop, portrait, landscape |

## Scope and evidence

- Baseline: `preintegration-geometry.json`, captured from the preintegration production scene with the updated gym/kitchen alignment; 80 static bodies. The harness compares the complete collision-rectangle multiset, not the obsolete PORT-18A world layout.
- Per environment: normal/slow forward/reverse couch routes (28 waypoint records); cardinal and diagonal physical contacts at both speeds (16 cases); desktop, portrait and landscape emulated screenshots (12); retained TV/vinyl/globe depth checks (6); two normal scene restarts; seven missing-texture combinations checked across two restart iterations with seven additional physical-contact checks.
- Artifacts: [development results](development/results.json), [production results](production/results.json), 19 PNG screenshots and one `couch-routes.webm` per environment. JSON now includes actual full-room frame names and source dimensions. Main reported visual acceptance of development normal desktop behind/front and portrait behind before the fallback fix.
- Missing-art simulation removes texture-cache entries and disables scene preload before restart; it is not a network-failure simulation.
- Mobile views are desktop-browser emulation, not physical-device testing. Status/prompt panels are temporarily hidden only for screenshots.
- Globe-gallery and quick-travel regression suites were run by main, as attributed above; they are not part of the couch harness.
- Main reports 973 tests and independent source/asset review; those are separate from this browser execution.

## Reproduction

```sh
node scripts/verify-port19b-browser.mjs http://127.0.0.1:5173 9333
node scripts/verify-port19b-browser.mjs http://127.0.0.1:4173 9333
# Only the additive interaction matrix, preserving the existing couch results:
node scripts/verify-port19b-browser.mjs http://127.0.0.1:5173 9333 --interactions-only
node scripts/verify-port19b-browser.mjs http://127.0.0.1:4173 9333 --interactions-only
```

Only `scripts/verify-port19b-browser.mjs` and `output/qa/port19b/` are owned by this QA task. No runtime edits, commits or pushes.

## Snapshot SHA-256

The original 84-record suite used harness hash `74378e65a86b4694af81a3c817bd7a44c2da3f30eae48d5aa7612d7bd8f26404`. The current harness below adds interaction verification; it was syntax-checked and executed in interactions-only mode on both environments.

```text
ab98b0ed03fc90d0a7218bf29718418d923335e1c3cf79ef8f3dd8bd979cd63a  scripts/verify-port19b-browser.mjs
43935adeff463f1f216d01d3e035d787500ecf564638b1ebc25637e73d6c9d68  src/game/rendering/houseRenderer.ts
fe80995ce57cdfbccf7e6acb6b7bb0e4fac5b274bf92b5ca6dbc3c23387162f6  src/game/data/houseLayout.ts
671444ff657de957774a88052a4f7c07a3b8b803e5a2106fe6c97114e56059a5  dist/assets/index-BsunBI-4.js
8605061509436e79b1d662b18c84a961fbe0e114a925ec37459501b30a767251  output/qa/port19b/preintegration-geometry.json
4f20ac6900b73acefbe1d7fe1ff24e52d5f711805fd692e41dae662c370221b7  output/qa/port19b/development/results.json
97d5826dc4ae9e2f269be07fa8964eecb7b93844f673b48a0cb1131eea15a812  output/qa/port19b/production/results.json
ddb8f1fd78dd02e794b44120e02097a5526a8247d9a59fae039403a4ea70f472  output/qa/port19b/development/interactions-results.json
8c5b6466b1509fc8949ca58706193fff55fcb053963f291dc1a45d5ed440b1f2  output/qa/port19b/production/interactions-results.json
```
