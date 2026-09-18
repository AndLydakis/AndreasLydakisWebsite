# PORT-14 directional animation generation

Generated on 2026-09-18 with the built-in image tool, not a CLI/API fallback.
Reference image for every call: `public/assets/sprites/player/idle-down-sample-v2.png` (approved identity and style).

## Prompt template used for each direction

Use case: stylized-concept. Make ONE production animation SPRITESHEET of the supplied approved character, DIRECTION_DESCRIPTION in ALL TWELVE frames. Preserve slimmer adult male build, short sandy blonde buzzcut, full brown beard, green eyes, black hoodie with hood DOWN, olive cargo shorts, black/white canvas high-top sneakers. Same pixel-art craftsmanship, elevated orthographic RPG camera and upper-left lighting as reference; no redesign, no added objects.

EXACTLY 12 complete character frames arranged in a regular grid of FOUR columns and THREE rows, equal-sized square cells, landscape canvas aspect ratio 4:3. Suggested canvas 1536x1152. Each cell contains exactly one full-body sprite centered horizontally, soles at 94% of cell height, head near 18% of cell height, same character height and ground anchor throughout. Transparent margins in every cell, NO touching adjacent cells.

ROW 1: four IDLE frames neutral -> slight breathing rise -> slight breathing peak -> return toward neutral. Feet planted; tiny differences, same height/identity.

ROW 2: first FOUR frames of an eight-frame in-place WALK loop: first foot forward contact; settling weight; trailing foot passing; push off into opposite step.

ROW 3: last FOUR walk frames: opposite foot forward contact; settling opposite weight; other foot passing; push off back toward first contact. Arms alternate opposite legs. Clear leg/arm motion, not repeated static poses. Raised feet naturally lifted; no translation of the ground anchor. Rows 2 and 3 together are ONE sequential eight-frame loop, not separate animations.

Detailed crisp hard-edged pixel clusters, layered fabric folds/stitching/shoe laces, many coherent shades with warm muted palette. NOT smooth vector, 3D, blur, chibi, photorealism. Keep identical proportions and viewpoint for every frame. Keep full shoes and all extremities inside each cell, no clipping. Genuine RGBA transparent background, NO checkerboard, no labels, no grid lines, no floor, no shadow ellipses, no text/watermarks. Output only this twelve-frame DIRECTION sheet.

## Direction substitutions and saved results

| Direction | DIRECTION_DESCRIPTION | File |
| --- | --- | --- |
| down | DOWN/front, faces viewer symmetrically, green eyes and beard visible | `public/assets/sprites/player/animations/down.png` |
| left | LEFT, nose and toes point toward LEFT edge of screen, profile face | `public/assets/sprites/player/animations/left.png` |
| right | RIGHT, nose and toes point toward RIGHT edge of screen, profile face | `public/assets/sprites/player/animations/right.png` |
| up | UP/back, faces away from viewer, show back of head and hood down on back, NO eyes or front face visible | `public/assets/sprites/player/animations/up.png` |

Actual output for all four: 1448×1086 RGBA, 362px cells. Original PNG bytes retained. Generated placement differs slightly between cells; measured torso/sole origins in `playerAnimation.ts` correct runtime alignment. The read-only `scripts/inspect_player_sheets.mjs` reproduces those measurements. These are generated placeholder animations, not manually cleaned production pixel art.
