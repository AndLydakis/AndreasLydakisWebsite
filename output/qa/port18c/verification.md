# PORT-18C verification — local, awaiting owner acceptance

Date: 2026-09-25. Base commit: `6c11c11`. No commit/push authorized until owner
manual verification. This story is **In review**, not Done.

## Scope and implementation

- One scene-owned registry for separate decorations and interactables; no new
  room/asset/content-specific sorting branches. World sole/ground Y, object before
  player at equality, then Unicode code-point `(roomId, spriteId)` order.
- Bounded depths strictly in `(3,4)`; unconverted furniture at 2; world diagnostics
  at 8 and screen diagnostics at 9. Diagnostics are disabled in production even
  if explicitly requested, and share a development toggle.
- Pilot anchors only: TV `(10,5.5625)`, vinyl `(17.5,7.75)`, globe `(4,8.125)`.
  Existing placements, dimensions, collisions and interaction radii are unchanged.
  The remaining separate assets await their individual metadata-adoption stories.
- Public Arcade `preUpdate(false,0)` applies foot offsets/history without stepping
  simulation. Visible art, depth and camera synchronize before destination render;
  teleports reset walk distance, including short jumps. Missing art sorts through
  its actual placeholder. Scene shutdown releases registry/listener references.

## Automated and browser evidence

`npm test`: **815 tests across 33 files pass**. `npm run build`: typecheck and
production build pass; existing large-bundle warning remains. Scoped diff check
passes. Unrelated owner style edits and plan-review wording were preserved.

Final run: **all six browser commands below pass**. Both depth result files contain
37 records, including six first-destination-render measurements and the synthetic
overlap rank reversal; both recordings exist. Both report zero uncaught exceptions,
with stable two POST_UPDATE listeners and one WORLD_STEP listener across normal
restarts. The technical review condition is met; only owner visual acceptance remains.

Commands (isolated Chrome on CDP9333; not the owner's active browser):

```sh
node scripts/verify-port18c-browser.mjs http://127.0.0.1:5173
node scripts/verify-port18c-browser.mjs http://127.0.0.1:4173
node scripts/verify-quick-travel-browser.mjs http://127.0.0.1:5173 9333 output/qa/port18c/quick-travel-development
node scripts/verify-quick-travel-browser.mjs http://127.0.0.1:4173 9333 output/qa/port18c/quick-travel-production
node scripts/verify-globe-gallery-browser.mjs http://127.0.0.1:5173 9333 output/qa/port18c/gallery-development
node scripts/verify-globe-gallery-browser.mjs http://127.0.0.1:4173 9333 output/qa/port18c/gallery-production
```

The depth harness records normal/half-speed forward and reverse left-side routes
around every pilot, idle front/behind screenshots, exact-tie assertions, and
portrait/landscape snapshots. It compares collision rectangles and every object's
placement/radius to the PORT-18A baseline. `development/results.json` and
`production/results.json` record assertions, with `pilot-routes.webm` recordings.
It also exercises immediate paused-physics travel, first destination render,
pre-first-frame scene-ready state, repeated restart/listener counts, synthetic
office/gym fixtures sharing local IDs, an overlapping travel destination that
reverses rank, absent optional player/TV art, and full game destruction.

Quick-travel regression covers desktop, portrait, landscape and 320px width:
all destinations twice, pointer/keyboard/touch, feet/camera alignment, input reset,
modal guards, focus and overflow. Gallery regression covers desktop/portrait/
landscape scrolling, close/focus, existing dialogs and four-sided globe collisions.
Empty/single/150-image lists and image-error fallback are development-only fixtures.
These are browser emulation,
not physical-device tests.

Visual inspection: desktop TV hides the lower player when behind; globe renders
behind the player when in front. Portrait vinyl and landscape globe hide the
covered pixels without hiding the uncovered head/shoulders. Screenshots supplement
state assertions; the owner still needs to judge live motion and the globe's
conservative 2.22px gap between substantial-alpha feet and the approved sort plane.

## Review and corrections

Senior software engineer Lorentz and senior game developer Ramanujan independently
requested two corrections: scene shutdown touched already-disposed camera/group
resources, and JS string comparison was UTF-16 rather than Unicode code-point
order. Both were fixed and re-reviewed. Source approval received from both;
Lorentz independently passed 584 targeted tests/typecheck, Ramanujan 47 targeted
tests. Both also independently passed the final 24 renderer tests and reviewed
representative screenshots and result artifacts. Both approve technical handoff
conditional on the final evidence run and owner live acceptance. The game reviewer
requested persisting first-destination-render measurements rather than merely
asserting them; the harness now includes those records. Neither review is
represented as independent live browser testing.

Approved runtime SHA-256 snapshot (unchanged after source re-review):

```text
DepthRegistry.ts f4c58396645ce6cc04c50f0a93d6438cf02ff45129c88a23678eb4229bb7d57c
houseRenderer.ts 2758f78c48f093e16543b994fb92cefbe02aa98e9282a601ff3b0f6f2c68ff9b
Player.ts 6079a765ac464665637fe4aa97dc2d4be3cb9b1d7e8eb08ec4d94f53026a6786
PlayerVisual.ts 63c3bbd106590de62f42eed374585375ca1d6b90597b7330a8cc203a33a0fab7
HouseScene.ts 4ca62d9a417e6d98bf7a936cd64ad3ad1cdf7d39c091b3e722a77f19c7c760cc
CollisionSystem.ts 96d54d64ad919916477da3968065f32553055a89202ef89b5dc35a5d25f57e3f
DebugOverlay.ts 14031a89794321777c244b57ef82f7e6094b32bd7be268233309fd5d32cae259
houseLayout.ts 7e3aed196fece47b38a06e477803e97143fd13e03defebf7d5c7e810ebc3cfe5
```

Harness repairs, not product regressions: CDP cannot serialize a returned Phaser
scene/world, so action expressions explicitly return void; missing-art tests must
suppress preload on restart or the deliberately removed texture is reloaded.

## Owner checklist / remaining gate

1. Refresh preview, choose **Media**, and circle the TV, vinyl player and globe
   using their left-side paths. Walk behind, in front, and back again.
2. Confirm only overlapping player pixels are hidden behind each object; in front
   the player draws over it, without animation/depth flicker.
3. Try quick travel and the globe gallery. Other furniture still uses its prior
   rendering behavior until its adoption story.
4. Approve the visible result before story closure, commit or push.

No asset generation, art resizing, collision migration or additional adoption was
performed. PORT-18D has not started.
