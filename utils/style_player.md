# Player sprite and animation generation prompt

Status: character revision 2 approved; full generation and PORT-14 implementation authorized on 2026-09-18.

Based on the shared styling paragraphs in `utils/style.md`; its living-room subject is replaced with a character. Preserve the detailed material rendering, palette and lighting of the existing project artwork, but prioritize a readable character silhouette over tiny surface details.

## Character design — resolve before generation

The character wears a simple black hoodie, cargo shorts and has converse like high top sneakers. White skin, green eyes, a bit buff. blonde/brown stube for hair, big beard.

Approved refinement: slightly lighter sandy-blonde buzz-cut hair and a slimmer, moderately athletic build. `public/assets/sprites/player/idle-down-sample-v2.png` is the identity reference; retain the large brown beard, black hoodie, olive cargo shorts and black/white high-top shoes.

Do not infer a likeness or invent an approved outfit. Once the design is approved, use the same character reference for every direction and animation frame.

## Reference assets

Supply these project images as visual references when generating:

- `public/assets/backgrounds/living-room/sample.png` — environment palette, scale relationships and elevated viewpoint.
- `public/assets/sprites/television-console/front.png` — pixel clusters, material shading and lighting.
- `public/assets/sprites/record-player/front.png` — matching wood/metal rendering and overall detail density.

These references establish style only. Do not include their furniture or backgrounds in the character images. Once approved, the character reference takes precedence for identity and proportions.

## Generation prompt

Create a complete, consistent animation set for ONE player character in a 2D orthographic RPG house exploration game.

### Subject

Use the CHARACTER BRIEF above. The character is a visitor walking around a furnished house, not a combat character. No weapons, attacks, running, jumping or additional props unless explicitly included in the approved character design.

### Art direction

Create extremely detailed, hand-pixelled, 32-bit-era arcade character sprites. Use the visual language of richly animated 1990s run-and-gun arcade games, such as Metal Slug: complex but readable silhouettes, layered construction, irregular organic pixel clusters, dense material rendering, and small readable secondary forms. Use an original character design, not a character copied from another game.

Build clothing and accessories from believable parts: fabric folds, seams, collars, cuffs, pockets, stitching, shoe soles, laces and overlapping layers. Give every visible material its own treatment: woven texture and soft shading for fabric, restrained highlights for leather or rubber, hard specular highlights only for actual metal, and subtle color variation for skin and hair. Do not apply the source prompt's mechanical panels, screws or vents to the human body.

Use multiple shades per material, including reflected light, contact shadows, occlusion shadows, rim highlights, midtone transitions and carefully placed accent pixels. Preserve the warm, slightly muted palette of the supplied room and furniture references. Texture should support the form, not create noisy speckles or obscure the face and limb positions.

The result should feel like a production game asset carefully animated and hand-pixelled by an expert, not a logo, vector illustration, flat icon, emoji, minimalist pixel-art symbol, smooth 3D render or photorealistic person. Use crisp hard-edged pixels, no anti-aliasing, no blur and no smooth vector curves. Maintain consistent pixel scale, lighting, palette, proportions and detail density across all frames.

Use lighting from the upper-left of the image consistently across all directions. Do not mirror the lighting when the character turns. Do not simply flip asymmetric clothes or accessories to create the opposite direction.

### Camera and directions

Use a fixed elevated orthographic RPG view, looking slightly down at the character so the top of the head and shoulders are visible. Match the house's presentation; do not use an isometric diamond, vanishing-point perspective, a strict overhead head-only view or a flat side-scroller camera.

- **Down/front:** facing toward the bottom of the screen and the viewer; face visible.
- **Left:** facing toward the left edge of the screen.
- **Right:** facing toward the right edge of the screen.
- **Up/back:** facing toward the top of the screen, away from the viewer; back of head and clothing visible.

Left and right refer to screen direction, not the character's anatomical left/right. Keep camera elevation fixed when the character rotates.

### Required frames: 48 total

Generate all four directions. For EACH direction create:

**Four stationary idle frames:**

1. Neutral relaxed standing pose.
2. Small breathing rise through chest/shoulders.
3. Gentle breathing peak, without changing overall character scale.
4. Return toward neutral so the next frame loops smoothly to frame 1.

Feet remain planted at the same ground anchor. No stepping, turning, large gestures or sideways drift. The neutral frame must also work as a static standing sprite when idle animation is disabled.

**Eight in-place walking frames:**

1. First foot forward contact, opposite arm forward.
2. Weight settles onto the leading foot.
3. Trailing foot passes the planted foot.
4. Leading leg pushes off; trailing leg swings forward.
5. Opposite foot forward contact, with arms reversed.
6. Weight settles onto the new leading foot.
7. Other foot passes the planted foot.
8. Push-off and swing toward frame 1, completing a seamless cycle.

Show an unmistakable alternating gait, not eight nearly identical standing poses. Walking is animated in place: the game moves the character through the world. Keep the ground anchor fixed; allow only a small intentional vertical body bob. Do not translate the character across frames. Use the same stride timing and phase ordering in every direction. Do not append a duplicate of frame 1 at the end.

### Frame geometry and export contract

**Implemented delivery amendment:** the built-in generator produced four separate 1448×1086 RGBA sheets, each a 4-column × 3-row grid of 362px cells. Row 1 contains idle 01–04; rows 2–3 contain walk 01–08. Runtime keeps original image bytes and uses measured per-frame origin metadata to align the torso/soles to the unchanged physics anchor. The source-height display is 51 world pixels, increased from 34 at the owner's request. The original draft target below is retained as future art-production guidance, not the current loader contract.

- Final logical cell: **128 × 128 pixels**, the same for every frame.
- Ground anchor: **(64, 120)** in cell coordinates, measured from the top-left; the foot-contact line is y=120. Keep planted soles on this line; raised feet may leave it naturally during a step.
- Neutral standing height: approximately **96 pixels**, consistent across directions. Keep the complete silhouette within x=8…119 and y=8…119; do not crop hair, arms or shoes.
- No per-frame auto-cropping, recentering, resizing or changing margins. Transparent breathing room is intentional and overrides the source brief's isolated-object instruction to avoid empty space.
- Genuine RGBA PNG transparency. No painted checkerboard, matte background, floor, room, shadow ellipse, labels, guides, grid lines, captions, text or watermark.
- Do not bake a ground shadow into the character frames. Small self/contact shadows within the character are allowed.

Final deliverable: one **1536 × 512 PNG spritesheet**, exactly **12 columns × 4 rows**, with no padding or gutters between the 128-pixel cells.

| Row, top to bottom | Direction | Columns 1–4 | Columns 5–12 |
| --- | --- | --- | --- |
| 1 | Down/front | idle 01–04 | walk 01–08 |
| 2 | Left | idle 01–04 | walk 01–08 |
| 3 | Right | idle 01–04 | walk 01–08 |
| 4 | Up/back | idle 01–04 | walk 01–08 |

All cells contain only one character frame. Never place a reference portrait, decorative border or frame label into a cell. Raster PNG is the source asset; do not present a PNG embedded inside SVG as editable vector artwork.

## Generation and review notes — not implementation instructions

1. Approve the character brief and one neutral down-facing reference before producing the full set. Then approve neutral left/right/up views against that identity reference.
2. Use those approved views to produce the directional animation sequences. If generating in separate passes, repeat the same geometry and lighting rules; do not let each pass redesign the character.
3. The sheet dimensions above are the final export target, not a guarantee that an image generator can deliver exact frame geometry. Inspect actual output; arrange approved frames losslessly into the target grid afterward if needed. Do not stretch a malformed sheet to force compliance.
4. Verify all 48 frames, true transparency, fixed anchors, correct directions, stable identity and clean loop seams. Reject missing/duplicate frames, extra limbs, changing clothing, camera-angle changes and inconsistent lighting. Inspect playback, not just a static sheet.
5. Test readability at intended game display size as well as full resolution. Detailed source artwork may simplify considerably when reduced; prioritize silhouette and movement over preserving every tiny texture.
6. Suggested preview timing, to be tuned later: idle 4 fps and walk 8 fps. These are draft animation settings, not implemented behavior.
7. The new artwork has transparent foot margins, unlike the current placeholder. PORT-14 explicitly maps its ground anchor to the player physics foot position; do not blindly reuse the current full-image-bottom offset. Camera, interaction position and collision geometry remain consistent. Implementation was separately authorized by the owner.
