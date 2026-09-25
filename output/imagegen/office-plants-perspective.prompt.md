# Office plant perspective assets

Built-in image_gen editing; original reference/edit target: public/assets/backgrounds/office/sample-v5.png. Original preserved. Four separate calls, no CLI or post-generation raster edits. Generated alpha preserved verbatim.

## Saved project assets

- `public/assets/backgrounds/office/three-plants-removed-v1.png`
- `public/assets/sprites/office-plant-top-right/front-v1.png`
- `public/assets/sprites/office-plant-bottom-left/front-v1.png`
- `public/assets/sprites/office-plant-bottom-right/front-v1.png`

The following sections preserve each submitted prompt verbatim. These are generated cutouts, not pixel-exact deterministic segmentation; final foliage differs slightly from the painted original.

## office-background-clean

Use case: precise-object-edit. Image 1 is the edit target, an existing pixel-art game room backdrop. Remove ONLY three small potted plants: the narrow upright snake plant at the far TOP RIGHT against the wall, the small leafy plant at the BOTTOM LEFT corner, and the small leafy plant at the BOTTOM RIGHT corner. Remove all their leaves, stems, pots and contact shadows. Restore the small wall/baseboard/wood-floor/rug areas revealed underneath with seamlessly matching pixels. KEEP the large monstera at upper left entirely untouched. Preserve EXACT room framing, wall and doorway coordinates, perspective, proportions, two overlapping rugs and fringe, every window, picture, lighting, colors and pixel-art texture. No redesign, no new furniture, no other changes. Output the complete same wide room image, same framing/aspect ratio, no margin or crop; only these three plant removals.

## office-plant-top-right

Use case: background-extraction. Image 1 is the edit target. Extract ONLY the small upright snake plant in the dark sage-green rounded ceramic pot at the FAR TOP RIGHT of the room (not the large monstera at left). Deliver ONE isolated full plant including all pointed sword-shaped leaves, stems, soil and pot, on a genuinely transparent alpha background. Preserve its existing silhouette, leaf arrangement, muted green palette, speckled olive-green pot and warm pixel-art rendering, same slightly overhead front viewpoint. Do not redesign or add foliage. Remove all room pixels, wall, wood, rug and floor shadows. Center the complete cutout with small transparent margins, no text, no checkerboard painted in pixels. This is a separate foreground sprite to replace its painted original at the same size.

## office-plant-bottom-left

Use case: background-extraction. Image 1 is the edit target. Extract ONLY the SMALL leafy potted plant at the BOTTOM LEFT corner of the room (not the large upper-left monstera). Deliver ONE isolated full plant, including all short broad pointed leaves, stems, soil and rounded tan terracotta pot with its small dark decoration, on a genuinely transparent alpha background. Preserve its exact existing silhouette and compact leaf arrangement, earthy green palette, ochre/tan pot, warm pixel-art texture and slightly overhead front viewpoint. Do not redesign, enlarge the pot relative to leaves, or add foliage. Remove all room pixels, wall, wood, rug and floor shadows. Center the complete plant with small transparent margins, no text or painted checkerboard. This sprite will replace the painted original at the same size.

## office-plant-bottom-right

Use case: background-extraction. Image 1 is the edit target. Extract ONLY the SMALL leafy potted plant at the BOTTOM RIGHT corner of the room. Deliver ONE isolated full plant including all broad pointed leaves, stems, soil and rounded pale beige ceramic pot with blue-gray motifs, on a genuinely transparent alpha background. Preserve its exact existing silhouette, compact leaf arrangement, dark and olive green palette, pale patterned pot, warm pixel-art texture and slightly overhead front viewpoint. Do not redesign or add foliage. Remove all room pixels, wall, wood, rug and floor shadows. Center the complete plant with small transparent margins, no text or painted checkerboard. This sprite will replace the painted original at the same size.
