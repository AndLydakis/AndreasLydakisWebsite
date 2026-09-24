# Workstation collision follow-up — DEC-114

## Final delivery verification — 2026-09-24 (DEC-117)

Owner requested delivery. Current DEC-115 chair footprint and DEC-116 office spawn pass 520 tests, production build and full development/production browser suites (desktop/portrait/landscape emulation). Office startup is visible and permits movement; chair backrest remains passable while the visible rear support blocks. No uncaught browser exceptions. Commit/push in progress; earlier local-review notes below are historical.

## DEC-115 revision (current)

- Replaced chair silhouette with wheel footprint and visible rear-leg/support rectangles. Desk outline and visible rear support retained. Combined bottom band narrowed to the desk foot; raised seat/backrest are non-solid. No depth sorting added.
- 520 tests pass across 25 files, including reachable positions behind raised chair art and blocked rear leg. Fewer rectangles reduce generated physics cases by 32. Typecheck and build pass; existing bundle-size warning remains.
- Production-preview browser checks pass in isolated Chrome at desktop, portrait and landscape dimensions: sustained movement crosses the former backrest collider and stops against the visible rear leg; existing bases, office interactions and keyboard/touch controls pass without uncaught exceptions. Mobile checks are emulation, not physical-device testing. Earlier evidence below describes DEC-114, not this revision.
- No commit/push; visual acceptance pending.

## DEC-114 historical verification

- Scope: room-data stepped desk/tabletop and chair outline, excluding monitor-only pixels; existing base band retained. Separate coffee table and artwork unchanged.
- Automated: 552 tests pass across 25 files. Outline hit/miss samples, monitor exclusion, 16×1px foot-strip navigation to desk/bookcase/dog and actual Arcade collision checks in four directions at four frame rates.
- Build: typecheck and production build pass; pre-existing large-bundle warning remains.
- Browser: isolated headless Chrome checks pass on development (5173) and production preview (4173), at desktop 1280×900, portrait 390×844 and landscape 844×390. Actual sustained movement stops at the chair's right edge above the old base band; all seven bases, corridor traversal, three office dialogs, keyboard/touch controls and dialog cleanup pass with no uncaught exceptions. This is mobile emulation, not physical-device testing. Inspected development desktop collision-overlay screenshot against the desk/chair artwork.
- Owner check: approach the chair from the right and desk from below; feet should stop at the furniture outline. Confirm desk interaction is reachable. Monitor artwork is not an extra obstacle, although the room wall behind it remains solid.
- No commit/push; awaiting visual acceptance.
