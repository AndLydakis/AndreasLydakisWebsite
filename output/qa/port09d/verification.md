# PORT-09D fitted kitchen — DEC-121 local review

## DEC-123 corridor boundary fix

- Root cause: getAllCollisionRects omitted corridors entirely. Only room walls and the distant world perimeter were solid.
- Fix: derive exterior corridor wall strips and subtract every room/corridor floor, preserving entrance and junction space with fractional origins supported.
- Automated: 738 tests pass, including 512 actual Arcade solver cases (96 new cases for six corridor walls, four directions and four frame rates), geometry integration, floor non-overlap and a branch-junction fixture. Typecheck/build and diff whitespace checks pass; existing bundle-size warning unchanged.
- Browser: PASS development (5173) and production preview (4173) at desktop 1280x900, portrait 390x844 and landscape 844x390. Expanded scripts/verify-port09d-browser.mjs pushes against both exposed sides and traverses both end seams of all three corridors at each viewport, then repeats kitchen interaction, furniture and mobile-control checks. No uncaught exceptions. This final run also covers the DEC-122 table collision adjustment.
- No layout or artwork changes. No physical-device or independent-review claim. No commit/push.

## Earlier kitchen verification

DEC-122 follow-up: main table collision extended upward by 0.5 tiles (8 world pixels), bottom and lower chair bands unchanged. All 640 tests, typecheck, build and diff whitespace checks pass, including a new bounds/blocked-strip regression and existing Arcade solver coverage. Browser checks/screenshots below predate this collision-only adjustment and were not repeated.

- Current assets: fitted background sample-v3 (cutting board, knife block, sink/bowl/stove and fridge/cupboards baked in) plus one transparent front-v1 dining set with four tucked chairs. No duplicate fixture sprites. Removed unused named-sheet-frame infrastructure.
- Alignment: painted jambs local x=7.5625..9.875, kitchen origin x=27.28125; exact center world x=36 equals gym corridor center. The four-tile corridor intentionally leads into a narrower painted doorway. Tile doorway metadata contains the precise collision opening.
- Physics: solid fixed-cabinet footprints, fridge base, stepped dining lower footprint and painted wall limits. Player-foot-width flood fill verifies both interactions and routes around the dining area.
- Automated: 639 tests pass across 26 files. Includes 416 real Arcade solver cases across kitchen/gym/office at four directions and four frame rates, painted doorway alignment/jamb assertions, fallback rendering, keyboard/mobile dialog cycles and content registration. Lower count than DEC-119 reflects two fewer kitchen collision rectangles and removal of two obsolete sheet-frame tests, plus one new entrance test.
- Typecheck and production build pass. Existing large-JavaScript-bundle warning remains. git diff --check passes.
- Development browser: PASS desktop 1280x900, portrait 390x844, landscape 844x390. Verified actual fitted-image request, dining texture, corridor entry/exit with real keyboard events, E/F or touch opening both dialogs twice, read-only shopping content, movement disabled/restored around dialogs, exposed furniture bases, left counter side approach and mobile d-pad. No uncaught exceptions.
- Production browser: PASS all the same checks at desktop, portrait and landscape sizes, with no uncaught exceptions. Reproducible driver: node scripts/verify-port09d-browser.mjs http://127.0.0.1:4173 9333.
- Harness correction: Phaser's loaded image can have a blob URL, so asset-version verification inspects the resource request instead of expecting a file URL on the texture image. This was a test assertion issue, not missing artwork.
- Visual review: inspected development/production desktop kitchen, production portrait kitchen and landscape shopping dialog screenshots. Confirmed centered painted passage, one dining group, fitted left/right fixtures, collision overlay placement and visible mobile controls/dialog content. Screenshots capture full page, including scrollable content in landscape.
- Cleanup: ten superseded kitchen PNGs moved outside public assets to /private/tmp/port09d-superseded-assets.mY1jk8 for temporary recovery. Generator originals remain outside the repository. Historical prompts are retained with superseded notices.
- Limitations: physical-device and independent reviewer checks not performed. Perspective/depth sorting remains deferred. Office remains the starting room. Owner final visual acceptance and story delivery are pending; no commit or push.

Earlier DEC-119 results applied to the rejected separate-object arrangement and are not evidence for this layout. Final screenshots in development/ and production/ replace that earlier run.
