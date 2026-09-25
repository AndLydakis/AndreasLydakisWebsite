# Office plant separation — focused browser QA

**Development and production PASS: 24 focused records each, plus the both-backdrops-missing check; final success files report zero exceptions. CDP9333 released to main.** Production build `index-CfIgWzj0.js`. No broad story matrix, owner visual acceptance or physical-device testing is claimed.

## Completed scope

- Full 79-body geometry remains equal to the previously validated dog/pot snapshot, including all three unchanged pot rectangles. Edge comparison uses 1e-9px rounding for Arcade/graphics floating-point reconstruction. Each plant owns its exact former room rectangle once; anchors are world Y384/460/460.
- Actual loaded alpha masks are nonempty and transparent. Alpha ≥128 visible bottoms align with the three planes within 0.00001px. Authored positions, display heights and anchors match the frozen metadata.
- Six real keyboard bypass sequences: three plants at 144 forward and 72 reverse, with per-postupdate collision/depth monitoring and walk/idle checks. Six front/behind poses have positive opaque overlap: development sample counts 218/4048 (top), 400/5089 (bottom-left), 469/5115 (bottom-right), using 16 samples per world-pixel area. Clean and cyan captures wait for two actual postrender events. This is real overlap, not merely adjacent depth readings.
- Top-right behind-plane evidence is reachable side floor, **not** a rear route through its wall. Lower plants use wider bypasses around the dog/robots; inaccessible narrow adjacent gaps are not claimed.
- Normal rendering has one full clean backdrop and exactly one view per plant. No duplicate registered/art views. Alpha alignment and saved scene captures support registration review; pixel-perfect restored-background art quality remains the independent visual reviewer's responsibility.
- Two normal scene restarts retain exact geometry, expected bundle and stable listeners.
- Each of the four bundle textures is removed separately: clean backdrop or one of three foregrounds. Every case restores the original backdrop and suppresses **all three** separate plants. Full backdrop frame is explicitly `__BASE`, 1634×962, preventing corridor-subframe/default-frame mistakes.
- All bundle textures plus original missing: generic room fallback, three sorted placeholders and all 79 bodies.
- Additional `both-backdrops-missing.json`: both backdrop textures missing while all three foreground textures remain loaded still produces the coherent generic/placeholder bundle. This directly covers the requested background-missing case, not only absent foregrounds.
- Dog photo opens with E, image loads, gameplay is guarded, Escape closes it, both normally and after each fallback. Prior dog routes/collisions remain separately evidenced; no redundant interaction matrix was run.

## Evidence and caveats

`development/results.json` completed 2026-09-25 12:54:48 UTC; `production/results.json` completed 12:55:35 UTC. Each has 24 records and zero exceptions. Separate `both-backdrops-missing.json` files also pass with zero exceptions. PNGs include clean/cyan plant poses and fallback states. QA author inspected development bottom-left front; main reports inspecting bottom-left behind as coherent. Independent game review is external to this QA author.

Missing art is simulated by disabling preload and removing textures before restart, not by network failure. The additional production background-only probe initially deleted a live background texture before hiding its old view, causing a fixture render exception and restart timeout. The helper now hides/deactivates those old views before deletion, matching the main failure-matrix fixture. The corrected production probe passed; the development probe had already passed. `production/failure.json` is retained as superseded diagnostic evidence, not a final result. No runtime fix or waived runtime exception is claimed.

Main separately reports **1,930 tests/42 files PASS**, including all 32 office bundle combinations and PNG alpha/registration tests. This QA agent did not independently run that full suite. No image edits, runtime/tests/plan/log edits or push were made by this agent.

## Snapshot and reproduction

```sh
node scripts/verify-office-plants-browser.mjs http://127.0.0.1:5173 9333
node scripts/verify-office-plants-browser.mjs http://127.0.0.1:4173 9333
# Separate requested both-backgrounds-missing condition:
node scripts/verify-office-plants-browser.mjs http://127.0.0.1:4173 9333 --backgrounds-only
```

```text
531b1920a98ebd646a8a6a948589ee2e92725d2bd3445789d1c0d2bf315205a4  scripts/verify-office-plants-browser.mjs
f99b0f41e0363ed8a3d7943a126b56752de8933436e6699b779357414fb28f53  src/game/data/office.ts
06f3e6b43ad605a0c2bb63d29a840f7e3cdad41ef7ac9e58caf63255a530f9b2  src/app/assetManifest.ts
ecbcd3d4077d156c192b51108e3c9b9fbb4562cef81dd8a41631c379e35afa04  dist/assets/index-CfIgWzj0.js
```
