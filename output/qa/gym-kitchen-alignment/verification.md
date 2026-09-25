# PORT-18D1 — gym/kitchen entrance alignment

2026-09-25; local only, no push. Owner requested alignment to both painted
entrances and authorized moving the kitchen. No textures were changed.

## Measured correction

The 1341×1173 gym backdrop renders at256×224 world pixels. Its south jambs
correspond approximately to local x103..174px; old collision/corridor edges were
x112..176px. The new gym wall gap and corridor use the measured edges directly.

- Gym stays at(25,4) tiles.
- Gym gap6.4375..10.875 local tiles; shared centerworld33.65625.
- Corridor origin(31.4375,18), size4.4375×2 tiles.
- Kitchen origin(24.9375,20), shifted left0.34375 tiles =5.5 world pixels.
- Kitchen-local contents, furniture dimensions/collisions and painted entrance
  7.5625..9.875 stay unchanged. The narrower kitchen entrance is centered on the
  wider gym passage, rather than silently changing either artwork.

`gymKitchenConnection.ts` owns the measured edges, gym origin and shared center.
Corridor validation now accepts finite nonnegative fractional origins and positive
finite dimensions; doorway metadata retains containing integer envelopes. Physics
and wood-floor rendering already support these exact coordinates.

## Verification

- **936 tests across34files pass**, including alignment, continuous clear foot
  path, side containment, invalid/nonfinite corridor values, and translated Food
  Log destination. Existing actual Arcade collision tests also pass.
- Typecheck/build and scoped diff checks pass. Existing bundle-size warning remains.
- Development and production corridor/kitchen checks pass desktop1280×900,
  portrait390×844 and landscape844×390: every corridor side blocks movement,
  all end seams traverse both ways, both kitchen dialogs open/close twice,
  furniture bases and controls pass, zero uncaught exceptions.
- Quick-travel regression covers desktop, portrait, landscape and320px width,
  including Food Log's translated landing, camera/input/focus and modal guards.
  Both development and production quick-travel runs pass all four viewports with
  zero uncaught exceptions. All commands below completed successfully.
- Inspected clean production `desktop-gym-kitchen-connection.png`: corridor edges
  meet gym jambs and both entrances share one centerline. Mobile screenshots also
  retained. These are emulation checks, not physical-device claims.

Commands:

```sh
npm test
npm run build
QA_OUTPUT_DIR=output/qa/gym-kitchen-alignment/development node scripts/verify-port09d-browser.mjs http://127.0.0.1:5173 9333
QA_OUTPUT_DIR=output/qa/gym-kitchen-alignment/production node scripts/verify-port09d-browser.mjs http://127.0.0.1:4173 9333
node scripts/verify-quick-travel-browser.mjs http://127.0.0.1:5173 9333 output/qa/gym-kitchen-alignment/quick-travel-development
node scripts/verify-quick-travel-browser.mjs http://127.0.0.1:4173 9333 output/qa/gym-kitchen-alignment/quick-travel-production
```

## Review and baseline scope

Lorentz authored five test-file changes and independently passed936tests/typecheck.
Ramanujan approved source, tests and screenshots, independently passing52targeted
tests. His final production quick-travel condition is met by the successful run
recorded above. Neither claims independent live testing. Owner visual acceptance
remains outstanding; no commit/push.

This owner-authorized alignment intentionally changes gym lower walls, corridor
walls and kitchen world placement. It does not invalidate the completed18D pilot
ownership proof: that regression now applies the current living-room migration
to the retained18A historical layout, comparing the full collision multiset there.
Current pilot ownership tests remain; new alignment tests cover the intentional
nonpilot delta. Historical18A/18C/18D screenshot/geometry fixtures retain their old
placement and are not represented as the new whole-house baseline.

Couch art package remains pending owner acceptance; no couch/table integration
or other story work was included in this correction.
