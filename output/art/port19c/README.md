# PORT-19C — Coffee-table extraction review

Owner accepted this package for integration. PORT-19C1 now tracks the live switch
and runtime review separately; the art-preparation evidence below is retained.

Art preparation only. No live assets, scene data, collision geometry or asset
manifest changed. Owner approved the same deterministic extraction used for the
couch. Owner art acceptance is required before PORT-19C1 integration. No push.

## Method and provenance

`scripts/prepare-table-mask.py` traces a binary alpha mask on the retained original
`public/assets/backgrounds/living-room/sample.png`. Table, legs, lower crossbar,
pizza box, pizza and cans retain their original RGB samples without resampling.
The open floor below the crossbar is transparent. The script writes review outputs
only; rerun with `uv run --with pillow python scripts/prepare-table-mask.py`.

The base for restoration is the approved couch-free
`public/assets/backgrounds/living-room/couch-removed.png`. The built-in image tool
generated `rug-restoration-candidate.png` using [the saved prompt](restoration.prompt.md).
It returned1500×1049 rather than1499×1049. Only this generated repair candidate is
normalized to1499×1049 with nearest-neighbor sampling; the table/source/couch are
never resized. Its contribution is limited by the local repair mask, leaving all
pixels outside the recorded repair bounds identical to the accepted backdrop.

Original source and restoration hashes are in `mask-verification.json`. The
original art is retained project-generated artwork; no new licensing claim is
made. Hidden rug pixels are reconstructed, not recovered original content.

## Assets and review images

- `table-foreground-masked.png`: registered1499×1049 RGBA layer, alpha0/255.
- `table-foreground-cropped.png`:308×185 native crop, no scaling.
- `table-mask.png`: explicit alpha silhouette.
- `backdrop-couch-table-removed.png`: backdrop with both extracted objects removed.
- `table-couch-registered-composite.png`: restored backdrop plus unchanged couch
  layer and table; compares the originally baked furniture placement.
- `table-alpha-review.png`: enlarged white/magenta edge checks.
- `table-trace-grid.png`: native-coordinate tracing aid, not a runtime asset.
- `table-player-{behind,front,left-side,right-side}.png`: static overlap mockups,
  with960px and390px versions. These include existing TV/vinyl/globe source art at
  current placements, plus the unchanged couch. They are not browser/device tests.

## Registration and geometry

| Item | Value |
| --- | --- |
| Original canvas |1499×1049px |
| Crop rectangle (right/bottom exclusive) | `[587,446,895,631)` |
| Crop size / source center |308×185px / `(741,538.5)` |
| Room display / world origin |320×224px / `(32,64)` |
| Proposed centered sprite position | `(741*20/1499 - 0.5, 538.5*14/1049 - 0.5)` tiles |
| Explicit width / height | `308*20/1499`, `185*14/1049` tiles |
| Ground anchor (room tile-edge units) | `(9.875,8.4375)` |
| Ground anchor (world pixels) | `(190,199)` |
| Existing base (room tile-edge rectangle) | `(8,7.9375,3.75,0.5)` |
| Existing base (world pixels) | `(160,191,60,8)` |

The base and sort plane are independent of the image crop. Preserve this complete
base when integrating; individual-leg traversal is outside scope. Player mockup
soles are room-local `(158,124)`, `(158,140)`, `(115,131)`, `(201,131)`, all outside
the current base. The reviewed couch base starts at local y150, leaving15px of
floor after the table base ends at135. Runtime routes/contacts belong to19C1.

## Shadow ownership

Broad existing cast shadow remains floor-owned. Narrow dark silhouette/contact
edges and the wooden crossbar stay with the table. Restoration feathers only the
local repair boundary, never the binary foreground alpha. Inspect the region
under the crossbar and both feet for grounding and accidental rug pickup. The
accepted couch layer and its separate floor shadow are unchanged.

## Proposed visual bundle (not activated)

- Primary backdrop: this couch-and-table-free background.
- Foregrounds: existing `living-room-couch` plus proposed `living-room-coffee-table`.
- Original fallback remains `living-room-background` / `sample.png`, not the
  intermediate couch-free backdrop.
- TV, vinyl and globe remain independent actors. Bookcase stays painted.
-19C1 must extend the existing all-or-nothing bundle list and exercise every
  missing-member/fallback/restart combination, preserving all collision counts.

## Verification and acceptance

Script assertions verify zero foreground RGB changes, exact opaque table pixels
in the reconstruction, zero changes outside the repair region, and no overlap
with the accepted couch mask/restoration region.

Independent game/art reviewer approved alpha, reconstructed placement, shadow
ownership and all12 scaled player mockups. Independent senior engineer reproduced
all19 generated images and the report in memory, checked registration/order and
confirmed the archival couch matches the live crop. Both approved this art-only
handoff with no blockers. Owner art acceptance remains pending. No claim of
runtime integration, physical-device validation or completed19C1 is made.
