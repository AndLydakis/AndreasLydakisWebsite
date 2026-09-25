# PORT-19C1 owner-requested table bounds verification

Owner accepted the final result and authorized delivery on2026-09-25 (DEC-143).
The recorded execution/reviewer limitations below remain unchanged.

Status: **PASS for table/bounds, TV/vinyl interactions, quick travel and gallery regressions** against DEC142 runtime and production build `index-C8eMkW2t.js`. Both environments passed 114 table records plus 22 interaction cases with zero uncaught exceptions. Main completed all four additional regression runs. Owner live acceptance remains separate.

## Final results

| Environment | Table completion (UTC, 2026-09-25) | Interaction completion | Evidence |
| --- | --- | --- | --- |
| Development | 09:09:02.964 | 09:09:12.785 | [114 table records](development/results.json), [22 interactions](development/interactions-results.json) |
| Production | 09:10:25.329 | 09:10:35.309 | [114 table records](production/results.json), [22 interactions](production/interactions-results.json) |

Both runs retained 80 bodies with only the approved table expansion, exact matching collider outlines, and stable postupdate/worldstep listener counts of 2/1. All four sides and four diagonal corner approaches passed at speeds 144 and 72. North contact stopped at Y=175 and south contact at Y=199. All four passage runs kept the body at Y=204..205 with zero penetration between the table and sofa.

The QA author visually inspected [development desktop/behind](development/desktop-behind.png), [production desktop/front](production/desktop-front.png), and [production portrait/behind](production/portrait-behind.png). The three-times-taller table outline is visible and foreground ordering is preserved. Each environment includes 12 normal screenshots, 15 fallback screenshots, 22 interaction screenshots and `table-routes.webm`.

## Approved geometry exception

Historical baseline `../port19c1/preintegration-geometry.json` remains immutable. Expected geometry replaces exactly one world rectangle `(160,191,60,8)` with `(160,175,60,24)`, preserving bottom Y=199. All other rectangles remain identical and total count stays 80. The new room-local footprint is `(8,6.9375,3.75,1.5)`; ground anchor remains world `(190,199)`.

The north route now uses sole Y=168 and northern contacts start at Y=167. Side tests use Y=187; the front route remains Y=205. The 15px passage between table bottom 199 and sofa top 214 is unchanged.

## Suite coverage

- Normal/half-speed routes, all four sides and four diagonal corners at both speeds, and both-direction passage traversal.
- Desktop, portrait and landscape bounds screenshots; drawn collider rectangles must match all 80 actual physics rectangles.
- All 15 original/new/couch/table missing-art combinations, both-member fallback behavior, complete backdrop frames, restarts, listener counts and collision preservation.
- Separate 22-case TV/vinyl keyboard/touch interaction matrix; retained TV/vinyl/globe/couch sorting checks.

Contacts stop at first contact and check penetration through that point; sustained pushing is not claimed. Mobile uses browser emulation. Missing art uses texture-cache removal and restart, not network failures.

All new output belongs here; completed `output/qa/port19c1/` evidence is preserved. No runtime edits, commits or pushes.

Main executed all four additional regression runs on the final build: quick travel
in development/production at desktop, portrait, landscape and320px narrow sizes;
gallery in both environments at desktop/portrait/landscape, including native
scroll, images, close/focus, existing dialogs and four-sided globe collisions.
Development additionally passed empty/single/150-photo lists, error fallback and
scroll reset. All passed with zero uncaught exceptions. Screenshots are in
`quick-travel-{development,production}` and `gallery-{development,production}`
within this evidence folder. These are current-revision results, not prior-story
claims. Main also executed981 tests/38files and typecheck/build successfully.

Independent senior game reviewer approved the current source and final saved
development/production images, bounds and fallback results with no blockers.
This remains desktop-browser mobile emulation, not physical-device testing.

## Reproduction

```sh
node scripts/verify-port19c1-browser.mjs http://127.0.0.1:5173 9333
node scripts/verify-port19c1-browser.mjs http://127.0.0.1:4173 9333
```

## Snapshot SHA-256

```text
3a142a1c6236fe8aa8b90ab9711a565b2d63ac6112913c9aa9163cc264811fa2  scripts/verify-port19c1-browser.mjs
3a976af138a2a646516466b1468e672947e18ea6a34ed1ed3ce5865456d012b2  src/game/data/houseLayout.ts
509c9e903d5c584353d3b08393cca1373b7a604ede6107220d62cc392aa24856  src/game/rendering/houseRenderer.ts
13e2443fabf14142fa1409c2876c301522562a872b7bee5d66b2a007aaef7ad5  src/game/scenes/HouseScene.ts
e398d8f77d62ce17279bbf4da2329f45a3871a2c672a18710506a9a4b00f1623  src/app/assetManifest.ts
903f179929141bafd0157f1963effe8ae5588e9977f0b506c3c004a7ea638e9c  dist/assets/index-C8eMkW2t.js
9e8a8055c8a678c7b02b471b2e22a02fc4d6633b7fb69b11b299286d78ec8789  output/qa/port19c1/preintegration-geometry.json
55476d4405a57e2772980500bf3ff25abaa955a7eca40a4ef8eada3c7bb3c84b  output/qa/port19c1-table-bounds/development/results.json
8eaa67a084a5490a3d4e63b66ab7f3dbd3460c7ebba35f6adb92ebfb287e7cb5  output/qa/port19c1-table-bounds/development/interactions-results.json
7974b47268526d8b3d3b0d21d98bc7b3fcc31bbcb626f9924132997349c3245e  output/qa/port19c1-table-bounds/production/results.json
3bae41a9f99a2d3c04e1031c50efa9e1b61be215a151688f3aa9c436667c0342  output/qa/port19c1-table-bounds/production/interactions-results.json
```
