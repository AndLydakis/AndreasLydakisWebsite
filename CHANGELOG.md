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

### Delivery workflow

- Future story completion entries will include the story ID, a concise change summary, and the verification commands run.
