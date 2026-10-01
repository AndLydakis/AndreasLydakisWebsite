# PORT-14 follow-up — Idle-matched walking artwork

Built-in image generation, 2026-10-01. No API/CLI generation. Runtime idle strips are the appearance masters; previous runtime walk strips supply pose order only. Earlier drafts with repeated poses or weaker style matching were not selected.

Final source sheets: `output/assets/player-animation-sources/idle-matched-v2/{down,left,right,up}.png`.
Mechanical export: `scripts/package-idle-matched-walk.mjs` detects gutters and visible frame bounds, applies one uniform scale per direction against the retained idle height, and aligns head center relative to the idle torso anchor and soles. It does not generate, repaint or interpolate artwork. Outputs retain eight 362px cells in lossless WebP, keeping the existing published filenames and asset inventory. Measured bounds/scales are in `measurements.json` beside the sources.

## Final prompt, repeated for each direction

Use case: identity-preserve. INPUT 1 is MASTER IDLE CHARACTER ART; INPUT 2 supplies eight walking POSES only.
Draw the EXACT pixel-art man in input1 in EACH corresponding pose from input2. The first image wins ALL appearance decisions: pixel texture, head size, face/beard/hair, green eyes, torso length, shoulder width, leg length, clothing folds, shoe size and palette. Maintain the finely detailed grainy pixel clusters from input1; avoid input2's smooth cartoon shading and exaggerated round head or large shoes. Keep the subtle elevated orthographic angle of input1. All poses must look like that standing character simply articulated, not a different rendition.
Render ONLY eight walking frames, 4 columns x 2 rows, matching input2 pose order. Copy its leg and opposite-arm sequence, including the passing poses and opposite lead in the second half of the loop. Relaxed modest strides, no high knees. Stable head and upper torso silhouette throughout with minimal bob, same overall height as idle relative to head. True RGBA transparency, no floor/shadow/labels/grid. Full body per equal cell, ample clear margins so shoes or hair never touch adjacent cells. Target 1448x724, 362px cells. The master character must retain the smaller head, slimmer waist, long hoodie body, dense pixellated beard and textured hair visible in input1. Do not return standing poses. Preserve identity over copying the smooth art style of input2.

Direction suffix: All eight figures face screen {down/left/right/up}, exactly like input1. This direction is {front facing/side profile/side profile/back facing, no face}.

## Review boundary

Generated appearance is a closer match, not a guarantee of pixel-identical anatomy. Preserve the original idle bytes, original source sheets, physics, speed and distance-driven cadence. Inspect all packed frames and runtime loops; owner visual acceptance is pending. No push authorized.
