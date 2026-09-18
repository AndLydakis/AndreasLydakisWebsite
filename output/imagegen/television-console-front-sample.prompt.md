# Television and console front-view sample

- Date: 2026-09-18
- Source brief: `style.md`.
- Generator: built-in image generation tool.
- Output: `public/assets/placeholders/television-console-front-sample.png`.
- Format: PNG, 1221 × 1288 pixels, with an alpha channel.
- Status: AI-generated placeholder artwork used by the living-room television through the optional texture manifest. PORT-08A1 remains in progress while dedicated living-room backdrop art is pending.
- Scope: the original approved front-view image. The complete front/back/left/right set and raster-backed SVG copies are documented in `television-console-directional-samples.prompt.md`. These SVG copies embed PNG artwork rather than editable vector paths.
- Integration note: source resolution is independent of in-game display dimensions. The front sprite displays at 64 world pixels high, centered on the interaction point and circle, preserving aspect ratio. Other furniture retains the generic 48-pixel cap.

## Generation prompt

```text
Use case: stylized-concept
Asset type: isolated furniture sprite sample for a 2D browser game.
Primary request: Create one FRONT-VIEW sample sprite of an old-fashioned CRT television with a retro game console underneath, on a wooden television stand, with exactly two wired controllers attached to the television setup. A single assembled object, all parts fully visible.
Scene/backdrop: genuinely transparent alpha background. No painted checkerboard, no room, floor plane, scenery, labels or framing.
Subject and composition: straight-on front view with a modest elevated camera so the stand and console top surfaces are visible, suitable for a top-down adventure game's furniture. Show the bulky CRT cabinet, rounded glass screen, physical buttons and speaker vents, console in the shelf immediately below, two readable controllers resting at the front with distinct connected cables. Center the complete object with only a small transparent margin; do not crop cables, feet or controllers.
Style/medium: extremely detailed 32-bit arcade pixel art, visual language of richly animated 1990s run-and-gun games such as Metal Slug. Complex silhouettes, layered construction, irregular organic pixel clusters, dense material rendering and many small readable secondary forms. It should look carefully hand-pixelled, not a flat icon or logo.
Materials and detail: distinct panels, seams, screws, vents, cables, bevels, ridges, recesses, surface wear, reflections and overlapping components. Hard specular highlights on metal, grain and uneven shading on wood, rough texture on rubber and subtle variation on painted surfaces. Many shades per material with reflected light, contact and occlusion shadows, rim highlights, midtone transitions and tiny accent pixels. Break up flat areas with functional details and restrained scratches, dents and dirt. Believable construction and subtle asymmetry.
Lighting: consistent light from upper left, coherent warm wood and aged cabinet tones, subtle cool CRT glass highlights, dark contact shadows; preserve readable silhouette.
Constraints: a SINGLE front-view sprite, not four views or a sheet. Crisp hard-edged square pixel clusters, no anti-aliasing, no blur, no smooth vector curves, no photorealistic or smooth 3D rendering, no excessive empty space, no large unbroken flat color areas. Original unbranded hardware; no text or watermark. PNG output with actual transparency.
```
