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

### Delivery workflow

- Future story completion entries will include the story ID, a concise change summary, and the verification commands run.
