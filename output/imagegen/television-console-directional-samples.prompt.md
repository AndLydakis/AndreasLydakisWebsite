# Television and console directional samples

- Date: 2026-09-18.
- Brief: `style.md`.
- Generator: built-in image generation tool, one call per new direction, using the approved front PNG as the design reference.
- Status: the approved front PNG is used by the living-room television. The other directions and SVG copies remain review assets. PORT-08A1 remains in progress for dedicated living-room backdrop art.
- Directory: `public/assets/placeholders/`.

## Files and orientation

| Direction | PNG | SVG | Meaning |
| --- | --- | --- | --- |
| Front | television-console-front-sample.png | television-console-front-sample.svg | Screen faces the viewer; original approved image preserved. |
| Back | television-console-back-sample.png | television-console-back-sample.svg | Screen faces away; rear casing and connections visible. |
| Left | television-console-left-sample.png | television-console-left-sample.svg | Screen points toward the left edge of the image. |
| Right | television-console-right-sample.png | television-console-right-sample.svg | Screen points toward the right edge of the image. |

The PNG files retain their generated alpha channels. The original front is 1221 × 1288 pixels; the three new directions are 1221 × 1289 pixels. All SVG copies use a shared 1221 × 1289 viewBox, adding one transparent row of space below the front image without resampling it.

These SVGs embed the complete PNG bytes and preserve their transparency. They are self-contained raster-backed SVGs, not traced or hand-editable vector artwork. They contain no external image links, scripts, or fonts. Use the PNG originals for pixel editing. `package-television-samples.mjs` reproduces the SVG packaging and refuses to overwrite existing files.

The set preserves the overall design and style; generated details are not guaranteed to be geometrically identical across views. The front PNG displays at 64 world pixels high, centered on the interaction point and circle. Other directions are not currently loaded by the game; their display scale and anchoring remain subject to integration.

## Reference

`public/assets/placeholders/television-console-front-sample.png`

The original front prompt is recorded in `television-console-front-sample.prompt.md`.

## Back generation prompt

```text
Use case: stylized-concept
Asset type: one directional furniture sprite for a 2D game.
Reference image: the attached PNG is the approved FRONT sprite and is the authoritative design, palette, material rendering, detail density and lighting reference.
Primary request: draw the SAME complete TV setup viewed from a new direction. Keep the charcoal gray bulky CRT television, curved glass screen only where geometrically visible, vent grilles, worn casing, warm medium-brown wooden stand with one open console shelf and bottom drawer, short block feet, gray retro cartridge console, cartridge stacks and EXACTLY TWO gray wired game controllers with colored face buttons. Preserve object proportions and relative component positions under rotation.
Rotate the whole assembled object, including stand, console, cartridges, cables and controllers. Hidden components should be naturally occluded, not moved into view. This is a different side of the SAME object, not a redesign.
Style: match the reference's detailed 32-bit 1990s run-and-gun arcade pixel-art language (Metal Slug-like). Hand-pixelled appearance, complex layered silhouette, hard pixel clusters, seams, vents, screws, scuffs, wood grain, rubber cords, tiny metal highlights, contact shadows and subtle material color ramps. Consistent upper-left screen-space lighting across the set. No smooth vector shading, blur or antialiasing. Preserve the reference's quality and level of detail.
Camera: modest elevation matching the reference, same scale for the TV's height, minimal perspective, single centered object, full silhouette including feet and visible cable ends inside frame with a small margin.
Output: one sprite only, portrait canvas approximately 1221x1288 like the reference. Genuinely transparent alpha background; no checkerboard painted into pixels, floor plane, scene, captions, labels, logos, watermarks, borders or extra objects.
Direction: BACK / REAR view, a 180-degree yaw from the reference. TV SCREEN FACES AWAY from the viewer. Show the large deep CRT rear casing, cooling vents, screw recesses and recessed cable connectors, not the glass screen or front control buttons. Show the BACK of the wooden stand and the rear of the console through a suitable shelf opening. Controllers remain on the far front side and may be mostly or fully occluded. No glass screen visible anywhere in this image.
```

## Left generation prompt

```text
Use case: stylized-concept
Asset type: one directional furniture sprite for a 2D game.
Reference image: the attached PNG is the approved FRONT sprite and is the authoritative design, palette, material rendering, detail density and lighting reference.
Primary request: draw the SAME complete TV setup viewed from a new direction. Keep the charcoal gray bulky CRT television, curved glass screen only where geometrically visible, vent grilles, worn casing, warm medium-brown wooden stand with one open console shelf and bottom drawer, short block feet, gray retro cartridge console, cartridge stacks and EXACTLY TWO gray wired game controllers with colored face buttons. Preserve object proportions and relative component positions under rotation.
Rotate the whole assembled object, including stand, console, cartridges, cables and controllers. Hidden components should be naturally occluded, not moved into view. This is a different side of the SAME object, not a redesign.
Style: match the reference's detailed 32-bit 1990s run-and-gun arcade pixel-art language (Metal Slug-like). Hand-pixelled appearance, complex layered silhouette, hard pixel clusters, seams, vents, screws, scuffs, wood grain, rubber cords, tiny metal highlights, contact shadows and subtle material color ramps. Consistent upper-left screen-space lighting across the set. No smooth vector shading, blur or antialiasing. Preserve the reference's quality and level of detail.
Camera: modest elevation matching the reference, same scale for the TV's height, minimal perspective, single centered object, full silhouette including feet and visible cable ends inside frame with a small margin.
Output: one sprite only, portrait canvas approximately 1221x1288 like the reference. Genuinely transparent alpha background; no checkerboard painted into pixels, floor plane, scene, captions, labels, logos, watermarks, borders or extra objects.
Direction: LEFT-FACING, exactly 90 degrees yaw from the front reference. The television SCREEN/front edge is at the LEFT of the image and points toward the LEFT image edge; the deep rounded rear CRT housing extends to the RIGHT. This is a genuine side profile, not a three-quarter frontal view. Show the side casing, side vents and thin glass/front lip at the left end, not the broad front screen. The wooden stand rotates with it, showing its side panel. Both controllers remain on the assembly's front side, toward the LEFT of the stand, with realistic overlap/occlusion and their cables leading into the rotated setup.
```

## Right generation prompt

```text
Use case: stylized-concept
Asset type: one directional furniture sprite for a 2D game.
Reference image: the attached PNG is the approved FRONT sprite and is the authoritative design, palette, material rendering, detail density and lighting reference.
Primary request: draw the SAME complete TV setup viewed from a new direction. Keep the charcoal gray bulky CRT television, curved glass screen only where geometrically visible, vent grilles, worn casing, warm medium-brown wooden stand with one open console shelf and bottom drawer, short block feet, gray retro cartridge console, cartridge stacks and EXACTLY TWO gray wired game controllers with colored face buttons. Preserve object proportions and relative component positions under rotation.
Rotate the whole assembled object, including stand, console, cartridges, cables and controllers. Hidden components should be naturally occluded, not moved into view. This is a different side of the SAME object, not a redesign.
Style: match the reference's detailed 32-bit 1990s run-and-gun arcade pixel-art language (Metal Slug-like). Hand-pixelled appearance, complex layered silhouette, hard pixel clusters, seams, vents, screws, scuffs, wood grain, rubber cords, tiny metal highlights, contact shadows and subtle material color ramps. Consistent upper-left screen-space lighting across the set. No smooth vector shading, blur or antialiasing. Preserve the reference's quality and level of detail.
Camera: modest elevation matching the reference, same scale for the TV's height, minimal perspective, single centered object, full silhouette including feet and visible cable ends inside frame with a small margin.
Output: one sprite only, portrait canvas approximately 1221x1288 like the reference. Genuinely transparent alpha background; no checkerboard painted into pixels, floor plane, scene, captions, labels, logos, watermarks, borders or extra objects.
Direction: RIGHT-FACING, exactly 90 degrees yaw in the opposite direction from the left-facing view. The television SCREEN/front edge is at the RIGHT of the image and points toward the RIGHT image edge; the deep rounded rear CRT housing extends to the LEFT. This is a genuine side profile, not a three-quarter frontal view. Show the opposite side casing, side vents and thin glass/front lip at the right end, not the broad front screen. The wooden stand rotates with it, showing its opposite side panel. Both controllers remain on the assembly's front side, toward the RIGHT of the stand, with realistic overlap/occlusion and their cables leading into the rotated setup. Preserve upper-left illumination; do not simply mirror the front sprite.
```
