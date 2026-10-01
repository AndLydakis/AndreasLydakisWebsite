# PORT-22 verification and independent review — 2026-10-01

Owner authorized story creation, implementation, testing, verification and push.
Implementation complete; final independent review approved before delivery.

## Implementation and review loop

1. Live diagnosis: mouse-only desktop controls hidden at 1440px, visible at 850px.
   Existing OR-width query dates to initial implementation, not the latest deployment.
2. Replace control-row and landscape-rail conditions with coarse-pointer capability
   guards. CSS owns layout, including automatic resize/capability updates.
3. Independent senior engineer Lagrange reviewed CSS/policy and approved the source,
   requesting browser evidence including held-touch capability removal.
4. Added that check; it reproduced hidden controls with held movement still active.
5. Add minimal MobileControls media-query listener to reset held pointers on loss
   of coarse capability and unregister on teardown. Add unit coverage for multiple
   pointers/capture/styles, no resumption on restoration, and listener cleanup.
6. Rerun full tests, build and both browser matrices. Lagrange inspected final
   implementation, tests and saved results and explicitly approved with no blockers.
   Reviewer did not rerun tests/browser sessions; no independent rerun is claimed.

## Results

- 2,084 tests across 52 files passed; TypeScript and production build passed.
- Existing bundle-size advisory remains; no build failure. Whitespace check passed.
- Development and production: 13 records each, zero captured runtime exceptions.
- Mouse-only viewport sizes: 1440x900, 897x900, 896x900, 850x900, 844x390, 390x844;
  controls hidden, no reserved row/rail, canvas fills shell, keyboard press/release works.
- Touch: 390x844, 844x390, 320x740, 1440x900; controls visible outside canvas,
  targets at least 44px, real touch press/release works and landscape rail is preserved.
- Capability changes both ways without reload and held-touch removal pass. Actual
  media-query results checked rather than assuming touch emulation implied capability.
- Production click-to-move: 12 routes/324 moving samples passed, correct facing,
  settled endpoints and zero captured exceptions. Source: `navigation-production/results.json`.
- Matrix evidence: `development/results.json`, `production/results.json`.

## Limits and maintenance

Chrome emulation, not physical-phone or hybrid-device certification. Hybrid policy
is justified by standard any-pointer semantics; simultaneous fine/coarse physical
hardware was not tested. Width-only zoom consequences covered through CSS viewport
sizes, not a physical browser zoom UI test. No live deployment success is claimed.

Maintenance: `docs/mobile-controls.md`. Reproduce with
`node scripts/verify-mobile-controls-browser.mjs [URL]`; use `QA_OUTPUT_DIR` for
separate output folders and an isolated Chrome endpoint on port 9333.
