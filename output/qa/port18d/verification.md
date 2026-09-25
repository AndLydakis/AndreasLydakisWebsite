# PORT-18D — object-owned footprints

Local implementation, 2026-09-25. No commit/push. No artwork, placement, size,
interaction radius, speed, wall, corridor or footprint-shape changes.

## Implementation and automated verification

`getRoomLocalCollisionRects` is the shared collector for room solids and optional
object footprints. Physics, spawn validation, quick travel, fallback graphics,
renderer previews and debug outlines use combined geometry. Missing textures and
depth order never enable/disable solids. Compound pieces and counts are preserved.
Pilot bases moved atomically to their owners, removing the old room copies:

| Object | Room-local rectangle x, y, width, height |
|---|---|
| TV | 9, 5.25, 2, 0.3125 |
| Vinyl | 16.375, 7.4375, 2.25, 0.3125 |
| Globe | 3.375, 7.75, 1.25, 0.375 |

- 926 tests across 34 files pass; typecheck and production build pass. Existing
  bundle-size warning remains. Scoped diff check passes.
- Exact complete world-collision multiset equals the retained PORT-18A baseline,
  including multiplicity. Every pilot base appears once; all four destinations
  resolve identically. Synthetic decorative compound offsets, empty/omitted
  footprints, missing-art blockers and spawn rejection are covered.
- 96 new actual Arcade cases cover cardinal and diagonal approaches at four frame
  rates, in addition to existing house/corridor regressions.

## Browser checks

Isolated Chrome CDP9333; no owner browser use. Development and production:

```sh
node scripts/verify-port18d-browser.mjs http://127.0.0.1:5173
node scripts/verify-port18d-browser.mjs http://127.0.0.1:4173
node scripts/verify-quick-travel-browser.mjs http://127.0.0.1:5173 9333 output/qa/port18d/quick-travel-development
node scripts/verify-quick-travel-browser.mjs http://127.0.0.1:4173 9333 output/qa/port18d/quick-travel-production
node scripts/verify-globe-gallery-browser.mjs http://127.0.0.1:5173 9333 output/qa/port18d/gallery-development
node scripts/verify-globe-gallery-browser.mjs http://127.0.0.1:4173 9333 output/qa/port18d/gallery-production
```

The focused harness compares combined room geometry with the baseline, records
80 live static bodies, checks debug on/off without physics changes, desktop and
portrait/landscape keyboard/touch interactions for all three pilots, and normal/
half-speed contacts. Synthetic object-owned geometry blocks real `travelTo('cv')`
without movement, with and without TV art; restart rebuilds identical geometry.
Quick travel additionally covers 320px width, focus/input reset and modal guards.
Gallery regression covers scroll/close/reopen and missing-image fallback fixtures.
Evidence is emulation, not physical-device testing.

## Review

Lorentz authored tests and independently reviewed main-agent runtime/harness;
Ramanujan independently reviewed runtime/tests and ran 670 targeted tests.
Both approved runtime, but requested removing an incorrect harness exclusion:
vinyl's right side is reachable through the east doorway, not blocked by a
continuous wall. The corrected harness includes that approach at both speeds;
final development and production reruns pass, including all four sides at both
speeds. All six browser commands above pass with zero uncaught exceptions. No
product-code change was needed. Both reviewers confirm final technical approval:
each build records 24 contacts (3 pilots × 4 sides × 2 speeds), 9 interactions,
2 rejected travel checks, 80 original bodies and zero exceptions. Vinyl-right
contact is exactly x330px. No remaining technical findings.

Approved runtime SHA256 prefixes: collector `4d3ed55a07c12f29`, layout
`3afaeba3a2009494`, validation `5e0b249137c94059`, renderer `00a0700dc030a14d`,
debug `179d26cb5e30fb49`. No reviewer claims independent live browser testing.

## Next sequence / delivery

Owner-approved priority: couch 19A/19B, table 19C/19C1, then gym 18E. Original
18A footprint placement approval and 18C visual acceptance are retained because
geometry is exactly unchanged; the owner may still verify the local preview.
No pushes, no couch/table runtime switch before the corresponding art approval.
