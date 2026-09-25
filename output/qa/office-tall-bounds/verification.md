# Office sofa/table tall bounds — focused QA

**Development and production PASS: 27 focused records each, zero exceptions. CDP9333 released to main; safe to perform the deferred comment-only edit.** This report covers only the two approved tall colliders, not the pending broader story matrix. No runtime/test/plan edits or push by this agent.

The immutable 80-body baseline is transformed by the previously approved desk-post deletion plus exactly two replacements. Current count remains **79**. All other bodies compare exactly. Local footprint values, original asset/position/scale fields, fixed bottom edges and unchanged ground anchors are asserted.

| Object | World x / width | World top / height (approx.) | Fixed bottom / sort plane |
| --- | --- | --- | --- |
| Sofa | 262 / 30 | 388.003333 / 46.996667 | 435 |
| Coffee table | 217 / 22 | 397.056667 / 33.943333 | 431 |

Heights use the approved formulas `4.6*(1226/1536)*.8` and `3.4*(1198/1536)*.8` in tiles. Runtime metadata is checked exactly against these formulas. Arcade's center-to-top construction introduces one-ULP rounding for the table: expected physics edges reproduce that construction; graphics/physics outline comparisons round to 1e-9px. The first failure file records the superseded harness roundoff assertion, not a physics or geometry regression.

Per environment: **27 records**, consisting of geometry/bounds verification, 16 sustained cardinal pushes (two objects × four sides × speeds 144/72), four real keyboard bypass sequences (144 forward, 72 reverse per object), and six front/behind/midbody-side captures. Each push holds input for 850ms, verifies exact target-edge contact and monitors all static bodies for penetration throughout. Left/right approaches are at the midpoint of the new tall box, not the old floor band. Route checks require no penetration, correct sole-based ordering and observed walk/idle animations.

Routes use the actual clear floor: sofa passes along the narrow gap between sofa/table; table uses its left bypass. Front poses at Y443 (sofa) and Y440 (table) put player ahead of their unchanged planes. Behind poses are above each enlarged top. Screenshots wait for two actual postrender events. Cyan bounds remain visible with diagnostics disabled, and their commands are checked against all 79 actual colliders. Development midbody-side screenshot was visually inspected; both tall cyan boxes are visible.

Evidence: completed `development/results.json` and `production/results.json`, plus six `*-cyan.png` captures per environment. Production table-front capture was also visually inspected, showing the tall cyan bounds and player in front. Desktop only; no mobile, missing-art, interaction or broad-story matrix is claimed for this focused request. Main separately reports full **1,779 tests/42 files and build PASS**, alpha-height PNG tests and independent source review; those are not tests independently executed by this QA agent.

Production build: `index-DDyF0Ke-.js`. The stale room-level comment is awaiting main's safe post-QA edit; a comment-only follow-up changes no tested behavior.

```text
e853ada13d7e1cc305d15cbc861134b44382fbf7b9a6ba0b945ff22aa97ce4f8  scripts/verify-office-tall-bounds-browser.mjs
bf064e38404ce71503bc22aba7f6cc995e24d32c886bcc5b3fbf621d0acfb988  src/game/data/office.ts
a6e28c1e6244ee0988e1d02aa9f6d41293a61a5594904efb3ab7ad0b7e72ebbc  dist/assets/index-DDyF0Ke-.js
```
