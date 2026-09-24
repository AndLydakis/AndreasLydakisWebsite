# PORT-09C-B — FF7-inspired dialogs

## Final delivery verification — 2026-09-24 (DEC-117)

Owner requested delivery. Final 520 tests, typecheck/build and whitespace checks pass. Full development and production browser suites pass in desktop, portrait and landscape emulation with the tripled reveal speed, current workstation footprint and office spawn. Startup position, camera visibility, immediate movement, all three office dialogs, Show all/reduced motion, long-content clipping, photo fallback and collision checks pass without uncaught exceptions. Commit/push in progress. Historical local-review results follow.

Reference: owner-supplied `<owner-supplied-reference>/final_fantasy_dialog.css`. Owner selected gradient, overlapping title tab and typewriter animation. Local implementation; no commit/push.

## Implementation

- Shared native dialog now uses a blue gradient and silver inset bevels, white shadowed Courier text and title tab. Existing close/focus/gameplay behavior retained.
- Body wraps and scrolls within dynamic viewport height. Unlike the reference's single-line width animation, glyph visibility reserves full text layout. No horizontal text crop or blinking cursor.
- Paragraphs and list items reveal at grapheme boundaries, now ~136 glyphs/sec (DEC-113, three times the initial rate), accelerating long content to complete within two seconds. Headings, links, photos and fallback messages are immediate. Earlier browser results below precede this timing-only change.
- Show all is a native keyboard/touch button. Focus returns to Close before the button is hidden. Reduced motion skips animation, including changes while open. Closing, replacing or destroying a dialog clears its timer.
- Full text is available immediately in a visually hidden span; animated duplicates are aria-hidden. Screen-reader behavior follows this DOM contract but has not been tested with a physical assistive-technology setup.

## Verification

- 390 tests across 25 files passed, including five new lifecycle, grapheme, reduced-motion and duration tests.
- TypeScript check and production build passed; existing bundle-size warning remains. Whitespace check passed.
- Development desktop 1280×900 and touch-emulated portrait 390×844 / landscape 844×390 suite passed. Checked E/F, touch, native keyboard Show all, live reduced motion, hidden-glyph cleanup, close focus, long titles/unbroken text, overflow/scrolling, photo loading/fallback, room traversal and collisions.
- Browser harness fixes: native Enter requires the char event in addition to key events; repeated long-content fixture is isolated in an IIFE. No product fix was needed for those harness errors.
- Desktop/portrait/landscape CV screenshots visually inspected; landscape scrolls the body while keeping its title and controls visible. Evidence lives in development/*-ff-dialog.png and production/*-ff-dialog.png beside existing dog-dialog captures.
- Production desktop/portrait/landscape suite also passed with zero uncaught browser exceptions. Production landscape photo visually inspected: complete image visible and controls within viewport. Owner visual acceptance remains pending; no independent-review or physical-phone claim.
