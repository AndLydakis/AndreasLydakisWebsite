# Changelog

All notable project changes are recorded here. Entries are grouped under the
story that delivered them and are added before that story is committed and
pushed.

## [Unreleased]

### Historical baseline

- `PORT-00` through `PORT-03A` were completed before the per-story commit and push workflow was introduced.
- The current baseline includes the Vite/TypeScript foundation, DOM services, input tests, placeholder assets, typed content, placeholder CV PDF, and registry validation tests.

### PORT-04A — Define coordinate contracts and conversion helpers

- Added pure typed helpers for room, corridor, doorway, and world-to-pixel conversions.
- Added non-zero-origin, inverse-conversion, invalid-input, and source-room validation tests.
- Verification: `npm test` (4 files, 30 tests), `npm run typecheck`, and `npm run build`.

### PORT-04B — Author the initial house layout data

- Added the data-only 64×36-tile house layout with four rooms, three corridors, six reciprocal doorways, five interactables, and a world-global initial spawn.
- Added focused layout-shape and reference tests without Phaser or browser setup.
- Verification: `npm test` (5 files, 37 tests), `npm run typecheck`, and `npm run build`.

### PORT-04C — Add layout validation and reachability rules

- Added a pure house-layout validator and assertion helper for dimensions, bounds, overlaps, references, doorway geometry/connectivity, spawn walkability, and required-room reachability.
- Reused the existing room and content registries for interactable reference validation.
- Added intentionally broken data-only fixtures covering each validation rule.
- Verification: `npm test` (6 files, 47 tests), `npm run typecheck`, and `npm run build`.

### PORT-04D — Add comprehensive pure layout tests

- Added a dedicated pure layout-contract suite covering valid room/corridor/doorway/spawn data, invalid dimensions and origins, malformed geometry, duplicate and missing references, doorway failures, corridor spawns, required-room subsets, and the Phaser/DOM-free boundary.
- Verification: `npm test` (7 files, 60 tests), `npm run typecheck`, and `npm run build`.

### PORT-06A — Boot the Phaser runtime and lifecycle

- Added the single Phaser creation boundary and `HouseScene` lifecycle with the approved fixed resolution, FIT scaling, pixel-art rendering, zero-gravity Arcade Physics, validated camera/world bounds, and typed startup-error handling.
- Wired Phaser startup after the DOM fallback services and added teardown for the Phaser instance and application-owned subscriptions.
- Kept room rendering, player creation, movement, collisions, and public `gameReady` emission deferred to later stories.
- Verification: `npm test` (7 files, 60 tests), `npm run typecheck`, `npm run build`, and a successful local Vite HTTP smoke check.

### PORT-06B — Render the data-driven house

- Added generic Phaser graphics helpers for room floors, corridor paths, walls, doorway previews, collision previews, and world bounds from the validated `HouseLayout`.
- Configured the scene to fit the complete world in the logical camera while deferring player follow, physics bodies, movement, and interaction systems.
- Added a responsive 16:9 game-shell aspect ratio for the FIT-scaled canvas.
- Verification: `npm test` (7 files, 60 tests), `npm run typecheck`, `npm run build`, and a successful local Vite HTTP smoke check.

### PORT-06C — Load placeholders and create the player

- Added placeholder asset loading, player placement at the configured spawn, camera follow, and development diagnostics for rooms, collisions, interactable ranges, world bounds, and player position.
- Corrected `assetUrl()` to resolve the manifest and CV paths beneath `/assets/`, with regression tests for SVG and PDF paths.
- Emits `gameReady` only after required textures and the player sprite are ready; movement, collision bodies, proximity, and content events remain deferred.
- Verification: `npm test` (8 files, 62 tests), `npm run typecheck`, `npm run build`, and HTTP checks confirming all five SVG assets return successfully.

### PORT-05 — Integrate Player movement after Phaser boot

- Added the reusable player wrapper and dynamic Arcade Physics body using the existing sprite and shared `InputController`.
- Added normalized cardinal/diagonal movement, named speed, world-bound enforcement, facing state, and a minimal `PlayerState` contract for later systems.
- Added pure movement-math tests and debug-overlay facing output without adding duplicate input listeners or DOM access.
- Verification: `npm test` (9 files, 68 tests), `npm run typecheck`, and `npm run build`.

### PORT-05 follow-up — Increase player movement speed

- Increased the default `PLAYER_SPEED` from 96 to 144 pixels per second (1.5×).
- Added a regression test that locks the requested default speed.
- Verification: focused player-motion tests (7 tests) and `npm run typecheck` pass.

### PORT-07A — Add room and perimeter collision

- Added data-driven collision geometry for all room walls and four independent world-perimeter bodies.
- Added a reusable `CollisionSystem` with static Arcade bodies, player collision wiring, and idempotent scene-shutdown teardown.
- Kept corridors and doorway openings passable by creating bodies only from authored wall rectangles and the outer perimeter.
- Added pure geometry tests for room conversion, openings, perimeter construction, and combined collision geometry.
- Verification: `npm test` (10 files, 73 tests), `npm run typecheck`, `npm run build`, and `git diff --check`.

### PORT-07B — Add proximity detection and target selection

- Added a DOM-free `InteractionSystem` that converts room-local interactables into world-space targets and selects the closest valid target.
- Added radius and optional rectangular-bounds checks, deterministic tie handling, typed target-change callbacks, gameplay gating, and teardown.
- Exposed target changes through the Phaser scene/game creation boundary without leaking Phaser objects or DOM nodes.
- Added pure tests for range limits, overlaps, ties, stable availability, disabled gameplay, world conversion, and cleanup.
- Verification: `npm test` (11 files, 82 tests), `npm run typecheck`, `npm run build`, and `git diff --check`.

### PORT-07C — Add interaction commands and the game/UI bridge

- Added one-shot interaction request handling in `HouseScene`, validating requests against the active proximity target.
- Routed availability, unavailability, and content-request events through the typed `GameUiBridge`, preserving keyboard/mobile trigger sources.
- Connected the accessible prompt and mobile Interact button, with prompt text that names both keyboard `E` and mobile `Interact`.
- Added bridge routing and teardown tests while retaining the existing input-controller request tests.
- Verification: `npm test` (12 files, 84 tests), `npm run typecheck`, `npm run build`, and `git diff --check`.
- Follow-up: added `F` as an additional keyboard interaction key.

### PORT-07CA — Correct zoom-aware camera follow

- Added Phaser-free camera viewport, scroll-limit, target-centering, edge-clamping, and round-pixel helpers.
- Replaced the scene’s built-in player follow with explicit bounded camera scroll updates that remain correct at non-1 zoom.
- Added pure tests for fit zoom, zoomed-in follow, independent edge clamping, smaller worlds, non-16:9 viewports, rounding, and invalid inputs.
- Verification: `npm test` (13 files, 92 tests), `npm run typecheck`, `npm run build`, and `git diff --check`.

### PORT-07CB — Use bounded default camera zoom for expandable layouts

- Replaced fit-to-world zoom with a configurable 1× default gameplay zoom.
- Added optional camera-zoom configuration and centered constraints for smaller layouts while preserving bounded player-follow for larger layouts.
- Corrected camera tests for smaller-world centering and added camera constraint-bound coverage.
- Verification: `npm test` (13 files, 93 tests), `npm run typecheck`, `npm run build`, and `git diff --check`.

### PORT-07CC — Temporarily hide the content index from the game layout

- Hid the visible content-index box and expanded the game column to the full available experience width.
- Kept the content-index service and DOM mount available for future re-enablement.
- Updated the skip link to target the interactive house while the content index is hidden.
- Verification: `npm test` (13 files, 93 tests), `npm run typecheck`, `npm run build`, and `git diff --check`.

### PORT-07D — Add pure proximity and bridge tests

- Confirmed focused proximity coverage for range boundaries, overlapping targets, deterministic ties, stable selection, rectangular bounds, gameplay disablement, and teardown.
- Added one-shot interaction-trigger coverage and verified keyboard/mobile trigger-source forwarding through the UI bridge.
- Verified unsubscribe behavior prevents later event replay.
- Verification: `npm test` (13 files, 95 tests), `npm run typecheck`, `npm run build`, and `git diff --check`.

### PORT-08A — Complete the desktop television slice

- Registered the `livingroom-media` television content with the shared dialog manager through a generic content adapter.
- Kept the television interactable and furniture placeholder data-driven, with no room-specific game-system branches.
- Verified the prompt, `E` dialog opening, dummy game/movie/future-list content, Escape close, and focus return in the local desktop preview.
- Added adapter tests for television content and future base-path-aware dialog actions.
- Verification: `npm test` (14 files, 97 tests), `npm run typecheck`, `npm run build`, and `git diff --check`.

### PORT-08A1 — Living-room and television placeholder art

- Increased default camera zoom from 1 to 1.25 for 25% larger game artwork without changing world geometry or DOM UI. Verification: 106 tests, typecheck and build pass.
- Added the approved front/back/left/right television sprite samples and their generation/provenance records; SVG copies embed the PNG sources.
- Replaced the living-room television's generic artwork with its front-facing PNG through the optional texture manifest and existing loader.
- Added data-defined artwork height, keeping the TV at 64 world pixels tall without changing its interaction point, range, dialog, or collision data.
- Follow-up: centered the TV artwork on its interaction circle and removed the bottom-anchor override; regression coverage checks the shared center.
- Preserved generic furniture fallback if dedicated art is missing.
- Generated the living-room background sample and exact prompt, then integrated it at the owner's request using generic `visualAssetId` rendering and the optional texture manifest.
- Separated background rendering from collision previews/physics; retained generic room fallback when artwork is missing. Mapped pictured wall/furniture obstacles, aligned the gym connection and moved the record player onto open floor.
- Collision refinement: replaced the full-sprite player body with a bottom-anchored foot strip, removed the bookcase-specific obstacle, and temporarily disabled table/couch collisions. Walls and exits remain intact. Verification: 105 tests in 16 files, typecheck and production build pass; visual movement check remains pending.
- Grouped player, television and record-player art into separate sprite folders; updated loader paths, URL tests, packaging script and provenance documentation without altering existing artwork bytes.
- Final verification: 106 tests in 16 files, typecheck and production build pass; asset serving was checked successfully. The owner approved the preview and requested story closure and push on 2026-09-18. The prior folder refactor preserved all 17 moved files byte-for-byte.

### PORT-09A — Record-player artwork and content registration (in progress)

- Generated four matching views of an 1980s turntable on a wooden table with vinyl records underneath; saved PNG originals, raster-backed SVG copies, prompts and provenance.
- Integrated the front sprite through the existing optional texture manifest and generic renderer, centered on the vinyl interaction circle at 64 world pixels high.
- Connected the existing Music collection dummy content through the shared dialog adapter.
- Verification: 100 tests, typecheck, production build, successful front-asset HTTP response, and visual confirmation in the room. Full desktop/mobile interaction verification remains pending.

### Preview corrections — PORT-06B, PORT-06C, and PORT-07C follow-ups

- Updated the interaction tooltip to list `E`, `F`, `Enter`, `Space`, and the mobile `Interact` control.
- Corrected camera bound initialization after zoom so the current full-house view is centered and follow limits remain valid for larger worlds.
- Fixed the canvas layer so the Phaser canvas and startup placeholder share one absolute overlay instead of being placed in separate CSS Grid rows, preventing the preview from clipping the lower rooms.
- Rendered each interactable with its registered furniture placeholder or the generic marker fallback, scaled to fit the room preview.
- Verification: `npm test` (12 files, 84 tests), `npm run typecheck`, `npm run build`, and `git diff --check`.

### Delivery workflow

- Future story completion entries will include the story ID, a concise change summary, and the verification commands run.
