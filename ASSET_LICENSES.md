# Asset Licenses

Current assets in `public/assets/` are project-created placeholders, AI-generated artwork or owner-supplied material. The owner-supplied cast-iron plate photograph described below was used as design inspiration, not included as a runtime image. No third-party fonts, music or sound effects have been added.

Replace this document with a full attribution record if approved third-party assets are added later.

## Office samples — PORT-09C (artwork review)

- Owner-supplied runtime photograph: `public/assets/photos/dog/stella.jpg`. Used only by Stella's office dialog. The superseded AI-generated placeholder was removed from runtime assets; its historical prompt remains in `output/imagegen/office-dog-photo.prompt.md`.

- DEC-108 runtime selection: background sample-v5; workstation left-review.png (camera-view filename, screens/working side face screen-right); bookcase front; dog-bed front-three-quarter; sofa left; coffee-table front; standing and seated robots front-three-quarter. Existing generated originals preserved. The desk uses a previously labelled review candidate, not a claim that all directional variants are geometrically consistent. Runtime IDs/paths are in src/app/assetManifest.ts; placement/collisions in src/game/data/office.ts.

- DEC-107: public/assets/backgrounds/office/sample-v5.png generated on 2026-09-24 with the built-in image generator from sample-v4, shortening room proportions. Exact prompt: output/imagegen/office-background-v5.prompt.md. Artwork review only.

- DEC-106: public/assets/backgrounds/office/sample-v4.png generated on 2026-09-24 with the built-in image generator as a rug-only edit of sample-v3.png. Exact prompt: output/imagegen/office-background-v4.prompt.md. Artwork review only.

- DEC-105: public/assets/sprites/office-sofa/left.png and office-coffee-table/front.png generated on 2026-09-24 with the built-in image generator, using office sample-v3 as style reference. Exact prompts: output/imagegen/office-seating.prompt.md. Not runtime-integrated.

- DEC-104: sample-v3.png generated on 2026-09-24 with the built-in image generator as an edit of sample-v2.png, adding two plants. Exact prompt: output/imagegen/office-background-v3.prompt.md. Artwork review only.

- DEC-103: background sample-v2, rear/side object candidates and seated robot generated as reference-based edits on 2026-09-24. Prompt and QA records are output/imagegen/office-background-v2.prompt.md, office-directional-views.prompt.md, office-followup-poses.prompt.md and office-views-review.md. Review-labelled variants have known geometry/detail inconsistencies and are not runtime-approved assets.

- Files: `public/assets/backgrounds/office/sample.png` and per-object PNGs under `public/assets/sprites/office-{workstation,bookcase,dog-bed,robot}/`.
- Generated with the built-in image tool on 2026-09-24 from the owner's `utils/style_office.md` and existing project style descriptions. No third-party images supplied to these calls. Generic degree decoration and generic border collie, not verified personal credentials or a real-pet portrait.
- Exact prompts: `output/imagegen/office-assets.prompt.md`. Generated images retained unchanged with alpha channels. Awaiting owner review; not loaded by the running game.

## Gym background and equipment — PORT-09B

- Background: `public/assets/backgrounds/gym/background.png`, generated from `utils/style_gym.md` using the project living room as style/camera reference. Wood architecture, posters, no-curtain window and owner-requested uneven DIY matting are painted into the background; equipment is not.
- Equipment: `public/assets/sprites/gym-{squat-rack,bench,dumbbell-rack,boombox,steel-plates,bumper-plates}/`. Squat rack has eight directions, bench/dumbbell rack/boombox four each, and each plate pile front only. Runtime loads the selected front-right squat rack and other front views, plus the separately documented boxing bag; unused directions are review/future-layout assets, not an animation sequence.
- Provenance: built-in image-generation tool, 2026-09-20. The project record-player sprite provided the initial equipment style reference; revised front sprites provided identity references for directional views. Exact initial and revision prompts are saved under `output/imagegen/gym-*.prompt.md`.
- Owner-provided reference: photograph of a traditional BARBELL 20KGS/44LBS cast-iron plate, supplied in conversation. Used for solid-disc/rim/hub/rib/embossed-marking design inspiration. Its original photographer/source/license was not supplied; no redistribution rights to that photograph are claimed and the photograph is not shipped. The generated pile contains four plates and no grip cutouts.
- Owner revisions: low bench without shortening its human-length seat; graduated matched dumbbell pairs with balanced plate ends; front-only plate piles; repaired squat-rack side geometry and additional diagonal views. Review notes are in `log.md` DEC-091.
- Preservation: generated PNGs are copied without pixel rewriting; generated transparency is retained. Superseded plate side/rear drafts were moved outside `public/` to `output/imagegen/superseded-plate-views/` and are not runtime assets.
- Acceptance boundary: owner approved the final rendered composition on 2026-09-20 and authorized delivery after verification. Generated alternate views are not asserted to be pixel-exact 3D rotations; unused rejected drafts are not accepted runtime artwork.
- Rejected dumbbell views: current left/right PNGs are unapproved drafts; repeated generated versions have inconsistent dumbbell geometry. Only the unchanged front is loaded at runtime. Additional diagonals and side-view rebuilding are parked outside the current delivery.
- Runtime selection (DEC-092): owner selected the existing DIY/"clumsy" background, front-right squat rack and front-facing remaining equipment. Two coloured plate instances share one PNG; the cast-iron stack has one instance. Low bench retained. Alternate dumbbell-view work is parked, not approved or used. No images were regenerated for this selection.

## Television and console directional samples

- Files: `public/assets/sprites/television-console/{front,back,left,right}.png` and matching `.svg` copies.
- Provenance: AI-generated for this project using the built-in image generation tool on 2026-09-18, based on the owner's `style.md` brief. The approved front PNG was the design reference for the other three directions. No third-party reference images were supplied.
- Status: the approved front PNG is used by the living-room television. Back/left/right views and SVG copies remain review assets. The SVG files embed the generated PNG artwork and are not hand-authored vector drawings.
- Prompts and scope: `output/imagegen/television-console-front-sample.prompt.md` and `output/imagegen/television-console-directional-samples.prompt.md`.

## Record-player directional samples

- Files: `public/assets/sprites/record-player/{front,back,left,right}.png` and matching `.svg` copies.
- Provenance: AI-generated with the built-in image generation tool on 2026-09-18 using the styling paragraphs from `style.md`. The project's TV sprite supplied the visual style reference; the generated record-player front supplied the reference for its remaining views.
- Status: the front PNG is used by the living-room vinyl interactable. Other views remain available for future use. SVG copies embed raster PNG artwork; they are not editable vector drawings.
- Prompts: `output/imagegen/record-player-directional-samples.prompt.md`.

## Living-room background sample

- File: `public/assets/backgrounds/living-room/sample.png` (1499 × 1049).
- Provenance: AI-generated with the built-in image generation tool on 2026-09-18 from the owner's updated `style.md`, using this project's TV and record-player front sprites as style references.
- Status: placeholder background used by the living room through its optional visual asset. Separate tile-grid collision rectangles approximate the pictured walls; bookcase-specific collision is omitted and table/couch collisions are temporarily disabled. Interactable sprites remain independent.
- Prompt and review notes: `output/imagegen/living-room-background-sample.prompt.md`.

## Player neutral front sample

- File: `public/assets/sprites/player/idle-down-sample.png`.
- Provenance: AI-generated using the built-in image generation tool on 2026-09-18 from the owner's character description in `utils/style_player.md`. Project-generated room, TV and record-player assets supplied the style references.
- Status: original avatar design sample retained for provenance. No supplied real-person likeness or third-party reference artwork.
- Design intent and missing-transcript notice: `output/imagegen/player-idle-down-sample.prompt.md`.
- Revision 2: `public/assets/sprites/player/idle-down-sample-v2.png`, edited with the built-in image tool from the original sample at the owner's request for slightly lighter hair and a slimmer build. Approved as the identity reference for PORT-14. Edit intent and missing-transcript notice: `output/imagegen/player-idle-down-sample-v2.prompt.md`.

## Player directional animation sheets — PORT-14

- Files: `public/assets/sprites/player/animations/{down,left,right,up}.png`.
- Provenance: generated with the built-in image tool on 2026-09-18, using the approved v2 character reference and the shared project styling. No third-party artwork was supplied.
- Format: four original, unmodified 1448×1086 RGBA PNGs, 4×3 cells per sheet. First row: four idle frames. Remaining rows: eight walk frames.
- Runtime: eight directional animation states; measured frame-origin metadata aligns artwork to the existing physics foot position without rewriting image pixels.
- Prompt set: `output/imagegen/player-animation-sheets.prompt.md`; editable art brief: `utils/style_player.md`.

### Right/down walking corrections

- Runtime files: `public/assets/sprites/player/animations/right-walk-v2.png` (1447×1087) and `down-walk-v3.png` (1448×1086).
- Generated using the built-in image tool on 2026-09-18. Right uses the project's working left sequence as a gait reference; down is a targeted refinement of the project's original down sheet. No third-party references.
- Only walking frames are consumed. Original idle sources and working left/up artwork are preserved unchanged. Per-sheet dimensions and measured origins are explicit in `playerAnimation.ts`.
- Exact prompts, rejected iteration notes and provenance: `output/imagegen/player-walking-repair.prompt.md`.

### Gym boxing-bag sprite

- File: `public/assets/sprites/gym-boxing-bag/front-three-quarter.png`.
- Generated with the built-in image tool on 2026-09-20 from the owner's `utils/style_bbag.md`; no external reference image used.
- Exact prompt: `public/assets/sprites/gym-boxing-bag/generation-prompt.md`. Original generated PNG preserved, with alpha transparency; included in the owner's 2026-09-20 visual approval.
- DEC-100: owner requested runtime placement; preloaded as optional artwork and displayed at 63.75px height in the gym's bottom-left. Original image remains unchanged; final placement review pending.
