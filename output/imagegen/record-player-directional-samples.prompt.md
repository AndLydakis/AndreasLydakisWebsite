# Record-player directional sprites

- Date: 2026-09-18.
- Generator: built-in image generation tool.
- Style: unchanged style paragraphs from `style.md`; the approved TV front image was used only as a visual style reference for the record-player front. The record-player front then served as the design reference for the other directions.
- Files: `public/assets/placeholders/record-player-{front,back,left,right}-sample.png` and matching `.svg` copies.
- Front faces the viewer; back faces away; left/right indicate the direction the turntable's front controls face.
- All views are original AI-generated placeholder artwork. SVG copies embed the PNG bytes and are not editable vector drawings.
- Reproduce SVG copies with `node output/imagegen/package-television-samples.mjs record-player` (refuses to overwrite existing files).
- Runtime: the front PNG is registered as `record-player-front`, centered on the existing vinyl interaction point at 4 tiles (64 world pixels) high with aspect ratio preserved. Other views remain available for future use.
- Content: existing `livingroom-vinyl` dummy content opens through the shared dialog system. Full PORT-09A verification remains pending.

## front prompt

```text
Use case: stylized-concept. Asset: isolated 2D game furniture sprite, transparent PNG.
Reference image is ONLY the visual style, palette and perspective reference; do not include its television, console or controllers.
Create an extremely detailed, hand-pixelled 32-bit arcade game sprite. Use the visual language of richly animated 1990s run-and-gun arcade games, like metal slug: complex silhouettes, layered construction, irregular organic pixel clusters, dense material rendering, and many small readable secondary forms.

Build the object from distinct parts such as panels, seams, handles, screws, vents, joints, cables, bevels, ridges, recesses, damage marks, surface wear, reflections, and overlapping components. Give every material its own treatment: hard specular highlights for metal, grain and uneven shading for wood, rough texture for rubber, and subtle color variation for painted surfaces.

Use multiple shades per material, including reflected light, contact shadows, occlusion shadows, rim highlights, midtone transitions, and tiny accent pixels. Break up large flat areas with texture, panel lines, scratches, dents, dirt, highlights, and small functional details. Prefer asymmetry and believable construction over simple geometric shapes.

The result should feel like a production game asset carefully animated and hand-pixelled by an expert, not a logo, vector illustration, flat icon, emoji, or minimalist pixel-art symbol. Use crisp hard-edged pixels, no anti-aliasing, no blur, no smooth vector curves, no excessive empty space, and no large unbroken areas of flat color. Maintain consistent scale, lighting, palette, and detail density across all views.
Subject: an unbranded 1980s home hi-fi record player on a small warm-brown wooden table with four legs and a lower shelf containing a horizontal stack of vinyl records in worn colored cardboard sleeves. Charcoal and brushed-silver turntable, black vinyl disc with small muted label, readable tonearm and cartridge, tactile buttons and speed controls, clear smoked dust cover hinged open. Original design, no lettering or logos. One assembled furniture object.
View: FRONT-facing, slight elevated orthographic perspective matching the reference so the platter is visible. Center complete object including table feet; minimal transparent margin, no cropping. Light from upper left. Keep a clear recognizable silhouette readable at small game scale. Match the TV reference's wood hue, crisp pixel clusters and detail density.
Output exactly ONE front-view sprite on a genuinely transparent alpha background, no checkerboard, no floor plane, no scene, no extra objects, no captions or watermark. The back, left and right views will be generated separately from this design.
```

## back prompt

```text
Use case: stylized-concept. Transparent directional sprite for 2D game.
Reference image: authoritative approved FRONT design. Draw precisely the same 1980s silver/charcoal turntable with black record, gold center label, tonearm, smoked transparent OPEN dust cover, warm-brown small four-legged wooden table and lower shelf with horizontal colored vinyl sleeves. Preserve all component shapes, materials, proportions, scale and lid opening angle as the whole assembly rotates. Correctly occlude hidden parts. No additional objects or redesign.
Create an extremely detailed, hand-pixelled 32-bit arcade game sprite. Use the visual language of richly animated 1990s run-and-gun arcade games, like metal slug: complex silhouettes, layered construction, irregular organic pixel clusters, dense material rendering, and many small readable secondary forms.

Build the object from distinct parts such as panels, seams, handles, screws, vents, joints, cables, bevels, ridges, recesses, damage marks, surface wear, reflections, and overlapping components. Give every material its own treatment: hard specular highlights for metal, grain and uneven shading for wood, rough texture for rubber, and subtle color variation for painted surfaces.

Use multiple shades per material, including reflected light, contact shadows, occlusion shadows, rim highlights, midtone transitions, and tiny accent pixels. Break up large flat areas with texture, panel lines, scratches, dents, dirt, highlights, and small functional details. Prefer asymmetry and believable construction over simple geometric shapes.

The result should feel like a production game asset carefully animated and hand-pixelled by an expert, not a logo, vector illustration, flat icon, emoji, or minimalist pixel-art symbol. Use crisp hard-edged pixels, no anti-aliasing, no blur, no smooth vector curves, no excessive empty space, and no large unbroken areas of flat color. Maintain consistent scale, lighting, palette, and detail density across all views.
BACK view: rotate the entire setup 180 degrees. Controls/front of turntable face away. Show rear dust-cover hinges, rear chassis connectors/cable, back of wooden table and reverse edges of the same vinyl stack. Do not show the front controls on the rear.
Match the reference's slight elevated orthographic camera, crisp arcade pixel clusters, detailed material wear and upper-left lighting. Keep whole object inside the frame, matching reference scale, tightly framed but no cropping. One sprite only on genuinely transparent alpha background, no scene, floor plane, checkerboard, captions, logos, text or watermarks. PNG output. Natural shadows belong inside the object only.
```

## left prompt

```text
Use case: stylized-concept. Transparent directional sprite for 2D game.
Reference image: authoritative approved FRONT design. Draw precisely the same 1980s silver/charcoal turntable with black record, gold center label, tonearm, smoked transparent OPEN dust cover, warm-brown small four-legged wooden table and lower shelf with horizontal colored vinyl sleeves. Preserve all component shapes, materials, proportions, scale and lid opening angle as the whole assembly rotates. Correctly occlude hidden parts. No additional objects or redesign.
Create an extremely detailed, hand-pixelled 32-bit arcade game sprite. Use the visual language of richly animated 1990s run-and-gun arcade games, like metal slug: complex silhouettes, layered construction, irregular organic pixel clusters, dense material rendering, and many small readable secondary forms.

Build the object from distinct parts such as panels, seams, handles, screws, vents, joints, cables, bevels, ridges, recesses, damage marks, surface wear, reflections, and overlapping components. Give every material its own treatment: hard specular highlights for metal, grain and uneven shading for wood, rough texture for rubber, and subtle color variation for painted surfaces.

Use multiple shades per material, including reflected light, contact shadows, occlusion shadows, rim highlights, midtone transitions, and tiny accent pixels. Break up large flat areas with texture, panel lines, scratches, dents, dirt, highlights, and small functional details. Prefer asymmetry and believable construction over simple geometric shapes.

The result should feel like a production game asset carefully animated and hand-pixelled by an expert, not a logo, vector illustration, flat icon, emoji, or minimalist pixel-art symbol. Use crisp hard-edged pixels, no anti-aliasing, no blur, no smooth vector curves, no excessive empty space, and no large unbroken areas of flat color. Maintain consistent scale, lighting, palette, and detail density across all views.
LEFT-FACING view: rotate the entire setup a quarter turn so its front controls face the LEFT image edge; back hinges and open lid are toward the RIGHT. Show side profile with modest elevated view, not another frontal view.
Match the reference's slight elevated orthographic camera, crisp arcade pixel clusters, detailed material wear and upper-left lighting. Keep whole object inside the frame, matching reference scale, tightly framed but no cropping. One sprite only on genuinely transparent alpha background, no scene, floor plane, checkerboard, captions, logos, text or watermarks. PNG output. Natural shadows belong inside the object only.
```

## right prompt

```text
Use case: stylized-concept. Transparent directional sprite for 2D game.
Reference image: authoritative approved FRONT design. Draw precisely the same 1980s silver/charcoal turntable with black record, gold center label, tonearm, smoked transparent OPEN dust cover, warm-brown small four-legged wooden table and lower shelf with horizontal colored vinyl sleeves. Preserve all component shapes, materials, proportions, scale and lid opening angle as the whole assembly rotates. Correctly occlude hidden parts. No additional objects or redesign.
Create an extremely detailed, hand-pixelled 32-bit arcade game sprite. Use the visual language of richly animated 1990s run-and-gun arcade games, like metal slug: complex silhouettes, layered construction, irregular organic pixel clusters, dense material rendering, and many small readable secondary forms.

Build the object from distinct parts such as panels, seams, handles, screws, vents, joints, cables, bevels, ridges, recesses, damage marks, surface wear, reflections, and overlapping components. Give every material its own treatment: hard specular highlights for metal, grain and uneven shading for wood, rough texture for rubber, and subtle color variation for painted surfaces.

Use multiple shades per material, including reflected light, contact shadows, occlusion shadows, rim highlights, midtone transitions, and tiny accent pixels. Break up large flat areas with texture, panel lines, scratches, dents, dirt, highlights, and small functional details. Prefer asymmetry and believable construction over simple geometric shapes.

The result should feel like a production game asset carefully animated and hand-pixelled by an expert, not a logo, vector illustration, flat icon, emoji, or minimalist pixel-art symbol. Use crisp hard-edged pixels, no anti-aliasing, no blur, no smooth vector curves, no excessive empty space, and no large unbroken areas of flat color. Maintain consistent scale, lighting, palette, and detail density across all views.
RIGHT-FACING view: rotate the entire setup the opposite quarter turn so its front controls face the RIGHT image edge; back hinges and open lid are toward the LEFT. Show the opposite side profile with modest elevation, not another frontal view.
Match the reference's slight elevated orthographic camera, crisp arcade pixel clusters, detailed material wear and upper-left lighting. Keep whole object inside the frame, matching reference scale, tightly framed but no cropping. One sprite only on genuinely transparent alpha background, no scene, floor plane, checkerboard, captions, logos, text or watermarks. PNG output. Natural shadows belong inside the object only.
```
