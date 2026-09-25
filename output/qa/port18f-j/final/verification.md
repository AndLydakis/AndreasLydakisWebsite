# PORT-18F–J final integration gate — PASS

Technical browser QA approval: no remaining runtime blocker found on frozen production `index-CfIgWzj0.js`. **CDP 9333 released.** No runtime/assets, owner styles, plan/log, staging, commit or push changes made by QA. Requested spacing/current-room glove follow-up is outside this snapshot.

Both environments passed exact current layout/geometry: **24 separate instances, 25 normal registry entries including player, 79 physical bodies**. The immutable historical 80-body baseline remains unchanged. Expected exceptions are precisely the desk-post deletion, dog move/full-body footprint, two lounge resizes, three pot resizes, and corresponding ownership/plant-bundle metadata. All other collision geometry is preserved.

## Completed results

Counts below are unique records per environment, not assertions or screenshots counted as independent test suites. Per-viewport route JSON files are cumulative checkpoints: do not add them to the final route count.

| Stage | Development | Production | Evidence |
| --- | ---: | ---: | --- |
| Routes/depth/ties/debug/restart | 294 | 294 | `{environment}/routes-results.json` |
| Rendered camera/real following | 42 | 42 | `camera-results.json` |
| Sustained collision contacts | 25 | 25 | `contacts-results.json` |
| Desk/corridor navigation | 21 | 21 | `navigation-results.json` |
| Real WASD movement/release | 4 | 4 | `wasd-results.json` |
| Keyboard/touch dialogs | 66 | 66 | `interactions-results.json` |
| Actual touch D-pad | 2 | 2 | `dpad-results.json` |
| Paired desk render probes | 6 | 6 | `desk-render-probe-results.json` |
| Normal/missing-art restarts | 38 | 38 | `fallbacks-results.json` |
| **Total** | **498** | **498** | **Zero exceptions in every completed stage** |

Additionally, existing quick-travel regression passed **four viewports per environment**, all four destinations twice (32 UI landings/environment), camera/feet checks, held-input reset, modal guard and no overflow. Logs: `development/quick-travel/run.log`, `production/quick-travel/run.log`; both report zero uncaught exceptions.

- Routes: 144 actual arrow-key sequences/environment (12 targets × 3 viewports × 144/72 speed × both directions), 108 front/behind/side captures, 36 immediate/settled tie cases, three debug-toggle records, two normal restarts, initial geometry. All route monitors assert walking/idle animation, ordering and no penetration.
- Contacts: 24 sustained south-contact cases/environment, all 12 targets at both speeds, plus geometry. Contact is held for two readings, not only first impact.
- Navigation: 20 sequences/environment: approved opened desk strip, desk/chair interior and three connecting corridors, both directions/speeds, plus geometry. Every route has nonzero post-render camera samples: 1,765 development / 1,763 production total, zero violations.
- Camera: 36 teleport readings plus three real-movement routes and three following summaries/environment. Visible player/full sprite bounds remain in view during 122.4 px actual movement, with equal camera scroll displacement on unclamped X. Render samples are nonzero: 200 development / 199 production.
- Inputs/dialogs: real W/A/S/D four-direction smoke and release stops; E/F/Enter on desktop, portrait and landscape; actual touch on both mobile orientations for CV, dog photo, books, meals, shopping and music. D-pad touch movement, collision and free-floor release-stop checks pass in portrait/landscape.
- Fallbacks: two normal restarts plus 18 missing-art scenarios × two restarts. Each of the 12 target textures individually, new/original backdrops individually, all targets plus new backdrop, missing player, both backdrops with foregrounds available, and all targets/backdrops/player missing. Atomic restored-background suppression or generic placeholders, full `__BASE` backdrop dimensions 1634×962, expected registry membership, 79 bodies and stable listeners are asserted. This is 18 browser scenarios, not a claim to rerun the separate unit suite's 32 bundle combinations.

## Resolved evidence issues and scope

**Initial camera assertion:** retained in `development/failure.json`. The early monitor read `worldView` during scene postupdate. HouseScene updates camera scroll during presentation synchronization; Phaser updates `worldView` in Camera.preRender. The dedicated development camera stage reproduces 13 stale pre-render views becoming correct at the next render with unchanged player/scroll coordinates, confirming the phase mismatch. No runtime fix or weakened camera gate: actual post-render following/visibility and current four-room UI checks passed in both environments.

**Early development route snapshot:** its 294-record process loaded before post-render monitoring/hash instrumentation. Those records prove finite-camera, movement, depth and collision checks only; they are not credited as rendered-camera evidence. Dedicated final camera and corridor files supply that proof. All production route sequences use the final nonvacuous post-render monitor (16,612 samples). Intermediate development camera/contact/navigation/desk files embed harness SHA256 `5bc0565cd6825fc7245ff138ee8aae5ff224e39f42455e3e03a146f86f78c2a4`; subsequent development modes and all production modes embed the final hash below. No later hash is retroactively attributed to the early run.

**Desk visual concern:** six same-paused-pose cyan/clean captures per environment, after two actual render completions, record exactly one visible player and desk with player depth/display-list index above desk. Main relayed Ramanujan's explicit development and production acceptance: the facial obstruction was cyan debug geometry, not desk occlusion. The requested diagnostic clean captures temporarily hide cyan only, restoring it immediately; all standard captures retain the accepted cyan bounds.

Owner-accepted whole-sprite composite/foliage limitations remain unchanged. Wall-blocked bookcase/plant rear positions are labelled reachable side poses, not rear traversal. Mobile route matrices use actual keyboard input; mobile touch evidence is separately identified. This is isolated desktop Chrome emulation, not physical-device testing.

Main reports fresh 1,930 tests/build PASS and scoped source review; this agent authored/executed QA, not production implementation. Tesla/Ramanujan approvals relayed by main are distinct from these browser results.

## Frozen snapshot SHA256

| File | SHA256 |
| --- | --- |
| `scripts/verify-port18f-j-browser.mjs` | `abe2a93e175b2e809855d4ba3e09fe98b55b256a22d4c40dec4b71fb9b2aed7e` |
| `scripts/verify-quick-travel-browser.mjs` | `c4340b53ddfe016d8469285f1518d39dc768ff29f3c917c35b18fec699a880f8` |
| `src/game/data/houseLayout.ts` | `f63cfce0ef2660045bb3c422960a6833abe51b2ab550512c00ad6e2e50422b47` |
| `src/game/data/office.ts` | `f99b0f41e0363ed8a3d7943a126b56752de8933436e6699b779357414fb28f53` |
| `src/game/data/kitchen.ts` | `d46b067ce24a61ac9e4f248fa4bddc08bf8bb068e0e5bd40a679c6de6097d016` |
| `src/app/assetManifest.ts` | `06f3e6b43ad605a0c2bb63d29a840f7e3cdad41ef7ac9e58caf63255a530f9b2` |
| `dist/assets/index-CfIgWzj0.js` | `ecbcd3d4077d156c192b51108e3c9b9fbb4562cef81dd8a41631c379e35afa04` |
| Immutable `output/qa/port18f-j/preintegration-geometry.json` | `ac595c2b3b9d72a1a129b407fdcbe8b9e3f89d15556ed3ad676acfea423e835b` |
