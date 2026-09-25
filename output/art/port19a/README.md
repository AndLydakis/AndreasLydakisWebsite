# PORT-19A couch extraction — pixel-preserving review package

Owner authorized deterministic mask extraction after the generated drafts below
failed registration. Current outputs are produced by `scripts/prepare-couch-mask.py`
with Pillow (`uv run --with pillow python scripts/prepare-couch-mask.py`). No model
regenerates the couch. No live references, collisions or original files changed.

## Current review package

- `couch-foreground-masked.png`: full registered 1499×1049 RGBA layer; original RGB
  retained exactly, binary alpha only. `couch-mask.png` is the traced silhouette.
- `couch-foreground-cropped.png`: 503×204, no resampling; source rectangle
  `[491,631,994,835)` (exclusive right/bottom). A future loader must restore that
  offset, not center it by eye or scale it from the full transparent canvas.
- `backdrop-couch-removed-masked.png`: the prior restoration candidate is used
  only around the couch and its old cast shadow; unaffected original pixels stay
  identical. The original broad cast shadow remains on the floor/background, not
  the sorted couch sprite. Dark contact pixels immediately under its feet stay in
  the cutout. This retains the original grounded appearance; bundle fallback must
  keep backdrop and foreground paired. `backdrop-couch-removed-shadow-free.png`
  and `couch-composite-shadow-free.png` are alternatives only, not the proposal.
- `couch-registered-composite.png`: the actual registered pair composited together.
- `couch-alpha-review.png`: white/magenta edge checks. `couch-trace-grid.png` is a
  trace aid, not an asset. `couch-player-{behind,front,left-side}.png` are static
  overlap mockups using the existing idle sprite at 51 world pixels tall, plus
  960px and 390px review versions. They are not live physics/device evidence.
- `mask-verification.json`: original hash, dimensions, bounds and exact-pixel
  assertions. Zero RGB changes in the foreground; zero changes outside the
  restoration mask; table unchanged; opaque couch pixels reconstruct exactly.

Registration uses room size320×224px at world origin(32,64). Proposed ground anchor
is room-local(9.875,11.125) tiles = (158,178)px = world(190,242)px. Existing footprint
stays room-local(6.625,10.6875,6.5,0.4375) tiles = world(138,235,104,7)px. Render the
full foreground at the room origin or map its crop using independent x/y factors
320/1499 and224/1049. Do not mutate physics to match transparent padding.

Owner art acceptance is still required before PORT-19B integration. Original
provenance is the retained project-generated image; no new license claim is made.
The restored hidden floor is reconstructed, not original recoverable pixels.

Senior game reviewer approved the primary static art package, registration, alpha
edges and native/960px/390px overlap mockups with no blocking findings. Runtime
transitions, collision preservation and visual-bundle fallback belong to PORT-19B.

## Earlier rejected generated drafts (history)

Built-in image-generation skill used on 2026-09-25. No live asset references changed.
Original retained at `public/assets/backgrounds/living-room/sample.png` (1499×1049).
Project-generated source; retained repository asset is the provenance reference,
not a new claim of third-party licensing clearance.

## Files and status

- `backdrop-without-couch-candidate.png`: same-size restored-floor/rug draft.
- `couch-foreground-candidate.png`: RGBA 1499×1049, rejected because the couch was
  enlarged/reinterpreted instead of extracted at original registration.
- `couch-foreground-candidate-v2.png`: 1498×1050 RGBA retry; changed canvas dimensions
  and still does not preserve
  original couch dimensions/design sufficiently. Not approved or registered.

Do not load these as game assets. The original approximate couch extent is
x490–995 / y631–835 pixels. Its collision base remains room-local
(6.625,10.6875,6.5,0.4375) tiles; no proposed art change may silently alter it.
Room display is 320×224 world pixels at origin (32,64); foreground registration
must use independent scale factors 320/1499 and 224/1049. Provisional existing
base-front sort plane is room-local y178px, subject to measured cutout review.

At the earlier generated-draft stage no valid composite or mockup existed. Before
integration: preserve exact original couch silhouette/appearance, check alpha on
contrasting backgrounds, register the layer, compare the reconstructed scene at
native/desktop/mobile scale, obtain game/owner art approval, then review the generic
visual-bundle fallback schema. Table preparation follows accepted couch integration.

## Prompt record (built-in tool, no CLI)

Backdrop prompt: precise-object-edit of the original 1499×1049 room. Remove only
the bottom-center plaid couch and contact/cast shadow; restore underlying wooden
floor and green/gold rug. Preserve table/pizza/sodas/bookcase/walls/window/curtains/
frames/sunlight/door/framing and all pixels outside that region. Same canvas, no
crop/recenter, original crisp 1990s hand-pixelled style; no replacement furniture.

Foreground prompt: background-extraction of only the original couch onto genuine
transparent alpha, on the same full-size canvas and at original x490–995/y632–836.
Preserve rear view, original plaid texture/lighting/feet/silhouette; remove all
floor/rug/room pixels. Narrow contact shadow only, no matte/checkerboard/labels.

Retry prompt: original room authoritative, first cutout explicitly rejected for
enlargement/restyling. Require x490–995/y631–835 (505×204), not the enlarged draft;
retain original long back-cushion seams and texture, no recentering or redesign.

The generative retries did not satisfy the exact-extraction invariant. The owner
subsequently approved the deterministic workflow documented above; neither of
these rejected foregrounds is used in the current review package.
