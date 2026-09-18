# PORT-14 right/down walking repair prompts

Built-in image-generation tool, 2026-09-18. Originals retained; working left/up images and all original idle animation sources are unchanged. No CLI/API fallback was used.

Selected runtime artwork:
- `public/assets/sprites/player/animations/right-walk-v2.png` — 1447×1087 RGBA. Frame extraction uses 361×362 cells, four columns / three rows; only frames 4–11 are played.
- `public/assets/sprites/player/animations/down-walk-v3.png` — 1448×1086 RGBA. Frame extraction uses 362×362 cells; only frames 4–11 are played.

The right refinement uses the working left sheet as its gait/identity reference. The down refinement uses the initial generated down repair, then a targeted final leg-position correction. Per-frame anchors are remeasured from the selected sources. Source PNGs are not resampled or edited by scripts.

## Initial right repair (not selected)

Reference: public/assets/sprites/player/animations/right.png

Use case: identity-preserve. Image 1 is the EDIT TARGET: fix its eight broken walking frames, preserving this exact character, outfit, proportions, pixel-art rendering and upper-left lighting. Keep the TOP ROW four idle frames unchanged. Keep the same 4 columns x 3 rows layout, aspect ratio 4:3, 1448x1086 if possible, twelve full-body figures. All figures remain RIGHT-facing profile, nose and both shoe toes point to screen RIGHT.
The bottom TWO rows must form ONE coherent eight-frame walk cycle, read row-major. This is the only change. The original has repeated contact poses and is not a valid gait. Draw new anatomically consistent intermediate poses, not eight variants of the same spread stance.
Bottom two rows, successive cells:
1 CONTACT A: anatomical left leg forward, right leg back, opposite arm counter-swing.
2 DOWN A: weight settled onto left leg, legs getting closer, rear heel raised.
3 PASSING A: right knee swinging FORWARD directly next to left support knee; feet nearly together under hips; right foot lifted. This MUST be a NARROW silhouette, not wide stride.
4 UP A: right knee advances, left heel lifts; narrow/medium silhouette.
5 CONTACT B: right leg forward, left leg back, opposite of cell 1.
6 DOWN B: weight on right leg, legs drawing together, left rear heel raised.
7 PASSING B: left knee swinging FORWARD directly next to right support knee; feet nearly together under hips, left foot lifted. NARROW silhouette.
8 UP B: left knee advances, right heel lifts, preparing to return seamlessly to cell 1.
Keep exactly TWO arms and TWO legs per pose. Torso and head remain stable, facing same direction; no face, clothing, age or build changes. Shorts olive, hoodie black hood down, sandy blond buzzcut, big brown beard, black/white high tops.
Every cell same character scale and foot-contact baseline, central torso aligned to cell center. Full body entirely within its cell with transparent margin, no clipping or neighboring-frame spill. Actual RGBA transparency, no checkerboard/matte/shadow/background, no captions/gridlines/text. Crisp shaded pixel art matching original. Distinct alternating steps with clear contact-to-passing-to-opposite-contact progression is more important than added texture.

## Initial down repair (not selected)

Reference: public/assets/sprites/player/animations/down.png

Use case: identity-preserve. Image 1 is the EDIT TARGET: fix its eight broken walking frames, preserving this exact character, outfit, proportions, pixel-art rendering and upper-left lighting. Keep the TOP ROW four idle frames unchanged. Keep the same 4 columns x 3 rows layout, aspect ratio 4:3, 1448x1086 if possible, twelve full-body figures. All figures remain DOWN/front-facing toward viewer, never turning sideways.
The bottom TWO rows must form ONE coherent eight-frame walk cycle, read row-major. This is the only change. The original has repeated contact poses and is not a valid gait. Draw new anatomically consistent intermediate poses, not eight variants of the same spread stance.
Bottom two rows, successive cells:
1 CONTACT A: anatomical left leg forward, right leg back, opposite arm counter-swing.
2 DOWN A: weight settled onto left leg, legs getting closer, rear heel raised.
3 PASSING A: right knee swinging FORWARD directly next to left support knee; feet nearly together under hips; right foot lifted. This MUST be a NARROW silhouette, not wide stride.
4 UP A: right knee advances, left heel lifts; narrow/medium silhouette.
5 CONTACT B: right leg forward, left leg back, opposite of cell 1.
6 DOWN B: weight on right leg, legs drawing together, left rear heel raised.
7 PASSING B: left knee swinging FORWARD directly next to right support knee; feet nearly together under hips, left foot lifted. NARROW silhouette.
8 UP B: left knee advances, right heel lifts, preparing to return seamlessly to cell 1.
Keep exactly TWO arms and TWO legs per pose. Torso and head remain stable, facing same direction; no face, clothing, age or build changes. Shorts olive, hoodie black hood down, sandy blond buzzcut, big brown beard, black/white high tops.
Every cell same character scale and foot-contact baseline, central torso aligned to cell center. Full body entirely within its cell with transparent margin, no clipping or neighboring-frame spill. Actual RGBA transparency, no checkerboard/matte/shadow/background, no captions/gridlines/text. Crisp shaded pixel art matching original. Distinct alternating steps with clear contact-to-passing-to-opposite-contact progression is more important than added texture.

## right refinement

Use case: identity-preserve. Edit this WORKING LEFT WALK CYCLE into the corresponding RIGHT WALK CYCLE. Turn each of the twelve individual character poses to face SCREEN RIGHT, preserving exactly the same step phase and limb articulation as its corresponding original cell. Do NOT reverse cell ordering: first cell stays first, second stays second. This is twelve individually direction-reversed figures, not one mirrored whole sheet. Preserve the alternating forward/back leg positions and narrow passing poses of the original. Keep the same 4 columns by 3 rows grid, 1448x1086 RGBA transparent PNG. Top row four idle, lower two rows eight successive walking frames. Same buzzcut bearded man, same skinny athletic build, black hoodie, olive shorts and black/white high tops. Same detailed hard-edged pixel art, upper-left light, proportions, complete unclipped bodies and per-cell scale. Do not stylize, redesign, add text, add shadows or backgrounds. Every nose and shoe points right. True transparent background.

## down refinement

Use case: precise-object-edit. Fix ONLY the bottom two rows' LEG AND ARM POSES of this front-facing sprite sheet into a sequential walk. Preserve exact head, torso, identity, black hoodie, olive shorts, skin, beard, hair, pixel style, viewpoint, scale, transparent background, 1448x1086 size and top idle row. Four columns and three rows unchanged. Feet alternate toward the viewer with clear level-foot passing poses. All figures front facing. REQUIRED lower rows pose order (screen left/right, NOT anatomical): ROW 2 col1: SCREEN LEFT foot in front/lower, right foot back/higher; col2: left foot settles, right foot moves halfway toward it; col3: BOTH SHOES approximately SAME HEIGHT vertically below hips, right knee lifted in passing, legs narrow; col4: SCREEN RIGHT foot now slightly in front/lower. ROW3 col1: SCREEN RIGHT foot fully in front/lower, left back/higher; col2: right foot settles, left foot moves halfway toward it; col3: BOTH SHOES approximately SAME HEIGHT vertically below hips, LEFT knee lifted in passing, legs narrow; col4: SCREEN LEFT foot now slightly in front/lower, returning to row2col1. Arms counter-swing opposite their leg consistently. Do NOT randomly alternate contact poses every frame: each row describes one half-step, front foot changes ONLY as swinging foot passes planted foot. Keep full body inside each equal cell with clear transparent gaps. No background, text, labels, grid, floor shadow, extra limbs.

## Final down leg-position correction

Reference: the down refinement, preserved as `output/imagegen/player-down-walk-intermediate.png`.

Use case: precise-object-edit. Edit this front-facing character spritesheet surgically. Preserve all pixels/designs except the LEG positions in three cells of the bottom two rows. Keep 1448x1086 RGBA, 4 columns by 3 rows, same character size, exact face, hoodie, shorts, sneakers, camera, texture and true transparency. Required changes, columns counted left to right: (1) ROW 2 COLUMN 2: the shoe on SCREEN RIGHT must be planted slightly LOWER than the shoe on SCREEN LEFT, with feet close together, a settling pose following row2col1. (2) ROW 2 COLUMN 4: the shoe on SCREEN LEFT is slightly LOWER / moving toward viewer, SCREEN RIGHT shoe behind, transitional small stride leading into row3col1. (3) ROW 3 COLUMN 4: the shoe on SCREEN RIGHT is slightly LOWER / moving toward viewer, SCREEN LEFT behind, transitional small stride leading back into row2col1. Keep the narrow nearly level shoes of row2col3 and row3col3 as passing poses. No unrelated changes, no repeated copy of adjacent poses, no turn of body, no additional legs, no text, no background. All feet fully inside cells. This corrects animation order, not character design.

## Review tooling

Development preview: `/utils/player-animation-preview.html`. It shows isolated right/down walk loops at 2fps or the game's 8fps, with pause, frame stepping, fixed-foot guide lines and all eight frames in order. Automated tests verify geometry/source mapping and byte-identical left/up files, not the visual quality of a gait.
