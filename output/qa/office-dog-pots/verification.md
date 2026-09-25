# Dog bed and three plant pots — focused collision QA

**Development and production PASS: 27 focused records each, zero exceptions. CDP9333 released to main.** Production build is `index-w3JcrfXq.js`. Main separately reports the full final **1,881 tests/42 files and build PASS**; this QA agent did not independently execute that full suite. No broad-story matrix or plant-perspective acceptance is claimed. Plants remain baked into the background; resized collision rectangles do not provide independent artwork sorting. Plant extraction approval is pending; no art work was started.

## Exact scope

The historical 80-body baseline remains immutable. Expected current geometry applies only the approved desk-post deletion, earlier sofa/table resizes, dog replacement/move, and three pot replacements. The entire resulting **79-body multiset** is checked. New authored values are checked exactly; Arcade center-to-edge rounding is reproduced for fractional physics rectangles. Cyan outline edges match all actual bodies to 1e-9px.

- Dog: local position `(2.5,7.625)`, anchor `(3,8.8125)`, footprint `(1.8484375,7.4921875,2.321875,1.3234375)`. World box `(85.575,439.875,37.15,21.175)`, bottom 461.05 and sort plane 461. No other dog fields change. South wall starts at 466, leaving 4.95px of floor.
- Top-right pot: local `(15.375,3.0625,.875,.9375)`, world `(302,369,14,15)`; bottom 384. Its upper section intentionally overlaps the north wall.
- Bottom-left pot: local `(.625,7.9375,.875,.8125)`, world `(66,447,14,13)`; bottom 460.
- Bottom-right pot: local `(15.5,7.9375,.875,.8125)`, world `(304,447,14,13)`; bottom 460.

## Focused checks per environment

27 records: one geometry/bounds check, six dog cardinal pushes, five real keyboard routes, three dog depth captures, six pot contacts, three pot captures and three photo interactions. Each contact holds input for 850ms, verifies the expected collision edge and monitors every static body for penetration.

- Dog north/south/east contacts at 144 and 72px/s. The enlarged bottom-left pot makes the dog's west midpoint inaccessible: only 5.575px between pot and dog for 16px-wide feet. No west traversal/contact is falsely claimed on this final layout. The earlier dog-only development run's west result predates the pot change and is superseded for that approach.
- Desk-to-dog gap route `(74,433) → (142,433) → (142,450) → (134,450)` runs both directions at both speeds. Per-postupdate checks enforce no penetration, correct depth and observed walk/idle animation.
- East-to-front route `(134,450) → (134,464) → (104,464)` reaches the photo interaction on clear floor. E/F/Enter each open the dog-photo dialog, load an image, disable gameplay while open, and close via Escape. Photo activation is tested from the front, not falsely claimed from the east outside the interaction radius.
- Dog behind/east/front captures verify sole-based ordering and retain cyan bounds; screenshots wait for two postrender events. Development behind capture was visually inspected.
- Top-right pot west/south contacts; lower pots north/south contacts, at 144px/s. No rear path through the upper wall or approach through neighboring obstacles is claimed.

Desktop browser only. No touch/mobile/fallback matrix was requested or rerun. Previous sofa/table focused QA remains separately recorded; its collision resizes are included in the exact current geometry check. No runtime/tests/plan/log edits or push by this QA agent.

## Reviewed snapshot

```text
c606d9c604fdfcf99840389a05a60ad4fab32ef2a57d7762568edcd66efa293a  scripts/verify-office-dog-pots-browser.mjs
32628a0b518810a30b2a987a271a34eceae0c97fac8ee2a7d9a5d29e707d08e6  src/game/data/office.ts
70887e5b23278aa19998db6b73f9d2ebde3470f08e79345ceea440de97ea55e2  dist/assets/index-w3JcrfXq.js
```

Evidence is in each environment's `results.json` and corresponding cyan-bound PNGs. Plant artwork extraction/perspective, if authorized, requires separate evidence and is not implemented here.
