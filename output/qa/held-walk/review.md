# Sustained keyboard walking — DEC-197 / PORT-21C follow-up

Date: 2026-10-01. Owner visually accepted the fix and authorized commit/push after verification and independent review.

## Reproduction and cause

`scripts/verify-held-walk-browser.mjs` sends initial keydown, waits 350ms, then
30 real CDP auto-repeat keydowns at approximately 30ms intervals before keyup.
Each of the eight movement keys reproduced 29 gait resets and only frame 0
after repeat started. Recorded travel was approximately 72–77px in that interval.
Baseline assertion failed as expected; `before/results.json` preserves all cases.

PORT-21 introduced unconditional manual-intent notification on every movement
keydown. The navigation subscriber calls cancel(), which calls Player.stop(),
zeroing velocity and selecting idle/resetting phase. OS repeat repeatedly invokes
this path even without an active route. Earlier browser checks used one keydown
and a delayed keyup, missing keyboard auto-repeat entirely.

## Minimal correction

Notify only if the logical keyboard direction is not already held. Do not simply
ignore event.repeat: after blur/modal/reset the held set is empty, so the first
observed repeated key must still cancel any new automatic route. Existing new
and opposing directions, explicit interaction, pointer input and lifecycle reset
notifications remain unchanged. No changes to art, gait math, speed or collision.

## Verification

- Full suite: 2,093 tests in 52 files passed; typecheck and production build passed.
- Existing bundle-size advisory only; whitespace check passed.
- Development and production: eight keys each, zero gait discontinuities,
  all eight phase slots visited, correct idle facing after release, no exceptions.
  Repeated-interval travel approximately 142–154px (144px/s configured speed unchanged).
- Production normal-collision click navigation: 12 routes passed.
- Production mobile/control layout and input: 13 records passed, including held
  touch capability removal. No recorded runtime exceptions in either suite.
- Evidence folders: `before`, `development`, `production`, `navigation`, `mobile`.

The sustained-gait fixture disables furniture collision only in its isolated tab
to avoid treating a wall stop as an animation freeze; world bounds remain active.
The tab is closed after testing. Click-navigation regression retains real collisions.
No physical-device or live-site acceptance is claimed. Owner subsequently accepted the preview and authorized delivery.

## Independent review

Singer (senior engineer, read-only) approved the fix and test design with no blocking
findings, ran 59 focused tests plus syntax/whitespace checks, and inspected baseline
and development evidence. Review confirmed repeat-after-reset and lifecycle
cancellation behavior. Final production/navigation/mobile evidence inspection also
approved with no runtime blockers; reviewer did not rerun browser sessions or the
full suite (those were run by the implementation agent). Reviewer flagged ambiguous
plan wording about owner acceptance; corrected to explicitly pending. Review file
was being created concurrently with that final inspection and is now present.
