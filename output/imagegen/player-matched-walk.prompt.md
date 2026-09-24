# Matched directional walking sheets — DEC-127

Built-in image generation using the imagegen skill. Downward walk and all original idle source bytes retained. New sheets replace only left/right/up walking frames. Source geometry and anchors must be measured before integration; no raster processing or CLI fallback.

## left

Selected workspace path: <repo>/public/assets/sprites/player/animations/left-walk-matched-v1.png

### Initial draft

Use case: identity-preserve. Asset type: replacement walking spritesheet for an existing pixel-art RPG character.
Input Image 1 is the APPROVED DOWNWARD WALK, the master for identity, proportions, gentle stride amplitude and phase continuity. Input Image 2 is the old TARGET-DIRECTION sheet, for exact directional appearance ONLY; replace its exaggerated/jittery walking poses.
Create one 4-column by 3-row transparent RGBA sheet, ideally exactly 1448x1086 with 362x362 cells. Row 1: four neutral standing reference poses; rows 2 and 3: ONE coherent eight-frame in-place WALK read left-to-right row-major. Runtime will retain the original idle images separately; all eight lower frames must be new matching walk art.
Identity: same light-skinned sandy-blond buzzcut, large brown beard, slimmer moderately athletic man; plain black hoodie with hood down, olive cargo shorts, black/white high-top sneakers. Preserve face, beard, clothing details, sleeve lengths, body proportions and upper-left lighting. Richly shaded hard-edged hand-pixelled 32-bit arcade aesthetic, existing warm palette, no redesign.
Motion: match the approved down-facing walk's quiet indoor stroll, not the exaggerated old side-view march. Keep head/shoulders/hips centered on exactly the same vertical axis in every cell, same scale, only 0-2 source-pixel intentional body bob. Ground contact baseline fixed at cell y=350 with 12px transparent foot margin; head height stable. Small ankle lift, low knees, modest arm swing, short steps. Avoid high raised knees, lunges, wide split legs, hard heel kicks, torso lean, oscillating head size or side-to-side drift.
Eight lower cells form a SINGLE two-step cycle, not two repeated half-cycles and not random alternating contacts:
1 contact A (one foot slightly forward, other slightly back);
2 settle A (leading foot stable, trailing foot begins recovery);
3 narrow passing A (recovering foot beneath hip, knees close, minimal lift);
4 recover toward contact B (opposite foot moves a little ahead);
5 contact B (opposite of 1, same modest amplitude);
6 settle B (mirror phase of 2, not mirrored lighting);
7 narrow passing B;
8 recover toward contact A; smooth transition back to frame1.
Keep the SAME limb identities through consecutive frames; no swapping which leg leads until the passing phase. Do not duplicate a contact at the end. Shoulders/hood/shorts retain stable silhouettes while lower limbs articulate. Exactly two arms/two legs per pose, natural occlusion, consistent foot volume.
Full character inside every equal cell, complete soles, no clipping or cross-cell fragments. Real transparency, no checkerboard/matte, no floor shadows, no text/labels/grid/cell borders. Do not change the approved down sheet; it is reference only.
Direction constraint: All twelve figures face SCREEN LEFT, nose and both shoe toes pointing left. Elevated orthographic profile with top of head/shoulders subtly visible; NOT a flat side-scroller or running stance.

### Direct pose reprojection

Use case: identity-preserve. Image 1 is the ONLY edit target and motion master, an approved front/down-facing sprite sheet. Reproject EACH EXISTING CHARACTER POSE into 90 degrees toward SCREEN LEFT: nose, chest and toes all facing left, elevated profile. This is the SAME 12 poses seen from another side, NOT a newly invented gait. KEEP the 4 columns by 3 rows arrangement and corresponding cell order exactly. Top row standing references; lower two rows the same eight gentle walking poses as the original. For every cell preserve the exact anatomical left/right leg and arm phase of its corresponding reference pose while changing viewing direction. First walking row and second walking row must lead with opposite anatomical legs; the near arm must visibly reverse its swing between row2col1 and row3col1. Do not repeat a half-cycle. Keep the narrow passing poses at row2col3 and row3col3. Use relaxed SHORT steps and minimal knee lift like reference, NOT a long lunge, high-kneed march, jog or run.
Preserve this exact man's identity, same relative head size, same body height/build, sandy-blond buzzcut, brown beard, plain black hoodie hood down, olive cargo shorts, black and white high-top shoes, dense shaded hard-edged arcade-pixel rendering. Do not alter clothing material/lighting/palette. Upper-left image light stays fixed. Torso/head remain stable from frame to frame, no twisting, no lean, no breathing scale changes, only the reference's small movement. Match contact/support-foot baseline across all cells and gently match body bob to the approved sheet. Keep subjects centered consistently.
Deliver exactly one 1448x1086 RGBA image, 4 columns x3 rows of 362x362 square cells. Each full body completely inside its cell with small transparent margins. No cropping, no neighboring-frame spill, no frame labels, text, floor/shadow or checkerboard. Genuine transparency. Do not mirror the whole sheet or reverse cell ordering. EACH cell individually changes facing direction while retaining that exact instant in the gait. Seamless transition row3col4 back to row2col1.

### Opposite-half-cycle correction

Use case: precise-object-edit. Make a surgical animation correction to this sprite sheet. KEEP ALL of row 1 and row 2 unchanged. Keep the ENTIRE HEAD, face, torso, hoodie collar and shoulders of row 3 unchanged. Modify ONLY the FOUR poses' ARMS AND LEGS in the BOTTOM THIRD ROW.
All characters continue facing screen left. The old bottom row wrongly repeats the first walking half-cycle. It must now show the OPPOSITE leg/arm phase.
For bottom-row COLUMN 1: foreground/near arm (large visible sleeve) swings FORWARD toward screen left, elbow gently bent, hand in FRONT of the belly. Far/background arm swings BACK toward screen right. Foreground/near leg (visible large cargo pocket thigh) extends BACK toward screen right; far leg reaches slightly FORWARD toward screen left. This must visibly differ from row2col1: large visible foreground sleeve forward, not hanging behind hip.
Bottom row COLUMN 2: same foreground arm still forward but beginning to settle, foreground rear foot recovers toward planted far foot; modest stride.
Bottom row COLUMN 3: narrow passing pose; foreground arm moving down past hip, foreground leg passes beneath hips, knees low.
Bottom row COLUMN 4: foreground arm now moving a little back toward screen right, foreground leg begins moving forward toward screen left, preparing to join unchanged row2col1.
Exactly two arms and legs, same clothes and sneakers, gentle short indoor steps. No torso/head shifts, no resizing, no turn, no mirror, no new artwork style. Preserve exact 4x3 layout, cell dimensions, small body bob and transparency. Do not change row1/row2 or any face/hair pixels. No labels/grid/floor/background. Actual transparent PNG.

Selected generator source: <generated-image-source>

## right

Selected workspace path: <repo>/public/assets/sprites/player/animations/right-walk-matched-v1.png

### Initial draft

Use case: identity-preserve. Asset type: replacement walking spritesheet for an existing pixel-art RPG character.
Input Image 1 is the APPROVED DOWNWARD WALK, the master for identity, proportions, gentle stride amplitude and phase continuity. Input Image 2 is the old TARGET-DIRECTION sheet, for exact directional appearance ONLY; replace its exaggerated/jittery walking poses.
Create one 4-column by 3-row transparent RGBA sheet, ideally exactly 1448x1086 with 362x362 cells. Row 1: four neutral standing reference poses; rows 2 and 3: ONE coherent eight-frame in-place WALK read left-to-right row-major. Runtime will retain the original idle images separately; all eight lower frames must be new matching walk art.
Identity: same light-skinned sandy-blond buzzcut, large brown beard, slimmer moderately athletic man; plain black hoodie with hood down, olive cargo shorts, black/white high-top sneakers. Preserve face, beard, clothing details, sleeve lengths, body proportions and upper-left lighting. Richly shaded hard-edged hand-pixelled 32-bit arcade aesthetic, existing warm palette, no redesign.
Motion: match the approved down-facing walk's quiet indoor stroll, not the exaggerated old side-view march. Keep head/shoulders/hips centered on exactly the same vertical axis in every cell, same scale, only 0-2 source-pixel intentional body bob. Ground contact baseline fixed at cell y=350 with 12px transparent foot margin; head height stable. Small ankle lift, low knees, modest arm swing, short steps. Avoid high raised knees, lunges, wide split legs, hard heel kicks, torso lean, oscillating head size or side-to-side drift.
Eight lower cells form a SINGLE two-step cycle, not two repeated half-cycles and not random alternating contacts:
1 contact A (one foot slightly forward, other slightly back);
2 settle A (leading foot stable, trailing foot begins recovery);
3 narrow passing A (recovering foot beneath hip, knees close, minimal lift);
4 recover toward contact B (opposite foot moves a little ahead);
5 contact B (opposite of 1, same modest amplitude);
6 settle B (mirror phase of 2, not mirrored lighting);
7 narrow passing B;
8 recover toward contact A; smooth transition back to frame1.
Keep the SAME limb identities through consecutive frames; no swapping which leg leads until the passing phase. Do not duplicate a contact at the end. Shoulders/hood/shorts retain stable silhouettes while lower limbs articulate. Exactly two arms/two legs per pose, natural occlusion, consistent foot volume.
Full character inside every equal cell, complete soles, no clipping or cross-cell fragments. Real transparency, no checkerboard/matte, no floor shadows, no text/labels/grid/cell borders. Do not change the approved down sheet; it is reference only.
Direction constraint: All twelve figures face SCREEN RIGHT, nose and both shoe toes pointing right. Elevated orthographic profile with top of head/shoulders subtly visible; NOT a flat side-scroller or running stance.

### Direct pose reprojection

Use case: identity-preserve. Image 1 is the ONLY edit target and motion master, an approved front/down-facing sprite sheet. Reproject EACH EXISTING CHARACTER POSE into 90 degrees toward SCREEN RIGHT: nose, chest and toes all facing right, elevated profile. This is the SAME 12 poses seen from another side, NOT a newly invented gait. KEEP the 4 columns by 3 rows arrangement and corresponding cell order exactly. Top row standing references; lower two rows the same eight gentle walking poses as the original. For every cell preserve the exact anatomical left/right leg and arm phase of its corresponding reference pose while changing viewing direction. First walking row and second walking row must lead with opposite anatomical legs; the near arm must visibly reverse its swing between row2col1 and row3col1. Do not repeat a half-cycle. Keep the narrow passing poses at row2col3 and row3col3. Use relaxed SHORT steps and minimal knee lift like reference, NOT a long lunge, high-kneed march, jog or run.
Preserve this exact man's identity, same relative head size, same body height/build, sandy-blond buzzcut, brown beard, plain black hoodie hood down, olive cargo shorts, black and white high-top shoes, dense shaded hard-edged arcade-pixel rendering. Do not alter clothing material/lighting/palette. Upper-left image light stays fixed. Torso/head remain stable from frame to frame, no twisting, no lean, no breathing scale changes, only the reference's small movement. Match contact/support-foot baseline across all cells and gently match body bob to the approved sheet. Keep subjects centered consistently.
Deliver exactly one 1448x1086 RGBA image, 4 columns x3 rows of 362x362 square cells. Each full body completely inside its cell with small transparent margins. No cropping, no neighboring-frame spill, no frame labels, text, floor/shadow or checkerboard. Genuine transparency. Do not mirror the whole sheet or reverse cell ordering. EACH cell individually changes facing direction while retaining that exact instant in the gait. Seamless transition row3col4 back to row2col1.

### Opposite-half-cycle correction

Use case: precise-object-edit. Make a surgical animation correction to this sprite sheet. KEEP ALL of row 1 and row 2 unchanged. Keep the ENTIRE HEAD, face, torso, hoodie collar and shoulders of row 3 unchanged. Modify ONLY the FOUR poses' ARMS AND LEGS in the BOTTOM THIRD ROW.
All characters continue facing screen right. The old bottom row wrongly repeats the first walking half-cycle. It must now show the OPPOSITE leg/arm phase.
For bottom-row COLUMN 1: foreground/near arm (large visible sleeve) swings FORWARD toward screen right, elbow gently bent, hand in FRONT of the belly. Far/background arm swings BACK toward screen left. Foreground/near leg (visible large cargo pocket thigh) extends BACK toward screen left; far leg reaches slightly FORWARD toward screen right. This must visibly differ from row2col1: large visible foreground sleeve forward, not hanging behind hip.
Bottom row COLUMN 2: same foreground arm still forward but beginning to settle, foreground rear foot recovers toward planted far foot; modest stride.
Bottom row COLUMN 3: narrow passing pose; foreground arm moving down past hip, foreground leg passes beneath hips, knees low.
Bottom row COLUMN 4: foreground arm now moving a little back toward screen left, foreground leg begins moving forward toward screen right, preparing to join unchanged row2col1.
Exactly two arms and legs, same clothes and sneakers, gentle short indoor steps. No torso/head shifts, no resizing, no turn, no mirror, no new artwork style. Preserve exact 4x3 layout, cell dimensions, small body bob and transparency. Do not change row1/row2 or any face/hair pixels. No labels/grid/floor/background. Actual transparent PNG.

Selected generator source: <generated-image-source>

## up

Selected workspace path: <repo>/public/assets/sprites/player/animations/up-walk-matched-v1.png

### Initial draft

Use case: identity-preserve. Asset type: replacement walking spritesheet for an existing pixel-art RPG character.
Input Image 1 is the APPROVED DOWNWARD WALK, the master for identity, proportions, gentle stride amplitude and phase continuity. Input Image 2 is the old TARGET-DIRECTION sheet, for exact directional appearance ONLY; replace its exaggerated/jittery walking poses.
Create one 4-column by 3-row transparent RGBA sheet, ideally exactly 1448x1086 with 362x362 cells. Row 1: four neutral standing reference poses; rows 2 and 3: ONE coherent eight-frame in-place WALK read left-to-right row-major. Runtime will retain the original idle images separately; all eight lower frames must be new matching walk art.
Identity: same light-skinned sandy-blond buzzcut, large brown beard, slimmer moderately athletic man; plain black hoodie with hood down, olive cargo shorts, black/white high-top sneakers. Preserve face, beard, clothing details, sleeve lengths, body proportions and upper-left lighting. Richly shaded hard-edged hand-pixelled 32-bit arcade aesthetic, existing warm palette, no redesign.
Motion: match the approved down-facing walk's quiet indoor stroll, not the exaggerated old side-view march. Keep head/shoulders/hips centered on exactly the same vertical axis in every cell, same scale, only 0-2 source-pixel intentional body bob. Ground contact baseline fixed at cell y=350 with 12px transparent foot margin; head height stable. Small ankle lift, low knees, modest arm swing, short steps. Avoid high raised knees, lunges, wide split legs, hard heel kicks, torso lean, oscillating head size or side-to-side drift.
Eight lower cells form a SINGLE two-step cycle, not two repeated half-cycles and not random alternating contacts:
1 contact A (one foot slightly forward, other slightly back);
2 settle A (leading foot stable, trailing foot begins recovery);
3 narrow passing A (recovering foot beneath hip, knees close, minimal lift);
4 recover toward contact B (opposite foot moves a little ahead);
5 contact B (opposite of 1, same modest amplitude);
6 settle B (mirror phase of 2, not mirrored lighting);
7 narrow passing B;
8 recover toward contact A; smooth transition back to frame1.
Keep the SAME limb identities through consecutive frames; no swapping which leg leads until the passing phase. Do not duplicate a contact at the end. Shoulders/hood/shorts retain stable silhouettes while lower limbs articulate. Exactly two arms/two legs per pose, natural occlusion, consistent foot volume.
Full character inside every equal cell, complete soles, no clipping or cross-cell fragments. Real transparency, no checkerboard/matte, no floor shadows, no text/labels/grid/cell borders. Do not change the approved down sheet; it is reference only.
Direction constraint: All twelve figures face SCREEN UP, away from viewer: back of head and hoodie/hood visible, no face. Same elevated orthographic angle as the approved down sheet. Shoes progress into depth rather than kicking alternately toward camera.

### Direct pose reprojection

Use case: identity-preserve. Image 1 is the ONLY edit target and motion master, an approved front/down-facing sprite sheet. Reproject EACH EXISTING CHARACTER POSE into 180 degrees: SCREEN UP/BACK facing away from viewer, back of head and hoodie visible, no face. This is the SAME 12 poses seen from another side, NOT a newly invented gait. KEEP the 4 columns by 3 rows arrangement and corresponding cell order exactly. Top row standing references; lower two rows the same eight gentle walking poses as the original. For every cell preserve the exact anatomical left/right leg and arm phase of its corresponding reference pose while changing viewing direction. First walking row and second walking row must lead with opposite anatomical legs; the near arm must visibly reverse its swing between row2col1 and row3col1. Do not repeat a half-cycle. Keep the narrow passing poses at row2col3 and row3col3. Use relaxed SHORT steps and minimal knee lift like reference, NOT a long lunge, high-kneed march, jog or run.
Preserve this exact man's identity, same relative head size, same body height/build, sandy-blond buzzcut, brown beard, plain black hoodie hood down, olive cargo shorts, black and white high-top shoes, dense shaded hard-edged arcade-pixel rendering. Do not alter clothing material/lighting/palette. Upper-left image light stays fixed. Torso/head remain stable from frame to frame, no twisting, no lean, no breathing scale changes, only the reference's small movement. Match contact/support-foot baseline across all cells and gently match body bob to the approved sheet. Keep subjects centered consistently.
Deliver exactly one 1448x1086 RGBA image, 4 columns x3 rows of 362x362 square cells. Each full body completely inside its cell with small transparent margins. No cropping, no neighboring-frame spill, no frame labels, text, floor/shadow or checkerboard. Genuine transparency. Do not mirror the whole sheet or reverse cell ordering. EACH cell individually changes facing direction while retaining that exact instant in the gait. Seamless transition row3col4 back to row2col1.

Selected generator source: <generated-image-source>
