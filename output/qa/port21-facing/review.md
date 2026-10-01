# PORT-21C/F automatic-facing follow-up — 2026-10-01

Status: implemented and independently approved; owner requested commit/push on
2026-10-01, releasing the visual-review hold. Delivery checks rerun before commit.

## Reproduction and correction

Before the change, real click routes `(64,1)` and `(-64,1)` selected down for
all 27 moving frames, and `(64,-1)` selected up. Keyboard-style boolean facing
discarded displacement magnitude. Dominant actual-displacement facing now selects
the correct axis; a compatible-only 10% diagonal deadband avoids flicker without
retaining opposite directions. No art, speed, cadence, collision or route changes.

## Verification

- Full suite: 2,082 tests in 52 files passed; TypeScript and production build passed.
- Existing large-bundle warning remains; no new build errors.
- `git diff --check` passed.
- `scripts/verify-navigation-facing-browser.mjs` passed against development
  (5173) and built production preview (4173) using isolated Chrome tabs (9333).
- Each environment: 12 real pointer-command routes, 324 moving-frame samples,
  expected facing and animation throughout, settled endpoints and zero recorded
  runtime exceptions. Evidence: `development/results.json`, `production/results.json`.
- Helper tests cover shallow/cardinal directions, near-diagonal noise, reversals,
  tiny/stopped/nonfinite displacement. Player integration tests cover a sequence
  of shallow travel, corners, reversals and distance forwarding.
- Browser coverage here is desktop straight shallow/cardinal routes; corner
  catch-up and diagonal stability rely on automated tests and code review. No
  physical-device or live-site acceptance claimed.

## Independent review loop

1. Boole (senior engineer) approved the narrow implementation with no blockers,
   ran focused tests/typecheck and checked 2,116 additional edge combinations.
2. Ampere (senior game developer) approved with no blockers; suggested stronger
   integration coverage for corner/reversal sequences.
3. Added the real Player automatic-step sequence regression and supplied browser
   evidence to both reviewers for re-review.
4. Boole explicitly approved final code/evidence, reran 59 focused tests and
   typecheck, and independently inspected both saved browser datasets.
5. Ampere explicitly approved final code/evidence, reran 76 tests across five
   relevant suites and typecheck, and independently inspected both datasets.

Reviewers did not edit implementation. Both inspected browser results rather
than rerunning browser sessions. No unresolved blocking findings.
