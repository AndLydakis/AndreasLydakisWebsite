# Office view review — 2026-09-24

All artwork remains unintegrated and subject to owner review. No claim of pixel-exact 3D reconstruction. Each original front/front-three-quarter file remains unchanged (SHA-256 verified before/after).

## Room and scale

- `public/assets/backgrounds/office/sample-v2.png`: two plants, clean doorway, original preserved. Uses the existing 320×160 world-pixel room / 51px player display-height relationship in its art prompt. Final apparent scale must still be reviewed with the player and separate sprites in-game; image generation alone does not establish runtime scale.

## Directional candidates

- Workstation: original front preserved; corrected `back.png` puts the chair on the far user side, partially hidden by desk/monitors. Rejected first rear image had the chair on the near camera side and remains only in generator history. `left-review.png` / `right-review.png` are oblique candidates, not validated lateral projections: desk control-panel position/prop spacing and chair offset need further reconciliation. Rear v2 fixes the owner's chair-side requirement, but exact hidden geometry and rear chair height still require layout review.
- Bookcase: `back.png`, `left.png`, `right.png` retain the wooden case and five-bay structure; side views retain main shelf identities (cat ornament, globe, pencil cup, chest). These are oblique side views; fine book counts/spacing are not certified identical. Rear joinery is inferred from unseen surfaces.
- Dog bed: `back.png` hides the leather patch on the far side and puts the curled back nearest the camera. `left-review.png` / `right-review.png` remain too frontal and introduce fabric motif changes; NOT consistency-approved. Preserve the original sleeping pose/markings and tartan pattern in a later corrective pass.
- Standing robot: `back.png`, `left.png`, `right.png` preserve the main cream/orange character, antenna, raised-right-arm gesture and lowered-left-arm intent. Side candidates are oblique; small panel/scuff and finger details vary, so these are not an animation-ready rotation set.
- Additional `seated-front-three-quarter.png`: same character design sitting on its butt with legs forward; a separate pose, not a replacement standing reference.

## Original reference checksums

- Workstation: faba7a3dd570f257c708e4ba5593fc7fecf7e35aa431c9c61e70eb7f7432b189
- Bookcase: 6ae75855b737b96ad708e7e4103fc8d637c25c70db228fd885d093f95dc33fb4
- Dog bed: 114a2ac3aeb0bdc3cae547f856a90420d4d570fc41212d5e334f27df14a44720
- Robot: e83157d8a48e518fcc7e8d236f895014a4679b2fbb58d300a7efefb92e5121a1

Exact prompt sets: office-background-v2.prompt.md, office-directional-views.prompt.md and office-followup-poses.prompt.md. Built-in imagegen; source PNGs copied unchanged. No runtime code/collision changes or push.
