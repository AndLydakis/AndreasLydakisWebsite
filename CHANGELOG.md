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

### Delivery workflow

- Future story completion entries will include the story ID, a concise change summary, and the verification commands run.
