# PORT-18F–J: final nine-instance adoption QA

Status: **Focused desk correction PASS in development and production; CDP9333 released to main.** See [current desk QA report](desk-top-post-removed/verification.md). Both environments pass five interior/strip routes and 12 overlapping transition states; main reports independent game-review approval. Broader nine-instance story QA remains explicitly pending. No push. The remaining sections below describe the superseded 80-body candidate and its investigation, not final broad-story acceptance. The immutable baseline is retained; current geometry removes exactly the approved desk post for 79 bodies. Earlier 18E/partial-18F acceptance was delivered in `6c39288`.

## Independent baseline and source review

`preintegration-geometry.json` was captured from the live isolated browser at **2026-09-25 11:46:31.311 UTC**, before main's edits. It contains exactly 80 bodies, 12 already migrated instances plus the player, and none of these nine target registrations. Its layout independently matches `src/game/systems/fixtures/port18f-j-before.json` exactly.

The harness constructs the expected current layout from that baseline, permitting only nine agreed anchors and ownership transfer of **19 identical rectangles**: nine workstation pieces, three dining pieces, and seven singleton bases. It compares the entire layout and complete 80-body multiset, not just counts. It requires all **21 separate instances** to have anchors/footprints and 22 registry entries including the player. Baked interaction hotspots remain excluded. Every normal/missing-art restart repeats exact geometry and metadata checks.

Read-only production review is scoped to `houseLayout.ts`, `office.ts`, and `kitchen.ts`: boombox metadata, all seven office instances, and dining. Existing positions, scales, interaction definitions, backdrop IDs, walls, corridors and geometry remain unchanged. Kitchen splits fixed-vs-dining ownership while retaining its complete exported furniture inventory for tests; physics uses the shared collector, so the combined export is not an additional runtime owner. The workstation retains all eight outline rectangles plus its front band. No asset-specific renderer/physics/input branch is added.

Independent targeted execution: **1,420 tests PASS in four files** (remaining migration 33, office 7, kitchen 7, actual Arcade collision tests 1,373). Scoped source whitespace checks pass. Main separately reports 1,802 core tests; no independent full-suite/build execution is claimed here. Source review finds no implementation blocker, but visual/owner acceptance remains distinct.

## Focused runtime matrix

Each environment's core matrix has 192 records: one initial integration check, 54 real route sequences (nine instances × three viewports × 144-forward/72-reverse), 81 per-instance screenshot states, three debug off/on pairs, 27 immediate/settled plane samples, two normal restarts and 24 missing-art restart states. This is not a full two-speed × two-direction cross-product.

Every route monitors per-postupdate penetration against all static bodies and player/object depth order; walk and idle animations must both occur. Desktop is 1280×900, portrait 390×844 and landscape 844×390. Mobile route matrices use keyboard; they are not misrepresented as touch locomotion. No physical device is claimed.

Missing art: each of nine object textures individually, all nine, player alone, and all nine plus player; two restarts each. Sorted placeholders, actual visible player fallback, exact 80-body geometry and stable postupdate/worldstep listeners are asserted. Texture removal with preload disabled is a simulated missing-art condition, not network failure evidence. Old animated views are stopped before removing their texture; fresh restarted views are unmodified.

`interactions-results.json`: 42 actual CV/dog/books/meals/shopping/music dialog cases (six targets, E/F/Enter on desktop and portrait, plus portrait touch). Titles, modal movement guard, unchanged player position and gameplay resume are checked. Existing DOM paths are not replaced with direct callback invocation.

`dpad-results.json`: actual on-screen touchStart/touchEnd on up/down in portrait and landscape. Player starts at (228,443), contacts office table at sole Y=432, retreats onto clear floor, then release must yield zero velocity and unchanged position over another 250ms. Controls are scrolled into view when necessary; unscrolled landscape visibility is not claimed.

Temporary cyan collision bounds remain runtime-default visible in production and are decoded to exactly the 80 physics rectangles. Other diagnostics remain development-only. Selected clean inspection captures temporarily hide collisionPreview and restore it in `finally`; no source flag/default is changed.

## Rendered evidence correction and composite review

Latest controlled probe: `development/render-probe-frame1-clean.png` vs `render-probe-frame1-bounds.png` reproduces the visual difference at the same explicitly paused idle frame and pose. Clean player is in front; the bounds-on image appears to obscure the head. `render-probe-frame1-no-desk.png` also shows the complete player. Therefore the issue cannot simply be dismissed as stale-frame timing. Enabling collisionPreview is associated with the discrepancy; precise rendering cause remains unresolved. Runtime was not edited. This must be rechecked after the newly requested geometry change; no final rendered-correctness approval is issued for the bounds-on state.

An initial development attempt was interrupted by a source/comment-triggered page reload (`s is not defined`). It is superseded, not a runtime defect or passing run. A subsequent timer-delayed workstation-front screenshot appeared to put furniture over a front-ranked player. That image is **not accepted evidence**, even though its state assertion passed.

The final screenshot helper waits for **two actual game postrender events** before capturing. Dedicated clean desk evidence also inspects the actual display-list order and duplicate views. The development clean front at sole Y=434 visibly puts the player in front: one workstation view, hidden physics placeholder, visible player later in the display list (107 vs 105). The precise cause of the earlier image is not conclusively assigned; final rendered captures, not state-only assertions, supersede it. Full core captures are being regenerated with the stronger helper.

The desk/chair interior is reached by real 72px/s movement from accessible right-side floor (154,408) to approximately (111,412), through the thin gap. No teleport inside the composite or geometry change creates this evidence. Its clean screenshot shows the player behind the **entire** workstation/chair image at plane Y=426. One plane cannot put the player independently ahead of desk pixels and behind chair pixels. Explicit game/owner acceptance of this limitation, or separately authorized layered art, is required if that mixed ordering is desired. The clean interior is not evidence of independent part occlusion.

`transition-results.json` records desktop overlapping side poses at each plane minus one, equal and plus one pixel for workstation, dining, sofa and office table. Alpha masks from actual loaded frames/transforms prove positive opaque overlap (alpha ≥128, 4× sampling, 16 samples/world-pixel). Idle animation pauses only during mask measurement/capture, then resumes. These clean images are for visual review of the measured offsets: dining plane about 2.36px south of art, desk 1.40px, sofa 1.83px; office table about 0.78px early. These are game-reviewer measurements, not new measurements claimed by this QA author. No anchor adjustment is made to conceal them.

## Reachability limits

- Boombox has a very narrow rear strip between its base and upper wall; its actual route tests that strip. It is not a broad rear aisle.
- Office bookcase base directly abuts the upper wall. `below-plane-right-side-not-rear` captures and routes do not claim rear traversal.
- Desk rear-pocket access is not claimed. A one-pixel-grid clearance search over the preserved 16×1-foot geometry found the clear rear pocket disconnected from accessible floor; the real tested route is the right side/front and separately the thin desk/chair interior.
- Dog bed uses the right bypass; a left-side bypass through the plant is not claimed.
- Robots use a shared left bypass and narrow front strip above the south wall. The gap between robots and gap beside the seated robot/plant do not admit the foot width. `side` for the seated robot is shared-bypass evidence, not immediate side access.
- Dining preserves all three table/chair pieces and uses reachable perimeter floor. Its complete image still sorts as one plane, not chair/table sublayers.

## Execution and snapshot

Final run timestamps, hashes and browser release will be recorded here after both environments finish. Earlier failed/superseded diagnostics may remain in the evidence directory and are not final success files.

```sh
node scripts/verify-port18f-j-browser.mjs http://127.0.0.1:5173 9333
node scripts/verify-port18f-j-browser.mjs http://127.0.0.1:4173 9333
```

Standalone flags: `--interactions-only`, `--dpad-only`, `--interior-only`, `--transitions-only`. Only this harness and `output/qa/port18f-j/` were edited by this QA/review agent. No runtime, tests, plan or log edits; no push.
