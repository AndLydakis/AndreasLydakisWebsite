# Decision Log

This file is the project decision record. New implementation decisions, approved changes, deferred choices, and story-completion decisions must be added here before or alongside changes to `plan.md` or source files.

## DEC-124 — Deliver PORT-09D

- Date: 2026-09-24
- Authorization: Owner requested pushing the completed kitchen and corridor fixes.
- Scope: DEC-118 through DEC-123, selected fitted kitchen/dining artwork, stove/fridge content, generic corridor walls, tests and QA evidence. Include the kitchen-specific style prompt; preserve unrelated root/style-folder reorganization and earlier plan-review wording outside the commit.
- Verification: 738 automated tests and build pass; final development/production desktop, portrait and landscape browser checks passed in DEC-123. No physical-device or independent-review claim.
- Delivery: Ready for scoped commit and push on master. Mark Done only after successful push.

## DEC-123 — Block exposed corridor edges

- Date: 2026-09-24
- Issue: Owner could walk from corridors into the void. getAllCollisionRects included room-authored walls and the world perimeter, but omitted corridor boundaries entirely.
- Fix: Generate one-tile-thick exterior wall strips around each corridor, subtracting all room/corridor floor rectangles. This blocks exposed edges without narrowing floors or sealing room entrances, bends or junctions. Exact rectangle subtraction supports existing fractional room origins. Reuse the existing CollisionSystem lifecycle; no layout, artwork, movement-speed or input changes.
- Verification: 738 tests, typecheck and production build pass, including six current corridor walls at four approach directions/four frame rates, floor non-overlap, junction and fractional-origin tests. Development and production browser checks PASS at desktop/portrait/landscape sizes: both exposed sides and both end seams of all three corridors, plus kitchen dialogs, furniture and mobile controls. No uncaught exceptions. Results recorded in output/qa/port09d/verification.md.
- Delivery: PORT-09D remains in progress pending owner acceptance. No commit/push.

## DEC-122 — Extend kitchen table collision by half a tile

- Date: 2026-09-24
- Authorization: Owner revised the requested increase from one tile to half a tile before any edit was made.
- Direction: Extend the main dining collision upward by 0.5 layout tiles (8 world pixels): y=6.5 to 6, height=1.0625 to 1.5625. Preserve bottom y=7.5625, width, lower chair bands, sprite placement and all other collisions. No commit/push.
- Verification: All 640 tests, typecheck, production build and diff whitespace check pass, including the new blocked-strip/clear-floor/unchanged-bottom regression and actual Arcade collision tests. Browser checks not repeated; prior browser evidence is for DEC-121.

## DEC-121 — Integrate fitted kitchen and center its painted entrance

- Date: 2026-09-24
- Authorization: Owner selected the new kitchen and confirmed the old assets are no longer needed. No push authorized.
- Direction: Use sample-v3 background and one front-v1 combined dining sprite. Remove duplicate fixture/chair sprites and unused named-frame infrastructure. Stove and fridge remain ordinary background hotspots with existing recipes and display-only shopping-list dialogs.
- Alignment: Painted jambs are local x=7.5625..9.875. Shift kitchen origin to x=27.28125 so the visible passage center equals the gym corridor center x=36. Preserve the four-tile corridor; its centered doorway is intentionally narrower. Integer doorway metadata x=7..10 contains the painted opening; precise collision jambs govern passage. No global layout-validation relaxation or room-specific rendering code.
- Collision: Re-author fixed cabinet/fridge footprints from new artwork and a stepped lower dining footprint. Keep routes around the table, to both hotspots, and through the entrance at the full player-foot width.
- Cleanup: Ten obsolete kitchen PNGs (two backgrounds and eight object sheets) moved out of public assets to /private/tmp/port09d-superseded-assets.mY1jk8 for temporary recovery. Original generator outputs also remain outside the repo. Historical prompt/decision records retained.
- Verification: Automated tests and production build pass; final browser verification and owner review recorded in output/qa/port09d/verification.md. Story remains in progress; no commit/push.

## DEC-120 — Regenerate fitted kitchen background and combined dining set

- Date: 2026-09-24
- Authorization: Owner rejected the freestanding arrangement and approved baking fitted wall runs into the background, with a separate single-view table-and-four-tucked-chairs asset.
- Direction: Left-wall continuous counter/sink/stove, upper and lower cupboards, sunny window above sink, dog bowl directly beneath sink. Right-wall fridge with adjacent cupboards, facing inward. Preserve decorated two-door mint fridge and horizontal handles. Central dining set remains one independently placeable sprite.
- Scope: Regenerate and review artwork first, preserving older files and current runtime until visual approval. Subsequent integration must remove duplicate fixed-object sprites, use background interaction hotspots and re-author collisions. Prior DEC-119 tests apply only to the old arrangement. No commit/push.
- Tool: Built-in image generation through imagegen skill; exact prompts saved with versioned outputs.
- Owner follow-up: add one cutting board and one knife block on the left countertop, preserving the regenerated fitted layout and all other details.

## DEC-119 — Integrate the owner's kitchen arrangement

- Date: 2026-09-24
- Authorization: Owner placed sink, stove and dog bowl on the left wall, front-facing fridge and cupboards on the right, and table in the center. Retain four wooden chairs from DEC-118.
- Implementation: New data-only kitchen module, separate cupboard decoration, left-camera counter/stove views (working fronts face right), fridge v2 front, central table and four inward-facing chair instances. Use named Phaser texture frames to select tight sprite regions without modifying generated PNGs. A small generic frame-registration helper and optional sprite frame field support reuse; no kitchen-specific scene logic.
- Content: Stove opens dummy recent recipes/meals; fridge opens dummy display-only shopping list through the existing shared dialog. Startup now registers the central content registry rather than a hand-maintained room list; browser testing caught and resolved the initially missing kitchen registration. No editable state, persistence or backend.
- Physics: Author independent furniture ground footprints and painted wall/jamb collisions. Keep world x=36 corridor centerline open despite narrower painted doorway. Increase bowl footprint from 3px to 6px after actual Arcade tests reproduced vertical tunneling; no movement-speed or global physics change.
- Verification: 672 tests pass, including nine furniture rectangles in four directions at 15/30/60/120 FPS, foot-width route flood-fill, atlas bounds/restart/missing-texture behavior, renderer fallbacks and kitchen keyboard/touch dialog cycles. Typecheck/build pass with existing bundle-size warning. Browser evidence: output/qa/port09d/verification.md.
- Delivery: Local implementation and owner visual review; no commit or push. Depth sorting remains deferred.

## DEC-118 — Kitchen artwork and interaction scope

- Date: 2026-09-24
- Authorization: Generate the kitchen using utils/style_kitchen.md and the established room/sprite approach. Owner confirmed a display-only fridge shopping list and exactly four old-style wooden chairs.
- Direction: Separate architectural background, fridge, gas stove, counter/sink with two-slot toaster and drying rack, upper cupboards, round red/white-checkered table with flower vase, wooden chair and dog bowl. One reusable chair design supplies four placed chairs later. Front/back/left/right object turnaround sheets are artwork-review assets; extraction, placement and collisions are implementation work, not part of this generation pass.
- Constraints: Match existing warm textured arcade art and elevated orthographic camera; preserve the kitchen's 16x10 room ratio and top opening at local x=7..11. Window positioned above the future sink area, clear passage and player-relative furniture proportions. Reference artwork is style guidance only, not an edit target.
- Interaction intent: Fridge opens a read-only shopping-list dialog; stove opens recipes and recently eaten meals. No editing/persistence/backend. Runtime implementation and push remain deferred.
- Owner revision during generation: fridge has a separate top freezer, horizontal handles on both doors, and front-door stickers/notes/magnets. Preserve original single-door sample as v1; generate v2 with the revision consistent across views. Notes are visual decoration, not the shopping-list content itself.
- Generation: Built-in image tool via imagegen skill; versioned assets and exact prompts saved in the workspace. Review results recorded with the prompt set.

## DEC-117 — Deliver dialogs and office follow-ups

- Date: 2026-09-24
- Authorization: Owner requested pushing the changes so far, accepting PORT-09C-B and office follow-ups DEC-114 through DEC-116 for delivery.
- Scope: FF7-style shared dialogs, faster accessible typewriter reveal, desk/chair collision refinement and office starting point; include tests, QA and delivery documentation.
- Delivery result: e7f6840 successfully pushed to origin/master on 2026-09-24. PORT-09C-B is Done; record this result in a follow-up documentation commit.
- Preserve: Exclude unrelated owner edits to the earlier plan-review requirement, deleted root style.md and untracked utils style prompts. Keep those edits in the working tree.
- Verification: 520 tests, typecheck, production build and whitespace checks pass; existing bundle-size warning remains. Final development and production browser suites pass at desktop/portrait/landscape dimensions, including office startup, camera/movement, current chair footprint, dialogs and faster reveal. No uncaught exceptions. Mobile emulation only; no independent reviewer or physical-device claim. Commit/push in progress.

## DEC-116 — Start in the office

- Date: 2026-09-24
- Authorization: Owner requested changing the starting room from living room to office.
- Decision: Set the authoritative initial spawn to world tile (12, 27), a clear central office location derived from the office origin. Keep camera initialization, movement, room ordering and interactions unchanged; no saved-state behavior added.
- Verification: 520 tests and production build pass, including a collision-free player foot strip, connection from the office spawn to the entrance/interactions, and reachability of the other rooms. Browser regression now checks actual startup position, camera visibility and movement before fixture teleports. Existing bundle-size warning remains.
- Delivery: Local follow-up, no commit/push.

- Browser result (DEC-116): rebuilt production preview passes actual office startup position, camera visibility and immediate keyboard movement checks using the browser script's capture-only mode. No uncaught exceptions. Full interaction suite was not rerun for this spawn-only change.

## DEC-115 — Chair floor footprint and visible rear leg

- Date: 2026-09-24
- Authorization: Owner clarified that the chair should block only its floor footprint plus the visible back leg, allowing passage behind raised artwork when perspective is implemented.
- Decision: Supersede DEC-114's chair silhouette with two low rectangles for the wheel footprint and visible rear support. Split the old combined desk/chair base band down to the desk foot. Preserve the desk outline, including its visible rear support, and all artwork/placement. Backrest and seat do not collide. Depth sorting remains future work, not implemented here.
- Verification: 520 tests pass (fewer generated collision cases because four chair rectangles became two), including reachable backrest/seat locations, blocked rear support, and real Arcade collision checks. Typecheck/build pass with the existing bundle-size warning. Browser results: output/qa/port09c/workstation-collisions.md.
- Delivery: Local changes only, no commit/push; visual acceptance pending.

## DEC-114 — Office desk and chair outline collision

- Date: 2026-09-24
- Authorization: Owner confirmed the office workstation, not the coffee table; follow desk and chair outline, excluding monitors.
- Decision: Add a stepped, room-local rectangle silhouette for the tabletop, desk support and chair above the existing base band. Keep the sprite, placement, scale, content and other furniture unchanged. Monitor-only artwork does not add collision; existing room walls still apply.
- Verification: 552 tests pass, including outline samples, monitor exclusion, foot-width routes to all three office interactions and actual Arcade collisions in four directions at 15/30/60/120 FPS. Typecheck and production build pass (existing bundle-size warning). Bookcase QA approach moves half a tile right to stay clear of the chair, without changing the interaction itself. Browser results recorded in output/qa/port09c/workstation-collisions.md.
- Delivery: Local follow-up; visual acceptance pending. No commit or push.

## DEC-001 — Placeholder-first delivery

- Date: 2026-09-17
- Status: Accepted
- Scope: Initial implementation
- Decision: Build the first release with clearly labeled dummy content and placeholder visual assets. Do not add real personal content or final artwork until the owner supplies it.
- Rationale: The owner explicitly requested no implementation or real content at the planning stage and will provide dummy content during implementation.

## DEC-002 — Minimal frontend technology stack

- Date: 2026-09-17
- Status: Accepted
- Decision: Use Vite, strict TypeScript, vanilla HTML/CSS, and Phaser `3.90.0` pinned exactly. Use npm with a committed lockfile and Node.js `22.14.0` as the initial supported version.
- Exclusions: React, a separate state-management library, backend services, database, authentication, routing, and a map editor are not part of v1.
- Rationale: This is the simplest modular stack for a small static game-like portfolio and leaves room for future rooms without introducing unnecessary framework complexity.

## DEC-003 — Phaser and DOM ownership boundary

- Date: 2026-09-17
- Status: Accepted
- Decision: Phaser owns the canvas, house scene, player movement, Arcade Physics, collisions, proximity detection, player animation, camera, room rendering, and optional audio. The DOM owns semantic content, the native `<dialog>`, CV markup and PDF link, content index, focus management, accessibility, and mobile controls.
- Decision: Use one `InputController` created by `main.ts`. Keyboard and mobile controls write to the same controller. The game emits typed `contentRequested(contentId, triggerSource)` events; `DialogManager` opens content without exposing Phaser internals to the DOM.
- Rationale: A narrow typed boundary keeps gameplay and responsive document UI independently testable and prevents canvas-only content access.

## DEC-004 — Data-driven house layout and coordinate contract

- Date: 2026-09-17
- Status: Accepted
- Decision: Use one data-driven `HouseScene` with typed rooms, corridors, doorways, collision rectangles, interactables, and stable content IDs.
- Coordinate rules: World points and rectangles are world-global. Room origins are world-global. Room collisions and interactables are room-local. Corridor origins are world-global. Doorway openings are room-local to `fromRoomId` and convert through that room. `HouseLayout.initialSpawn` is the only authoritative world-global spawn.
- Required helpers: `roomTileToWorld`, `worldToRoomTile`, `roomRectToWorld`, `doorwayOpeningToWorld`, `worldTileToWorldPixel`, and `worldRectToWorldPixel`.
- Rationale: Explicit coordinate spaces prevent room/corridor/doorway ambiguity and allow future rooms to be added as data.

## DEC-005 — Mobile, accessibility, and interaction baseline

- Date: 2026-09-17
- Status: Accepted
- Decision: Support WASD and arrow keys on desktop, with `E` as the primary interaction key and Enter/Space as aliases. Provide accessible on-screen directional controls and an Interact button on mobile.
- Decision: Mobile movement uses pointer events, press-and-hold behavior, pointer capture, pointer-ID tracking, and reset handling for pointer-up, pointer-cancel, lost pointer capture, window blur, and document visibility changes.
- Decision: Use a semantic HTML content index, one native `<dialog>`, focus restoration, live proximity prompts, keyboard access, safe-area CSS, 44px minimum touch targets, and reduced-motion support.
- Rationale: Mobile usability and accessible content are required from the beginning; the canvas is not the only content route.

## DEC-006 — CV delivery and static hosting

- Date: 2026-09-17
- Status: Accepted
- Decision: Show the CV as semantic HTML inside the reusable dialog and provide a same-origin static PDF download at `public/assets/cv.pdf`. Do not generate PDFs dynamically or require an embedded PDF viewer.
- Decision: Host the static Vite build on Netlify through GitHub, using `netlify.toml`, `public/_redirects`, `dist` as the publish directory, and `import.meta.env.BASE_URL` for runtime asset URLs.
- Rationale: This requires no backend, keeps deployment simple, and prevents asset/PDF path failures after deployment.

## DEC-007 — Scope of animation, audio, and persistence

- Date: 2026-09-17
- Status: Accepted
- Decision: Required presentation behavior includes basic player idle/walking and directional animation using placeholder assets. Environmental/dialog animation polish and sound effects/music are optional follow-up stories, must be muteable if added, and must not block release.
- Decision: No save state, quests, scores, inventory, progression, or other persistence is planned for v1.
- Rationale: The owner wants a lively presentation but no gameplay-state complexity.

## DEC-008 — PORT-00 architecture approval

- Date: 2026-09-17
- Status: Accepted
- Decision: Complete `PORT-00` and proceed to implementation story `PORT-01`.
- Evidence: The experienced architect agent returned `ARCHITECT APPROVED`; the senior software engineer reviewer returned `APPROVED` after the final coordinate-contract reconciliation.
- Open questions: Final real content, final assets, optional audio, and a custom domain remain deferred. They do not block `PORT-01`.

## DEC-009 — PORT-01 foundation implementation

- Date: 2026-09-17
- Status: Accepted
- Decision: Use a private ESM package named `interactive-portfolio-house` with npm, a committed `package-lock.json`, strict TypeScript, Vite, Vitest, and an intentionally minimal static shell until later stories add gameplay and content.
- Dependency policy: Phaser is pinned exactly to `3.90.0`. Development tooling uses semver ranges in `package.json` and exact resolved versions in the lockfile: TypeScript `5.9.3`, Vite `7.3.6`, and Vitest `3.2.7`.
- Runtime policy: Support Node.js `22.14.0` through `.nvmrc` and `>=22.14.0 <23` in `package.json`; the current verification machine is Node `26.3.1`, so npm reports the expected engine warning during local checks.
- Files added: `.gitignore`, `index.html`, `src/main.ts`, `src/styles/foundation.css`, `src/app/foundation.test.ts`, `tsconfig.json`, `.nvmrc`, and `README.md`.
- Verification: `npm ci`, `npm run typecheck`, `npm test`, and `npm run build` all passed.
- Rationale: This provides a reproducible, beginner-friendly foundation without prematurely implementing rooms, assets, dialogs, or gameplay.

## DEC-010 — PORT-01 completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-01` complete and proceed to `PORT-02`.
- Evidence: All `PORT-01` acceptance criteria passed; the production build generated `dist/` successfully from a clean dependency install.

## DEC-011 — PORT-02 DOM shell and service boundaries

- Date: 2026-09-17
- Status: Accepted
- Decision: Build the pre-Phaser experience as semantic DOM assembled by `renderDomShell()`, with a noscript fallback in `index.html` and a dedicated mount point for the later Phaser canvas.
- Decision: Keep `InputController`, `DialogManager`, `ContentIndex`, `MobileControls`, and `GameUiBridge` as separate services. `main.ts` creates them once and owns teardown; Phaser is not imported or started by `PORT-02`.
- Decision: Use a small typed dialog-content model and typed DOM element creation with `textContent`; leave the content index empty with an explicit next-story message until `PORT-03` supplies the content registry.
- Decision: The visible mobile UI is an HTML D-pad and Interact button. Pointer capture and pointer-ID tracking are internal handling for press-and-hold movement; the Interact control uses normal accessible button activation.
- Decision: Dialog opening disables the shared input controller and mobile controls; dialog close resets movement and restores focus to the trigger or game shell.
- Decision: Use a lightweight in-memory typed listener map for game/UI events rather than exposing Phaser or adding a state-management library.
- Verification: `npm run typecheck`, `npm test`, and `npm run build` passed. The live Vite HTML response was verified with `curl`; browser automation was unavailable in this environment, so visual responsive emulation remains a manual follow-up in `PORT-11`.
- Rationale: This keeps the DOM experience independently usable and testable before the game exists while preserving the approved Phaser/DOM boundary.

## DEC-012 — PORT-02 completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-02` complete and proceed to `PORT-02A`.
- Evidence: The shell, services, typed bridge, focus/accessibility behavior, fallback state, mobile controls, and teardown path are implemented; automated checks and live HTML serving passed.

## DEC-013 — PORT-02A dependency-free controller tests

- Date: 2026-09-17
- Status: Accepted
- Decision: Test `InputController` with lightweight `EventTarget` doubles for the keyboard window and visibility document instead of adding `jsdom` or another browser-test dependency.
- Decision: Keep the tests next to `InputController` and verify the public contract: WASD/arrows, one-shot interaction requests, pointer-ID state and release paths, blur/visibility resets, gameplay gating, and teardown.
- Rationale: The controller is intentionally independent of Phaser and can be tested through its public API without increasing the project’s dependency or setup burden.

## DEC-014 — PORT-02A completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-02A` complete and proceed to `PORT-03`.
- Evidence: Seven controller tests pass independently of Phaser, covering all required state and cancellation behaviors. Typecheck and production build also pass.

## DEC-015 — PORT-03 data and placeholder asset implementation

- Date: 2026-09-17
- Status: Accepted
- Decision: Represent portfolio content with data-only `ContentRecord` modules and a central registry containing the five approved stable IDs: `livingroom-media`, `livingroom-vinyl`, `gym-personal-records`, `office-cv`, and `kitchen-meals`.
- Decision: Represent the initial room set with stable room references (`living-room`, `gym`, `office`, and `kitchen`) until `PORT-04` supplies the complete spatial layout.
- Decision: Use self-authored SVG placeholders for the player, floor, wall, furniture, and interactable marker. Use the system font fallback rather than adding a font asset before final art is available.
- Decision: Keep `assetUrl()` base-path aware and run development-only `HEAD` checks for the required placeholder assets from `main.ts`; validation failures are reported clearly without blocking the DOM fallback.
- Decision: Generate the static placeholder CV with the reproducible `scripts/create_placeholder_cv.py` ReportLab script. Use the exact ASCII label `PLACEHOLDER CV - REPLACE BEFORE LAUNCH` to keep the PDF text portable and compliant with the PDF quality requirements.
- Decision: Keep `ASSET_LICENSES.md` explicit that current assets are original project placeholders with no third-party licenses.
- Verification: `npm test`, `npm run typecheck`, and `npm run build` passed. `file`, `pdfinfo`, `pdftotext`, and `pdftoppm` verified the PDF; the rendered page was visually inspected; local Vite requests returned successfully for all placeholder assets and `cv.pdf` with `application/pdf`.
- Rationale: This gives later Phaser stories stable data and replaceable assets without adding a content CMS, backend, image pipeline, or licensing uncertainty.

## DEC-016 — PORT-03 completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-03` complete and proceed to `PORT-03A`.
- Evidence: All five typed content modules, room references, asset manifest, base-path helper, placeholder assets, valid PDF, validation functions, and beginner guidance are present and verified.

## DEC-017 — PORT-03A pure validation test strategy

- Date: 2026-09-17
- Status: Accepted
- Decision: Add a dedicated Vitest suite beside the content registry. Exercise validators with small in-memory fixtures, assert clear error messages for intentionally broken contracts, and keep the suite independent of browser rendering and Phaser initialization.
- Decision: Use Vite's raw source glob in the test to guard the five data-only content modules against Phaser or DOM imports without adding a Node filesystem test dependency.
- Rationale: The tests protect the data boundary while preserving the project's minimal dependency set and beginner-friendly workflow.

## DEC-018 — PORT-03A completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-03A` complete and proceed to `PORT-04`.
- Evidence: `npm test` passes with 3 test files and 20 tests; `npm run typecheck` passes; `npm run build` passes. Coverage includes valid registries, duplicate and empty IDs, missing room/content references, interactable references, and data-only module import guards.

## DEC-019 — Break down PORT-04 into modular layout stories

- Date: 2026-09-17
- Status: Accepted
- Decision: Replace the single `PORT-04` story with four sequential stories: `PORT-04A` for coordinate contracts and conversion helpers, `PORT-04B` for the initial house layout data, `PORT-04C` for layout validation and reachability, and `PORT-04D` for comprehensive pure layout tests.
- Decision: Make `PORT-04D` the final layout dependency for `PORT-06` and the optional asset-replacement story. Update the canonical dependency graph and downstream story references accordingly.
- Rationale: The original story combined coordinate math, data authoring, validation, graph reachability, and testing. Separating these responsibilities keeps failures isolated, preserves the data-only boundary, and gives implementation smaller beginner-manageable increments without creating one ticket per helper.

## DEC-020 — Scrum-master approval of the remaining story breakdown

- Date: 2026-09-17
- Status: Accepted
- Decision: Split the remaining oversized stories into cohesive implementation increments: `PORT-06A`–`PORT-06C`, `PORT-07A`–`PORT-07D`, `PORT-08A`–`PORT-08B`, `PORT-09A`–`PORT-09D`, `PORT-10A`–`PORT-10B`, `PORT-11A`–`PORT-11B`, `PORT-12A`–`PORT-12C`, `PORT-13A`–`PORT-13B`, `PORT-15A`–`PORT-15D`, `PORT-16A`–`PORT-16C`, and `PORT-17A`–`PORT-17D`.
- Decision: Keep `PORT-05`, `PORT-14`, `PORT-14A`, and `PORT-14B` as single stories because each is a cohesive capability. Keep the `PORT-12A`–`PORT-12C` asset branch and `PORT-14A`/`PORT-14B` optional and independent of the release path.
- Decision: Make each downstream dependency reference the final child story where a parent story was split, and make `PORT-05` expose an explicit player position/facing contract for later systems.
- Evidence: The scrum-master agent returned `ACCEPTED` after a second review of the updated `plan.md`, following four requested consistency corrections to dependencies and stale story references.
- Rationale: The approved breakdown keeps implementation stories small enough for a beginner while maintaining clear ownership, executable dependencies, and testable acceptance criteria.

## DEC-021 — Per-story Git delivery and changelog workflow

- Date: 2026-09-17
- Status: Accepted
- Decision: For every remaining story, update `CHANGELOG.md`, record decisions and evidence in `log.md`, update the story completion record in `plan.md`, commit with a message beginning with the story ID, and push the commit to the configured `origin` remote on the active branch before marking the story `Done`.
- Decision: Record `PORT-00` through `PORT-03A` as a historical baseline because those stories were completed before Git was initialized and before this workflow was requested.
- Decision: If a push is blocked by authentication, remote, or network state, leave the story incomplete and document the blocker in `log.md`.
- Rationale: The workflow gives each future story an auditable change history and a recoverable, reviewable delivery point while keeping the existing Git history accurate.

## DEC-022 — PORT-04A coordinate helper context

- Date: 2026-09-17
- Status: Accepted
- Decision: Implement coordinate helpers with typed room/corridor context objects and explicit `tileSize` parameters. `doorwayOpeningToWorld` accepts the doorway plus its source room and rejects mismatched room IDs.
- Decision: Do not introduce a global room-origin lookup in PORT-04A; the complete `HouseLayout` is authored in PORT-04B and can supply the typed contexts later.
- Rationale: This keeps the helpers pure, makes coordinate ownership explicit, and avoids coupling the first math story to a layout registry that does not yet exist.

## DEC-023 — PORT-04A completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-04A` complete and proceed to `PORT-04B`.
- Evidence: `npm test` passes with 4 test files and 30 tests; `npm run typecheck` passes; `npm run build` passes. The coordinate suite covers non-zero origins, inverse conversion, room/corridor/doorway rectangles, pixel conversion, and invalid inputs.

## DEC-024 — PORT-04B initial layout data

- Date: 2026-09-17
- Status: Accepted
- Decision: Use a 64×36-tile world with 16 logical pixels per tile, four explicit rooms, three world-global corridors, six reciprocal doorways, five room-local interactables, and a world-global initial spawn.
- Decision: Represent room wall openings by split collision rectangles around doorway locations. Keep visual asset IDs and stable content IDs in data so later Phaser systems remain generic.
- Rationale: The initial layout provides a small connected house with non-zero room origins and explicit coordinate spaces suitable for validation and rendering in later stories.

## DEC-025 — PORT-04B completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-04B` complete and proceed to `PORT-04C`.
- Evidence: `npm test` passes with 5 test files and 37 tests; `npm run typecheck` passes; `npm run build` passes. Layout-shape tests cover the approved rooms, local geometry, content references, corridors, reciprocal doorways, and initial spawn without starting Phaser.

## DEC-026 — PORT-04C validation model

- Date: 2026-09-17
- Status: Accepted
- Decision: Implement `validateHouseLayout(layout, options?)` as a pure validator that returns all discovered errors, plus `assertValidHouseLayout(layout, options?)` for a later Phaser startup guard.
- Decision: Treat tile rectangles as half-open ranges (`x <= point < x + width`). Reject positive-area room overlaps while allowing edge contact, and use explicit doorway-opening/corridor/destination contact checks for walkability.
- Decision: Reuse the existing `roomRegistry`, `contentRegistry`, and `validateInteractableReferences()` for interactable references. Keep room geometry owned by the supplied layout, with optional content and required-room overrides for isolated tests or future builds.
- Decision: Model reachability as an undirected graph of room and corridor nodes connected by valid doorway paths. By default, every room in the supplied layout is required; callers can provide a narrower required-room list.
- Rationale: The validator catches authoring errors before rendering, reports multiple actionable IDs in one pass, and remains independent of Phaser, the DOM, and any browser test environment.

## DEC-027 — PORT-04C completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-04C` complete and proceed to `PORT-04D`.
- Evidence: `npm test` passes with 6 test files and 47 tests; `npm run typecheck` passes; `npm run build` passes. Focused fixtures cover valid data, dimensions, room/corridor bounds, duplicate IDs, room overlap, collision bounds, doorway references and geometry, world conversion, disconnected targets, interactable references, spawn validity, and unreachable rooms.

## DEC-028 — PORT-04D pure contract-test coverage

- Date: 2026-09-17
- Status: Accepted
- Decision: Add a dedicated `layoutContract.test.ts` suite while retaining the coordinate and validator suites as focused rule-level tests.
- Decision: Use small in-memory layout copies and table-driven cases for invalid scalar configuration, room origins, collision/interactable geometry, references, doorway destinations, valid corridor spawns, and required-room subsets.
- Decision: Add a raw-source import guard for the layout data, coordinate helpers, and validator to prevent Phaser or DOM dependencies from entering the pure layout boundary.
- Rationale: The full layout contract is now protected both at the individual-rule level and at the cross-module boundary before Phaser scenes consume it.

## DEC-029 — PORT-04D completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-04D` complete and proceed to `PORT-06A`.
- Evidence: `npm test` passes with 7 test files and 60 tests; `npm run typecheck` passes; `npm run build` passes. The combined pure suites cover every documented conversion, bounds, overlap, doorway, reference, spawn, reachability, and import-boundary rule without browser or Phaser initialization.

## DEC-030 — PORT-06A Phaser lifecycle boundary

- Date: 2026-09-17
- Status: Accepted
- Decision: Create Phaser exactly once through `createGame()` after the DOM shell and shared services are initialized. Pass a single `HouseScene` instance the validated `HouseLayout` and typed lifecycle callbacks.
- Decision: Use a 512×288 logical canvas with `Scale.FIT`, centered scaling, pixel-art rendering, `roundPixels`, and Arcade Physics with zero gravity. Derive camera and physics world bounds in pixels from the layout tile dimensions and tile size.
- Decision: Treat `onSceneReady` as an internal scene-readiness callback. Do not emit the public `gameReady` event until the player is created and usable in a later story.
- Decision: Catch synchronous creation failures in `main.ts` and scene setup failures in `HouseScene`, route both through `gameStartupError`, and keep the DOM fallback available. Destroy the Phaser instance from the existing HMR/application teardown path.
- Rationale: This establishes one auditable runtime boundary without coupling the first boot story to room rendering, input consumption, player state, or content interactions.

## DEC-031 — PORT-06A completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-06A` complete and proceed to `PORT-06B`.
- Evidence: `npm test` passes with 7 test files and 60 tests; `npm run typecheck` passes; `npm run build` passes. The local Vite server returned the expected HTML response over HTTP; browser automation was unavailable, so visual boot and forced-runtime-failure checks remain manual follow-up items.

## DEC-032 — PORT-06B data-driven renderer

- Date: 2026-09-17
- Status: Accepted
- Decision: Render the initial house with Phaser `Graphics` layers rather than loading placeholder image assets or introducing a tilemap pipeline. Use generic room and corridor iteration over the validated layout.
- Decision: Draw room collision rectangles as walls and as a visible development collision preview. Draw doorway openings from source-room-local definitions after converting them to world pixels, and draw corridors separately so the intended walkable paths are visible.
- Decision: Set the initial camera zoom to the smaller ratio of logical viewport dimensions to world pixel dimensions, which fits the complete 64×36-tile house into the 512×288 logical viewport while preserving the existing camera bounds.
- Rationale: This provides an immediately inspectable rendering checkpoint with no asset-loading dependency and leaves the later player, collision-body, and interaction stories free to consume the same typed layout.

## DEC-033 — PORT-06B completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-06B` complete and proceed to `PORT-06C`.
- Evidence: `npm test` passes with 7 test files and 60 tests; `npm run typecheck` passes; `npm run build` passes. The local Vite server returned the expected HTML response over HTTP; browser automation was unavailable, so visual inspection remains a manual follow-up.

## DEC-034 — PORT-06C player and asset readiness

- Date: 2026-09-17
- Status: Accepted
- Decision: Load all five registered placeholder assets in `HouseScene.preload()`, verify their texture keys in `create()`, and create the player as a non-physical sprite at the world-global `initialSpawn`. PORT-05 will add the dynamic body and movement.
- Decision: Keep `gameReady` as the public readiness event and emit it only through the existing scene-ready callback after layout validation, texture checks, player creation, camera follow, and development overlay setup complete.
- Decision: Use the shared logical viewport constants for the initial camera fit zoom, and keep camera bounds derived from the layout world dimensions.
- Rationale: Asset and player readiness are established without introducing movement, collision, or proximity responsibilities into the scene.

## DEC-035 — PORT-06C asset path correction and completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Treat manifest asset paths as relative to `public/assets` and normalize them through `assetUrl()` to `/assets/...`, while accepting already-rooted `/assets/...` paths without duplication.
- Evidence: The live Vite check showed the old `/sprites/...` route returned `text/html` fallback content, while `/assets/sprites/...` returned `image/svg+xml`. After correction, all five placeholder SVG paths return HTTP 200 with `image/svg+xml`; `npm test` passes with 8 test files and 62 tests; `npm run typecheck` passes; `npm run build` passes.
- Decision: Mark `PORT-06C` complete and proceed to `PORT-05`. Browser automation was unavailable, so visual camera and debug-overlay inspection remains a manual follow-up.

## DEC-036 — PORT-05 player movement contract

- Date: 2026-09-17
- Status: Accepted
- Decision: Wrap the existing Phaser sprite in a reusable `Player` class. Attach its dynamic Arcade body through the existing `HouseScene` and pass the one `InputController` instance created by `main.ts`; do not create listeners or controllers inside the player.
- Decision: Use `PLAYER_SPEED = 96` pixels per second, convert the four booleans in `MovementSnapshot` into a normalized vector, disable gravity, and rely on the scene’s configured Arcade world bounds with `setCollideWorldBounds(true)`.
- Decision: Expose only `PlayerState { position, facing }` from the player wrapper. Keep Phaser sprite/body references private so collision, proximity, and animation systems consume a stable contract rather than unrelated engine internals.
- Decision: Define deterministic facing priority for simultaneous input as up, down, left, right, and preserve the previous facing direction while stationary.
- Rationale: This makes keyboard and mobile movement share one tested path and leaves internal wall collisions, interactions, and animation behavior to their dedicated stories.

## DEC-037 — PORT-05 completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-05` complete and proceed to `PORT-07A`.
- Evidence: `npm test` passes with 9 test files and 68 tests; `npm run typecheck` passes; `npm run build` passes. The movement suite covers idle, cardinal, normalized diagonal, opposing-direction cancellation, facing, and invalid-speed cases; browser automation was unavailable for live movement inspection.

## DEC-038 — PORT-05 movement speed adjustment

- Date: 2026-09-17
- Status: Accepted
- Decision: Increase the default `PLAYER_SPEED` from 96 to 144 pixels per second, preserving the existing injectable speed option for future tuning or tests.
- Decision: Keep the default speed in the Phaser-free `playerMotion.ts` module and re-export it from `Player.ts`, so the regression test does not require a browser environment merely to verify the constant.
- Evidence: The focused player-motion suite passes with 7 tests and `npm run typecheck` passes.

## DEC-039 — PORT-07A collision architecture

- Date: 2026-09-17
- Status: Accepted
- Decision: Represent room collision rectangles and four world-perimeter rectangles as one flat, data-derived list of world-tile rectangles. Convert each rectangle to an invisible Phaser `Rectangle` and add it to one Arcade `StaticGroup`.
- Decision: Attach one collider between the PORT-05 player sprite and the static group. Keep collision construction independent of corridors, doorways, proximity, prompts, content events, and all input listeners; openings remain passable because no body is created for those gaps.
- Rationale: Static Arcade bodies match the existing axis-aligned layout data, require no tilemap or editor, and preserve a small reusable boundary between pure geometry and Phaser runtime behavior.

## DEC-040 — PORT-07A completion and teardown

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-07A` complete and proceed to `PORT-07B`.
- Decision: Destroy the player collider during `HouseScene.shutdown()`, explicitly disable every static body before clearing and destroying its invisible game object, and make teardown idempotent.
- Evidence: `npm test` passes with 10 test files and 73 tests; `npm run typecheck`, `npm run build`, and `git diff --check` pass. Interactive browser automation was unavailable, so manual walking and shutdown inspection remain follow-up verification.

## DEC-041 — PORT-07B interaction target contract

- Date: 2026-09-17
- Status: Accepted
- Decision: Keep `InteractionSystem` independent of Phaser and the DOM. Convert each room-local `InteractableDefinition` into a data-only `InteractionTarget` with world position, optional world bounds, labels, content ID, and an effective interaction radius.
- Decision: Select candidates by distance to the target point or nearest point on optional bounds. Choose the closest candidate, use the stable current target for exact-distance ties, and use the target ID as the deterministic fallback for other ties.
- Decision: Expose availability through an optional typed `onTargetChanged(target | null)` callback. `HouseScene` forwards that callback through `createGame()` for the later bridge story; PORT-07B does not access or update DOM state.
- Rationale: The system can be tested without browser or Phaser initialization, future rooms require only layout data, and the later bridge can translate one stable target contract into UI events.

## DEC-042 — PORT-07B completion and gameplay gating

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-07B` complete and proceed to `PORT-07C`.
- Decision: Clear the active target as soon as gameplay is disabled, suppress duplicate availability callbacks while the target remains unchanged, and clear all target data on idempotent destroy.
- Evidence: `npm test` passes with 11 test files and 82 tests; `npm run typecheck`, `npm run build`, and `git diff --check` pass. Interactive browser automation was unavailable, so manual in-game proximity inspection remains follow-up verification.

## DEC-043 — PORT-07C game/UI bridge wiring

- Date: 2026-09-17
- Status: Accepted
- Decision: Keep `HouseScene` responsible for consuming one pending `InputController` interaction request and validating it against `InteractionSystem.getCurrentTarget()`. Expose only `(contentId, triggerSource)` through the existing scene/game creation callback.
- Decision: Let `main.ts` translate target changes into the existing typed `GameUiBridge` events. The DOM owns prompt text and mobile-button state through its existing bridge subscriptions; game systems do not query or mutate DOM nodes.
- Decision: Preserve the original keyboard/mobile trigger source in `contentRequested`, and describe both `E` and the mobile `Interact` control in the visible availability prompt.
- Rationale: One-shot request ownership remains in `InputController`, target validity remains in the game layer, and the bridge remains the only boundary crossing into dialog/UI behavior.

## DEC-044 — PORT-07C completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-07C` complete and proceed to `PORT-07D`.
- Evidence: `npm test` passes with 12 test files and 84 tests; `npm run typecheck`, `npm run build`, and `git diff --check` pass. Interactive browser automation was unavailable, so manual preview checks for prompt visibility, keyboard/mobile interaction, and the expected unavailable-content fallback remain follow-up verification.

## DEC-045 — PORT-07C add F interaction key

- Date: 2026-09-17
- Status: Accepted
- Decision: Add lowercase `f` to the shared keyboard interaction mapping. Because key handling normalizes `event.key` with `toLowerCase()`, both `F` and `f` activate the same one-shot keyboard interaction request.
- Decision: Keep the visible prompt unchanged; it describes the interaction action and the mobile control, while the keyboard mapping supports the configured interaction alternatives.
- Evidence: The input-controller regression test confirms `F` is prevented and produces one keyboard interaction request; the full test, typecheck, and build checks remain required before delivery.

## DEC-046 — Preview camera and interactable rendering correction

- Date: 2026-09-17
- Status: Accepted
- Decision: Apply the camera zoom before setting camera bounds and center the bounds afterward. Phaser calculates camera scroll limits from the zoom-adjusted effective viewport; setting bounds first leaves stale unzoomed limits and can crop the house or prevent correct follow behavior.
- Decision: Keep the approved initial fit zoom for the current 64×36 house. At that zoom the complete house is visible and no panning is needed; camera follow remains active and will pan when a future layout or zoom makes the world larger than the effective viewport.
- Decision: Render every room interactable from its data-driven `assetId`, with the generic interactable-marker placeholder as fallback. Scale oversized placeholder art to at most three tiles while preserving the original asset dimensions for final-art replacement.
- Rationale: This corrects the current preview without adding room-specific branches, a second asset registry, or an unnecessary camera mode.

## DEC-047 — Preview correction verification

- Date: 2026-09-17
- Status: Accepted
- Decision: Record the camera, interactable-art, and tooltip corrections as follow-ups to `PORT-06B`, `PORT-06C`, and `PORT-07C`; the stories remain complete while their preview defects are corrected.

## DEC-048 — Add PORT-07CA camera correction story

- Date: 2026-09-17
- Status: Accepted
- Decision: Insert unimplemented `PORT-07CA` between `PORT-07C` and `PORT-07D` to address the zoom-aware camera defect shown in the attached recording before pure proximity and bridge test work proceeds.
- Decision: Preserve the approved full-house fit overview for the current 64×36 house. Because the effective viewport equals the world at that fit zoom, camera panning is only expected when the effective viewport is smaller than the world; `PORT-07CA` must validate that mode with a deliberately zoomed-in or larger-world fixture.
- Rationale: Phaser 3.90’s built-in follow and bounds-centering calculations use logical camera dimensions without accounting for non-1 zoom, so explicit zoom-aware scroll math is required for correct centering, clamping, and future panning.

## DEC-049 — PORT-07CA camera implementation and completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Replace `HouseScene.startFollow()` with explicit camera scroll updates driven by the Phaser-free `cameraFollow` helpers. Keep Phaser camera bounds enabled as a runtime safety net and stop any built-in follow state during shutdown.
- Decision: Model Phaser’s center-relative scroll contract directly: zoom determines the valid scroll range through the effective viewport, while the target is centered relative to the logical camera midpoint. Clamp each axis independently and round scroll values before applying them.
- Evidence: `npm test` passes with 13 test files and 92 tests; `npm run typecheck`, `npm run build`, and `git diff --check` pass. Browser visual automation was unavailable because no browser surface was exposed; local Vite startup succeeded with escalated permission.
- Decision: Mark `PORT-07CA` complete and proceed to `PORT-07D`.

## DEC-050 — Fix clipped Phaser canvas overlay

- Date: 2026-09-17
- Status: Accepted
- Decision: Make `.canvas-layer` a single absolute stacking context and place both the Phaser canvas and startup placeholder at `inset: 0`. Stretch the 16:9 canvas to the shell rather than allowing CSS Grid auto-placement to create separate rows.
- Rationale: The preview’s apparent camera-follow failure was caused by the canvas being placed in a second grid row and clipped by `.game-shell`; the game world was not being displayed in the full available viewport.
- Evidence: The live local preview now shows all four rooms and the complete world outline inside the game shell. Player movement remains functional. The current fit zoom intentionally keeps the whole world visible, so visible panning requires a smaller effective viewport.

## DEC-051 — Use a bounded default camera zoom

- Date: 2026-09-17
- Status: Accepted
- Decision: Replace fit-to-world camera zoom with the named `DEFAULT_CAMERA_ZOOM` of 1× and expose an optional `cameraZoom` override through `createGame()`.
- Decision: Keep physics bounds tied to the authored world while deriving camera constraints from the effective viewport. Center smaller layouts and allow bounded player-follow on larger layouts, independently per axis.
- Rationale: The house may grow with additional rooms and different layouts. A fixed/readable gameplay zoom keeps the player view stable while allowing the camera to pan through a larger world instead of shrinking every new layout to overview size.

## DEC-052 — PORT-07CB completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-07CB` complete and proceed to `PORT-07CC`.
- Evidence: `npm test` passes with 13 test files and 93 tests; `npm run typecheck`, `npm run build`, and `git diff --check` pass. Native Chrome preview confirmed that a desktop movement key changes the player position and pans the camera at the default zoom.

## DEC-053 — Temporarily hide the content index

- Date: 2026-09-17
- Status: Accepted
- Decision: Hide the visible content-index section and use a full-width `game-only` experience layout for now. Keep the content-index DOM structure and `ContentIndex` service initialized so the presentation can be re-enabled later without changing the content contract.
- Decision: Change the skip link target to the focusable game shell while the content index is hidden.
- Rationale: The content index currently contains no useful entries and consumes space needed by the interactive house.

## DEC-054 — PORT-07CC completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-07CC` complete and proceed to `PORT-07D`.
- Evidence: `npm test` passes with 13 test files and 93 tests; `npm run typecheck`, `npm run build`, and `git diff --check` pass. Native Chrome preview confirmed the content index is hidden and the game shell uses the available experience width.

## DEC-055 — PORT-07D completion

- Date: 2026-09-18
- Status: Accepted
- Decision: Mark `PORT-07D` complete and proceed to `PORT-08A`.
- Decision: Keep the story test-only; the existing runtime contracts already expose the needed pure proximity, input, and bridge seams without requiring Phaser or browser rendering.
- Evidence: `npm test` passes with 13 test files and 95 tests; `npm run typecheck`, `npm run build`, and `git diff --check` pass.

## DEC-056 — PORT-08A completion

- Date: 2026-09-18
- Status: Accepted
- Decision: Register the television content record with the shared dialog through a generic adapter from data-only content to UI dialog content.
- Decision: Keep the television interaction data-driven and leave all other room content registration for their later vertical-slice stories.
- Rationale: This completes the first desktop interaction without adding room-specific branches to Phaser systems or prematurely completing the hidden semantic content index.
- Evidence: The local desktop preview showed the television prompt at spawn, opened `Games and movies` with all three dummy sections via `E`, and returned focus to the game shell after Escape. `npm test` passes with 14 test files and 97 tests; `npm run typecheck`, `npm run build`, and `git diff --check` pass.

## DEC-057 — Add PORT-08A1 placeholder-art story

- Date: 2026-09-18
- Status: Accepted
- Decision: Insert `PORT-08A1` between the completed desktop television slice and mobile television parity.
- Decision: Scope the story to original, clearly labeled living-room and television/console placeholder art, manifest/loader registration, data-driven renderer selection, fallback behavior, and licensing records.
- Rationale: The current implementation uses generic room and furniture placeholders. Dedicated art can improve the television slice without changing interaction IDs, dialog behavior, or Phaser/DOM boundaries.

## DEC-058 — Generate a television sprite sample from style.md

- Date: 2026-09-18
- Status: Accepted
- Decision: Use the owner's style.md brief to generate one front-view CRT television, retro console, wooden stand, and two-controller sample with the built-in image generation tool.
- Decision: Preserve the generated PNG with its alpha channel at public/assets/placeholders/television-console-front-sample.png. The tool produces raster artwork; editable SVG output and the remaining views from the brief are outside this single-sample delivery.
- Decision: Keep PORT-08A1 open for asset integration and display-size verification. No manifest, renderer, interaction, or story-completion changes are included in this sample.
- Evidence: The image was visually inspected for the requested subject and style. Its saved dimensions are 1221 × 1288 pixels, with an alpha channel. The exact prompt and provenance are recorded in output/imagegen/television-console-front-sample.prompt.md.

## DEC-059 — Complete all four television sprite directions

- Date: 2026-09-18
- Status: Accepted; supersedes the single-view scope recorded in DEC-058.
- Decision: Correct the incomplete delivery to include front, back, left-facing and right-facing television sprites as required by style.md and clarified by the owner.
- Decision: Preserve the approved front PNG and use it as the design reference for three separate image-generation calls. Define left/right by the direction the screen points within the image.
- Decision: Save all four PNG sources and self-contained SVG copies in public/assets/placeholders/. The SVG files embed PNG artwork; they are not editable vector drawings. Use a common 1221 × 1289 SVG canvas without resampling the generated pixels.
- Evidence: Visually inspected all three generated directions against the front reference. All four PNGs have alpha channels; front is 1221 × 1288 and the new directions are 1221 × 1289. Generation prompts and the reproducible SVG packaging script are saved in output/imagegen/.
- Decision: Keep PORT-08A1 open for runtime integration and size/anchor verification.

## DEC-060 — Use the front-facing television sprite in the living room

- Date: 2026-09-18
- Status: Accepted
- Decision: Load the approved front PNG through a generic optional-texture manifest and select it with the existing living-room television's assetId. Use PNG directly to avoid the embedded-image overhead of its SVG wrapper.
- Decision: Add optional displayHeightTiles and originY metadata to interactables. Display the TV at 4 tiles (64 world pixels) high, preserving aspect ratio and anchoring its base at the unchanged interaction point. Art size does not change interaction range or collision geometry.
- Decision: If dedicated artwork is unavailable, render the required generic furniture placeholder at its existing size and center anchor. Optional-art failure must not prevent scene startup.
- Evidence: All 100 tests in 15 files pass, including artwork size/anchor and missing-texture regression checks. Typecheck, production build, and diff whitespace checks pass. Desktop Chrome visibly rendered the TV and opened Games and movies via F; the closed dialog returned focus to the game shell. Further movement automation was interrupted by concurrent user activity.
- Decision: Record this as partial PORT-08A1 delivery. Dedicated living-room backdrop/surface art remains outstanding; do not mark the entire story complete.

## DEC-061 — Center television artwork on its interaction circle

- Date: 2026-09-18
- Status: Accepted; supersedes the base-anchor choice in DEC-060.
- Decision: Use a center origin (0.5, 0.5) so the rendered TV and its interaction circle share the same world-space center. Remove the unused originY override from the layout and type contract; keep the configured height at 64 pixels.
- Rationale: Anchoring the TV's base at the interaction point displaced its visual center 32 pixels above the circle, as reported by the owner.
- Evidence: The renderer regression checks the center origin and unchanged world position (120, 152), alongside scale and fallback behavior. All 100 tests in 15 files, typecheck, production build, and whitespace checks pass. A post-correction browser visual check remains unconfirmed because the browser was in concurrent use.

## DEC-062 — Generate and integrate the record-player artwork

- Date: 2026-09-18
- Status: Accepted
- Decision: Follow the owner's agreed hybrid approach: separate interactable artwork over room scenery. Generate four views of an 1980s turntable on a small wooden table with vinyl records on its lower shelf.
- Decision: Reuse the unchanged styling paragraphs from style.md. Use the TV front sprite as a style reference and the new record-player front as the identity reference for the back/left/right views. Preserve transparent PNGs and self-contained raster-backed SVG copies, with exact prompts in output/imagegen/record-player-directional-samples.prompt.md.
- Decision: Load only the record-player front PNG through optionalTexturePaths. Keep its existing ID, position, radius and centered origin, with displayHeightTiles set to 4. Reuse the renderer and missing-art fallback without new room-specific code.
- Decision: Register the already-authored livingroom-vinyl dummy content so the new artwork has a content destination through the shared dialog manager.
- Evidence: All 100 tests in 15 files, typecheck and production build pass. The front PNG returns HTTP 200. Desktop preview visibly shows the TV and record player centered within their interaction circles. Further keyboard interaction checks were interrupted by concurrent user activity.
- Decision: Bring forward this portion of PORT-09A at the owner's request; leave the story in progress pending full desktop/mobile verification. Existing PORT-08A1 and PORT-08B remaining work is unchanged.

## DEC-063 — Art-first living-room sample and per-sprite folders

- Date: 2026-09-18
- Status: Accepted for sample generation and asset organization; background approval/integration pending.
- Decision: Generate one living-room background from the revised `style.md`, using the existing TV and record-player fronts only as style references. Interpret library as bookshelf, put the north-facing couch below the rug, and place the coffee table between the couch and rug center. Leave interactables out of the background.
- Decision: Preserve the generated 1499 × 1049 PNG at `public/assets/backgrounds/living-room/sample.png` and its exact prompt in `output/imagegen/living-room-background-sample.prompt.md`. Do not wire this review sample into the runtime yet. Once art is approved, map bounds, collisions, doorway regions and adjoining corridors to it rather than forcing it onto the existing placeholder geometry.
- Review: The sample captures the requested composition but adds a plant and landscape picture, includes a bottom wall around the entrance, and shows slight side-wall convergence. These are review points, not approved changes to the level contract.
- Decision: Move player art into `public/assets/sprites/player/`; move television-console and record-player PNG/SVG directions into their own named sprite folders, using `front`, `back`, `left`, and `right` filenames. Retain shared generic fallbacks in `placeholders/`. Update manifest paths and packaging/provenance documentation; keep runtime texture keys unchanged. Earlier log paths are historical and superseded by this organization.
- Evidence: All 17 moved files are byte-identical to their committed originals, all 7 manifest paths exist, and no obsolete asset paths remain in source/current asset documentation. All 100 tests in 15 files, typecheck, production build and packaging-script syntax check pass. The build retains its existing large-chunk warning.
- Decision: Keep PORT-08A1 in progress; the sample does not satisfy runtime backdrop integration or full story verification.

## DEC-064 — Push completed stories only

- Date: 2026-09-18
- Status: Accepted; owner clarification.
- Decision: Push only after an entire story's implementation and verification are complete. Do not push intermediate samples or partial story deliveries. Retain story-ID commit messages, changelog updates, and decision records for completed-story delivery.
- Decision: Leave this turn's PORT-08A1 sample and sprite-folder changes local and uncommitted. Preserve the owner's pre-existing edits to `style.md` and the reviewer description in `plan.md`.

## DEC-065 — Integrate the living-room sample with separate collision data

- Date: 2026-09-18
- Status: Accepted for implementation at the owner's request; final preview verification pending.
- Decision: Register the existing PNG as the optional `living-room-background` texture and render any available room `visualAssetId` at the room's origin and bounds. The sample's near-10:7 aspect ratio fits the existing 20×14-tile footprint. Keep the background below interactables and player, with no room-ID conditionals.
- Decision: Do not render opaque collision blocks over available room artwork. Retain the collision-preview layer and unchanged physics pipeline; missing artwork falls back to the generic floor and obstacle blocks.
- Decision: Approximate the painted top wall, bookcase, coffee table, couch and lower walls with integer tile-grid collision rectangles. Leave the rug and surrounding floor walkable. Shift both gym-facing doorway definitions and their corridor down one tile to match the side entrance. Preserve the lower entrance, room bounds, spawn and TV position; move the record player to local tile (16, 6) to avoid the bookcase.
- Limitation: The sample is one flattened image, so furniture has collision but no foreground occlusion layer. Collision rectangles approximate its silhouettes rather than following every painted edge. Fine alignment and player clearance still need a live preview check.
- Evidence: 103 tests in 15 files, typecheck, production build, and background HTTP 200 pass. New regressions cover backdrop placement/depth, missing-art fallback, collision preview independence and reachable exits/interactables around furniture. The existing build chunk-size warning remains.
- Decision: Keep PORT-08A1 in progress and unpushed because final browser visual/movement/dialog verification was interrupted by concurrent user activity. Stop the extra temporary preview server; leave the existing preview on port 5173 running. Preserve all prior local work and user edits.

## DEC-066 — Ground-contact player body and temporarily walkable furniture

- Date: 2026-09-18
- Status: Accepted at the owner's request; supersedes DEC-065 furniture collision choices.
- Decision: Replace the player's full-sprite Arcade Physics body with a centered half-width, one-pixel-high strip at the sprite's bottom. This lets its torso overlap painted wall faces while the feet reach the floor boundary within one world pixel. Apply this consistently across the house; retain sprite origin, interaction/camera position, movement speed and world-bound enforcement.
- Decision: Keep wall coordinates at the background floor boundaries, removing the artificial gap caused by the old full-height player body rather than shifting the walls into the art. Remove the bookcase-specific collision rectangle entirely and temporarily omit table/couch rectangles. Keep their artwork, all perimeter walls and both living-room exits unchanged.
- Evidence: 105 tests in 16 files, typecheck, build and whitespace checks pass. Constructor-level tests verify body size and bottom offset for 32px and 48px sprite heights. Layout tests verify bookcase/table/couch floor positions are walkable, walls remain solid and exits/interactables remain reachable. The pre-existing build chunk-size warning remains.
- Decision: Leave PORT-08A1 in progress with final live movement/visual verification still pending. No commit or push for partial work.

## DEC-067 — Increase displayed game scale by 25 percent

- Date: 2026-09-18
- Status: Accepted at the owner's request.
- Decision: Increase `DEFAULT_CAMERA_ZOOM` from 1 to 1.25 so room art, interactables and player appear 25% larger. Keep world coordinates, movement speed, collision shapes, canvas dimensions and DOM controls/dialog sizing unchanged. The visible world area decreases and the existing player-follow camera remains responsible for navigation.
- Evidence: Added a regression for the default zoom, effective viewport (409.6 × 230.4 world pixels) and centered player follow. All 106 tests in 16 files, typecheck and production build pass; the existing chunk-size warning remains.
- Decision: Keep this refinement local with the other in-progress PORT-08A1 work; no commit or push.

## DEC-068 — Owner acceptance and PORT-08A1 delivery

- Date: 2026-09-18
- Status: Accepted; owner requested story closure and push.
- Decision: Accept the owner's preview approval as the final manual acceptance of the placeholder-art story. Do not describe it as independently repeated agent browser verification. Include the background integration, per-sprite folders, collision refinements and 125% camera zoom in the PORT-08A1 delivery; leave PORT-08B mobile parity and PORT-09A outstanding work unchanged.
- Decision: Preserve and exclude the pre-existing reviewer-description edit in plan.md and the owner's style.md working changes. The exact room-generation prompt is already preserved in the story's provenance file.
- Delivery: commit and push the completed implementation with a PORT-08A1-prefixed message, then record Done after the delivery succeeds.
- Delivery result: implementation commit `d9bb826` successfully pushed to `origin/master`; confirmed directly against the remote after the interrupted turn. Marked PORT-08A1 Done following owner acceptance. All 106 tests, typecheck, production build and whitespace checks passed before the implementation commit. The user's unrelated plan reviewer-description and style.md edits remain local and excluded.

## DEC-069 — PORT-08B mobile parity regression coverage

- Date: 2026-09-18
- Status: Implemented locally; browser acceptance pending.
- Decision: Keep the existing on-screen D-pad and Interact button, shared InputController, InteractionSystem and DialogManager path. Do not add mobile-specific content registration or Phaser room branches.
- Decision: Preserve pressed styling while any tracked pointer still holds a direction button; previously the first finger release removed styling while another finger continued movement.
- Decision: Test real control/input/dialog service code with small event/element doubles without new dependencies. These tests cover logical event contracts, not browser rendering, native capture or native modal behavior.
- Evidence: Nine new tests cover pointerup, pointercancel, lostpointercapture, multi-touch, blur, visibility loss, availability/disabled gating, repeated E/mobile television dialog parity and teardown. All 115 tests in 17 files, typecheck and production build pass. Existing bundle-size warning remains.
- Browser evidence: Opened the local preview and observed the ready state and television interaction prompt. Attempts to enter device emulation were repeatedly interrupted by concurrent Chrome activity, including after the owner offered an idle testing interval. Portrait/landscape, actual held touch movement and console inspection are not verified.
- Decision: Keep PORT-08B in progress and unpushed until its browser checks can be completed. Preserve the user's unrelated plan edit, style.md deletion and new utils/ directory.

## DEC-070 — Mobile viewport layout and PORT-08B acceptance

- Date: 2026-09-18
- Status: Verified; ready for completed-story delivery.
- Finding: At 390×844 the absolutely positioned D-pad/Interact controls obscured the artwork and overlapped the prompt. Separate controls from the canvas instead of shrinking touch targets.
- Decision: Use an in-flow control row beneath the 16:9 canvas on touch/narrow screens; use a 10rem side rail for landscape viewports no wider than 56rem and no taller than 32rem. Keep desktop layout, camera scale, input services and content path unchanged.
- Browser evidence: Chrome emulation at 390×844 and 844×390 displayed the controls clear of the scene. D-pad short press/drag/release moved the player and stopped without subsequent drift. Interact repeatedly opened Games and movies; close restored game-shell focus. E opened the same dialog. Landscape content scrolled to the final section. The default-level console showed Phaser startup logging and no application errors. Restored desktop mode and closed DevTools afterward.
- Test boundary: Native pointer cancellation/lost capture, multiple fingers, blur and visibility resets have event-level automated coverage. Short emulated drags are not a prolonged physical-device hold test; no claim of native OS interruption or real-device certification.
- Decision: Browser and automated evidence satisfy this story's emulation checkpoint. Deliver PORT-08B and then mark Done after successful push. Preserve unrelated working-tree edits.
- Delivery result: `d89a2d8` (`PORT-08B: verify mobile TV parity and separate touch controls`) pushed successfully to `origin/master`. Marked PORT-08B Done. Final suite: 115 tests in 17 files; typecheck, build and whitespace checks pass, with the existing large-bundle warning unchanged.

## DEC-071 — Finish the record-player vertical slice

- Date: 2026-09-18
- Status: Verification in progress.
- Decision: Retain the existing separate record-player front sprite, stable livingroom-vinyl content ID and shared dialog registration. Existing Recently listened and Personal comments placeholders satisfy the dummy-content scope; do not invent personal listening history or add a room-specific runtime branch.
- Decision: Extend existing tests rather than duplicate mobile controls or dialog implementations. Four-direction proximity tests cover vinyl selection, out-of-range clearing and TV recovery; shared repeated keyboard/mobile dialog-cycle tests now exercise both living-room content records.
- Evidence: 120 tests in 17 files, typecheck and build pass. The initial live-browser attempt was diverted by concurrent browser use; live vinyl checks are still pending. Preserve unrelated local edits and do not push an unfinished story.

## DEC-072 — Prepare player artwork before PORT-14 implementation

- Date: 2026-09-18
- Status: Draft prompt; character appearance awaiting owner input.
- Decision: At the owner's request, prioritize player-animation preparation instead of continuing PORT-09A verification. Create `utils/style_player.md` from the shared style paragraphs in `utils/style.md`, adapting material details for a character and using existing room/TV/record-player art as style references.
- Proposed asset contract: four screen-facing directions, each with four subtle idle frames and eight walking frames (48 frames total). Specify consistent 128px cells, a fixed foot anchor, transparent PNG export and a documented 12×4 sheet layout. These are draft production choices, not runtime changes.
- Decision: Leave character appearance unresolved rather than inventing an approved likeness or outfit. Require an approved neutral reference before animation generation, and explicitly validate generated grid/anchors/loop consistency rather than assuming exact output.
- Decision: No image generation, runtime implementation, story closure, commit or push in this prompt-only step. Preserve the original style brief and existing local changes. PORT-09A remains unfinished; PORT-14's runtime scheduling/dependency update can follow prompt approval.

## DEC-073 — Generate the neutral player design sample

- Date: 2026-09-18
- Status: Generated for owner review; runtime integration and animation generation deferred.
- Decision: Follow the owner's newly supplied character description and explicit generation request, superseding the prompt document's earlier no-generation drafting notice for this single sample only. Generate one neutral down/front pose before the remaining views and animation sequences.
- Interpretation: short blonde/brown hair stubble becomes a sandy-brown buzz cut. Preserve light skin, green eyes, moderately muscular build, large beard, black hoodie, cargo shorts and unbranded canvas high-top shoes.
- Decision: Use the built-in image tool with project room/TV/record-player style references. Preserve the generated PNG at `public/assets/sprites/player/idle-down-sample.png`; record exact prompt and provenance separately. No game assets are replaced or loaded by the runtime.
- Review: The generated sample visibly includes the requested outfit, full beard, short hair, green eyes and neutral front pose. Exact 128px frame geometry and foot anchoring remain export/implementation tasks after design approval. No claim that this preview is animation-ready; no commit or push.

## DEC-074 — Refine player hair and build

- Date: 2026-09-18
- Status: Revised sample for owner review.
- Decision: Use the original front sample as an edit target; slightly lighten the buzz-cut hair toward sandy blonde and reduce body bulk while retaining the outfit, beard, face, pose, camera and arcade pixel-art styling.
- Decision: Preserve the original and save the edited PNG as `public/assets/sprites/player/idle-down-sample-v2.png`. Record the exact built-in tool edit prompt in `output/imagegen/player-idle-down-sample-v2.prompt.md` and update provenance.
- Review: The edited character has a visibly slimmer silhouette and subtly lighter hair with the same clothing and front pose. No runtime integration, remaining-direction generation, story completion, commit or push.

## DEC-075 — Approve the player design and bring PORT-14 forward

- Date: 2026-09-18
- Status: Implementation and automated verification complete; browser verification and story delivery pending.
- Authorization: The owner approved v2 and requested all remaining sprites, implementation and testing. This supersedes the earlier prompt-only restriction. PORT-09A remains unfinished.
- Decision: Generate four separate directional sheets with the built-in image tool, each containing four idle and eight walking frames. The actual outputs are 1448×1086 with 362px cells, not the draft 128px export. Preserve original PNGs rather than resampling; record measured origin metadata and render at 34 world pixels high.
- Decision: Keep a separate visual sprite following the existing invisible 32px physics/camera anchor after physics updates. This preserves the 16×1 foot collider, initial spawn, 144px/s speed and interaction coordinates across all animation frames.
- Decision: Use eight looping Phaser animations, 4fps idle and 8fps walk, with ignore-if-playing transitions from requested velocity. Walking into a wall shows a walking attempt. Artwork is optional with the original placeholder fallback; scene shutdown removes visual listeners.
- Decision: Replace PORT-14's room-content dependency with the completed player/scene foundations (PORT-05 and PORT-06C); no room-specific branches are needed. Environmental effects, audio and unrelated content remain out of scope.
- Evidence: 135 tests in 19 files pass; typecheck and production build pass. Existing bundle-size warning remains. A live desktop screenshot confirms the avatar renders in the house; further movement/mobile checks are pending because Chrome first changed concurrently, then its visible window became unavailable. No commit or push while verification is incomplete.

## DEC-076 — Hold PORT-14 delivery for player-size review

- Date: 2026-09-18
- Status: Awaiting the owner's requested sprite-size adjustment; all changes remain local.
- Decision: The owner explicitly requested no push yet, because they want to change the player sprite size. Do not close or push PORT-14 until the size revision and remaining verification are complete and the owner authorizes delivery.
- Evidence: Chrome reconnected and the local preview loaded, but sustained movement testing was interrupted when the active browser window changed. No additional live movement/mobile checks are claimed. The current visual height is 34 world pixels in `src/game/entities/playerAnimation.ts`; physics remains independent of this setting.

## DEC-077 — Rebalance player and living-room artwork sizes

- Date: 2026-09-18
- Status: Implemented and verified locally. Delivery hold remains in effect.
- Decision: Apply the owner's requested linear scaling: television and record-player artwork each decrease by 30%, from 64 to 44.8 world pixels high (4 to 2.8 tiles); player artwork increases by 50%, from 34 to 51 world pixels high.
- Decision: Change display settings only. Preserve source PNGs, aspect ratios, foot anchoring, camera zoom, movement speed, 16×1 player collider, interactable centers and two-tile interaction radii. No image regeneration is needed.
- Automated verification: 138 tests in 19 files pass, including explicit size regressions; typecheck and production build pass. The existing large-bundle warning remains.
- Browser verification: Chrome desktop confirmed the new proportions, sustained right/up/down/left movement, stopping, top-wall foot contact and F opening the television dialog. Controlled sustained-key checks used console-dispatched keyboard events; F was pressed through native UI automation. Camera scrolling kept the player visible on the route through the living-room/gym corridor.
- Mobile verification: Chrome 390×844 portrait and 844×390 landscape emulation confirmed artwork rendering and separate D-pad controls. Short native pointer drags moved the player and released; portrait Interact opened television content, close restored gameplay, and landscape Interact opened Music collection after approaching the record player. These are emulation checks, not physical-device certification.
- Slow-device check: At 4× CPU slowdown, sustained walking/camera follow and rapid directional input recovered to idle without visible failure or default-level console application errors. Restored CPU to No throttling, disabled device emulation, closed DevTools and reloaded the desktop preview at spawn.
- Delivery: No commit, push or story closure. Await the owner's approval of the revised proportions and delivery.

## DEC-078 — Reopen directional animation quality verification

- Date: 2026-09-18
- Status: Owner reports broken right/down walking; correction pending. Left/up should be preserved.
- Findings: Static inspection of the generated right/down sheets shows inconsistent gait progression. Right-facing walking cells mostly repeat wide-stride poses rather than including a clear passing-leg phase; down-facing cells repeat the same leading-leg pose across much of the sequence. The shared loader selects the expected 362px grid and frames 4–11 for every direction. This establishes an artwork defect, but does not rule out additional playback/alignment issues without isolated loop inspection.
- Decision: Withdraw the earlier implication that browser smoke checks established animation-art quality. Automated tests validate frame availability, dimensions and state transitions, not anatomical continuity or smooth loop seams. Keep PORT-14 open, preserve left/up and the approved display sizes, and do not push. Recommend correcting only right/down artwork and reviewing full loops at slow and normal speeds before accepting them.

## DEC-079 — Replace only right/down walking artwork

- Date: 2026-09-18
- Status: Local replacement implemented; automated checks pass; isolated browser loop review pending.
- Authorization: The owner approved the proposed right/down correction. The no-push and no-closure hold remains active.
- Decision: Use the built-in image tool for all raster changes. Reject the first repair attempt's inconsistent gait; derive the right-facing replacement from the working left gait, and refine down-facing leg positions to include near-level passing poses between alternating leading feet. Save selected replacements as `right-walk-v2.png` and `down-walk-v3.png`, preserving the original sheets.
- Decision: Load replacements under separate texture keys and use them only for walking. All four original idle animations, left/up walking textures, display sizes, speed, camera and collision geometry remain unchanged. SHA-256 regressions lock the working left/up PNGs byte-for-byte.
- Decision: Use actual measured source geometry (right 1447×1087 with 361×362 cells; down 1448×1086 with 362×362 cells), not the requested image dimensions. Remeasure per-frame anchors and use source-specific origins. The right image's leftover transparent edge pixels are outside the 4×3 frame grid; no raster resampling is performed.
- Verification: 143 tests in 19 files pass; typecheck and production build pass, with the existing large-bundle warning. A development-only loop review page supports 2fps/8fps, pause, next-frame stepping and ordered contact sheets. Chrome currently reports `cgWindowNotFound`; do not claim completed visual verification until that page and runtime are inspected.
- Art provenance and exact iteration prompts: `output/imagegen/player-walking-repair.prompt.md`. The unselected down intermediate is retained outside public assets in `output/imagegen/player-down-walk-intermediate.png`.

## DEC-080 — Owner accepts the corrected walking animations

- Date: 2026-09-18
- Status: Owner visually approved the correction: "looks ok now".
- Decision: Retain the current right/down replacements and unchanged left/up, idle animations and display sizes. This records owner acceptance, not an agent-performed isolated browser loop check; that check was interrupted by an unavailable Chrome window.
- Delivery: Approval of appearance does not override the explicit no-push hold. Keep PORT-14 open and all changes local until the owner authorizes story closure and delivery.

## DEC-081 — Authorize PORT-14 delivery

- Date: 2026-09-18
- Authorization: The owner said "loooks good you can push", lifting the prior delivery hold after visually accepting the repaired animations.
- Decision: Deliver PORT-14, including approved sprite sizes, artwork, runtime, tests and provenance. Preserve unfinished PORT-09A tests/notes and unrelated owner edits outside the commit. Verify the staged snapshot before pushing; mark Done only after successful delivery.
- Provenance correction: Two initial sample prompt records contained `undefined`. Replace those placeholders with an explicit missing-transcript notice; do not fabricate exact prompts.
- Verification boundary: Prior desktop/mobile/slowdown smoke checks and the owner's post-repair visual acceptance remain the visual evidence. No new agent-performed isolated browser check is claimed.
- Final scoped verification: 138 tests in 19 files, typecheck and production build pass in `/private/tmp/port14-verify.uc9LnX`, copied from the staged index. Five pending PORT-09A regressions are intentionally excluded. Existing bundle-size warning remains.
- Delivery result: `f0b1967` (`PORT-14: add player sprites and directional animations`) pushed successfully to `origin/master`. Mark PORT-14 Done and deliver this closure record separately; unfinished PORT-09A work and unrelated owner edits remain local.

## DEC-082 — Defer object occlusion until the existing backlog is complete

- Date: 2026-09-18
- Authorization: The owner requested future stories for object layering/partial player occlusion, broken down with specific acceptance criteria and thorough review. This is planning authorization only.
- Decision: Add M6 stories PORT-18A–18D and PORT-19A–19E after PORT-17D, gated on all pre-existing stories being Done, including optional stories. They do not block the initial release. Changing this ordering requires an explicit owner decision.
- Scope: Review contract, add independent spatial metadata, sort the player and separate furniture by ground anchors, then add pilot floor footprints. Separate backdrop furniture through one-object couch/table/bookcase migrations; finish with independent release verification and maintenance documentation.
- Guardrails: Keep solid floor collision independent of draw order; do not disable collision merely because the player is behind an object. Preserve interaction geometry and wall boundaries. No new engine, shader/fade effect, map editor or under-table leg traversal is included.
- Review process: Require independent architecture/game-development approval, senior engineer diff review, concrete automated/live evidence, owner visual acceptance and fix/re-review cycles. Require scrum-master size review at PORT-18A and split any story exceeding two focused engineering days before implementation. Reviews are future acceptance gates, not reviews claimed to have happened now.
- Delivery: Planning changes only in plan.md and this log. No runtime or art changes, story completion, commit or push are authorized by this request; preserve unrelated local work.

## DEC-083 — Center the television between the window and coffee table

- Date: 2026-09-18
- Authorization: The owner requested a presentation adjustment, with enough floor space to move in front of and behind the television.
- Decision: Move the TV's room-local interaction/art center from (5, 5) to (9.5, 4). The tile-point half-cell offset puts its rendered center exactly at the horizontal midpoint of the 20-tile room; its world-pixel center is now (192, 136). The current backdrop was visually inspected to choose the window/table gap.
- Decision: Preserve the 44.8px artwork height, interaction radius, record-player position, walls, player collider and temporarily disabled table/couch collisions. The interaction target moves with the image. Do not implement deferred depth sorting or new furniture footprints in this presentation change.
- Verification: 144 working-tree tests in 19 files, typecheck, production build and whitespace checks pass. Regressions cover the new rendered/interaction coordinates and 16px-wide foot-strip clearance across floor lanes at room-local y=4.5 and y=6.25. Fractional interactable placement is handled by the existing grid reachability test. Existing bundle-size warning remains.
- Review boundary: Asset/layout inspection and automated checks completed; no new live-browser visual approval is claimed. Keep the presentation adjustment local for owner review; no commit or push performed. Unfinished PORT-09A changes and deferred planning remain preserved.

## DEC-084 — Deliver TV placement and deferred layering plan

- Date: 2026-09-18
- Authorization: The owner requested "push the changes", authorizing delivery of the TV placement follow-up and deferred layering plan.
- Decision: Commit the approved presentation changes, their regressions and planning records. Exclude unfinished PORT-09A tests/notes and unrelated style-file edits. The nine future layering stories remain Deferred; this delivery does not implement or complete them.
- Verification: Run tests, typecheck and build against a scoped staged snapshot before pushing. No additional live-browser verification is claimed.
- Result: Scoped verification caught the original mobile TV test assuming spawn remained in range. Updated its fixture to use the current data-defined TV location without including the pending vinyl tests. All 139 scoped tests in 19 files, typecheck and build now pass; existing bundle-size warning remains.

## DEC-085 — Verify and deliver pending PORT-09A regressions

- Date: 2026-09-18
- Authorization: The owner requested running the tests and pushing changes when successful. This explicitly authorizes delivery of the pending tested PORT-09A changes before dedicated live-browser verification is finished; it does not establish that verification or story completion.
- Verification: `npm test` passes all 144 tests in 19 files; `npm run typecheck`, `npm run build` and `git diff --check` pass. The existing Vite large-bundle warning remains unchanged.
- Decision: Deliver only PORT-09A proximity/dialog tests and associated plan/changelog/decision records. Preserve unrelated plan-review wording and style-file relocation locally. Keep PORT-09A In progress pending the dedicated live browser approach/dialog-cycle checks; no new browser results are claimed.

## DEC-086 — Complete PORT-09A live-browser verification

- Date: 2026-09-18
- Authorization: The owner requested completion of the remaining tests and confirmed Chrome was idle. Prior successful-test push authorization and the story delivery workflow remain applicable.
- Environment: Chrome, local Vite preview at http://127.0.0.1:5174/, existing application code unchanged. Port 5173 was already occupied; started a separate preview without stopping the existing server.
- Desktop evidence: approached vinyl from the left, right, below and above. The proximity prompt cleared at outside-right/below/above points and returned on re-entry. Native E opened Music collection; Escape/F and Close repeated the flow and restored game-shell focus. Bounded arrow-key event holds moved back to the TV, native F opened Games and movies, and moving back restored the vinyl target.
- Mobile evidence: 390×844 portrait and 844×390 landscape rendered Recently listened and Personal comments dummy sections. Native pointer taps on the actual Interact button opened Music collection in both orientations. Repeated landscape close/reopen after a native left D-pad drag succeeded; the player moved from approximately x=18.6 to x=18.0 and released. Final DOM inspection reported viewport [844,390], dialogOpen=false, focus=game-shell, pressed=0 and disabledDirections=false.
- Test boundary: sustained approach movement used console-dispatched keyboard events with bounded keyup timers; native keyboard and pointer interactions covered the dialog and mobile control path. Pointer targeting initially missed because of automation coordinate mapping. Temporary read-only event/rectangle diagnostics identified the true hit coordinates and confirmed BUTTON mobile-interact pointerdown/click events. No application fix or synthetic replacement of those pointer events was used. Emulation does not certify physical touch devices or native OS interruption handling; existing automated cancellation/reset tests remain the evidence for those contracts.
- Console observations: one missing favicon.ico 404; no application exceptions during the tested flows. Existing production bundle-size warning remains. Title/intro placeholder text was not changed as part of this story.
- Cleanup: removed diagnostic listeners, disabled device emulation, restored Fit to window emulation scale and the original 110% browser zoom, closed DevTools and reloaded the desktop preview to clear helpers and reset spawn.
- Final automated verification: all 144 tests in 19 files, typecheck, production build and whitespace checks pass. Deliver the evidence, then mark PORT-09A Done after successful push. Preserve unrelated plan wording and style-file changes.
- Delivery result: browser evidence commit `3e1919a` pushed successfully to `origin/master`, following implementation/test commit `52fda6f`. Marked PORT-09A Done; next required story is PORT-09B.

## DEC-087 — Add bookcase reading interaction

- Date: 2026-09-18
- Authorization: The owner requested an interactable bookcase for recently read books. Add PORT-09A1 before gym work to track this explicit scope addition; do not start the deferred object-layering stories.
- Content: Add data-only `src/content/books.ts` with stable ID livingroom-books and clearly labeled title/author and reading-note placeholders. Do not invent personal books or reading history.
- Placement: Room-local (14.5, 4), 1.5-tile range, on the front-left edge of the painted bookcase. Keep the existing vinyl approach from above selectable; retain nearest-target behavior and unchanged TV/vinyl positions.
- Rendering: Add optional generic artworkInBackground metadata. Skip a duplicate sprite only when the room background is loaded; otherwise draw the standard furniture placeholder. No new image, collision body, occlusion or bookcase-specific core logic.
- Verification: 149 tests in 19 files, typecheck and production build pass, including bookcase/TV/vinyl selection, repeated keyboard/mobile dialog contracts, data-only content and background/fallback rendering. Existing bundle-size warning remains. Browser verification requested while preserving unrelated local edits.
- Browser result: owner made Chrome available. The preview at 127.0.0.1:5173 showed the bookcase prompt at player position approximately (16.5, 8.0), with the original painted shelf and no duplicate object. Native F and on-screen Interact opened Recently read books; both placeholder sections were visible. Escape and Close restored game-shell focus. Movement to vinyl changed the prompt and native E opened Music collection. Sustained walking used bounded console-dispatched keyboard events; dialog actions used native UI automation in the existing narrow responsive browser window. Reload cleared helpers and reset spawn; no physical-device certification claimed.
- Delivery decision: Verification satisfies PORT-09A1. Follow the standing completed-story commit/push workflow, preserving unrelated plan-review wording and style-file changes. Mark Done only after successful push.
- Delivery result: `158ec6e` (`PORT-09A1: add bookcase recent-reading interaction`) pushed successfully to `origin/master`. Marked PORT-09A1 Done; PORT-09B remains next.

## DEC-088 — Separate vinyl and bookcase interaction ranges

- Date: 2026-09-18
- Authorization: The owner requested moving the record player farther right and slightly reducing its interaction radius to avoid intersecting the bookcase range.
- Decision: Move vinyl from room-local (16, 6) to (17, 6), one tile / 16 world pixels right. Reduce its radius from 2 to 1.5 tiles (32px to 24px, a 25% reduction). Leave the bookcase, sprite sizes and collision geometry unchanged.
- Geometry: Center separation is sqrt(2.5² + 2²), approximately 3.202 tiles, greater than the combined 3-tile radii; the circles have a positive gap of approximately 3.225 world pixels.
- Verification: Add a no-overlap regression and update vinyl approach/boundary checks for its new position and 1.5-tile radius. Keep this presentation follow-up local for owner preview; no additional live-browser check, commit or push is claimed.
- Results: 150 tests in 19 files, typecheck, production build and whitespace checks pass. Existing bundle-size warning remains.

## DEC-089 — Fit the bookcase collision and center its hotspot

- Date: 2026-09-18
- Authorization: The owner requested tight collision at the bookcase bottom and an interaction circle centered horizontally and vertically on its artwork.
- Artwork mapping: Inspected the 1499×1049 room background rendered at 320×224 world pixels. Approximate shelf bounds map to x=217..287px and bottom y=73px; the visual center is approximately (252, 44).
- Collision: Keep the existing upper wall ending at room y=64px. Add only the 70×9px extension below it, room-local rectangle (13.5625, 4, 4.375, 0.5625), so the player's 1px foot strip stops with its soles approximately 1px below the painted shelf feet. Table/couch collisions remain disabled; no full-sprite collision or rendering-layer change.
- Hotspot: Move bookcase interaction from (14.5, 4) to (15.25, 2.25), accounting for the tile-center offset. Its 1.5-tile radius remains reachable from the floor at the base and stays separate from the vinyl range. Do not require an artwork-centered target itself to occupy walkable floor.
- Validation: Permit positive finite fractional collision dimensions while preserving integer room/doorway constraints and finite in-bounds coordinates. The previous integer-only collision rule would reject pixel-aligned bases; add explicit fractional acceptance and zero/negative/NaN/infinite rejection tests.
- Verification: Update reachability checks to sample quarter-tile foot-strip paths and reachable interaction ranges instead of requiring the target center to be traversable. Add base/contact geometry, centered-circle and boundary regressions. Browser focus was on an unrelated page, so no new live-browser collision result is claimed. Keep this and the vinyl adjustment local for preview; no commit or push.
- Results: 156 tests in 19 files, typecheck, production build and whitespace checks pass. Existing bundle-size warning remains.

## DEC-090 — Approve and deliver bookcase/vinyl refinements

- Date: 2026-09-18
- Authorization: The owner said "looks good, push the changes", accepting the placement/collision preview and authorizing delivery of DEC-088/089.
- Decision: Commit the approved geometry, validation and regression changes with their plan/changelog records under PORT-09A1. Preserve unrelated plan-review wording and style-file edits. Owner visual acceptance completes the pending review; no additional agent-performed live-browser check is claimed.

## DEC-091 — Separate gym artwork and equipment under PORT-09B

- Date: 2026-09-20
- Authorization: Owner requested gym artwork from utils/style_gym.md, separate front/back/left/right equipment views, room integration, and explicitly no push. Owner confirmed only the squat rack is interactive and approved tight floor-contact collisions for equipment.
- Scope: One architectural background with window, posters and mats; six separate equipment assets (squat rack with barbell, bench, dumbbell rack, steel plates, coloured bumper plates, boombox), four views each. Reuse current door connections; preserve an open central path. Other equipment is decorative, with no fabricated content or controls.
- Implementation direction: Extend generic room data with optional decorative sprites; keep physics rectangles separate from artwork, use the existing personal-records dialog, and leave deferred depth-sorting/occlusion stories untouched. Expand PORT-09B presentation scope to include requested artwork.
- Delivery: Keep all changes local, preserve unrelated owner edits, and do not mark the story Done until verification and owner acceptance. No commit or push authorized in this work session.
- Artwork revision: Owner clarified that mats should cover most of the central floor as well as the equipment areas. Use a contiguous rubber-mat field with a narrow wooden perimeter/thresholds; correct the generated left passage and bottom opening before integration.
- Follow-up art direction: Owner requested some uncovered spots and an amateur DIY installation. Keep majority mat coverage but use uneven/staggered sections, mismatched wear and scattered exposed wooden patches; these remain cosmetic, not new obstacles.
- Equipment revisions: Owner clarified that the bench should stay approximately human-length but be lower to the ground: shorten the legs/frame height, not the seat length. Owner also requested different dumbbell sizes representing different weights, with matched pairs sharing one consistent design. Apply those revisions before generating the other views. Remove the boombox's generated backdrop so equipment can overlay the floor cleanly.
- Dumbbell correction: Owner identified mismatched plate counts on the largest pair. Require three matching plates at both ends of each largest dumbbell, and identical construction within the pair; recheck dependent directional views.
- Steel plate correction: Owner requested simpler plain cast-iron plates without grip cutouts; retain central barbell holes, raised rims and worn cast-metal finish.
- Plate reference: Owner supplied a photograph of a classic ribbed BARBELL 20KGS/44LBS cast-iron plate. Use its solid disc, hub, rim, ribs and cast markings as shape inspiration, not photographic texture. Update all four views to this design.
- Squat rack views: Owner clarified that the squat rack needs four additional diagonal views and noted broken side-view bar perspective. Keep cardinal views, repair the side projections and add front-left/front-right/back-left/back-right. No additional dumbbell-rack views requested.
- Plate-view scope reduction: Owner requested front only for plates. Keep one front view each for cast-iron and bumper stacks; superseded side/rear drafts are not runtime assets. Final target is25images: room1, squat rack8, bench4, dumbbell rack4, boombox4, plate stacks2.
- Cast-iron quantity: Owner requested four plates instead of three. Retain the reference-inspired ribbed design and front-only deliverable, with four countable stacked rims.
- Dumbbell side-view consistency: Owner explicitly requested correcting side views to match front plate counts, without changing the front. Treat the current front as immutable reference, retain eight dumbbells/four per tier with the same matched pairs, sizes and balanced plate counts, and verify its checksum after side-only regeneration.
- Rejected side iterations: Side edits and front-referenced oblique rebuilds still fail exact dumbbell consistency; owner rejected them. Current left/right images are unapproved drafts and are not loaded by the room. Do not describe these views as verified or the story as complete. The front remains byte-for-byte unchanged, SHA-256 `45ef01e457c2f84effbd0e0992efac23ea26e7f1d82229f829e1418c6429bb7e`.
- Revised owner request: Keep the front, generate four additional dumbbell-rack diagonal POVs first, then left/right, with exact consistency. Independent image generation has repeatedly changed counts/geometry. Pause additional generations and request approval for a shared-geometry modelling/rendering approach instead of claiming a 100% consistency guarantee from another independent image attempt.
- Verification boundary: Local room integration has passed 175 tests in21files, typecheck and production build (existing bundle warning). Subsequent alternate-image revisions still require final inventory/build recheck. No live browser verification or owner acceptance of the gym is claimed. No commit or push.

## DEC-092 — Use the selected gym composition

- Date: 2026-09-20
- Authorization: Owner selected the "clumsy" gym floor, two coloured plate piles, one plain/cast-iron pile, front dumbbell rack, front boombox and front-right squat rack. Proceed with this existing artwork; no new generation or 3D modelling. Park the alternate dumbbell-view work without treating the rejected views as accepted.
- Composition: Retain the current uneven DIY-mat background and low bench. Add a second coloured-stack instance two tiles left of the first, sharing its texture and scale with a distinct decoration ID and footprint. Keep one four-plate cast-iron stack. The existing front dumbbell image remains untouched.
- Physics: Replace the front squat-rack footprints with nine small stepped rectangles approximating the front-right artwork's diagonal feet and lower crossmember. Preserve its interaction centre, size, personal-records content and open foot space, and keep both door routes reachable. Other equipment stays decorative.
- Delivery: Update PORT-09B progress and changelog. No commit/push and no claim of completed browser/owner acceptance.
- Verification: 176 tests in21files, typecheck, production build and whitespace checks pass. Coverage includes exact selected assets/counts, decorative fallback rendering, both-door foot-width reachability, rack interaction access and base alignment. Existing bundle-size warning remains. The front dumbbell SHA-256 is unchanged from DEC-091. Live visual/mobile preview remains pending.

## DEC-093 — Rearrange gym racks and share music through the boombox

- Date: 2026-09-20
- Authorization: Owner requested swapping rack positions, reducing the dumbbell rack by 50%, placing the boombox under the window and giving it the vinyl player's interaction.
- Placement: Swap rack centers exactly (dumbbells left, squat rack right). Interpret 50% smaller as half the rendered width and height, preserving aspect ratio and the original image. Center the boombox on the floor beneath the window at room-local (7.5, 4).
- Physics: Translate squat-rack footprints with its artwork, scale the dumbbell footprint about its artwork center and translate the boombox base. Preserve both doorway routes and walkable space between squat-rack feet.
- Interaction: Promote the existing boombox sprite from decoration to interactable. Reuse livingroom-vinyl content and the generic dialog/input lifecycle, with a boombox-specific prompt and the vinyl player's 1.5-tile radius. No duplicate content, audio behavior or room-specific handler is introduced. This supersedes the earlier squat-rack-only interaction scope.
- Verification: 178 tests across 21 files, typecheck, production build and whitespace checks pass. Tests cover placement/scale, base alignment, reachable rack/boombox approaches, shared content references and repeated keyboard/mobile dialog cycles. Existing bundle-size warning remains. Live browser visual acceptance is pending, not claimed.
- Delivery: PORT-09B remains in progress. Updated plan and changelog; no commit or push.

## DEC-094 — Enable living-room furniture bottom collisions

- Date: 2026-09-20
- Authorization: Owner requested bottom collisions for the vinyl player, sofa, coffee table and TV after the gym rearrangement. This supersedes the temporary disabled sofa/table collision decision.
- Implementation: Add four thin room-local floor-contact bands. Match the painted sofa/table feet in the 1499×1049 backdrop stretched to 320×224 world pixels. Match the standalone TV cabinet and vinyl stand bases at their existing 2.8-tile display height, accounting for transparent padding. TV controllers remain cosmetic; do not block the full sprite bounds or introduce deferred depth sorting.
- Verification: 182 tests across 21 files, typecheck and production build pass. New foot-strip checks cover solid contact, clear floor immediately below each base and base alignment within one world pixel. Existing flood-fill checks verify spawn-to-door and interaction reachability; both TV approach lanes remain clear. Existing build chunk-size warning remains. Live browser visual acceptance is pending.
- Delivery: Record this requested follow-up with the current local PORT-09B work. No artwork changes, commit or push; the story remains in progress pending preview acceptance.

## DEC-095 — Move dumbbells and boombox closer to the gym wall

- Date: 2026-09-20
- Authorization: Owner requested moving the dumbbell rack farther left and nearer the wall, moving the boombox nearer the wall, and verifying both collisions.
- Placement: Move dumbbells 1.5 tiles left and one tile up to (2, 2.5); move boombox one tile up to (7.5, 3). Keep artwork, scale and music content unchanged. Translate each bottom footprint by the same offset; both bases remain below the back-wall floor line. The rack's narrow left-wall gap is not a player passage; its front and right remain accessible.
- Verification: 184 tests across 21 files, typecheck and production build pass. Coverage includes moved base contact, clear floor immediately below, right-side clearance, expected left-wall restriction, both-door navigation, reachable approaches and boombox selection at collision contact. Existing chunk-size warning remains. Live visual/browser acceptance is pending.
- Delivery: Update plan and changelog; keep PORT-09B in progress and all changes local without committing or pushing.

## DEC-096 — Resize the gym bench independently on both axes

- Date: 2026-09-20
- Authorization: Owner requested half the current bench height and two-thirds its length.
- Decision: Interpret this as displayed sprite dimensions: height 3.75 → 1.875 tiles, width two-thirds of the original 1330:1182 image's displayed width. Preserve its center and original image. Add optional validated displayWidthTiles alongside displayHeightTiles so the generic renderer supports independent dimensions; all other artwork retains proportional scaling and missing-art fallbacks remain unchanged.
- Collision: Apply the same horizontal two-thirds and vertical one-half transform to the bench base about its existing center. The new bottom is y=9.6875 tiles, within one world pixel of the visible feet; remove blocking at the old base.
- Verification: 190 tests across 21 files, typecheck and production build pass. Coverage includes exact dimensions, rendering/fallback, width validation, base contact and navigation. Existing chunk-size warning remains. Live preview acceptance is pending.
- Delivery: Update plan/changelog; no commit or push, PORT-09B remains in progress.

## DEC-097 — Triple dumbbell and boombox collision heights

- Date: 2026-09-20
- Authorization: Owner requested three times the collision height for the dumbbell rack and boombox.
- Decision: Expand both rectangles upward, preserving widths and bottom edges aligned with the feet. Dumbbells: height 0.15625 → 0.46875 tiles, top y=3.5. Boombox: height 0.1875 → 0.5625 tiles, top y=3.625. Artwork, positions, scales and interaction settings remain unchanged.
- Verification: 190 tests across 21 files, typecheck and production build pass. Tests check the expanded upper area blocks, bottom contact stays aligned, approaches/doorways stay reachable and boombox activation still works. Existing bundle-size warning remains; live preview acceptance pending.
- Delivery: Updated plan/changelog. No commit or push; PORT-09B remains in progress.

## DEC-098 — Verify gym blockers with the real Arcade solver

- Date: 2026-09-20
- Authorization: Owner requested checking dumbbell rack, boombox and bench collisions and preventing walking through them.
- Evidence: Added headless tests using the installed Phaser Arcade World, Body and StaticBody implementations, actual authored rectangles, the player's 16×1px foot body and current 144px/s speed. Sustained movement from four directions at 15/30/60/120 render FPS reproduced bench penetration in eight vertical cases; dumbbell rack and boombox passed all 32 cases. Earlier geometry-only checks did not exercise separation and missed this defect.
- Fix: Increase only the bench collision depth from 3px to 6px upward (top y=9.3125, height=0.375 tiles). Preserve its bottom, width and artwork. No changes needed to the other two footprints. Upper artwork overlap remains intentional under bottom-only collision semantics; this is not an occlusion implementation.
- Verification: All 48 real-solver cases now reach contact and remain on the approach side during sustained movement. Full suite: 238 tests across 22 files; typecheck and build pass, existing chunk-size warning remains. Navigation/contact regressions still pass. These are headless engine tests, not live browser acceptance.
- Delivery: Update plan/changelog, leave PORT-09B in progress pending visual acceptance. No commit or push.

## DEC-099 — Generate a boxing-bag sprite from the owner prompt

- Date: 2026-09-20
- Authorization: Owner requested generating a gym boxing bag using utils/style_bbag.md in the established style; no placement or interaction requested.
- Direction: One standalone front three-quarter orthographic sprite: battered black bag with red ends and patches, chain suspension, worn steel stand with X-shaped base, dense 1990s arcade pixel rendering. Used the imagegen skill and built-in generator; preserved the source prompt and saved the exact normalized generation prompt alongside the asset.
- Delivery: Saved public/assets/sprites/gym-boxing-bag/front-three-quarter.png (1024×1536). Inspected the generated design and confirmed transparent pixels through read-only PNG alpha inspection. Pending owner visual approval; not preloaded, placed or given collisions. No code changes, commit or push.

## DEC-100 — Place the boxing bag and relocate the bench

- Date: 2026-09-20
- Authorization: Owner requested bench placement next to steel plates and the boxing bag in the bottom-left corner, at 125% of the player sprite height.
- Placement: Move bench to (9, 7.125), left of the cast-iron pile at (12.125, 7.125), retaining its reduced dimensions and moving its verified 6px collision base with it. Add boxing bag as decoration at (2.5, 9.25). Reuse the optional texture pipeline and fallback; no new interaction.
- Scale: Use PLAYER_DISPLAY_HEIGHT (51px), not the 32px physics anchor, giving the bag a 63.75px full-image height (3.984375 tiles), preserving its aspect ratio. Transparent image padding remains intact.
- Collision: Add a 7px-deep stand-base band ending at y=11.6875 tiles, within one world pixel of its visible bottom. Leave bottom doorway and central route clear; retain existing bottom-only collision semantics rather than blocking the entire hanging bag image.
- Verification: 256 tests across 22 files, typecheck and production build pass. Includes asset inventory, exact scale/placement, base alignment, foot-width navigation and 64 real Arcade collision cases including the moved bench and new stand. Existing bundle-size warning remains; live browser visual acceptance pending.
- Delivery: Updated plan/changelog/provenance. No commit or push; PORT-09B remains in progress.

## DEC-101 — PORT-09B acceptance and authorized delivery

- Date: 2026-09-20
- Authorization: Owner approved the final visuals and requested browser checks followed by push if tests pass, superseding earlier no-push instructions for this story.
- Verification: All 256 tests, typecheck, production build and whitespace checks pass. Separate headless Chrome development/production runs pass desktop 1280×900 and touch-emulated portrait 390×844 / landscape 844×390 checks. Real keyboard/touch navigation, four equipment bases, repeated five-object dialogs, exact dialog titles, input reset and zero uncaught runtime exceptions verified. Production screenshots inspected. Evidence and method limitations: output/qa/port09b/verification.md.
- Driver corrections: Native Escape key codes and scrolling rotated mobile controls into view were necessary for reliable browser automation; corrected driver and reran both complete suites. No app changes were needed for these harness issues. Physical-device testing is not claimed.
- Scope: Reconcile story wording with selected runtime art; park unapproved alternate dumbbell generation. Preserve unrelated owner's plan-review wording and style-file reorganization outside the story commit. Include gym/boxing-bag prompts needed for provenance.
- Delivery: Ready for story-ID commit and authorized push. Mark Done only after successful delivery; record the resulting commit below.
- Delivered: `9b1428a` (`PORT-09B: deliver gym artwork, interactions and verified collisions`) successfully pushed to origin/master on 2026-09-20. Mark PORT-09B Done and publish the completion record. Unrelated owner plan wording and style reorganization remain unstaged in the working tree.

## DEC-102 — Office artwork samples from style_office.md

- Date: 2026-09-24
- Authorization: Owner requested office artwork from utils/style_office.md, matching previous styling. This is generation/review scope, not authorization to implement or close PORT-09C.
- Direction: Use the imagegen skill and built-in generator for five separate assets: architectural background with rug/framed degree; standing desk with laptop, two additional monitors, keyboard, mouse and chair; bookcase; sleeping generic border collie with bed; toy-sized humanoid robot. Preserve existing 20×10 office ratio and top-centre doorway. Warm plaster/wood office palette and elevated orthographic arcade-pixel style. One view per object at this review stage; source prompt unchanged.
- Scope boundary: Record prompt intent for workstation CV and shared bookcase reading dialog; do not wire them yet. Dog-photo interaction is explicitly future work. No invented degree credentials or real-pet likeness. Robot remains art-only with no assumed interaction.
- Delivery: Room sample in public/assets/backgrounds/office/; object PNGs in per-object public/assets/sprites/office-* folders. Exact prompts saved in output/imagegen/office-assets.prompt.md. Original generated files retained. Visually inspected five outputs; final room arrangement, sprite scaling, collisions and alpha-edge appearance require integration review. No code changes, commit or push.

## DEC-103 — Office scale, fewer plants and multi-view art review

- Date: 2026-09-24
- Authorization: Owner requested avatar-proportional room details, fewer plants, multiple consistent object viewpoints, an additional seated robot and correction of the rear desk's chair placement.
- Room: Save sample-v2.png with exactly two plants; preserve initial sample. Prompt relates 320×160 room to the player's 51px displayed frame height, not its 32px physics anchor. Runtime proportionality still needs integration review.
- Views: Generate rear/left/right candidates for workstation, bookcase, dog bed and standing robot, each conditioned on its unchanged original image. Add seated robot as a separate pose. Correct rear desk camera/occlusion: chair remains on far user-facing side behind the desk from the rear viewpoint, never moves toward camera merely to remain visible.
- QA: Reject initial rear desk image for near-side chair; corrected candidate saved as back.png. Dog-bed side angles/fabric and workstation side geometry fail strict consistency and are saved explicitly as review candidates, not approved rotations. Other views preserve broad identities but fine geometry/detail is not certified exact. Record limitations and reference hashes in output/imagegen/office-views-review.md. All four reference hashes unchanged.
- Delivery: Exact prompts and all chosen/review candidates saved in workspace object folders. PORT-09C remains artwork review only; no integration, commit or push.

## DEC-113 — Triple the dialog text reveal speed

- Date: 2026-09-24
- Authorization: Owner requested text scrolling three times faster; interpreted as the active typewriter reveal, not mouse/touch scrolling.
- Change: Triple glyphs revealed per unchanged 22ms tick, from about 45 to 136 glyphs/second. Long-content completion cap drops from six to two seconds. Preserve grapheme handling, layout, skip and reduced-motion behavior.
- Verification: Add exact three-tick timing regression and update grapheme/long-content tests. Local PORT-09C-B adjustment; no commit/push.
- Result: All 391 tests, typecheck/build and whitespace checks pass; existing bundle warning unchanged. No fresh browser run needed for the batch-size-only adjustment.

## DEC-112 — FF7-inspired dialogs and safe typewriter reveal

- Date: 2026-09-24
- Authorization: Owner supplied <owner-supplied-reference>/final_fantasy_dialog.css as a visual reference, then chose gradient, overlapping title box and typewriter animation with clipping addressed. Treat reference comments as styling context, not independent instructions.
- Presentation: Blue diagonal gradient, silver/white inset bevels, white shadowed monospace text and overlapping name tab; native dialog remains the modal primitive. Flexible viewport-constrained body scrolls; title wraps; no fixed width or nowrap reveal.
- Animation: Paragraphs/list items reveal at grapheme boundaries with full layout reserved and complete screen-reader text. Titles, links and photographs remain immediate. Show all works with keyboard/touch; reduced-motion is observed initially and live. Close/destroy/replacement cancels timers and restores text. Long content accelerates to finish in six seconds; no blinking cursor added.
- Scope: New intermediate PORT-09C-B before kitchen work. Shared DOM/CSS only; no Phaser changes. No new assets or font dependency. Preserve unrelated owner edits; no commit/push.
- Verification: Five lifecycle/grapheme/reduced-motion/timing unit checks added; 390 tests and build pass. Browser driver extended for skip, live reduced-motion and long-content overflow; final evidence recorded after reruns.
- Final verification: Development and production suites passed desktop, portrait and landscape with zero uncaught exceptions. Long-content fixtures wrap/scroll, native Show all and reduced-motion changes finish the reveal, and the dog photo remains uncropped. Screenshots inspected; evidence in output/qa/port09c/ff-dialogs.md. Awaiting owner visual approval, no push.

## DEC-111 — Dog picture placeholder interaction

- Date: 2026-09-24
- Authorization: Owner requested an interactable on the existing dog that opens a same-style dialog containing only a generated dummy picture. This supersedes the decorative-dog choice for this local follow-up, not the completed delivery history.
- Content: Generate a fictional border collie photograph with the built-in imagegen tool. Save public/assets/photos/dog/placeholder.png and exact prompt output/imagegen/office-dog-photo.prompt.md. Clearly identify it as a placeholder in dialog title and alt text; no claim of real-pet likeness.
- Implementation: Promote the existing dog sprite to an interactable without moving or resizing it or its collision base. Radius 1.25 tiles. Add optional image metadata to the existing content-to-dialog boundary, base-path-aware URL resolution, responsive uncropped rendering and a failed-image message. Reuse normal dialog controls, movement gating and focus restoration; no custom dog-specific UI branch.
- Verification: 385 tests and typecheck/build pass. Extended isolated browser driver checks dog photo load, image-only body, fallback, repeated E/F/touch opening and no image left behind in other dialogs. Final browser evidence recorded separately.
- Delivery: Local PORT-09C follow-up pending owner review; no commit or push. Original PORT-09C delivery remains Done.
- Final verification: development and production desktop/portrait/landscape suites passed, including photo load/fallback/cleanup and all existing office checks; screenshots visually inspected. Evidence: output/qa/port09c/dog-followup.md.
- Follow-up delivery authorization: Owner requested pushing these changes. Repeat final tests/build/diff checks, commit only the dog follow-up and QA evidence, and preserve unrelated owner edits. Record successful delivery below.
- Delivered: b1e5841 successfully pushed to origin/master on 2026-09-24. Dog follow-up complete; final 385 tests/typecheck/build/whitespace checks passed. Unrelated plan wording and style reorganization remain local.

## DEC-110 — Accept and deliver PORT-09C

- Date: 2026-09-24
- Authorization: Owner approved pushing the completed story after the remaining-work summary. Treat this as visual acceptance and retain the dog as decoration, within the existing scope; no new dog dialog or photograph.
- Verification: 384 automated tests, TypeScript/build and development/production desktop and touch-emulated portrait/landscape checks passed, including the aligned corridor. Final test/build/diff review repeated before commit. Existing bundle-size warning and generic diagnostic outlines remain unchanged.
- Scope: Include office art iterations, prompts, source office brief, implementation, tests and QA evidence. Preserve unrelated owner plan-review wording and style-file reorganization unstaged. No independent-review claim.
- Delivery: Authorized PORT-09C commit and push to origin/master; record successful delivery before marking Done.
- Delivered: Implementation commit 1403d5f successfully pushed to origin/master on 2026-09-24. Mark PORT-09C Done and publish the completion record. Unrelated owner plan wording and style-file reorganization remain unstaged.

## DEC-109 — Center the office entrance on the living-room corridor

- Date: 2026-09-24
- Issue: The corridor and living-room exit were centered at world x=12, but the narrowed office and its doorway were centered at x=12.5.
- Fix: Shift the entire office origin from x=4 to x=3.5 (8 world pixels left). Keep artwork, local furniture positions, collision bands and corridor unchanged. The narrower office entrance now has symmetric shoulders beneath the wider corridor.
- Contract: Allow finite non-negative fractional room origins for precise placement; integer room dimensions, corridor geometry and local doorway metadata remain enforced. Reject negative/non-finite origins as before.
- Verification: Add regression assertions that both doorway centers and the office collision passage center equal the corridor center. Update browser fixtures for the shifted room and rerun checks. No commit/push; PORT-09C remains in progress.

## DEC-108 — Integrate office layout and existing content interactions

- Date: 2026-09-24
- Authorization: Owner requested furniture placement and interactables: right-facing desk on left wall, front dog below, adjacent bookcase, sofa/table center-right and both robots south of sofa. No push authorization.
- Layout: Use background v5 in a 17×10 room at (4,22). Preserve the existing corridor and narrow the office doorway metadata to local x=7..10, with painted jamb collisions x=7.125..9.875. Use a separate typed office data module; no office branches added to rendering, physics or interaction systems.
- Art: Use workstation left-review.png because its working side faces screen-right; filenames refer to camera viewpoints. Other selected art is unchanged. Prior directional consistency limitations remain, pending owner acceptance. Seven sprites use the generic optional asset/fallback pipeline and independent floor-contact collision bands, including small plant-pot bands in the backdrop.
- Content: Register dummy CV with DialogManager; office bookcase reuses livingroom-books. Sofa, table and robots decorative. Asked whether the dog should open a placeholder dialog; retain decoration while awaiting the answer and defer real-photo behavior. No PDF feature added.
- QA: Automated office navigation, ordering, assets and fallback tests added. Existing Arcade solver tests now also cover all seven office bases from four directions at 15/30/60/120 FPS. Browser tests caught and fixed missing CV dialog registration. Test details and remaining limitations are in output/qa/port09c/verification.md.
- Delivery: Update plan and changelog; keep PORT-09C in progress pending owner visual acceptance. No commit or push; preserve unrelated owner edits.

## DEC-107 — Shorten office horizontally

- Date: 2026-09-24
- Authorization: Owner requested a room a bit smaller lengthwise. Interpret length as the long horizontal axis; choose approximately 15% reduction for review.
- Direction: Generate sample-v5 with about 1.7:1 proportions instead of 2:1, maintaining vertical extent and avoiding global horizontal squashing. Retain four plants, two overlapping rugs and central entrance. Existing separate furniture assets unchanged.
- Verification: Visually inspected full room, retained plants and overlapping rugs. Exact world scale and entrance width remain integration checks, not guarantees from image generation.
- Delivery: Preserve v4; save exact prompt in output/imagegen/office-background-v5.prompt.md. During implementation, reconcile room footprint, corridor connection and collisions with the narrower art rather than stretching it to 20x10 tiles. No runtime changes, commit or push.

## DEC-106 — Casual overlapping office rugs

- Date: 2026-09-24
- Authorization: Owner requested replacing the single carpet with two casual carpets overlapping centrally and covering most of the floor.
- Direction: Edit background v3 with a large cream striped rug and a sage/ochre woven rug, slightly angled and overlapping in the middle. Keep narrow wood borders, existing architecture and all four plants. These are two distinct carpets within the background, not separate movable sprites.
- Delivery: Built-in image generation; visually inspected sample-v4.png for two rugs, central overlap and broad floor coverage. Previous versions preserved; exact prompt in output/imagegen/office-background-v4.prompt.md. No runtime integration, commit or push.

## DEC-105 — Separate office sofa and coffee table artwork

- Date: 2026-09-24
- Authorization: Owner requested a left-facing sofa and coffee table for the office.
- Direction: Generate a compact olive fabric two-seat sofa, backrest screen-right and open seating front screen-left, plus a separate low walnut coffee table aligned with its length. Use office sample-v3 as style reference, not a background to modify. Preserve existing artwork.
- Delivery: Built-in image generation; visually inspected left-facing silhouette and separate table. Saved per-object PNGs and exact prompts in output/imagegen/office-seating.prompt.md. Runtime sizing, alpha-edge appearance, placement and collision review remain for implementation. No interactions assumed; no integration, commit or push.

## DEC-104 — Add two plants to the office background

- Date: 2026-09-24
- Authorization: Owner requested a couple more plants, suggesting a large monstera.
- Direction: Add a large monstera at the upper-left wall and a smaller potted plant at bottom-right, retaining the existing two plants. Keep the central doorway and furniture space clear.
- Delivery: Generated and visually inspected sample-v3.png using the built-in image generator; four plants total. Previous versions preserved. Exact prompt in output/imagegen/office-background-v3.prompt.md. Artwork review only; no runtime changes, commit or push.
