# Circular proximity and label-trigger verification

Date: 2026-09-29

## Automated gates

- `npm test`: 44 files, 1,951 tests passed.
- `npm run build`: TypeScript and Vite production build passed; the existing bundle-size advisory remains.
- `git diff --check`: passed.

Focused tests preserve the original radius boundary behavior, verify the padded label rectangle as a
second trigger, confirm the default-on visibility flag and override path, and check active/inactive
yellow label-border state.

## Isolated Chrome

Development URL: `http://127.0.0.1:5176/`

`scripts/verify-label-interaction-browser.mjs` connected only to a dedicated headless Chrome profile
and confirmed:

- all 11 interactables retain rendered circular radius commands (initially verified at depth 10;
  DEC-171 later moves the shared layer behind labels to depth 2.8);
- the radius layer is shown by the default `true` flag;
- all 11 padded nameplate rectangles select their own stable interactable ID;
- exactly the selected nameplate has its yellow highlight visible;
- the television center and just-outside-radius points retain the original pass/fail behavior;
- zero uncaught browser exceptions occurred.

`office-workstation-highlight.png` was visually inspected. The object-shaped yellow overlays from the
rejected experiment are absent, radius circles are visible, and only the active workstation nameplate
has the added yellow outer border.

Owner visual acceptance remains pending. No commit, push, production-preview, or physical-device
verification is claimed.

## Recheck after DEC-166/167

The 2026-09-29 isolated-browser recheck does **not** pass the label-interaction contract:

- 9 of 11 label rectangles select their owner at all 25 sampled interior points.
- The office workstation label selects the dog at 6 of 25 points, including the workstation label
  center after the dog's one-pixel radius increase.
- The office bookcase label selects the workstation at 8 of 25 points.
- The selector currently compares object-center distance across both label and circular candidates,
  so a neighboring object's circle can override the label whose rectangle the player entered.
- The live player uses a 32×32 anchor and a 16×1-pixel foot collider, but label activation tests only
  the anchor-center point. Visual foot contact with a label therefore does not match the trigger edge.
- Original television radius boundaries and zero uncaught browser exceptions still pass.

The feature was not verified correct at this point. This failed recheck established the regression
that DEC-168 subsequently fixes.

## DEC-168 corrected browser verification

Final automated gates: all 1,954 tests across 44 files, typecheck, production build
(`index-BnlIaT6y.js`; existing bundle-size advisory only) and whitespace checks pass.

The isolated-browser rerun passes:

- all 11 label centers select and highlight their own interactable;
- every one of 25 sampled interior points for each label selects its owner (275/275 total);
- first physical contact between the live 16×1-pixel foot collider and each label selects its owner
  (11/11), without requiring the player's anchor center to enter the box;
- the workstation label no longer selects the dog and the bookcase label no longer selects the
  workstation;
- the original television radius boundary remains unchanged;
- exactly one matching yellow label highlight is active and no uncaught browser exceptions occur.

`office-workstation-highlight.png` was recaptured with the player at first foot contact in the office
and visually inspected. The workstation nameplate is the active highlighted label. No commit, push,
production-preview or physical-device verification is claimed.

## DEC-169 collision-visibility verification

The central and live scene `COLLISION_BOUNDS_VISIBLE` values both default to `false`, and isolated
Chrome confirms the collision rendering layer remains hidden even with development diagnostics on.
The recaptured office screenshot contains no object collision rectangles; general cyan room/world
diagnostic outlines and the separately controlled yellow interaction circles remain visible.

All 1,957 tests across 44 files, typecheck, production build (`index-CNrYbxCC.js`; existing
bundle-size advisory only), whitespace checks, 275 label samples, 11 foot-contact checks, the
original radius boundary and zero-exception browser checks pass.

## DEC-170 anchor and connection visibility verification

`GROUND_ANCHORS_VISIBLE` and `ROOM_CONNECTION_BOUNDS_VISIBLE` both default to `false`. Isolated
Chrome confirms the corresponding live ground-anchor and doorway-preview layers are also hidden
while general development diagnostics remain enabled. The recaptured office screenshot contains
neither the small object-anchor circles nor the doorway connection box. Perspective sorting,
doorway/corridor behavior and interaction logic are unchanged.

All 1,960 tests across 44 files, typecheck, production build (`index-B4R9K65l.js`; existing
bundle-size advisory only), whitespace checks, 275 label samples, 11 foot-contact checks, the
original radius boundary and zero-exception browser checks pass.

## DEC-171 radius-layer verification

The shared yellow interaction-radius layer now renders at depth 2.8, directly below nameplates at
depth 2.9 and below all perspective-sorted objects/player above depth 3. Isolated Chrome confirms
the exact depth and retains every interaction and visibility check. The recaptured office screenshot
was visually inspected: nameplate chrome cleanly occludes the yellow circles where they overlap.

Owner accepted the combined result; final delivery authorization after the room-bound refinement is
recorded under DEC-173.

## DEC-172 room-bound visibility verification

`ROOM_BOUNDS_VISIBLE` defaults to `false`, and isolated Chrome confirms the live room-bounds layer
is hidden even while general development diagnostics are enabled. The final office screenshot was
visually inspected: cyan room-perimeter boxes are absent; the purple outer webpage frame correctly
remains because it is not a room diagnostic.

## Final delivery gate

All 1,960 tests across 44 files, typecheck, production build (`index-MawTZsvY.js`; existing
bundle-size advisory only) and whitespace checks pass. The final isolated-browser run passes all
visibility flags, 275 label samples, 11 first-contact checks, the original radius boundary and zero
exceptions. Owner authorized delivery under DEC-173.
